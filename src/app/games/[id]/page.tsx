import Link from "next/link";
import { notFound } from "next/navigation";
import { gameAccess } from "@/lib/game-access";
import { gameFor, type GameId } from "@/lib/games";

export const dynamic = "force-dynamic";

export default async function GamePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ preview?: string }> }) {
  const id = Number((await params).id);
  const game = gameFor(id);
  if (!game || game.id === 4) notFound();
  const preview = (await searchParams).preview === "1";
  const { state } = await gameAccess(game.id as GameId, preview);
  return (
    <main className="app-shell narrow">
      <Link className="back-link" href={preview ? "/game-master" : "/dashboard"}>← {preview ? "Game Master" : "Team dashboard"}</Link>
      <section className="challenge-hero"><p className="eyebrow">Game {String(game.id).padStart(2, "0")} · {preview ? `Preview · ${state.status}` : "Live"}</p><h1>{game.title}</h1><p>{game.summary}</p></section>
      <section className="panel rules"><h2>How to play</h2><ol>{game.rules.map((rule) => <li key={rule}>{rule}</li>)}</ol><h2>Points</h2><ul>{game.points.map((point) => <li key={point}>{point}</li>)}</ul>
        {game.id === 3 && state.external_url && <a className="button-link" href={state.external_url} target="_blank" rel="noreferrer">Open Kahoot ↗</a>}
      </section>
    </main>
  );
}
