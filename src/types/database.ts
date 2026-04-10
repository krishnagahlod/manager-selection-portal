export type UserRole = 'super_admin' | 'evaluator' | 'candidate';
export type Vertical = 'events_operations' | 'projects_policies' | 'web_design';
export type InterviewStatus = 'not_scheduled' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
export type InvitationStatus = 'pending' | 'accepted' | 'expired';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  department: string | null;
  year_of_study: number | null;
  is_active: boolean;
  form_responses: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  invited_by: string;
  status: InvitationStatus;
  verticals: Vertical[];
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface CandidateVertical {
  id: string;
  candidate_id: string;
  vertical: Vertical;
  created_at: string;
}

export interface GroundworkSession {
  id: string;
  title: string;
  description: string | null;
  session_date: string;
  start_time: string;
  end_time: string;
  location: string | null;
  is_mandatory: boolean;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceCode {
  id: string;
  session_id: string;
  code: string;
  valid_from: string;
  valid_until: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  session_id: string;
  candidate_id: string;
  code_id: string;
  marked_at: string;
}

export interface SessionQuestion {
  id: string;
  session_id: string;
  asked_by: string;
  question_text: string;
  is_anonymous: boolean;
  is_answered: boolean;
  answered_by: string | null;
  answered_at: string | null;
  created_at: string;
  upvote_count?: number;
  user_has_upvoted?: boolean;
}

export interface GroundworkLog {
  id: string;
  session_id: string;
  candidate_id: string;
  key_insight: string;
  key_learning: string;
  question: string;
  submitted_at: string;
}

export interface IndividualGroundwork {
  id: string;
  candidate_id: string;
  team_member_id: string | null;
  member_name: string | null;
  key_takeaway: string;
  met_on: string | null;
  created_at: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  vertical: Vertical;
  deadline: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  candidate_id: string;
  submission_text: string | null;
  file_url: string | null;
  file_name: string | null;
  is_late: boolean;
  submitted_at: string;
  updated_at: string;
}

export interface AssignmentEvaluation {
  id: string;
  submission_id: string;
  evaluator_id: string;
  creativity: number;
  practicality: number;
  effort: number;
  comments: string | null;
  evaluated_at: string;
}

export interface Interview {
  id: string;
  candidate_id: string;
  scheduled_at: string | null;
  duration_min: number;
  location: string | null;
  status: InterviewStatus;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface InterviewPanel {
  id: string;
  interview_id: string;
  evaluator_id: string;
}

export interface InterviewEvaluation {
  id: string;
  interview_id: string;
  evaluator_id: string;
  strengths: string | null;
  weaknesses: string | null;
  red_flags: string | null;
  final_score: number;
  comments: string | null;
  evaluated_at: string;
}

// Composite types for dashboard views
export interface CandidateDashboardData {
  profile: Profile;
  verticals: Vertical[];
  upcomingSessions: GroundworkSession[];
  attendanceStats: {
    totalMandatory: number;
    attendedMandatory: number;
    totalOptional: number;
    attendedOptional: number;
  };
  assignments: (Assignment & { submission: Submission | null })[];
  interview: Interview | null;
  groundworkLogCount: number;
  totalSessionsForLogs: number;
}

export interface DashboardRow {
  id: string;
  name: string;
  email: string;
  verticals: Vertical[];
  subCount: number;
  logCount: number;
  intStatus: string;
  intScore: number | null;
}
