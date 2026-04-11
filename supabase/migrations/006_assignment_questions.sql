-- ============================================
-- ASSIGNMENT Q&A / DISCUSSION FORUM
-- ============================================
-- Candidates can ask questions about assignments.
-- Admins can reply. One answer per question (admins can update).
-- Questions are visible to all candidates in the assignment's vertical.

CREATE TABLE assignment_questions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  asked_by      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  answer_text   TEXT,
  answered_by   UUID REFERENCES profiles(id),
  answered_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_aq_assignment ON assignment_questions(assignment_id);
CREATE INDEX idx_aq_asked_by ON assignment_questions(asked_by);

-- Enable RLS
ALTER TABLE assignment_questions ENABLE ROW LEVEL SECURITY;

-- SELECT: Admins see all. Candidates see questions for assignments in their vertical.
CREATE POLICY aq_select ON assignment_questions FOR SELECT
  USING (
    public.is_admin()
    OR assignment_id IN (
      SELECT a.id FROM assignments a
      WHERE a.is_active = true
        AND a.vertical IN (SELECT vertical FROM candidate_verticals WHERE candidate_id = auth.uid())
    )
  );

-- INSERT: Authenticated users can ask questions (asked_by must be themselves)
CREATE POLICY aq_insert ON assignment_questions FOR INSERT
  WITH CHECK (asked_by = auth.uid());

-- UPDATE: Only admins can update (to set the answer)
CREATE POLICY aq_update ON assignment_questions FOR UPDATE
  USING (public.is_admin());

-- DELETE: Candidates can delete their own (if unanswered), admins can delete any
CREATE POLICY aq_delete ON assignment_questions FOR DELETE
  USING (
    public.is_admin()
    OR (asked_by = auth.uid() AND answer_text IS NULL)
  );
