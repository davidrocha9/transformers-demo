export type PreferredDevice = "webgpu" | "default";
export type SelectedModel =
  | "onnx-community/Qwen3-0.6B-ONNX"
  | "onnx-community/SmolLM2-360M-ONNX"
  | "onnx-community/SmolLM2-135M-Instruct-ONNX-MHA";

export type WorkerRequest =
  | {
      type: "load";
      model: SelectedModel;
      device?: PreferredDevice;
    }
  | {
      type: "stop";
    }
  | {
      type: "generate";
      model: SelectedModel;
      input: string;
      systemPrompt: string;
      device?: PreferredDevice;
    };

export type WorkerProgressEvent = {
  type: "progress";
  status?: string;
  file?: string;
  name?: string;
  progress?: number;
  loaded?: number;
  total?: number;
  message?: string;
};

export type WorkerResponse =
  | WorkerProgressEvent
  | {
      type: "stream";
      text: string;
    }
  | {
      type: "ready";
      device: PreferredDevice;
    }
  | {
      type: "result";
      text: string;
    }
  | {
      type: "error";
      message: string;
    };
