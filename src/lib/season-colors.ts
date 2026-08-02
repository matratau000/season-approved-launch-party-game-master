import colorsJson from "../../data/season-colors.json";
import type { Season } from "./roster";

export type SeasonColor = { hex: string; name: string };
export const seasonColors = colorsJson as Record<Season, SeasonColor[]>;

export function colorFor(season: Season, hex: string): SeasonColor | undefined {
  return seasonColors[season].find((color) => color.hex === hex.toUpperCase());
}
