import { type Vertical, type UserRole } from '@/types/database';

export const VERTICAL_LABELS: Record<Vertical, string> = {
  events_operations: 'Events & Operations',
  projects_policies: 'Projects & Policies',
  web_design: 'Web & Design',
};

export const VERTICAL_COLORS: Record<Vertical, { bg: string; text: string; border: string }> = {
  events_operations: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  projects_policies: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  web_design: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
};

export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  evaluator: 'Evaluator',
  candidate: 'Candidate',
};

export const VERTICALS: Vertical[] = ['events_operations', 'projects_policies', 'web_design'];

export const ATTENDANCE_CODE_VALIDITY_SECONDS = 150; // 2.5 minutes
export const ATTENDANCE_MAX_ATTEMPTS_PER_MINUTE = 5;
