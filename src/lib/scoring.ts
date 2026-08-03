export const placePoints = [4, 3, 2, 1] as const;
export const kahootPoints = [3, 2, 1] as const;

export function songPoints(result: string): number | undefined {
  return { artist: 1, title: 1, both: 3, incorrect: 0 }[result as "artist"];
}

export function allUnique(values: string[]): boolean {
  return values.every(Boolean) && new Set(values).size === values.length;
}
