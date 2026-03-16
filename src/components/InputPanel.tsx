import type { FormEvent, KeyboardEvent, RefObject } from "react";
import type { AppStatus } from "../playground-config";

type InputPanelProps = {
  systemPrompt: string;
  userPrompt: string;
  status: AppStatus;
  canRun: boolean;
  userPromptRef: RefObject<HTMLTextAreaElement>;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onSystemPromptChange: (value: string) => void;
  onUserPromptChange: (value: string) => void;
  onPromptKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  onClear: () => void;
  onStop: () => void;
};

export function InputPanel({
  systemPrompt,
  userPrompt,
  status,
  canRun,
  userPromptRef,
  onSubmit,
  onSystemPromptChange,
  onUserPromptChange,
  onPromptKeyDown,
  onClear,
  onStop,
}: InputPanelProps) {
  return (
    <form
      className="panel panel-input"
      onSubmit={onSubmit}
      aria-labelledby="input-heading"
      aria-describedby="input-shortcuts"
      aria-busy={status === "loading" || status === "running"}
    >
      <div className="panel-heading">
        <div>
          <h2 id="input-heading">Input</h2>
          <p className="panel-copy">Set the system prompt and user prompt, then run.</p>
        </div>
      </div>

      <label className="field-label" htmlFor="system-prompt-input">
        System prompt
      </label>
      <textarea
        id="system-prompt-input"
        className="prompt-input prompt-input-system"
        value={systemPrompt}
        onChange={(event) => onSystemPromptChange(event.target.value)}
        onKeyDown={onPromptKeyDown}
        placeholder="Describe the assistant behavior..."
        spellCheck={false}
        aria-describedby="input-shortcuts"
      />

      <label className="sr-only" htmlFor="prompt-input">
        User prompt input
      </label>
      <label className="field-label" htmlFor="prompt-input">
        User prompt
      </label>
      <textarea
        id="prompt-input"
        className="prompt-input"
        ref={userPromptRef}
        value={userPrompt}
        onChange={(event) => onUserPromptChange(event.target.value)}
        onKeyDown={onPromptKeyDown}
        placeholder="Type a message..."
        spellCheck={false}
        aria-describedby="input-shortcuts"
      />
      <p className="sr-only" id="input-shortcuts">
        Keyboard shortcuts: Control or Command plus Enter runs the prompt, or stops generation when
        a response is in progress. Control or Command plus Shift plus Enter loads or reloads the
        model.
      </p>

      <div className="actions">
        {status === "running" ? (
          <button
            className="action-button icon-action stop"
            type="button"
            onClick={onStop}
            aria-keyshortcuts="Control+Enter Meta+Enter"
            aria-label="Stop generation"
            title="Stop generation (Ctrl/Cmd+Enter)"
          >
            <span className="stop-icon" aria-hidden="true" />
          </button>
        ) : (
          <button
            className="action-button primary icon-action"
            type="submit"
            disabled={!canRun}
            aria-keyshortcuts="Control+Enter Meta+Enter"
            aria-label="Run prompt"
            title="Run prompt (Ctrl/Cmd+Enter)"
          >
            <span className="run-icon" aria-hidden="true">
              ↑
            </span>
          </button>
        )}
        <button
          className="action-button secondary"
          type="button"
          onClick={onClear}
          disabled={status === "running"}
        >
          Clear
        </button>
      </div>
    </form>
  );
}
