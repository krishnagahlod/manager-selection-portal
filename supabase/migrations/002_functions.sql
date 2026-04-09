-- ============================================
-- Helper functions for RLS
-- ============================================
-- NOTE: These functions are created in the PUBLIC schema
-- and reference auth.uid() for the current user.

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() IN ('super_admin', 'evaluator');
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT public.get_user_role() = 'super_admin';
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================
-- Attendance: validate and record via code
-- ============================================
CREATE OR REPLACE FUNCTION public.mark_attendance(
  p_session_id UUID,
  p_candidate_id UUID,
  p_code TEXT
) RETURNS JSONB AS $$
DECLARE
  v_code_id UUID;
BEGIN
  SELECT id INTO v_code_id
  FROM public.attendance_codes
  WHERE session_id = p_session_id
    AND code = p_code
    AND valid_from <= now()
    AND valid_until >= now()
  LIMIT 1;

  IF v_code_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired code');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.attendance
    WHERE session_id = p_session_id AND candidate_id = p_candidate_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Attendance already marked');
  END IF;

  INSERT INTO public.attendance (session_id, candidate_id, code_id)
  VALUES (p_session_id, p_candidate_id, v_code_id);

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- Attendance: generate rotating code
-- ============================================
CREATE OR REPLACE FUNCTION public.generate_attendance_code(
  p_session_id UUID,
  p_validity_seconds INTEGER DEFAULT 150
) RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
BEGIN
  v_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');

  INSERT INTO public.attendance_codes (session_id, code, valid_from, valid_until)
  VALUES (
    p_session_id,
    v_code,
    now(),
    now() + (p_validity_seconds || ' seconds')::INTERVAL
  );

  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================
-- Auto-set is_late on submissions
-- ============================================
CREATE OR REPLACE FUNCTION public.set_submission_late_flag()
RETURNS TRIGGER AS $$
BEGIN
  NEW.is_late := NEW.submitted_at > (
    SELECT deadline FROM public.assignments WHERE id = NEW.assignment_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_set_submission_late
  BEFORE INSERT OR UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_submission_late_flag();

-- ============================================
-- Auto-update updated_at timestamps
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON public.groundwork_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_assignments_updated BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_submissions_updated BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER trg_interviews_updated BEFORE UPDATE ON public.interviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- Profile creation on new user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role public.user_role;
  v_name TEXT;
  v_verticals public.vertical[];
BEGIN
  SELECT role, full_name, verticals INTO v_role, v_name, v_verticals
  FROM public.invitations
  WHERE email = NEW.email AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_role IS NULL THEN
    v_role := 'candidate';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(v_name, ''), v_role);

  IF v_verticals IS NOT NULL AND array_length(v_verticals, 1) > 0 THEN
    INSERT INTO public.candidate_verticals (candidate_id, vertical)
    SELECT NEW.id, unnest(v_verticals);
  END IF;

  UPDATE public.invitations
  SET status = 'accepted', accepted_at = now()
  WHERE email = NEW.email AND status = 'pending';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on auth.users for auto profile creation
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
