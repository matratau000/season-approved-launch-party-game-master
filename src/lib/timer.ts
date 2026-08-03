export type TimerState = {
  started_at: string | null;
  duration_seconds: number;
  timer_running: number;
  timer_remaining_seconds: number;
};

export function timerRemaining(state: TimerState, now = Date.now()) {
  if (!state.timer_running || !state.started_at) return Math.max(0, state.timer_remaining_seconds);
  const started = new Date(`${state.started_at.replace(" ", "T")}Z`).getTime();
  return Math.max(0, state.duration_seconds - Math.floor((now - started) / 1000));
}
