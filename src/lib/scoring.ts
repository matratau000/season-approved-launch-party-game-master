export const placePoints = [4, 3, 2, 1] as const;
export const kahootPoints = [3, 2, 1] as const;

export function songPoints(result: string): number | undefined {
  return { artist: 1, title: 1, both: 3, incorrect: 0 }[result as "artist"];
}

export function allUnique(values: string[]): boolean {
  return values.every(Boolean) && new Set(values).size === values.length;
}

export function isFinalScore(slot: string): boolean {
  return slot.startsWith("place-");
}

export function finalResultsComplete(scores: { game_id: number; slot: string }[]): boolean {
  return [[1, 4], [2, 4], [3, 3], [4, 4]].every(([gameId, expected]) =>
    scores.filter((score) => score.game_id === gameId && isFinalScore(score.slot)).length === expected);
}

export function uniqueLeader<T extends { points: number }>(standings: T[]): T | undefined {
  return standings[0] && standings[0].points > (standings[1]?.points ?? 0) ? standings[0] : undefined;
}
