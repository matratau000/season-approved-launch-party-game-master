import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const roster = JSON.parse(await readFile(new URL("../data/roster.json", import.meta.url)));
const names = Object.values(roster).flat();

assert.deepEqual(Object.keys(roster), ["Winter", "Spring", "Summer", "Autumn"]);
assert.ok(Object.values(roster).every((team) => team.length === 5));
assert.equal(new Set(names.map((name) => name.toLowerCase())).size, 20);
console.log("Roster check passed: 4 seasons, 20 unique participants.");
