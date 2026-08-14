"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function LiveRefresh({ every = 3000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.activeElement?.matches("input, select, textarea")) router.refresh();
    }, every);
    return () => window.clearInterval(timer);
  }, [every, router]);
  return null;
}
