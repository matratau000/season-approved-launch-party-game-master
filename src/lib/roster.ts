import rosterJson from "../../data/roster.json";

export const seasons = ["Winter", "Spring", "Summer", "Autumn"] as const;
export type Season = (typeof seasons)[number];

export const roster = rosterJson as Record<Season, string[]>;

export function seasonFor(participant: string): Season | undefined {
  return seasons.find((season) => roster[season].includes(participant));
}

export function isParticipant(value: string): boolean {
  return seasonFor(value) !== undefined;
}
