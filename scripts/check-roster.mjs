import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { participantName, seasons } from "../src/lib/roster.ts";

const colors = JSON.parse(await readFile(new URL("../data/season-colors.json", import.meta.url)));

assert.deepEqual(seasons, ["Winter", "Spring", "Summer", "Autumn"]);
assert.deepEqual(Object.keys(colors), seasons);
assert.ok(Object.values(colors).every((palette) => palette.length === 36));
assert.ok(Object.values(colors).flat().every((color) => /^#[0-9A-F]{6}$/.test(color.hex) && color.name));
assert.ok(Object.values(colors).flat().every((color) => !["lavendar", "teracotta", "yellow orche"].some((misspelling) => color.name.toLowerCase().includes(misspelling))));
assert.equal(participantName("  Ciera   L'Huillier  "), "Ciera L'Huillier");
assert.equal(participantName(""), undefined);
assert.equal(participantName("x".repeat(51)), undefined);
console.log("Season, participant name, and palette checks passed.");
