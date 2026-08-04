"use client";

import { resetDashboard, resetScavengerSubmissions } from "@/app/actions";

export function ResetDashboardForm() {
  return <form action={resetDashboard} onSubmit={(event) => {
    if (!window.confirm("Reset the Game Master dashboard? Every saved song score, winner, and placement will be cleared. Submissions and photos will be kept.")) event.preventDefault();
  }}><button className="danger ghost">Reset dashboard</button></form>;
}

export function ResetScavengerForm() {
  return <form action={resetScavengerSubmissions} onSubmit={(event) => {
    if (!window.confirm("Reset every Scavenger Hunt submission and photo? This cannot be undone.")) event.preventDefault();
  }}><button className="danger ghost">Reset submissions</button></form>;
}
