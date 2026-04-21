import { useState, useCallback, useRef } from "react";

// ── Text-to-Speech ────────────────────────────────────────────────────────────

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 0.92;
    utter.pitch = 1.0;
    utter.volume = 1;
    // Prefer a clear English voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Neural"))
    ) ?? voices.find((v) => v.lang.startsWith("en"));
    if (preferred) utter.voice = preferred;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => { setSpeaking(false); onEnd?.(); };
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  return { speak, stop, speaking };
}

// ── Speech-to-Text ────────────────────────────────────────────────────────────

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function useSTT(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => Boolean(SpeechRecognition));
  const recogRef = useRef<any>(null);

  const start = useCallback(() => {
    if (!SpeechRecognition) return;
    const recog = new SpeechRecognition();
    recog.lang = "en-US";
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.continuous = false;

    recog.onstart = () => setListening(true);
    recog.onresult = (e: any) => {
      const transcript = Array.from(e.results as any[])
        .map((r: any) => r[0].transcript)
        .join(" ")
        .trim();
      onTranscript(transcript);
    };
    recog.onend = () => setListening(false);
    recog.onerror = () => setListening(false);

    recogRef.current = recog;
    recog.start();
  }, [onTranscript]);

  const stop = useCallback(() => {
    recogRef.current?.stop();
    setListening(false);
  }, []);

  return { start, stop, listening, supported };
}
