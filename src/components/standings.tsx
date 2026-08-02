import type { SeasonStanding } from "@/lib/data";

export function Standings({ standings, tv = false }: { standings: SeasonStanding[]; tv?: boolean }) {
  const leader = standings[0]?.points ?? 0;
  return (
    <div className={tv ? "standings tv-standings" : "standings"}>
      {standings.map((team, index) => (
        <article className={`season-card ${team.season.toLowerCase()}`} key={team.season}>
          <div className="rank">{index + 1}</div>
          <div className="season-copy">
            <p className="eyebrow">Team</p>
            <h2>{team.season}</h2>
            <div className="score-bar" aria-label={`${team.season} progress`}>
              <span style={{ width: `${leader ? Math.max(8, (team.points / leader) * 100) : 8}%` }} />
            </div>
          </div>
          <strong className="points">{team.points}<small> pts</small></strong>
          {!tv && (
            <ul className="contributors">
              {team.contributors.map((person) => (
                <li key={person.name}><span>{person.name}</span><strong>{person.points}</strong></li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}
