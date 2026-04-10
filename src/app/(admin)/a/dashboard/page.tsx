import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Users, FileText, MessageSquare } from 'lucide-react';
import { type Vertical } from '@/types/database';
import { DashboardTable } from '@/components/admin/dashboard-table';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch all data in parallel
  const [
    { data: candidates },
    { data: allVerticals },
    { data: assignments },
    { data: allSubmissions },
    { data: allEvals },
    { data: interviews },
    { data: intEvals },
    { data: allLogs },
  ] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email').eq('role', 'candidate').eq('is_active', true).order('full_name'),
    supabase.from('candidate_verticals').select('candidate_id, vertical'),
    supabase.from('assignments').select('id, vertical').eq('is_active', true),
    supabase.from('submissions').select('candidate_id, assignment_id'),
    supabase.from('assignment_evaluations').select('submission_id, creativity, practicality, effort'),
    supabase.from('interviews').select('candidate_id, status'),
    supabase.from('interview_evaluations').select('interview_id, final_score, interviews(candidate_id)'),
    supabase.from('groundwork_logs').select('candidate_id'),
  ]);

  const totalAssignments = assignments?.length || 0;

  // Build lookup maps
  const verticalMap = new Map<string, Vertical[]>();
  (allVerticals || []).forEach((v) => {
    const arr = verticalMap.get(v.candidate_id) || [];
    arr.push(v.vertical as Vertical);
    verticalMap.set(v.candidate_id, arr);
  });

  const subMap = new Map<string, Set<string>>();
  (allSubmissions || []).forEach((s) => {
    const set = subMap.get(s.candidate_id) || new Set();
    set.add(s.assignment_id);
    subMap.set(s.candidate_id, set);
  });

  const logCountMap = new Map<string, number>();
  (allLogs || []).forEach((l) => {
    logCountMap.set(l.candidate_id, (logCountMap.get(l.candidate_id) || 0) + 1);
  });

  const interviewStatusMap = new Map<string, string>();
  (interviews || []).forEach((i) => {
    interviewStatusMap.set(i.candidate_id, i.status);
  });

  // Build score map (avg interview score per candidate)
  const intScoreMap = new Map<string, number>();
  (intEvals || []).forEach((e: any) => {
    const candidateId = e.interviews?.candidate_id;
    if (candidateId) intScoreMap.set(candidateId, e.final_score);
  });

  // Build candidate rows
  const rows = (candidates || []).map((c) => {
    const verts = verticalMap.get(c.id) || [];
    const subCount = subMap.get(c.id)?.size || 0;
    const logCount = logCountMap.get(c.id) || 0;
    const intStatus = interviewStatusMap.get(c.id) || 'not_scheduled';
    const intScore = intScoreMap.get(c.id) || null;

    return {
      id: c.id,
      name: c.full_name || c.email,
      email: c.email,
      verticals: verts,
      subCount,
      logCount,
      intStatus,
      intScore,
    };
  });

  // Sorting handled by DashboardTable client component

  // Overall stats
  const totalCandidates = candidates?.length || 0;
  const totalSubmissions = allSubmissions?.length || 0;
  const completedInterviews = (interviews || []).filter((i) => i.status === 'completed').length;

  return (
    <div className="max-w-6xl">
      <PageHeader title="Admin Dashboard" description="Consolidated view of all candidates" />

      {/* Summary Stats — gradient cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <div className="rounded-xl p-4 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
          <Users className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-3xl font-bold">{totalCandidates}</p>
          <p className="text-xs text-white/70 mt-0.5">Total Candidates</p>
        </div>
        <div className="rounded-xl p-4 bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg">
          <FileText className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-3xl font-bold">{totalSubmissions}</p>
          <p className="text-xs text-white/70 mt-0.5">Total Submissions</p>
        </div>
        <div className="rounded-xl p-4 bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg">
          <MessageSquare className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-3xl font-bold">{completedInterviews}</p>
          <p className="text-xs text-white/70 mt-0.5">Interviews Done</p>
        </div>
      </div>

      {/* Candidate Table — interactive filtering, sorting, search */}
      <DashboardTable rows={rows} />
    </div>
  );
}
