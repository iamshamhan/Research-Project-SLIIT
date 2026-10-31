"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import Navigation from "../navigation";

export default function DoctorPage() {
  const [source, setSource] = useState<"en" | "si">("en");
  const [message, setMessage] = useState("");
  const [translation, setTranslation] = useState<{
    source: string;
    language: string;
    text: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [waiting, setWaiting] = useState(false);
  const byteCount = new TextEncoder().encode(message.trim()).length;
  const translated =
    translation?.source === message && translation.language === source
      ? translation.text
      : "";
  useEffect(() => {
    if (!message.trim() || byteCount > 500) return;
    const controller = new AbortController();
    let live = true;
    const timer = setTimeout(async () => {
      setWaiting(true);
      setError("");
      const deadline = setTimeout(() => controller.abort(), 15000);
      try {
        const response = await fetch("http://127.0.0.1:8000/translate/online", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: message, source }),
          signal: controller.signal,
        });
        const value = await response.json();
        if (!response.ok)
          throw new Error(
            typeof value.detail === "string"
              ? value.detail
              : "Translation unavailable. Restart the app and retry.",
          );
        if (live)
          setTranslation({
            source: message,
            language: source,
            text: value.text,
          });
      } catch (reason) {
        if (live)
          setError(
            reason instanceof Error && reason.name !== "AbortError"
              ? reason.message
              : "Translation timed out. Please try again.",
          );
      } finally {
        clearTimeout(deadline);
        if (live) setWaiting(false);
      }
    }, 900);
    return () => {
      live = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [message, source, byteCount]);
  function edit(value: string, language: "en" | "si") {
    setSource(language);
    setMessage(value);
    setTranslation(null);
    setError("");
    setWaiting(false);
  }
  function retry() {
    setTranslation(null);
    setMessage("");
    setTimeout(() => setMessage(message), 0);
  }
  return (
    <main className="doctor-shell">
      <header className="app-header">
        <Link className="brand" href="/">
          <span className="brand-mark" aria-hidden="true">
            ↔
          </span>
          <span>
            <strong>SignBridge</strong>
            <small>Healthcare communication</small>
          </span>
        </Link>
        <Navigation />
      </header>
      <section className="doctor-intro">
        <div>
          <p className="eyebrow">DOCTOR → PATIENT</p>
          <h1>A clear message. In both languages.</h1>
          <p>
            Type in either box. The other language updates automatically after
            you pause.
          </p>
        </div>
        <button
          className="secondary-button clear-message"
          onClick={() => edit("", source)}
        >
          Clear message
        </button>
      </section>
      <div
        className="doctor-language-pick"
        role="group"
        aria-label="Writing language"
      >
        <span>Write in</span>
        <button aria-pressed={source === "en"} onClick={() => edit("", "en")}>
          English
        </button>
        <button aria-pressed={source === "si"} onClick={() => edit("", "si")}>
          සිංහල
        </button>
        <span className="doctor-status" role="status">
          {byteCount > 500
            ? "Message too long — shorten it to translate."
            : error ||
              (waiting
                ? "Translating online…"
                : translated
                  ? "Translation updated"
                  : message.trim()
                    ? "Waiting for translation…"
                    : "Ready to type")}
        </span>
        {error && <button onClick={retry}>Retry</button>}
      </div>
      <section className="doctor-messages" aria-label="Message for the patient">
        {(["si", "en"] as const).map((language) => (
          <section
            className={`doctor-message ${language === "si" ? "sinhala-card" : ""}`}
            key={language}
          >
            <div className="translation-heading">
              <label htmlFor={`doctor-${language}`}>
                {language === "si" ? "සිංහල" : "English"}
              </label>
              <span className="preview-badge">
                {source === language
                  ? "Typing"
                  : "Translated from " +
                    (source === "en" ? "English" : "Sinhala")}
              </span>
            </div>
            <textarea
              id={`doctor-${language}`}
              lang={language}
              dir="auto"
              maxLength={500}
              spellCheck={false}
              value={source === language ? message : translated}
              placeholder={
                source === language
                  ? language === "si"
                    ? "ඔබේ පණිවිඩය මෙහි ලියන්න…"
                    : "Type your message here…"
                  : language === "si"
                    ? "සිංහල පරිවර්තනය මෙහි පෙන්වයි…"
                    : "The English translation will appear here…"
              }
              onChange={(event) => edit(event.target.value, language)}
              aria-describedby="online-note"
            />
            <p>
              {source === language
                ? `${byteCount}/500 UTF-8 bytes`
                : "You can also type here to change the writing language."}
            </p>
          </section>
        ))}
      </section>
      <footer id="online-note">
        <span>
          Online translation by MyMemory. Text is sent to an external service.
          Avoid patient-identifying information.
        </span>
        <span>
          Please confirm important medical instructions with the patient.
        </span>
      </footer>
    </main>
  );
}
