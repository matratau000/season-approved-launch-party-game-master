export const outfitParticipantRules = [
  "Watch the wheel choose a guest, then use your SeasonApproved booklet to study their outfit.",
  "Choose one color the guest is wearing and write it on your whiteboard.",
  "Buzz when your answer is locked in. If the first answer is incorrect, the opponent may steal.",
  "Each teammate competes once in their heat. The Game Master runs six rounds per heat.",
];

export const outfitMasterRules = [
  "Run 2 heats with 2 Season Teams and 6 rounds in each heat.",
  "For each round, select one unused participant from each competing Season Team and spin the guest wheel.",
  "Bring the selected guest forward. Both participants use their booklet, write one outfit color, and buzz when ready.",
  "Compare the first answer to the approved answer. If it is incorrect, allow the opponent to steal.",
  "Award 1 point for a first correct answer or successful steal; award 0 when both are incorrect.",
];

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
    summary: "Face off to identify one color in a guest's outfit.",
    rules: outfitParticipantRules,
    points: ["First player correct: 1 point", "Successful steal: 1 point", "Both incorrect: 0 points"],
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
