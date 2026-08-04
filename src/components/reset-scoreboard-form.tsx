"use client";

import { resetScavengerSubmissions, resetScoreboard } from "@/app/actions";

export function ResetScoreboardForm() {
  return <form action={resetScoreboard} onSubmit={(event) => {
    if (!window.confirm("Reset every game score? Submissions and photos will be kept.")) event.preventDefault();
  }}><button className="danger ghost">Reset scoreboard</button></form>;
}

export function ResetScavengerForm() {
  return <form action={resetScavengerSubmissions} onSubmit={(event) => {
    if (!window.confirm("Reset every Scavenger Hunt submission and photo? This cannot be undone.")) event.preventDefault();
  }}><button className="danger ghost">Reset submissions</button></form>;
}
