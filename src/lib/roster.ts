export const seasons = ["Winter", "Spring", "Summer", "Autumn"] as const;
export type Season = (typeof seasons)[number];

export function participantName(value: string): string | undefined {
  const name = value.replace(/\s+/g, " ").trim();
  return name && name.length <= 50 && !/[\u0000-\u001f\u007f]/.test(name) ? name : undefined;
}
