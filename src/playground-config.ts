import type { SelectedModel } from "./types";

export const DEFAULT_SYSTEM_PROMPT =
  "You are a helpful assistant. Return only the final answer. Do not include thinking tags, hidden reasoning, or step-by-step internal thoughts.";

export const DEFAULT_USER_PROMPT = "Hey! How are you?";

export const DEFAULT_MODEL: SelectedModel = "onnx-community/Qwen3-0.6B-ONNX";

export const MODEL_OPTIONS: Array<{ label: string; value: SelectedModel }> = [
  { label: "Qwen3 0.6B", value: "onnx-community/Qwen3-0.6B-ONNX" },
  { label: "SmolLM2 360M", value: "onnx-community/SmolLM2-360M-ONNX" },
  {
    label: "SmolLM2 135M Instruct",
    value: "onnx-community/SmolLM2-135M-Instruct-ONNX-MHA",
  },
];

export type AppStatus = "loading" | "ready" | "running" | "error";

export type ThemeMode = "light" | "dark";
