import { useState, useCallback, useRef, useEffect } from "react";

// ── Gemini TTS ────────────────────────────────────────────────────────────────

function getToken(): string | null {
  return localStorage.getItem("cs231_token");
}

async function fetchGeminiTTS(text: string, voice = "Kore"): Promise<HTMLAudioElement | null> {
  try {
    const token = getToken();
    const res = await fetch("/ai/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text, voice }),
    });
    if (!res.ok) return null;
    const { audio_base64, mime_type } = await res.json();
    const audio = new Audio(`data:${mime_type};base64,${audio_base64}`);
    return audio;
  } catch {
    return null;
  }
}

// ── TTS hook ──────────────────────────────────────────────────────────────────

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const [mode, setMode] = useState<"gemini" | "browser" | "unknown">("unknown");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Detect which TTS is available by calling /ai/config once
  useEffect(() => {
    fetch("/ai/config")
      .then(r => r.json())
      .then(d => setMode(d.tts_available ? "gemini" : "browser"))
      .catch(() => setMode("browser"));
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string, onEnd?: () => void) => {
    stop();
    if (!text.trim()) return;
    setSpeaking(true);

    // Try Gemini TTS first if available
    if (mode === "gemini") {
      const audio = await fetchGeminiTTS(text);
      if (audio) {
        audioRef.current = audio;
        audio.onended = () => { setSpeaking(false); audioRef.current = null; onEnd?.(); };
        audio.onerror = () => {
          setSpeaking(false);
          audioRef.current = null;
          _browserSpeak(text, onEnd, setSpeaking);
        };
        audio.play().catch(() => {
          setSpeaking(false);
          _browserSpeak(text, onEnd, setSpeaking);
        });
        return;
      }
    }

    // Fallback: browser Web Speech API
    _browserSpeak(text, onEnd, setSpeaking);
  }, [mode, stop]);

  return { speak, stop, speaking, mode };
}

function _browserSpeak(text: string, onEnd: (() => void) | undefined, setSpeaking: (v: boolean) => void) {
  if (!window.speechSynthesis) { setSpeaking(false); return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.92;
  utter.pitch = 1.0;
  utter.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Natural") || v.name.includes("Neural")))
    ?? voices.find(v => v.lang.startsWith("en"));
  if (preferred) utter.voice = preferred;
  utter.onend = () => { setSpeaking(false); onEnd?.(); };
  utter.onerror = () => setSpeaking(false);
  window.speechSynthesis.speak(utter);
}

// ── STT hook ──────────────────────────────────────────────────────────────────

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export function useSTT(onTranscript: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(() => Boolean(SpeechRecognition));
  const [error, setError] = useState<string | null>(null);
  const recogRef = useRef<any>(null);
  const onTranscriptRef = useRef(onTranscript);

  // Keep callback ref up to date
  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  const start = useCallback(() => {
    if (!SpeechRecognition || listening) return;
    setError(null);

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
      if (transcript) onTranscriptRef.current(transcript);
    };

    recog.onend = () => setListening(false);

    recog.onerror = (e: any) => {
      setListening(false);
      if (e.error === "not-allowed") {
        setError("Microphone access denied. Allow microphone in browser settings.");
      } else if (e.error === "no-speech") {
        setError("No speech detected. Try again.");
      } else if (e.error !== "aborted") {
        setError(`Speech error: ${e.error}`);
      }
    };

    recogRef.current = recog;
    try {
      recog.start();
    } catch {
      setListening(false);
    }
  }, [listening]);

  const stop = useCallback(() => {
    recogRef.current?.stop();
    setListening(false);
  }, []);

  return { start, stop, listening, supported, error };
}
