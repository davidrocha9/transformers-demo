import { InterruptableStoppingCriteria, StoppingCriteriaList, pipeline, TextStreamer } from "@huggingface/transformers";
import type { PreferredDevice, WorkerProgressEvent, SelectedModel, WorkerRequest } from "./types";
import type { Message, TextGenerationOutput, TextGenerationPipelineType } from "@huggingface/transformers";

declare const self: DedicatedWorkerGlobalScope;

class ChatPipeline {
  static readonly task = "text-generation";

  private static instance: Promise<TextGenerationPipelineType> | null = null;
  private static activeDevice: PreferredDevice | null = null;
  private static activeModel: SelectedModel | null = null;
  private static interruptCriteria = new InterruptableStoppingCriteria();

  static async getInstance(model: SelectedModel, device: PreferredDevice | undefined, progressCallback?: (event: Record<string, unknown>) => void) {
    const requestedDevice = device ?? "default";

    if (!this.instance || this.activeDevice !== requestedDevice || this.activeModel !== model) {
      this.activeDevice = requestedDevice;
      this.activeModel = model;
      this.instance = this.createInstance(model, requestedDevice, progressCallback);
    }

    return this.instance;
  }

  private static async createInstance(model: SelectedModel, device: PreferredDevice, progressCallback?: (event: Record<string, unknown>) => void) {
    const progress = (event: Record<string, unknown>) => {
      progressCallback?.(event);
    };
    const options = {
      ...(device === "webgpu" ? { device: "webgpu" as const, dtype: "q4f16" as const } : { dtype: "q8" as const }),
      progress_callback: progress,
    };

    try {
      return await pipeline(this.task, model, options);
    } catch (error) {
      if (device === "webgpu") {
        self.postMessage({
          type: "progress",
          status: "fallback",
          message: "WebGPU load failed. Falling back to the browser default runtime.",
        } satisfies WorkerProgressEvent);

        this.activeDevice = "default";
        return pipeline(this.task, model, {
          dtype: "q8",
          progress_callback: progress,
        });
      }

      this.instance = null;
      this.activeDevice = null;
      this.activeModel = null;
      throw error;
    }
  }

  static getActiveDevice() {
    return this.activeDevice ?? "default";
  }

  static createStoppingCriteria() {
    this.interruptCriteria.reset();
    const stoppingCriteria = new StoppingCriteriaList();
    stoppingCriteria.push(this.interruptCriteria);
    return stoppingCriteria;
  }

  static interruptGeneration() {
    this.interruptCriteria.interrupt();
  }
}

const toErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong while running the model.";
};

const normalizeProgress = (event: Record<string, unknown>): WorkerProgressEvent => ({
  type: "progress",
  status: typeof event.status === "string" ? event.status : undefined,
  file: typeof event.file === "string" ? event.file : undefined,
  name: typeof event.name === "string" ? event.name : undefined,
  progress: typeof event.progress === "number" ? event.progress : undefined,
  loaded: typeof event.loaded === "number" ? event.loaded : undefined,
  total: typeof event.total === "number" ? event.total : undefined,
});

const sanitizeVisibleText = (value: string) =>
  value
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/<think>[\s\S]*$/g, "")
    .replace(/<\/think>/g, "")
    .trim();

const buildPrompt = (pipe: TextGenerationPipelineType, messages: Message[]) => {
  if (pipe.tokenizer.chat_template) {
    return pipe.tokenizer.apply_chat_template(messages, {
      tokenize: false,
      add_generation_prompt: true,
    } as never) as string;
  }

  const systemMessage = messages.find(message => message.role === "system")?.content;
  const userMessage = messages.find(message => message.role === "user")?.content ?? "";

  if (!systemMessage) {
    return `User: ${userMessage}\nAssistant:`;
  }

  return `System: ${systemMessage}\nUser: ${userMessage}\nAssistant:`;
};

const resolveModelMaxLength = (pipe: TextGenerationPipelineType) => {
  const tokenizerLimit = Number(pipe.tokenizer.model_max_length);

  if (Number.isFinite(tokenizerLimit) && tokenizerLimit > 0 && tokenizerLimit < 1_000_000) {
    return tokenizerLimit;
  }

  const configLimit = Number((pipe.model as { config?: { max_position_embeddings?: number } }).config?.max_position_embeddings);

  if (Number.isFinite(configLimit) && configLimit > 0) {
    return configLimit;
  }

  return undefined;
};

type GenerationOptions = NonNullable<Parameters<TextGenerationPipelineType>[1]> & {
  stopping_criteria?: StoppingCriteriaList;
};

self.addEventListener("message", async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data;

  try {
    switch (message.type) {
      case "load": {
        const device = message.device ?? "default";
        await ChatPipeline.getInstance(message.model, device, progressEvent => {
          self.postMessage(normalizeProgress(progressEvent));
        });

        self.postMessage({
          type: "ready",
          device: ChatPipeline.getActiveDevice(),
        });
        break;
      }

      case "stop":
        ChatPipeline.interruptGeneration();
        break;

      case "generate": {
        const pipe = await ChatPipeline.getInstance(message.model, message.device, progressEvent => {
          self.postMessage(normalizeProgress(progressEvent));
        });

        const messages: Message[] = [
          {
            role: "system",
            content:
              message.systemPrompt.trim() ||
              "You are a helpful assistant. Return only the final answer. Do not include thinking tags, hidden reasoning, or step-by-step internal thoughts.",
          },
          { role: "user", content: message.input.trim() },
        ];
        const prompt = buildPrompt(pipe, messages);
        const maxLength = resolveModelMaxLength(pipe);
        const stoppingCriteria = ChatPipeline.createStoppingCriteria();
        let visibleText = "";
        const generatedTokens: bigint[] = [];
        const streamer = new TextStreamer(pipe.tokenizer, {
          skip_prompt: true,
          callback_function: () => {},
          token_callback_function: (tokens: bigint[]) => {
            generatedTokens.push(...tokens);

            const decoded = pipe.tokenizer.decode(generatedTokens, {
              skip_special_tokens: true,
            });
            const sanitized = sanitizeVisibleText(decoded);

            if (!sanitized || sanitized === visibleText) {
              return;
            }

            visibleText = sanitized;
            self.postMessage({
              type: "stream",
              text: visibleText,
            });
          },
        });
        const generationOptions: GenerationOptions = {
          do_sample: false,
          repetition_penalty: 1.1,
          return_full_text: false,
          add_special_tokens: false,
          stopping_criteria: stoppingCriteria,
          streamer,
        };

        if (typeof maxLength === "number") {
          generationOptions.max_length = maxLength;
        }

        const output = await pipe(prompt, generationOptions);

        const normalizedOutput = (Array.isArray(output[0]) ? output[0] : output) as TextGenerationOutput;
        const generatedText = normalizedOutput[0]?.generated_text;
        const text = sanitizeVisibleText(
          typeof generatedText === "string" ? generatedText : generatedText?.[generatedText.length - 1]?.content ?? visibleText
        );

        self.postMessage({
          type: "result",
          text: text || visibleText.trim(),
        });
        break;
      }
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      message: toErrorMessage(error),
    });
  }
});
