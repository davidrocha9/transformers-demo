import type { PreferredDevice, WorkerProgressEvent } from "./types";

export const formatPercent = (progress?: number) => {
  if (typeof progress !== "number") {
    return null;
  }

  const normalized = progress > 1 ? progress : progress * 100;
  return Math.max(0, Math.min(100, normalized));
};

export const formatProgressLabel = (event: WorkerProgressEvent | null) => {
  if (!event) {
    return "Preparing model...";
  }

  if (event.message) {
    return event.message;
  }

  if (event.file && typeof event.progress === "number") {
    return `Loading ${event.file}`;
  }

  if (event.file) {
    return `Fetching ${event.file}`;
  }

  if (event.name) {
    return event.name;
  }

  switch (event.status) {
    case "initiate":
      return "Starting download...";
    case "progress":
      return "Downloading model files...";
    case "done":
      return "Finishing setup...";
    default:
      return "Preparing model...";
  }
};

export const detectPreferredDevice = async (): Promise<PreferredDevice> => {
  const webGpuNavigator = navigator as Navigator & {
    gpu?: {
      requestAdapter: () => Promise<unknown>;
    };
  };

  if (!webGpuNavigator.gpu) {
    return "default";
  }

  try {
    const adapter = await webGpuNavigator.gpu.requestAdapter();
    return adapter ? "webgpu" : "default";
  } catch {
    return "default";
  }
};
