import { useState, useEffect, useRef, useCallback } from "react";

export function useCountdown(totalSeconds: number) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const [active, setActive] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    setActive(true);
  }, []);

  const stop = useCallback(() => {
    setActive(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const reset = useCallback(() => {
    setRemaining(totalSeconds);
    setActive(false);
  }, [totalSeconds]);

  useEffect(() => {
    if (!active) return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [active]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const expired = remaining === 0;

  const urgency: "normal" | "warning" | "critical" =
    remaining <= 60 ? "critical" : remaining <= 300 ? "warning" : "normal";

  return { remaining, minutes, seconds, expired, urgency, start, stop, reset, active };
}
