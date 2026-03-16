import { useEffect, useRef, useState } from "react";
import type {
  PreferredDevice,
  SelectedModel,
  WorkerProgressEvent,
  WorkerRequest,
  WorkerResponse,
} from "../types";
import { DEFAULT_MODEL, type AppStatus } from "../playground-config";
import { detectPreferredDevice, formatPercent } from "../runtime-utils";

type RunRequest = {
  model: SelectedModel;
  input: string;
  systemPrompt: string;
};

export const useModelWorker = () => {
  const workerRef = useRef<Worker | null>(null);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<AppStatus>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [progressEvent, setProgressEvent] = useState<WorkerProgressEvent | null>(null);
  const [progressPercent, setProgressPercent] = useState<number | null>(null);
  const [runtimeDevice, setRuntimeDevice] = useState<PreferredDevice>("default");
  const [modelLoaded, setModelLoaded] = useState(false);
  const [hasRun, setHasRun] = useState(false);

  useEffect(() => {
    const worker = new Worker(new URL("../model.worker.ts", import.meta.url), {
      type: "module",
    });

    workerRef.current = worker;

    const onMessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data;

      switch (message.type) {
        case "progress": {
          setProgressEvent(message);

          const nextPercent =
            formatPercent(message.progress) ??
            (message.loaded && message.total ? (message.loaded / message.total) * 100 : null);

          setProgressPercent(nextPercent);
          break;
        }

        case "ready":
          setRuntimeDevice(message.device);
          setStatus("ready");
          setModelLoaded(true);
          setErrorMessage("");
          setProgressPercent(100);
          break;

        case "stream":
          setOutput(message.text);
          break;

        case "result":
          setOutput(message.text || "The model returned an empty response.");
          setStatus("ready");
          setHasRun(true);
          setErrorMessage("");
          break;

        case "error":
          setStatus("error");
          setErrorMessage(message.message);
          break;
      }
    };

    worker.addEventListener("message", onMessage);

    let cancelled = false;

    const prepareRuntime = async () => {
      const device = await detectPreferredDevice();
      if (!cancelled) {
        setRuntimeDevice(device);
        loadModel(DEFAULT_MODEL, device);
      }
    };

    prepareRuntime();

    return () => {
      cancelled = true;
      worker.removeEventListener("message", onMessage);
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const resetForLoad = () => {
    setStatus("loading");
    setModelLoaded(false);
    setErrorMessage("");
    setProgressEvent(null);
    setProgressPercent(null);
    setOutput("");
    setHasRun(false);
  };

  const loadModel = (model: SelectedModel, device = runtimeDevice) => {
    if (!workerRef.current) {
      setStatus("error");
      setErrorMessage("The worker is unavailable. Refresh and try again.");
      return false;
    }

    resetForLoad();
    workerRef.current.postMessage({
      type: "load",
      model,
      device,
    } satisfies WorkerRequest);

    return true;
  };

  const runModel = ({ model, input, systemPrompt }: RunRequest) => {
    if (!input.trim()) {
      setStatus("error");
      setErrorMessage("Enter a prompt before running the model.");
      return false;
    }

    if (!workerRef.current) {
      setStatus("error");
      setErrorMessage("The worker is unavailable. Refresh and try again.");
      return false;
    }

    setStatus("running");
    setErrorMessage("");
    setOutput("");
    setHasRun(true);

    workerRef.current.postMessage({
      type: "generate",
      model,
      input: input.trim(),
      systemPrompt: systemPrompt.trim(),
      device: runtimeDevice,
    } satisfies WorkerRequest);

    return true;
  };

  const stopModel = () => {
    if (!workerRef.current) {
      return false;
    }

    workerRef.current.postMessage({
      type: "stop",
    } satisfies WorkerRequest);

    return true;
  };

  const clearOutput = () => {
    setOutput("");
    setHasRun(false);
    setErrorMessage("");
    if (status === "error" && modelLoaded) {
      setStatus("ready");
    }
  };

  return {
    output,
    status,
    errorMessage,
    progressEvent,
    progressPercent,
    runtimeDevice,
    modelLoaded,
    hasRun,
    loadModel,
    runModel,
    stopModel,
    clearOutput,
  };
};
