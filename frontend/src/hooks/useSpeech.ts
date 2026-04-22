import { useState, useCallback, useRef, useEffect } from "react";

function getToken(): string | null {
  return localStorage.getItem("cs231_token");
}

function authHeaders(): Record<string, string> {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// ── Gemini TTS ────────────────────────────────────────────────────────────────

async function fetchGeminiTTS(text: string, voice = "Kore"): Promise<HTMLAudioElement | null> {
  try {
    const res = await fetch("/ai/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify({ text, voice }),
    });
    if (!res.ok) return null;
    const { audio_base64, mime_type } = await res.json();
    return new Audio(`data:${mime_type};base64,${audio_base64}`);
  } catch {
    return null;
  }
}

// ── TTS hook — Gemini primary, browser fallback ───────────────────────────────

export function useTTS() {
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

    // Always try Gemini first — no mode detection (avoids race condition)
    const audio = await fetchGeminiTTS(text);
    if (audio) {
      audioRef.current = audio;
      audio.onended = () => { setSpeaking(false); audioRef.current = null; onEnd?.(); };
      audio.onerror = () => {
        setSpeaking(false);
        audioRef.current = null;
        _browserSpeak(text, onEnd, setSpeaking);
      };
      try {
        await audio.play();
      } catch {
        setSpeaking(false);
        _browserSpeak(text, onEnd, setSpeaking);
      }
      return;
    }

    _browserSpeak(text, onEnd, setSpeaking);
  }, [stop]);

  return { speak, stop, speaking };
}

function _browserSpeak(text: string, onEnd: (() => void) | undefined, setSpeaking: (v: boolean) => void) {
  if (!window.speechSynthesis) { setSpeaking(false); return; }
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 0.9;
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

// ── Gemini STT — MediaRecorder → backend transcription ───────────────────────

const MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/mp4",
];

function getSupportedMime(): string {
  return MIME_TYPES.find(t => {
    try { return MediaRecorder.isTypeSupported(t); } catch { return false; }
  }) ?? "audio/webm";
}

export function useSTT(onTranscript: (text: string) => void) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported] = useState(() => Boolean(navigator.mediaDevices?.getUserMedia));
  const mrRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => { onTranscriptRef.current = onTranscript; }, [onTranscript]);

  const start = useCallback(async () => {
    if (recording || transcribing) return;
    setError(null);
    chunksRef.current = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e: any) {
      setError(e.name === "NotAllowedError" ? "Microphone access denied. Allow in browser settings." : `Mic error: ${e.message}`);
      return;
    }

    const mime = getSupportedMime();
    let mr: MediaRecorder;
    try {
      mr = new MediaRecorder(stream, { mimeType: mime });
    } catch {
      mr = new MediaRecorder(stream);
    }

    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };

    mr.onstop = async () => {
      stream.getTracks().forEach(t => t.stop());
      setRecording(false);

      const blob = new Blob(chunksRef.current, { type: mime.split(";")[0] });
      if (blob.size < 1000) {
        setError("Recording too short. Hold mic button while speaking.");
        return;
      }

      setTranscribing(true);
      try {
        const fd = new FormData();
        fd.append("audio", blob, "recording." + (mime.includes("mp4") ? "mp4" : mime.includes("ogg") ? "ogg" : "webm"));
        const res = await fetch("/ai/stt", {
          method: "POST",
          headers: { ...authHeaders() },
          body: fd,
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail ?? "Transcription failed");
        }
        const { transcript } = await res.json();
        if (transcript?.trim()) {
          onTranscriptRef.current(transcript.trim());
        } else {
          setError("No speech detected in recording.");
        }
      } catch (e: any) {
        setError(e.message ?? "Transcription failed");
      } finally {
        setTranscribing(false);
      }
    };

    mr.onerror = () => {
      stream.getTracks().forEach(t => t.stop());
      setRecording(false);
      setError("Recording failed.");
    };

    mrRef.current = mr;
    mr.start(100); // collect data every 100ms
    setRecording(true);
  }, [recording, transcribing]);

  const stop = useCallback(() => {
    if (mrRef.current && mrRef.current.state !== "inactive") {
      mrRef.current.stop();
    }
  }, []);

  // listening = recording (for backward compat in ExamFlow)
  const listening = recording;

  return { start, stop, recording, transcribing, listening, error, supported };
}
