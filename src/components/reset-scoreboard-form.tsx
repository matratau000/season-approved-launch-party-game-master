"use client";

import { clearTeamPhoto, removeParticipant, resetDashboard, resetScavengerSubmissions, resetTeam } from "@/app/actions";
import type { Season } from "@/lib/roster";

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

export function ClearTeamPhotoForm({ season }: { season: Season }) {
  return <form action={clearTeamPhoto} onSubmit={(event) => {
    if (!window.confirm(`Clear Team ${season}'s photo? This cannot be undone.`)) event.preventDefault();
  }}><input type="hidden" name="season" value={season} /><button className="danger ghost">Clear photo</button></form>;
}

export function RemoveParticipantForm({ id, name }: { id: string; name: string }) {
  return <form action={removeParticipant} onSubmit={(event) => {
    if (!window.confirm(`Remove ${name} from the team? Their saved scores and submissions will be kept.`)) event.preventDefault();
  }}><input type="hidden" name="participantId" value={id} /><button className="danger ghost">Remove</button></form>;
}

export function ResetTeamForm({ season }: { season: Season }) {
  return <form action={resetTeam} onSubmit={(event) => {
    if (!window.confirm(`Reset Team ${season}? Every registered member will need to sign in again. Saved scores and submissions will be kept.`)) event.preventDefault();
  }}><input type="hidden" name="season" value={season} /><button className="danger ghost">Reset team</button></form>;
}
