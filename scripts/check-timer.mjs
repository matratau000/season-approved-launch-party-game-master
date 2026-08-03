import assert from "node:assert/strict";
import { timerRemaining } from "../src/lib/timer.ts";

const running = { started_at: "2026-08-03 12:00:00", duration_seconds: 600, timer_running: 1, timer_remaining_seconds: 600 };
assert.equal(timerRemaining(running, Date.parse("2026-08-03T12:03:00Z")), 420);
assert.equal(timerRemaining({ ...running, timer_running: 0, started_at: null, timer_remaining_seconds: 77 }), 77);
assert.equal(timerRemaining(running, Date.parse("2026-08-03T12:20:00Z")), 0);
