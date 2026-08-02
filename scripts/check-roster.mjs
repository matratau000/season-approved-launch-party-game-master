import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const roster = JSON.parse(await readFile(new URL("../data/roster.json", import.meta.url)));
const colors = JSON.parse(await readFile(new URL("../data/season-colors.json", import.meta.url)));
const names = Object.values(roster).flat();

assert.deepEqual(Object.keys(roster), ["Winter", "Spring", "Summer", "Autumn"]);
assert.ok(Object.values(roster).every((team) => team.length === 5));
assert.equal(new Set(names.map((name) => name.toLowerCase())).size, 20);
assert.deepEqual(Object.keys(colors), Object.keys(roster));
assert.ok(Object.values(colors).every((palette) => palette.length === 36));
assert.ok(Object.values(colors).flat().every((color) => /^#[0-9A-F]{6}$/.test(color.hex) && color.name));
console.log("Roster and palette check passed: 4 seasons, 20 participants, 36 colors each.");
