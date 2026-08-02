import { standings } from "@/lib/data";
import { Standings } from "@/components/standings";
import { LiveRefresh } from "@/components/live-refresh";

export const dynamic = "force-dynamic";

export default async function ScoreboardPage() {
  const currentStandings = await standings();
  return (
    <main className="tv-shell">
      <LiveRefresh every={2500} />
      <header className="tv-header"><div><p className="eyebrow">SeasonApproved Launch Party</p><h1>Live Team Scoreboard</h1></div><div className="live-pill">Live</div></header>
      <Standings standings={currentStandings} tv />
      <footer className="tv-footer"><span>🏆</span><div><p className="eyebrow">Winning prize</p><strong>Prize reveal coming soon</strong></div></footer>
    </main>
  );
}
