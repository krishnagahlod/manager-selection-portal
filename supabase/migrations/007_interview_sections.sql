-- Add structured sections data to interview evaluations
-- Stores per-section notes and scores for the standardized interview flow:
-- 1. Introduction & Pitch
-- 2. Assignment Discussion
-- 3. Situation-Based Questions
-- 4. Rapid Fire Round
-- 5. Peer Review (non-evaluative)

ALTER TABLE interview_evaluations ADD COLUMN sections JSONB DEFAULT NULL;
