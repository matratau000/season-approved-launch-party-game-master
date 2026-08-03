"use client";

import { useEffect, useState } from "react";

function Clock({ startedAt, seconds }: { startedAt: string; seconds: number }) {
  const end = new Date(`${startedAt.replace(" ", "T")}Z`).getTime() + seconds * 1000;
  const [left, setLeft] = useState(() => Math.max(0, Math.ceil((end - Date.now()) / 1000)));
  useEffect(() => {
    const timer = window.setInterval(() => setLeft(Math.max(0, Math.ceil((end - Date.now()) / 1000))), 250);
    return () => window.clearInterval(timer);
  }, [end]);
  return <strong className="countdown" aria-live="polite">{String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}</strong>;
}

export function Countdown({ startedAt, seconds, running = true }: { startedAt: string | null; seconds: number; running?: boolean }) {
  if (running && startedAt) return <Clock key={`${startedAt}:${seconds}`} startedAt={startedAt} seconds={seconds} />;
  return <strong className="countdown" aria-live="polite">{String(Math.floor(seconds / 60)).padStart(2, "0")}:{String(seconds % 60).padStart(2, "0")}</strong>;
}
