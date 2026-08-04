"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function WelcomeCelebration({ name, season }: { name: string; season: string }) {
  const router = useRouter();
  const close = () => router.replace("/dashboard");
  useEffect(() => {
    const timer = window.setTimeout(() => router.replace("/dashboard"), 3000);
    return () => window.clearTimeout(timer);
  }, [router]);
  return <div className="celebration welcome-celebration" role="status"><span aria-hidden="true">✦ ✧ ✦</span><h1>{name}, Welcome to Team {season}!</h1><button onClick={close}>Continue</button><span aria-hidden="true">✦ ✧ ✦</span></div>;
}

export function WinnerCelebration({ season }: { season: string }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(false), 8000);
    return () => window.clearTimeout(timer);
  }, []);
  return visible ? <div className={`celebration winner-celebration theme-${season.toLowerCase()}`} role="status"><span aria-hidden="true">🎉 🏆 🎉</span><h1>{season} wins!</h1><button onClick={() => setVisible(false)}>Close celebration</button><span aria-hidden="true">🎊 ✨ 🎊</span></div> : null;
}
