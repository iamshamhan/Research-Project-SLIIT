"use client";
import { useState } from "react";
import { useSignBridge } from "./use-signbridge";
import { useEnglishTranslation } from "./use-english-translation";

function Icon({
  name,
}: {
  name: "camera" | "expand" | "shield" | "download" | "spark";
}) {
  const paths = {
    camera: (
      <>
        <rect x="3" y="6" width="13" height="12" rx="3" />
        <path d="m16 10 5-3v10l-5-3" />
      </>
    ),
    expand: (
      <>
        <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />
      </>
    ),
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5" />
      </>
    ),
    spark: (
      <>
        <path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
export default function Home() {
  const session = useSignBridge();
  const [sinhalaText, setSinhalaText] = useState("ආයුබෝවන්");
  const [englishEnabled, setEnglishEnabled] = useState(false);
  const english = useEnglishTranslation(sinhalaText, englishEnabled);
  const [showOverlay, setShowOverlay] = useState(true);
  const [fullscreenError, setFullscreenError] = useState("");
  const busy = session.phase === "connecting" || session.phase === "live";
  const time = `${Math.floor(session.metrics.seconds / 60)
    .toString()
    .padStart(2, "0")}:${Math.floor(session.metrics.seconds % 60)
    .toString()
    .padStart(2, "0")}`;
  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setFullscreenError("");
    } catch {
      setFullscreenError(
        "Fullscreen unavailable. Use your browser’s fullscreen option.",
      );
    }
  }
  return (
    <main className="app-shell">
      <header className="app-header">
        <a className="brand" href="/" aria-label="SignBridge home">
          <span className="brand-mark" aria-hidden="true">
            ↔
          </span>
          <span>
            <strong>SignBridge</strong>
            <small>Healthcare communication</small>
          </span>
        </a>
        <div className="header-center">
          <span className="small-dot" />A little closer to understanding
        </div>
        <button
          className="icon-button"
          onClick={fullscreen}
          aria-label="Toggle fullscreen"
          title="Toggle fullscreen"
        >
          <Icon name="expand" />
        </button>
      </header>
      <section className="workspace-heading">
        <div>
          <p className="eyebrow">YOUR COMMUNICATION SPACE</p>
          <h1>Every conversation matters.</h1>
        </div>
        <span className="privacy-pill">
          <Icon name="shield" />
          Processed on this device
        </span>
      </section>
      {fullscreenError && (
        <p className="fullscreen-error" role="status">
          {fullscreenError}
        </p>
      )}
      <div className="workspace">
        <div className="capture-column">
          <section className="camera-card" aria-label="Camera session">
            <div className="camera-toolbar">
              <div className="camera-title">
                <Icon name="camera" />
                <h2>Live camera</h2>
                <span
                  className={`session-badge ${session.phase === "live" ? "is-live" : ""}`}
                >
                  <i />
                  {session.phase === "live"
                    ? "Live"
                    : session.phase === "connecting"
                      ? "Connecting"
                      : "Standby"}
                </span>
              </div>
              <div className="view-tools">
                <label className="overlay-toggle">
                  <input
                    type="checkbox"
                    checked={showOverlay}
                    onChange={(event) => setShowOverlay(event.target.checked)}
                  />
                  Landmarks
                </label>
              </div>
            </div>
            <div className="camera-stage fit-view">
              <div className="camera-frame">
                <video
                  ref={session.video}
                  muted
                  playsInline
                  aria-label="Mirrored live webcam preview"
                />
                <canvas
                  ref={session.overlay}
                  width={640}
                  height={480}
                  style={{ visibility: showOverlay ? "visible" : "hidden" }}
                  aria-hidden="true"
                />
              </div>
              {busy && (
                <div
                  className={`capture-guidance ${session.guidance.level}`}
                  role="status"
                >
                  {session.guidance.message}
                </div>
              )}
              {!busy && (
                <div className="camera-placeholder">
                  <span className="placeholder-icon">
                    <Icon name="camera" />
                  </span>
                  <h3>A space to be understood.</h3>
                  <p>
                    Start your camera, sit comfortably, and keep
                    <br />
                    your hands and upper body in view.
                  </p>
                  <span>Camera access stays on this computer</span>
                </div>
              )}
              {busy && (
                <>
                  <div className="frame-corner corner-tl" />
                  <div className="frame-corner corner-tr" />
                  <div className="frame-corner corner-bl" />
                  <div className="frame-corner corner-br" />
                  <span className="stage-label">
                    Full signing frame · no display crop
                  </span>
                </>
              )}
            </div>
            <div className="camera-actions">
              <div className="start-controls">
                <button
                  className={`primary-button ${busy ? "stop-button" : ""}`}
                  onClick={busy ? session.stop : () => session.start()}
                >
                  <span aria-hidden="true">{busy ? "■" : "●"}</span>
                  {busy ? "End session" : "Start session"}
                </button>
                <p
                  role="status"
                  className={session.phase === "error" ? "error-message" : ""}
                >
                  {session.status}
                </p>
              </div>
              <span
                className="session-clock"
                aria-label="Processed session duration"
              >
                {time}
              </span>
            </div>
          </section>
        </div>
        <aside
          className="translation-column"
          aria-label="Translation and session details"
        >
          <div className="translation-flow" aria-label="Translation order">
            <span>Signs</span>
            <span aria-hidden="true">→</span>
            <strong>Sinhala</strong>
            <span aria-hidden="true">→</span>
            <span>
              English <small>optional</small>
            </span>
          </div>
          <section
            className="translation-card sinhala-card"
            aria-labelledby="translation-title"
          >
            <div className="translation-heading">
              <label
                className="eyebrow"
                id="translation-title"
                htmlFor="sinhala-text"
              >
                SINHALA TEXT
              </label>
              <span className="preview-badge">Manual preview</span>
            </div>
            <textarea
              id="sinhala-text"
              className="sinhala-input"
              lang="si"
              value={sinhalaText}
              maxLength={2000}
              onChange={(event) => setSinhalaText(event.target.value)}
              spellCheck={false}
              aria-describedby="sinhala-help"
            />
            <p id="sinhala-help">
              Sign recognition is pending. Edit this preview to test Sinhala →
              English separately.
            </p>
          </section>
          <section className="english-card" aria-labelledby="english-title">
            <div className="translation-heading">
              <h2 id="english-title">English translation</h2>
              <label className="switch-label">
                <input
                  type="checkbox"
                  checked={englishEnabled}
                  onChange={(event) => setEnglishEnabled(event.target.checked)}
                  aria-label="Enable Sinhala to English translation"
                />
                <span className="switch-track" aria-hidden="true" />
              </label>
            </div>
            <p className="english-source">
              Translated from the Sinhala text above
            </p>
            <div className="english-result" role="status" aria-live="polite">
              {!englishEnabled ? (
                <span className="english-empty">
                  Turn on to see English here.
                </span>
              ) : !sinhalaText.trim() ? (
                <span className="english-empty">Waiting for Sinhala text…</span>
              ) : english.error ? (
                <span className="translation-error">{english.error}</span>
              ) : english.loading || !english.result ? (
                <span className="english-empty">Translating…</span>
              ) : english.result.status === "translated" ? (
                english.result.text
              ) : (
                <span className="english-empty">
                  This text is not in the preview glossary.
                </span>
              )}
            </div>
            <p className="english-caption">
              Offline preview glossary: ආයුබෝවන්, ස්තූතියි, ඔව්, නැහැ. A general
              translation model is not connected yet.
            </p>
          </section>
          <details
            className="benchmark-panel"
            open={session.benchmarkProgress ? true : undefined}
          >
            <summary>
              Timed benchmark{" "}
              <span>
                {session.benchmarkProgress
                  ? session.benchmarkProgress.stage
                  : "5 s warm-up"}
              </span>
            </summary>
            <div className="benchmark-body">
              <p>
                Measure tracking performance after 5 seconds of warm-up. Camera
                stops automatically when the run ends.
              </p>
              <div className="benchmark-fields">
                <label>
                  Measurement duration
                  <select
                    value={session.benchmarkSeconds}
                    onChange={(event) =>
                      session.setBenchmarkSeconds(Number(event.target.value))
                    }
                    disabled={busy}
                  >
                    <option value={30}>30 seconds</option>
                    <option value={60}>60 seconds</option>
                    <option value={120}>120 seconds</option>
                  </select>
                </label>
                <label>
                  Condition
                  <select
                    value={session.condition}
                    onChange={(event) =>
                      session.setCondition(event.target.value)
                    }
                    disabled={busy}
                  >
                    {[
                      "Baseline",
                      "Low light",
                      "Busy background",
                      "Signer variation",
                    ].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="hardware-label">
                Device / CPU notes (optional)
                <input
                  value={session.hardware}
                  maxLength={200}
                  onChange={(event) => session.setHardware(event.target.value)}
                  placeholder="e.g. laptop model, CPU, RAM"
                  disabled={busy}
                />
              </label>
              <button
                className="secondary-button"
                onClick={session.startBenchmark}
                disabled={busy}
              >
                Run timed benchmark
              </button>
              {session.benchmarkProgress && (
                <p className="benchmark-progress" role="status">
                  {session.benchmarkProgress.stage === "warmup"
                    ? "Warming up"
                    : session.benchmarkProgress.stage === "measuring"
                      ? "Measuring"
                      : session.benchmarkProgress.stage === "complete"
                        ? "Finished"
                        : session.benchmarkProgress.stage === "connecting"
                          ? "Connecting"
                          : "Run interrupted"}
                  {session.benchmarkProgress.remainingSeconds > 0
                    ? ` · ${session.benchmarkProgress.remainingSeconds} s remaining`
                    : ""}
                </p>
              )}
              {session.benchmarkReport && (
                <div className="benchmark-result">
                  <strong>
                    {session.benchmarkReport.valid_timing_run
                      ? "Timing run complete"
                      : "Incomplete or empty run"}
                  </strong>
                  <div className="benchmark-numbers">
                    <span>
                      <b>{session.benchmarkReport.fps?.toFixed(1) ?? "—"}</b>FPS
                    </span>
                    <span>
                      <b>
                        {session.benchmarkReport.roundtrip_ms?.mean.toFixed(
                          0,
                        ) ?? "—"}{" "}
                        ms
                      </b>
                      Mean round trip
                    </span>
                    <span>
                      <b>
                        {session.benchmarkReport.roundtrip_ms?.p95.toFixed(0) ??
                          "—"}{" "}
                        ms
                      </b>
                      P95 round trip
                    </span>
                  </div>
                  <p>
                    {session.benchmarkReport.completed_frames} measured frames
                    over {session.benchmarkReport.measured_seconds.toFixed(1)}{" "}
                    s. Warm-up excluded.
                  </p>
                  <button
                    className="secondary-button"
                    onClick={session.downloadBenchmark}
                  >
                    Download benchmark JSON
                  </button>
                </div>
              )}
              <p className="benchmark-limitation">
                Measures timing and landmark availability only, not recognition
                accuracy. Keep setup and signing activity consistent across
                conditions.
              </p>
            </div>
          </details>
          <details className="diagnostics">
            <summary>
              Session details <span>{session.metrics.fps.toFixed(1)} FPS</span>
            </summary>
            <div className="session-sidebar">
              <section className="info-card performance-card">
                <div className="card-title">
                  <h2>Session performance</h2>
                  <span className="subtle-badge">640 × 480</span>
                </div>
                <div className="speed">
                  <strong>{session.metrics.fps.toFixed(1)}</strong>
                  <span>
                    FPS<small>completed frames / second</small>
                  </span>
                </div>
                <div className="metric-grid">
                  <div>
                    <strong>
                      {session.metrics.processing.toFixed(0)}
                      <small> ms</small>
                    </strong>
                    <span>Processing</span>
                  </div>
                  <div>
                    <strong>
                      {session.metrics.latency.toFixed(0)}
                      <small> ms</small>
                    </strong>
                    <span>Round trip</span>
                  </div>
                  <div>
                    <strong>{session.metrics.frames.toLocaleString()}</strong>
                    <span>Frames</span>
                  </div>
                </div>
                <p className="card-caption">Target ≥15 FPS · tracking only</p>
              </section>
              <section className="info-card tracking-card">
                <div className="card-title">
                  <h2>Movement tracking</h2>
                  <span className="small-dot" />
                </div>
                {[
                  ["pose", "Body position"],
                  ["left_hand", "Left hand"],
                  ["right_hand", "Right hand"],
                  ["face", "Face"],
                ].map(([key, label]) => (
                  <div className="tracking-row" key={key}>
                    <span>{label}</span>
                    <span
                      className={`tracking-status ${session.detected[key] ? "detected" : ""}`}
                    >
                      <i />
                      {session.detected[key] ? "Detected" : "Waiting"}
                    </span>
                  </div>
                ))}
              </section>
              <section className="info-card report-card">
                <div className="card-title">
                  <h2>Performance report</h2>
                  <Icon name="download" />
                </div>
                <label className="field-label" htmlFor="condition">
                  Session condition
                </label>
                <select
                  id="condition"
                  value={session.condition}
                  onChange={(event) => session.setCondition(event.target.value)}
                  disabled={busy}
                >
                  {[
                    "Baseline",
                    "Low light",
                    "Busy background",
                    "Signer variation",
                  ].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
                <button
                  className="secondary-button"
                  onClick={session.download}
                  disabled={!session.metrics.frames}
                >
                  <Icon name="download" />
                  Export timing CSV
                </button>
                <p className="card-caption">
                  Condition is fixed when a session starts. Timing data does not
                  measure recognition accuracy.
                </p>
              </section>
              <details className="info-card sequence-card">
                <summary>
                  Sequence preparation
                  <span>
                    {session.temporal.buffered_frames}/
                    {session.temporal.window_size}
                  </span>
                </summary>
                <div className="sequence-body">
                  <progress
                    aria-label="Temporal buffer fill"
                    value={session.temporal.buffered_frames}
                    max={session.temporal.window_size}
                  />
                  <p>
                    {session.temporal.windows_completed} windows · stride{" "}
                    {session.temporal.stride} frames
                  </p>
                  <p>
                    Prototype settings. The trained recognition model is
                    pending.
                  </p>
                </div>
              </details>
              <div className="session-tip">
                <Icon name="spark" />
                <p>
                  Good lighting and a clear view of both hands help the tracker
                  follow your movements.
                </p>
              </div>
            </div>
          </details>
        </aside>
      </div>
      <footer>
        <span>
          SignBridge <span className="footer-divider">/</span> Supporting more
          accessible care
        </span>
        <span>
          <i className="small-dot" />
          No video recordings. No cloud uploads.
        </span>
      </footer>
    </main>
  );
}
