export const games = [
  {
    id: 1,
    title: "Color Song Quiz",
    icon: "🎵",
    summary: "Name the artist, song title, or both.",
    rules: [
      "All four Season Teams play at the same time with one buzzer per team.",
      "There are 22 songs with a color in the title. The first team to buzz answers first.",
      "After an incorrect answer, the next team may buzz. Each team gets one guess unless every team misses the first round.",
    ],
    points: ["Artist only: 1 point", "Song title only: 1 point", "Artist and title: 3 points"],
  },
  {
    id: 2,
    title: "Outfit Color Match",
    icon: "👗",
    summary: "Race to match outfit colors to their seasons.",
    rules: [
      "Two Season Teams race at a time using one whiteboard, Color Detect, and the SeasonApproved booklet.",
      "Write three colors worn by each of four teammates and match each color to a season.",
      "Raise the board when finished. Incorrect answers must be corrected while the timer keeps running.",
    ],
    points: ["First: 4 points", "Second: 3 points", "Third: 2 points", "Fourth: 1 point"],
  },
  {
    id: 3,
    title: "Kahoot Color Trivia",
    icon: "📱",
    summary: "Play individually and earn points for your team.",
    rules: [
      "Everyone plays individually on their own device and represents their Season Team.",
      "The top three participants earn points. More than one winner may represent the same team.",
    ],
    points: ["First participant: 3 points", "Second participant: 2 points", "Third participant: 1 point"],
  },
  {
    id: 4,
    title: "Color Scavenger Hunt",
    icon: "📸",
    summary: "Find and submit colors from your Season palette.",
    rules: [],
    points: ["First: 4 points", "Second: 3 points", "Third: 2 points", "Fourth: 1 point"],
  },
] as const;

export type GameId = (typeof games)[number]["id"];

export function gameFor(id: number) {
  return games.find((game) => game.id === id);
}
