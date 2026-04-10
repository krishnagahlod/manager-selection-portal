-- Add recording link to groundwork sessions
ALTER TABLE groundwork_sessions ADD COLUMN recording_url TEXT DEFAULT NULL;
