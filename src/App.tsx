import { type FormEvent, type KeyboardEvent, useRef, useState } from "react";
import "./App.css";
import { AppHeader } from "./components/AppHeader";
import { InputPanel } from "./components/InputPanel";
import { OutputPanel } from "./components/OutputPanel";
import { useModelWorker } from "./hooks/useModelWorker";
import { useThemeMode } from "./hooks/useThemeMode";
import {
  DEFAULT_SYSTEM_PROMPT,
  DEFAULT_USER_PROMPT,
  MODEL_OPTIONS,
} from "./playground-config";
import { formatProgressLabel } from "./runtime-utils";
import type { SelectedModel } from "./types";

function App() {
  const userPromptRef = useRef<HTMLTextAreaElement | null>(null);
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
  const [userPrompt, setUserPrompt] = useState(DEFAULT_USER_PROMPT);
  const [selectedModel, setSelectedModel] = useState<SelectedModel>(MODEL_OPTIONS[0].value);

  const { themeMode, toggleTheme } = useThemeMode();
  const {
    output,
    status,
    errorMessage,
    progressEvent,
    progressPercent,
    modelLoaded,
    hasRun,
    loadModel,
    runModel,
    stopModel,
    clearOutput,
  } = useModelWorker();

  const canRun =
    modelLoaded && status !== "loading" && status !== "running" && userPrompt.trim().length > 0;
  const loadingLabel = formatProgressLabel(progressEvent);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const didRun = runModel({
      model: selectedModel,
      input: userPrompt,
      systemPrompt,
    });

    if (!didRun && !userPrompt.trim()) {
      userPromptRef.current?.focus();
    }
  };

  const handleClear = () => {
    setSystemPrompt(DEFAULT_SYSTEM_PROMPT);
    setUserPrompt("");
    clearOutput();
  };

  const handleReloadModel = () => {
    loadModel(selectedModel);
  };

  const handleRetryLoad = () => {
    loadModel(selectedModel);
  };

  const handleModelChange = (model: SelectedModel) => {
    setSelectedModel(model);
    loadModel(model);
  };

  const handlePromptKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();

      if (event.shiftKey) {
        handleReloadModel();
        return;
      }

      if (status === "running") {
        stopModel();
        return;
      }

      if (canRun) {
        const didRun = runModel({
          model: selectedModel,
          input: userPrompt,
          systemPrompt,
        });

        if (!didRun && !userPrompt.trim()) {
          userPromptRef.current?.focus();
        }
      }
    }
  };

  return (
    <main className="app-shell">
      <AppHeader
        selectedModel={selectedModel}
        modelOptions={MODEL_OPTIONS}
        status={status}
        onModelChange={handleModelChange}
        onReloadModel={handleReloadModel}
        onToggleTheme={toggleTheme}
        themeMode={themeMode}
      />

      <section className="workspace" aria-label="Transformers demo">
        <InputPanel
          systemPrompt={systemPrompt}
          userPrompt={userPrompt}
          status={status}
          canRun={canRun}
          userPromptRef={userPromptRef}
          onSubmit={handleSubmit}
          onSystemPromptChange={setSystemPrompt}
          onUserPromptChange={setUserPrompt}
          onPromptKeyDown={handlePromptKeyDown}
          onClear={handleClear}
          onStop={stopModel}
        />

        <OutputPanel
          status={status}
          hasRun={hasRun}
          output={output}
          errorMessage={errorMessage}
          loadingLabel={loadingLabel}
          progressPercent={progressPercent}
          onRetry={handleRetryLoad}
        />
      </section>
    </main>
  );
}

export default App;
