"use client";
import { useEffect, useRef, useState } from "react";

type Sample = {
  elapsed_ms: number;
  processing_ms: number;
  roundtrip_ms: number;
};
type Temporal = {
  buffered_frames: number;
  window_size: number;
  stride: number;
  windows_completed: number;
};
type Result = {
  schema_version: number;
  landmarks: Record<string, number[][]>;
  detected: Record<string, boolean>;
  processing_ms: number;
  temporal: Temporal;
  error?: string;
};
const emptyTemporal: Temporal = {
  buffered_frames: 0,
  window_size: 30,
  stride: 15,
  windows_completed: 0,
};
const MAX_SAMPLES = 18000;

export function useSignBridge() {
  const video = useRef<HTMLVideoElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const resources = useRef<{
    socket?: WebSocket;
    media?: MediaStream;
    timer?: ReturnType<typeof setTimeout>;
    watchdog?: ReturnType<typeof setTimeout>;
  }>({});
  const generation = useRef(0);
  const active = useRef(false);
  const samples = useRef<Sample[]>([]);
  const startedAt = useRef("");
  const sessionCondition = useRef("Baseline");
  const [condition, setCondition] = useState("Baseline");
  const [status, setStatus] = useState("Ready for your session");
  const [phase, setPhase] = useState<"idle" | "connecting" | "live" | "error">(
    "idle",
  );
  const [metrics, setMetrics] = useState({
    fps: 0,
    processing: 0,
    latency: 0,
    frames: 0,
    seconds: 0,
  });
  const [detected, setDetected] = useState<Record<string, boolean>>({});
  const [temporal, setTemporal] = useState(emptyTemporal);

  function release() {
    active.current = false;
    generation.current++;
    const old = resources.current;
    resources.current = {};
    clearTimeout(old.timer);
    clearTimeout(old.watchdog);
    old.socket?.close();
    old.media?.getTracks().forEach((track) => track.stop());
  }
  function stop() {
    release();
    if (video.current) video.current.srcObject = null;
    overlay.current?.getContext("2d")?.clearRect(0, 0, 640, 480);
    setDetected({});
    setPhase("idle");
    setStatus("Session stopped · report available");
  }
  useEffect(() => () => release(), []);

  async function start() {
    if (active.current) return;
    active.current = true;
    const attempt = ++generation.current;
    const current = () => active.current && generation.current === attempt;
    const fail = (message: string) => {
      if (!current()) return;
      stop();
      setPhase("error");
      setStatus(message);
    };
    samples.current = [];
    startedAt.current = new Date().toISOString();
    sessionCondition.current = condition;
    setMetrics({ fps: 0, processing: 0, latency: 0, frames: 0, seconds: 0 });
    setTemporal(emptyTemporal);
    setPhase("connecting");
    setStatus("Waiting for camera permission…");
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "Camera access requires localhost and a supported browser.",
        );
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          aspectRatio: { ideal: 4 / 3 },
        },
        audio: false,
      });
      if (!current()) {
        media.getTracks().forEach((track) => track.stop());
        return;
      }
      resources.current.media = media;
      media.getVideoTracks().forEach((track) => {
        track.onended = () =>
          fail("Camera disconnected. Reconnect your camera and start again.");
      });
      video.current!.srcObject = media;
      await video.current!.play();
      if (!current()) return;
      setStatus("Connecting to local tracking service…");
      const ws = new WebSocket("ws://127.0.0.1:8000/ws/landmarks");
      resources.current.socket = ws;
      resources.current.watchdog = setTimeout(
        () => fail("Connection timed out. Check the local service and retry."),
        15000,
      );
      const canvas = document.createElement("canvas");
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext("2d")!;
      let sent = 0,
        begun = 0,
        frames = 0,
        lastRender = 0;
      const send = () => {
        if (!current() || ws.readyState !== WebSocket.OPEN || !video.current)
          return;
        // Preserve the complete source image inside the shared 640x480 frame.
        const source = video.current;
        const scale = Math.min(
          640 / source.videoWidth,
          480 / source.videoHeight,
        );
        const width = source.videoWidth * scale,
          height = source.videoHeight * scale;
        ctx.fillStyle = "#192d32";
        ctx.fillRect(0, 0, 640, 480);
        ctx.drawImage(
          source,
          (640 - width) / 2,
          (480 - height) / 2,
          width,
          height,
        );
        canvas.toBlob(
          (blob) => {
            if (!current() || ws.readyState !== WebSocket.OPEN) return;
            if (!blob) {
              fail(
                "Could not capture a camera frame. Please restart the session.",
              );
              return;
            }
            sent = performance.now();
            ws.send(blob);
            resources.current.watchdog = setTimeout(
              () =>
                fail(
                  "Tracking timed out. Restart the local service and retry.",
                ),
              30000,
            );
          },
          "image/jpeg",
          0.75,
        );
      };
      ws.onopen = () => {
        if (!current()) {
          ws.close();
          return;
        }
        clearTimeout(resources.current.watchdog);
        begun = performance.now();
        setPhase("live");
        setStatus("Live · movement tracking");
        send();
      };
      ws.onerror = () =>
        fail(
          "Tracking service unavailable. Check the app terminal and try again.",
        );
      ws.onclose = () =>
        fail("Connection closed. Start a new session to reconnect.");
      ws.onmessage = (event) => {
        if (!current()) return;
        clearTimeout(resources.current.watchdog);
        try {
          const result: Result = JSON.parse(event.data);
          if (result.error) {
            fail(result.error);
            return;
          }
          if (
            result.schema_version !== 1 ||
            !result.landmarks ||
            !result.temporal ||
            !Number.isFinite(result.processing_ms)
          )
            throw new Error("Invalid response");
          const now = performance.now();
          frames++;
          const elapsed = now - begun,
            latency = now - sent;
          samples.current.push({
            elapsed_ms: elapsed,
            processing_ms: result.processing_ms,
            roundtrip_ms: latency,
          });
          if (samples.current.length > MAX_SAMPLES)
            samples.current.splice(0, 1000);
          // Keep the overlay responsive while limiting dashboard React updates.
          if (now - lastRender >= 200 || frames === 1) {
            setMetrics({
              fps: (frames * 1000) / elapsed,
              processing: result.processing_ms,
              latency,
              frames,
              seconds: elapsed / 1000,
            });
            setDetected(result.detected);
            setTemporal(result.temporal);
            lastRender = now;
          }
          const paint = overlay.current?.getContext("2d");
          if (paint) {
            paint.clearRect(0, 0, 640, 480);
            Object.entries(result.landmarks).forEach(([name, points]) => {
              if (!result.detected[name]) return;
              paint.fillStyle = name === "face" ? "#a5e6ed" : "#66ffca";
              paint.beginPath();
              for (const [x, y] of points) {
                paint.moveTo(x * 640 + 2, y * 480);
                paint.arc(
                  x * 640,
                  y * 480,
                  name === "face" ? 1 : 2.7,
                  0,
                  Math.PI * 2,
                );
              }
              paint.fill();
            });
          }
          resources.current.timer = setTimeout(send, 0);
        } catch {
          fail(
            "The tracking service returned an unexpected response. Please restart it.",
          );
        }
      };
    } catch (error) {
      const name = error instanceof DOMException ? error.name : "";
      fail(
        name === "NotAllowedError"
          ? "Camera permission was declined. Allow camera access in your browser and retry."
          : name === "NotFoundError"
            ? "No camera found. Connect a camera and retry."
            : error instanceof Error
              ? error.message
              : "Unable to start camera.",
      );
    }
  }
  function download() {
    const rows = samples.current;
    if (!rows.length) return;
    const csv = [
      "session_started_utc,condition,elapsed_ms,processing_ms,roundtrip_ms",
      ...rows.map(
        (row) =>
          `${startedAt.current},${sessionCondition.current},${row.elapsed_ms.toFixed(2)},${row.processing_ms},${row.roundtrip_ms.toFixed(2)}`,
      ),
    ].join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `signbridge-${sessionCondition.current.toLowerCase().replaceAll(" ", "-")}-${startedAt.current.replaceAll(":", "-")}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return {
    video,
    overlay,
    phase,
    status,
    metrics,
    detected,
    temporal,
    condition,
    setCondition,
    start,
    stop,
    download,
  };
}
