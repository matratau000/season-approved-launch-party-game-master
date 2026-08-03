ALTER TABLE game_state ADD COLUMN timer_phase TEXT NOT NULL DEFAULT 'idle' CHECK (timer_phase IN ('idle', 'delegation', 'hunt'));
ALTER TABLE game_state ADD COLUMN timer_running INTEGER NOT NULL DEFAULT 0 CHECK (timer_running IN (0, 1));
ALTER TABLE game_state ADD COLUMN timer_remaining_seconds INTEGER NOT NULL DEFAULT 0 CHECK (timer_remaining_seconds >= 0);

UPDATE game_state
SET timer_phase = 'hunt', timer_running = 1, timer_remaining_seconds = duration_seconds
WHERE game_id = 4 AND started_at IS NOT NULL;

UPDATE submissions SET points = 1 WHERE status = 'approved';
