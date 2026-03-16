import type { SelectedModel } from "../types";
import type { ThemeMode } from "../playground-config";
import { MoonIcon, SunIcon } from "./ThemeIcon";

type AppHeaderProps = {
  selectedModel: SelectedModel;
  modelOptions: Array<{ label: string; value: SelectedModel }>;
  status: "loading" | "ready" | "running" | "error";
  onModelChange: (model: SelectedModel) => void;
  onReloadModel: () => void;
  onToggleTheme: () => void;
  themeMode: ThemeMode;
};

export function AppHeader({
  selectedModel,
  modelOptions,
  status,
  onModelChange,
  onReloadModel,
  onToggleTheme,
  themeMode,
}: AppHeaderProps) {
  const controlsDisabled = status === "loading" || status === "running";

  return (
    <header className="page-header">
      <div className="header-copy">
        <h1>In-browser model playground</h1>
        <p className="subtle">
          Load small transformer models directly in the browser with Transformers.js and compare
          how they respond to different prompts.
        </p>
      </div>
      <div className="header-meta">
        <label className="sr-only" htmlFor="model-select">
          Select model
        </label>
        <select
          id="model-select"
          className="model-select"
          value={selectedModel}
          onChange={(event) => onModelChange(event.target.value as SelectedModel)}
          disabled={controlsDisabled}
        >
          {modelOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          className="header-action"
          type="button"
          onClick={onReloadModel}
          disabled={controlsDisabled}
          aria-keyshortcuts="Control+Shift+Enter Meta+Shift+Enter"
        >
          Reload model
        </button>
        <button
          className="header-action theme-toggle"
          type="button"
          onClick={onToggleTheme}
          aria-label={themeMode === "light" ? "Switch to dark mode" : "Switch to light mode"}
          title={themeMode === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {themeMode === "light" ? <MoonIcon /> : <SunIcon />}
        </button>
      </div>
    </header>
  );
}
