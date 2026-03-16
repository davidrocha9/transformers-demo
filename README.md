# In-Browser Model Playground

A browser-only React + Vite playground for loading small transformer models with `@huggingface/transformers` and comparing how they respond to different system and user prompts.

## What it does

- Loads ONNX transformer models directly in the browser
- Runs inference in a Web Worker so the UI stays responsive
- Streams responses into the output panel
- Supports model switching, reloads, and interrupting generation
- Includes light and dark mode

## Models

The app currently exposes these models:

- `onnx-community/Qwen3-0.6B-ONNX`
- `onnx-community/SmolLM2-360M-ONNX`
- `onnx-community/SmolLM2-135M-Instruct-ONNX-MHA`

## Tech stack

- React 18
- Vite
- TypeScript
- `@huggingface/transformers`

## Getting started

```bash
bun install
bun run dev
```

Open the local Vite URL in your browser.

## Scripts

```bash
bun run dev
bun run build
bun run preview
```

## Notes

- The first model load can take a while because weights and runtime assets are downloaded into the browser cache.
- Later loads are usually much faster on the same device/browser.
- Some models may think internally before producing visible output; the app strips hidden reasoning from the rendered response.
- If you change worker code and the browser seems stuck on old behavior, do a hard refresh so the new worker bundle is picked up.

## Project structure

```text
src/
  components/      UI sections
  hooks/           worker + theme hooks
  model.worker.ts  browser inference worker
  playground-config.ts
  runtime-utils.ts
  types.ts
```
