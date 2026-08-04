import assert from "node:assert/strict";
import { allUnique, finalResultsComplete, isFinalScore, kahootPoints, placePoints, songPoints, uniqueLeader } from "../src/lib/scoring.ts";

assert.deepEqual(placePoints, [4, 3, 2, 1]);
assert.deepEqual(kahootPoints, [3, 2, 1]);
assert.deepEqual(["artist", "title", "both", "incorrect"].map(songPoints), [1, 1, 3, 0]);
assert.equal(songPoints("unknown"), undefined);
assert.equal(allUnique(["Winter", "Spring", "Summer", "Autumn"]), true);
assert.equal(allUnique(["Winter", "Winter", "Summer", "Autumn"]), false);
assert.equal(isFinalScore("place-1"), true);
assert.equal(isFinalScore("song-01"), false);
const completeResults = [1, 2, 4].flatMap((game_id) => [1, 2, 3, 4].map((place) => ({ game_id, slot: `place-${place}` }))).concat([1, 2, 3].map((place) => ({ game_id: 3, slot: `place-${place}` })));
assert.equal(finalResultsComplete(completeResults), true);
assert.equal(finalResultsComplete(completeResults.slice(1)), false);
assert.equal(uniqueLeader([{ points: 4 }, { points: 3 }])?.points, 4);
assert.equal(uniqueLeader([{ points: 4 }, { points: 4 }]), undefined);
console.log("Game scoring check passed.");
