import { gamesAreOver, standings } from "@/lib/data";
import { Standings } from "@/components/standings";
import { LiveRefresh } from "@/components/live-refresh";
import { WinnerCelebration } from "@/components/celebration";
import { uniqueLeader } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export default async function ScoreboardPage() {
  const [currentStandings, over] = await Promise.all([standings(), gamesAreOver()]);
  const winner = uniqueLeader(currentStandings);
  return (
    <main className="tv-shell">
      <LiveRefresh every={2500} />
      {over && winner && <WinnerCelebration season={winner.season} />}
      <header className="tv-header"><div><p className="eyebrow">SeasonApproved Launch Party</p><h1>Live Team Scoreboard</h1></div><div className="live-pill">Live</div></header>
      <Standings standings={currentStandings} tv />
      <footer className="tv-footer"><span>🏆</span><div><p className="eyebrow">Winning prize</p><strong>Prize reveal coming soon</strong></div></footer>
    </main>
  );
}
