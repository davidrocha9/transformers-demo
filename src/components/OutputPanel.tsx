import type { AppStatus } from "../playground-config";

type OutputPanelProps = {
  status: AppStatus;
  hasRun: boolean;
  output: string;
  errorMessage: string;
  loadingLabel: string;
  progressPercent: number | null;
  onRetry: () => void;
};

export function OutputPanel({
  status,
  hasRun,
  output,
  errorMessage,
  loadingLabel,
  progressPercent,
  onRetry,
}: OutputPanelProps) {
  return (
    <section
      className="panel panel-output"
      aria-live="polite"
      aria-labelledby="output-heading"
      aria-busy={status === "loading" || status === "running"}
    >
      <div className="panel-heading">
        <div>
          <h2 id="output-heading">Output</h2>
          <p className="panel-copy">Streaming response from the browser worker.</p>
        </div>
      </div>

      {status === "loading" && (
        <div className="content-block state-block loading-state-block">
          <div className="loading-copy">
            <strong>Loading model</strong>
            <p className="helper-text">{loadingLabel}</p>
          </div>
          <div className="progress-track" aria-hidden="true">
            <div
              className="progress-fill"
              style={{
                width:
                  typeof progressPercent === "number"
                    ? `${Math.max(progressPercent, 8)}%`
                    : "20%",
              }}
            />
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="content-block state-block error-block">
          <strong>Something went wrong</strong>
          <p>{errorMessage}</p>
          <button className="action-button secondary" type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      {status !== "loading" && status !== "running" && status !== "error" && !hasRun && (
        <div className="content-block output-block output-placeholder" aria-hidden="true">
          <pre>Response will appear here...</pre>
        </div>
      )}

      {(status === "running" || hasRun) && status !== "loading" && status !== "error" && (
        <div className="content-block output-block">
          {status === "running" && !output ? (
            <div className="loading-inline" aria-live="polite">
              <span className="spinner" aria-hidden="true" />
              <p className="helper-text">Generating...</p>
            </div>
          ) : null}
          <pre>{output}</pre>
        </div>
      )}
    </section>
  );
}
