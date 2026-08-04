import type { SeasonStanding } from "@/lib/data";

export function Standings({ standings, tv = false }: { standings: SeasonStanding[]; tv?: boolean }) {
  return (
    <div className={tv ? "standings tv-standings" : "standings"}>
      {standings.map((team, index) => (
        <article className={`season-card ${team.season.toLowerCase()}`} key={team.season}>
          <div className="rank">{index + 1}</div>
          <div className="season-copy">
            <p className="eyebrow">Team</p>
            <h2>{team.season}</h2>
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
