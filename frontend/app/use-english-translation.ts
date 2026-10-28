"use client";
import { useEffect, useState } from "react";

type Translation = {
  source_text: string;
  text: string | null;
  status: "translated" | "unsupported";
  method: string;
};
export function useEnglishTranslation(source: string, enabled: boolean) {
  const [result, setResult] = useState<Translation | null>(null);
  const [error, setError] = useState("");
  const [pendingSource, setPendingSource] = useState("");
  useEffect(() => {
    if (!enabled || !source.trim()) return;
    const controller = new AbortController();
    let live = true;
    const timer = setTimeout(async () => {
      setPendingSource(source);
      setError("");
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        const response = await fetch(
          "http://127.0.0.1:8000/translate/sinhala-to-english",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: source }),
            signal: controller.signal,
          },
        );
        if (!response.ok)
          throw new Error(
            "Translation service unavailable. Restart the local app and retry.",
          );
        const value: Translation = await response.json();
        if (live) setResult(value);
      } catch (reason) {
        if (live) {
          setResult(null);
          setError(
            reason instanceof Error && reason.name !== "AbortError"
              ? reason.message
              : "Translation timed out. Check the local service.",
          );
        }
      } finally {
        clearTimeout(timeout);
        if (live) setPendingSource("");
      }
    }, 350);
    return () => {
      live = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [source, enabled]);
  const current =
    result?.source_text === source.trim().normalize("NFC").replace(/\s+/g, " ")
      ? result
      : null;
  return {
    result: current,
    error,
    loading: !!pendingSource && pendingSource === source,
  };
}
