import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { StatusCard } from '@/components/candidate/status-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VerticalBadge } from '@/components/shared/vertical-badge';
import { VERTICAL_LABELS } from '@/lib/constants';
import {
  CheckCircle,
  FileText,
  CalendarDays,
  BookOpen,
  Clock,
  MapPin,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { type Vertical } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function CandidateDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch all data in parallel
  const [
    { data: profile },
    { data: verticals },
    { data: sessions },
    { data: attendanceRecords },
    { data: assignments },
    { data: submissions },
    { data: interview },
    { data: groundworkLogs },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('candidate_verticals').select('vertical').eq('candidate_id', user.id),
    supabase.from('groundwork_sessions').select('*').eq('is_active', true).order('session_date', { ascending: true }),
    supabase.from('attendance').select('session_id').eq('candidate_id', user.id),
    supabase.from('assignments').select('*').eq('is_active', true).order('deadline', { ascending: true }),
    supabase.from('submissions').select('assignment_id').eq('candidate_id', user.id),
    supabase.from('interviews').select('*').eq('candidate_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('groundwork_logs').select('session_id').eq('candidate_id', user.id),
  ]);

  const myVerticals = (verticals || []).map((v) => v.vertical as Vertical);
  const attendedSessionIds = new Set((attendanceRecords || []).map((a) => a.session_id));
  const submittedAssignmentIds = new Set((submissions || []).map((s) => s.assignment_id));
  const loggedSessionIds = new Set((groundworkLogs || []).map((l) => l.session_id));

  const allSessions = sessions || [];
  const mandatorySessions = allSessions.filter((s) => s.is_mandatory);
  const attendedMandatory = mandatorySessions.filter((s) => attendedSessionIds.has(s.id)).length;

  const myAssignments = (assignments || []).filter((a) =>
    myVerticals.includes(a.vertical as Vertical)
  );
  const submittedCount = myAssignments.filter((a) => submittedAssignmentIds.has(a.id)).length;

  const today = new Date().toISOString().split('T')[0];
  const upcomingSessions = allSessions.filter((s) => s.session_date >= today);
  const pastSessions = allSessions.filter((s) => s.session_date < today);

  const interviewStatus = interview
    ? interview.status === 'scheduled'
      ? `Scheduled: ${new Date(interview.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      : interview.status === 'completed'
        ? 'Completed'
        : 'Pending'
    : 'Not yet scheduled';

  return (
    <div className="max-w-5xl">
      {/* Welcome banner */}
      <div className="rounded-2xl gradient-emerald p-6 md:p-8 mb-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-bold">
            Welcome back, {profile?.full_name?.split(' ')[0] || 'Candidate'}
          </h1>
          <p className="text-white/70 mt-1 text-sm">Your selection process at a glance</p>
          {myVerticals.length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              {myVerticals.map((v) => (
                <span key={v} className="inline-flex items-center px-2.5 py-1 rounded-lg bg-white/15 text-xs font-medium text-white backdrop-blur-sm">
                  {VERTICAL_LABELS[v]}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatusCard
          label="Attendance"
          value={`${attendedMandatory}/${mandatorySessions.length}`}
          subtext="mandatory sessions"
          icon={CheckCircle}
          color="emerald"
        />
        <StatusCard
          label="Assignments"
          value={`${submittedCount}/${myAssignments.length}`}
          subtext="submitted"
          icon={FileText}
          color="blue"
        />
        <StatusCard
          label="Interview"
          value={interviewStatus}
          icon={CalendarDays}
          color={interview?.status === 'scheduled' ? 'amber' : 'emerald'}
        />
        <StatusCard
          label="Groundwork Logs"
          value={`${loggedSessionIds.size}/${pastSessions.length}`}
          subtext="reflections submitted"
          icon={BookOpen}
          color="purple"
        />
      </div>

      {/* Upcoming Sessions */}
      <Card className="mb-6 shadow-card border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarDays className="w-4 h-4 text-primary" />
            </div>
            Upcoming Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No upcoming sessions</p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map((session) => {
                const attended = attendedSessionIds.has(session.id);
                return (
                  <Link
                    key={session.id}
                    href={`/c/groundworks/${session.id}`}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 hover:shadow-card-hover hover:border-primary/20 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{session.title}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>
                            {new Date(session.session_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            {' '}{session.start_time?.slice(0, 5)}
                          </span>
                          {session.location && (
                            <>
                              <MapPin className="w-3 h-3 ml-1" />
                              <span>{session.location}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {session.is_mandatory && (
                        <Badge variant="secondary" className="text-xs">Mandatory</Badge>
                      )}
                      {attended ? (
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">Attended</Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignments */}
      <Card className="shadow-card border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            Your Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {myAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assignments yet</p>
          ) : (
            <div className="space-y-3">
              {myAssignments.map((assignment) => {
                const submitted = submittedAssignmentIds.has(assignment.id);
                const deadline = new Date(assignment.deadline);
                const isOverdue = !submitted && deadline < new Date();

                return (
                  <Link
                    key={assignment.id}
                    href={`/c/assignments/${assignment.id}`}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 hover:shadow-card-hover hover:border-primary/20 transition-all duration-200"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-sm">{assignment.title}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <VerticalBadge vertical={assignment.vertical as Vertical} />
                        <span className="text-xs text-muted-foreground">
                          Due: {deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    </div>
                    <div className="shrink-0">
                      {submitted ? (
                        <Badge className="bg-emerald-100 text-emerald-700 text-xs">Submitted</Badge>
                      ) : isOverdue ? (
                        <Badge className="bg-red-100 text-red-700 text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Overdue
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">Pending</Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
