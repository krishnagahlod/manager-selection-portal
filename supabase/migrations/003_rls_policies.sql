-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidate_verticals ENABLE ROW LEVEL SECURITY;
ALTER TABLE groundwork_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_upvotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE groundwork_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE individual_groundworks ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_panels ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES
-- ============================================
CREATE POLICY profiles_select ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_update_own ON profiles FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));
CREATE POLICY profiles_update_admin ON profiles FOR UPDATE
  USING (public.is_super_admin());
CREATE POLICY profiles_insert ON profiles FOR INSERT
  WITH CHECK (id = auth.uid() OR public.is_super_admin());

-- ============================================
-- INVITATIONS
-- ============================================
CREATE POLICY invitations_select ON invitations FOR SELECT USING (public.is_super_admin());
CREATE POLICY invitations_insert ON invitations FOR INSERT WITH CHECK (public.is_super_admin());
CREATE POLICY invitations_update ON invitations FOR UPDATE USING (public.is_super_admin());

-- ============================================
-- CANDIDATE VERTICALS
-- ============================================
CREATE POLICY cv_select ON candidate_verticals FOR SELECT
  USING (public.is_admin() OR candidate_id = auth.uid());
CREATE POLICY cv_insert ON candidate_verticals FOR INSERT
  WITH CHECK (public.is_super_admin());
CREATE POLICY cv_delete ON candidate_verticals FOR DELETE
  USING (public.is_super_admin());

-- ============================================
-- GROUNDWORK SESSIONS
-- ============================================
CREATE POLICY gs_select ON groundwork_sessions FOR SELECT
  USING (is_active = true OR public.is_admin());
CREATE POLICY gs_insert ON groundwork_sessions FOR INSERT
  WITH CHECK (public.is_super_admin());
CREATE POLICY gs_update ON groundwork_sessions FOR UPDATE
  USING (public.is_super_admin());

-- ============================================
-- ATTENDANCE CODES (admins only)
-- ============================================
CREATE POLICY ac_select ON attendance_codes FOR SELECT USING (public.is_admin());
CREATE POLICY ac_insert ON attendance_codes FOR INSERT WITH CHECK (public.is_admin());

-- ============================================
-- ATTENDANCE
-- ============================================
CREATE POLICY att_select ON attendance FOR SELECT
  USING (public.is_admin() OR candidate_id = auth.uid());
CREATE POLICY att_insert ON attendance FOR INSERT
  WITH CHECK (public.is_super_admin());

-- ============================================
-- SESSION QUESTIONS
-- ============================================
CREATE POLICY sq_select ON session_questions FOR SELECT USING (true);
CREATE POLICY sq_insert ON session_questions FOR INSERT WITH CHECK (asked_by = auth.uid());
CREATE POLICY sq_update ON session_questions FOR UPDATE USING (public.is_admin());

-- ============================================
-- QUESTION UPVOTES
-- ============================================
CREATE POLICY qu_select ON question_upvotes FOR SELECT USING (true);
CREATE POLICY qu_insert ON question_upvotes FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY qu_delete ON question_upvotes FOR DELETE USING (user_id = auth.uid());

-- ============================================
-- GROUNDWORK LOGS
-- ============================================
CREATE POLICY gl_select ON groundwork_logs FOR SELECT
  USING (public.is_admin() OR candidate_id = auth.uid());
CREATE POLICY gl_insert ON groundwork_logs FOR INSERT WITH CHECK (candidate_id = auth.uid());
CREATE POLICY gl_update ON groundwork_logs FOR UPDATE USING (candidate_id = auth.uid());

-- ============================================
-- INDIVIDUAL GROUNDWORKS
-- ============================================
CREATE POLICY ig_select ON individual_groundworks FOR SELECT
  USING (public.is_admin() OR candidate_id = auth.uid());
CREATE POLICY ig_insert ON individual_groundworks FOR INSERT WITH CHECK (candidate_id = auth.uid());

-- ============================================
-- ASSIGNMENTS
-- ============================================
CREATE POLICY asn_select ON assignments FOR SELECT
  USING (
    public.is_admin()
    OR (
      is_active = true
      AND vertical IN (SELECT vertical FROM candidate_verticals WHERE candidate_id = auth.uid())
    )
  );
CREATE POLICY asn_insert ON assignments FOR INSERT WITH CHECK (public.is_super_admin());
CREATE POLICY asn_update ON assignments FOR UPDATE USING (public.is_super_admin());

-- ============================================
-- SUBMISSIONS
-- ============================================
CREATE POLICY sub_select ON submissions FOR SELECT
  USING (public.is_admin() OR candidate_id = auth.uid());
CREATE POLICY sub_insert ON submissions FOR INSERT WITH CHECK (candidate_id = auth.uid());
CREATE POLICY sub_update ON submissions FOR UPDATE USING (candidate_id = auth.uid());

-- ============================================
-- ASSIGNMENT EVALUATIONS (hidden from candidates)
-- ============================================
CREATE POLICY ae_select ON assignment_evaluations FOR SELECT USING (public.is_admin());
CREATE POLICY ae_insert ON assignment_evaluations FOR INSERT
  WITH CHECK (public.is_admin() AND evaluator_id = auth.uid());
CREATE POLICY ae_update ON assignment_evaluations FOR UPDATE
  USING (evaluator_id = auth.uid() OR public.is_super_admin());

-- ============================================
-- INTERVIEWS
-- ============================================
CREATE POLICY int_select ON interviews FOR SELECT
  USING (public.is_admin() OR candidate_id = auth.uid());
CREATE POLICY int_insert ON interviews FOR INSERT WITH CHECK (public.is_super_admin());
CREATE POLICY int_update ON interviews FOR UPDATE USING (public.is_admin());

-- ============================================
-- INTERVIEW PANELS
-- ============================================
CREATE POLICY ip_select ON interview_panels FOR SELECT USING (public.is_admin());
CREATE POLICY ip_insert ON interview_panels FOR INSERT WITH CHECK (public.is_super_admin());

-- ============================================
-- INTERVIEW EVALUATIONS (hidden from candidates)
-- ============================================
CREATE POLICY ie_select ON interview_evaluations FOR SELECT USING (public.is_admin());
CREATE POLICY ie_insert ON interview_evaluations FOR INSERT
  WITH CHECK (public.is_admin() AND evaluator_id = auth.uid());
CREATE POLICY ie_update ON interview_evaluations FOR UPDATE
  USING (evaluator_id = auth.uid() OR public.is_super_admin());

-- ============================================
-- APP SETTINGS
-- ============================================
CREATE POLICY as_select ON app_settings FOR SELECT USING (public.is_admin());
CREATE POLICY as_update ON app_settings FOR UPDATE USING (public.is_super_admin());
CREATE POLICY as_insert ON app_settings FOR INSERT WITH CHECK (public.is_super_admin());
