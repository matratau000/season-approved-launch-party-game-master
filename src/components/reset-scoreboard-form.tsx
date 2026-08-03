"use client";

import { resetScoreboard } from "@/app/actions";

export function ResetScoreboardForm() {
  return <form action={resetScoreboard} onSubmit={(event) => {
    if (!window.confirm("Reset every game score? Submissions and photos will be kept.")) event.preventDefault();
  }}><button className="danger ghost">Reset scoreboard</button></form>;
}
