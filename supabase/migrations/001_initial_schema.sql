-- ============================================
-- Manager Selection Portal — Initial Schema
-- ============================================

-- Custom enums
CREATE TYPE user_role AS ENUM ('super_admin', 'evaluator', 'candidate');
CREATE TYPE vertical AS ENUM ('events_operations', 'projects_policies', 'web_design');
CREATE TYPE interview_status AS ENUM ('not_scheduled', 'scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired');

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT NOT NULL DEFAULT '',
  role          user_role NOT NULL DEFAULT 'candidate',
  phone         TEXT,
  department    TEXT,
  year_of_study SMALLINT,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================
-- INVITATIONS (admin-controlled registration)
-- ============================================
CREATE TABLE invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  full_name   TEXT DEFAULT '',
  role        user_role NOT NULL DEFAULT 'candidate',
  invited_by  UUID NOT NULL REFERENCES profiles(id),
  status      invitation_status NOT NULL DEFAULT 'pending',
  verticals   vertical[] DEFAULT '{}',
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invitations_email ON invitations(email);
CREATE INDEX idx_invitations_status ON invitations(status);

-- ============================================
-- CANDIDATE VERTICALS (many-to-many)
-- ============================================
CREATE TABLE candidate_verticals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vertical     vertical NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(candidate_id, vertical)
);

CREATE INDEX idx_cv_candidate ON candidate_verticals(candidate_id);
CREATE INDEX idx_cv_vertical ON candidate_verticals(vertical);

-- ============================================
-- GROUNDWORK SESSIONS
-- ============================================
CREATE TABLE groundwork_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  description   TEXT,
  session_date  DATE NOT NULL,
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  location      TEXT,
  is_mandatory  BOOLEAN NOT NULL DEFAULT true,
  is_active     BOOLEAN NOT NULL DEFAULT true,
  created_by    UUID NOT NULL REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sessions_date ON groundwork_sessions(session_date);

-- ============================================
-- ATTENDANCE CODES (rotating 6-digit codes)
-- ============================================
CREATE TABLE attendance_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID NOT NULL REFERENCES groundwork_sessions(id) ON DELETE CASCADE,
  code        CHAR(6) NOT NULL,
  valid_from  TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_atcodes_session ON attendance_codes(session_id);
CREATE INDEX idx_atcodes_active ON attendance_codes(session_id, valid_from, valid_until);

-- ============================================
-- ATTENDANCE RECORDS
-- ============================================
CREATE TABLE attendance (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES groundwork_sessions(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  code_id      UUID NOT NULL REFERENCES attendance_codes(id),
  marked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, candidate_id)
);

CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_candidate ON attendance(candidate_id);

-- ============================================
-- SESSION Q&A (anonymous questions)
-- ============================================
CREATE TABLE session_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID NOT NULL REFERENCES groundwork_sessions(id) ON DELETE CASCADE,
  asked_by       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_text  TEXT NOT NULL,
  is_anonymous   BOOLEAN NOT NULL DEFAULT true,
  is_answered    BOOLEAN NOT NULL DEFAULT false,
  answered_by    UUID REFERENCES profiles(id),
  answered_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sq_session ON session_questions(session_id);

CREATE TABLE question_upvotes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES session_questions(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(question_id, user_id)
);

CREATE INDEX idx_qu_question ON question_upvotes(question_id);

-- ============================================
-- GROUNDWORK LOGS (post-session reflections)
-- ============================================
CREATE TABLE groundwork_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID NOT NULL REFERENCES groundwork_sessions(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  key_insight  TEXT NOT NULL,
  key_learning TEXT NOT NULL,
  question     TEXT NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, candidate_id)
);

CREATE INDEX idx_gl_session ON groundwork_logs(session_id);
CREATE INDEX idx_gl_candidate ON groundwork_logs(candidate_id);

-- ============================================
-- INDIVIDUAL GROUNDWORK TRACKER
-- ============================================
CREATE TABLE individual_groundworks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  team_member_id UUID REFERENCES profiles(id),
  member_name    TEXT,
  key_takeaway   TEXT NOT NULL,
  met_on         DATE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ig_candidate ON individual_groundworks(candidate_id);

-- ============================================
-- ASSIGNMENTS
-- ============================================
CREATE TABLE assignments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  vertical    vertical NOT NULL,
  deadline    TIMESTAMPTZ NOT NULL,
  created_by  UUID NOT NULL REFERENCES profiles(id),
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_assignments_vertical ON assignments(vertical);
CREATE INDEX idx_assignments_deadline ON assignments(deadline);

-- ============================================
-- SUBMISSIONS
-- ============================================
CREATE TABLE submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id   UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  candidate_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  submission_text TEXT,
  file_url        TEXT,
  file_name       TEXT,
  is_late         BOOLEAN NOT NULL DEFAULT false,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assignment_id, candidate_id)
);

CREATE INDEX idx_sub_assignment ON submissions(assignment_id);
CREATE INDEX idx_sub_candidate ON submissions(candidate_id);

-- ============================================
-- ASSIGNMENT EVALUATIONS
-- ============================================
CREATE TABLE assignment_evaluations (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id  UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  evaluator_id   UUID NOT NULL REFERENCES profiles(id),
  creativity     SMALLINT NOT NULL CHECK (creativity BETWEEN 1 AND 5),
  practicality   SMALLINT NOT NULL CHECK (practicality BETWEEN 1 AND 5),
  effort         SMALLINT NOT NULL CHECK (effort BETWEEN 1 AND 5),
  comments       TEXT,
  evaluated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(submission_id, evaluator_id)
);

CREATE INDEX idx_ae_submission ON assignment_evaluations(submission_id);
CREATE INDEX idx_ae_evaluator ON assignment_evaluations(evaluator_id);

-- ============================================
-- INTERVIEWS
-- ============================================
CREATE TABLE interviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  scheduled_at   TIMESTAMPTZ,
  duration_min   INTEGER DEFAULT 60,
  location       TEXT,
  status         interview_status NOT NULL DEFAULT 'not_scheduled',
  notes          TEXT,
  created_by     UUID NOT NULL REFERENCES profiles(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_int_candidate ON interviews(candidate_id);
CREATE INDEX idx_int_status ON interviews(status);

-- ============================================
-- INTERVIEW PANELS
-- ============================================
CREATE TABLE interview_panels (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id  UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  evaluator_id  UUID NOT NULL REFERENCES profiles(id),
  UNIQUE(interview_id, evaluator_id)
);

-- ============================================
-- INTERVIEW EVALUATIONS
-- ============================================
CREATE TABLE interview_evaluations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id  UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  evaluator_id  UUID NOT NULL REFERENCES profiles(id),
  strengths     TEXT,
  weaknesses    TEXT,
  red_flags     TEXT,
  final_score   SMALLINT NOT NULL CHECK (final_score BETWEEN 1 AND 10),
  comments      TEXT,
  evaluated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(interview_id, evaluator_id)
);

CREATE INDEX idx_ie_interview ON interview_evaluations(interview_id);

-- ============================================
-- APP SETTINGS (key-value config)
-- ============================================
CREATE TABLE app_settings (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_by  UUID REFERENCES profiles(id),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
