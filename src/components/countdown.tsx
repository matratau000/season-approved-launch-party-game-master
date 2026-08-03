"use client";

import { useEffect, useState } from "react";

export function Countdown({ startedAt, seconds }: { startedAt: string; seconds: number }) {
  const end = new Date(`${startedAt.replace(" ", "T")}Z`).getTime() + seconds * 1000;
  const [left, setLeft] = useState(() => Math.max(0, Math.ceil((end - Date.now()) / 1000)));
  useEffect(() => {
    const timer = window.setInterval(() => setLeft(Math.max(0, Math.ceil((end - Date.now()) / 1000))), 250);
    return () => window.clearInterval(timer);
  }, [end]);
  return <strong className="countdown" aria-live="polite">{String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}</strong>;
}
