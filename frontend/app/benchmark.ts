export type Detection = Record<string, boolean>;
export type TimingSample = {
  elapsed_ms: number;
  processing_ms: number;
  roundtrip_ms: number;
};

export function captureGuidance(detected: Detection) {
  if (!detected.pose)
    return {
      level: "warning",
      message: "Move into view so your upper body is visible.",
    };
  if (!detected.left_hand && !detected.right_hand)
    return {
      level: "warning",
      message: "Bring your hands into view when signing.",
    };
  if (!detected.face)
    return {
      level: "warning",
      message: "Keep your face visible to the camera.",
    };
  return {
    level: "ready",
    message: "Body, face and at least one hand are visible.",
  };
}

function distribution(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return {
    mean: values.reduce((a, b) => a + b, 0) / values.length,
    p50: sorted[Math.ceil(sorted.length * 0.5) - 1],
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1],
    max: sorted[sorted.length - 1],
  };
}

export class BenchmarkRecorder {
  readonly warmupMs = 5000;
  readonly durationMs: number;
  readonly samples: (TimingSample & {
    pose: boolean;
    left_hand: boolean;
    right_hand: boolean;
    face: boolean;
  })[] = [];
  readonly startedMs: number;
  constructor(startedMs: number, seconds = 60) {
    this.startedMs = startedMs;
    if (![30, 60, 120].includes(seconds))
      throw new Error("Choose a 30, 60 or 120 second benchmark");
    this.durationMs = seconds * 1000;
  }
  progress(now: number) {
    const elapsed = Math.max(0, now - this.startedMs);
    return {
      stage:
        elapsed < this.warmupMs
          ? "warmup"
          : elapsed < this.warmupMs + this.durationMs
            ? "measuring"
            : "complete",
      remainingSeconds: Math.max(
        0,
        Math.ceil(
          ((elapsed < this.warmupMs
            ? this.warmupMs
            : this.warmupMs + this.durationMs) -
            elapsed) /
            1000,
        ),
      ),
    };
  }
  record(now: number, sample: TimingSample, detected: Detection) {
    const elapsed = now - this.startedMs - this.warmupMs;
    if (elapsed <= 0 || elapsed > this.durationMs) return;
    if (
      ![sample.processing_ms, sample.roundtrip_ms].every(
        (value) => Number.isFinite(value) && value >= 0,
      )
    )
      return;
    this.samples.push({
      ...sample,
      elapsed_ms: elapsed,
      pose: !!detected.pose,
      left_hand: !!detected.left_hand,
      right_hand: !!detected.right_hand,
      face: !!detected.face,
    });
  }
  finish(now: number, reason: "completed" | "stopped" | "error") {
    const measuredMs = Math.min(
      this.durationMs,
      Math.max(0, now - this.startedMs - this.warmupMs),
    );
    const complete = reason === "completed" && measuredMs === this.durationMs;
    const detectionRate = (
      key: "pose" | "left_hand" | "right_hand" | "face",
    ) =>
      this.samples.length
        ? this.samples.filter((row) => row[key]).length / this.samples.length
        : null;
    return {
      schema_version: 1,
      mode: "landmarks_only",
      complete,
      reason,
      valid_timing_run: complete && this.samples.length > 0,
      warmup_seconds: this.warmupMs / 1000,
      requested_seconds: this.durationMs / 1000,
      measured_seconds: measuredMs / 1000,
      completed_frames: this.samples.length,
      fps: measuredMs > 0 ? (this.samples.length * 1000) / measuredMs : null,
      processing_ms: distribution(this.samples.map((row) => row.processing_ms)),
      roundtrip_ms: distribution(this.samples.map((row) => row.roundtrip_ms)),
      detection_rates: {
        pose: detectionRate("pose"),
        left_hand: detectionRate("left_hand"),
        right_hand: detectionRate("right_hand"),
        face: detectionRate("face"),
      },
      samples: this.samples.map((sample) => ({ ...sample })),
      limitation:
        "Tracking timing and landmark availability only. Does not measure recognition accuracy, WER, linguistic correctness, lighting, or clinical readiness.",
    };
  }
}
export type BenchmarkSummary = ReturnType<BenchmarkRecorder["finish"]>;
