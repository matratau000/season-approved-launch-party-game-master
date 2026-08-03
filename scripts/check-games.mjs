import assert from "node:assert/strict";
import { allUnique, kahootPoints, placePoints, songPoints } from "../src/lib/scoring.ts";

assert.deepEqual(placePoints, [4, 3, 2, 1]);
assert.deepEqual(kahootPoints, [3, 2, 1]);
assert.deepEqual(["artist", "title", "both", "incorrect"].map(songPoints), [1, 1, 3, 0]);
assert.equal(songPoints("unknown"), undefined);
assert.equal(allUnique(["Winter", "Spring", "Summer", "Autumn"]), true);
assert.equal(allUnique(["Winter", "Winter", "Summer", "Autumn"]), false);
console.log("Game scoring check passed.");
