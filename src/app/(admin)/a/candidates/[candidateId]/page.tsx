import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VerticalBadge } from '@/components/shared/vertical-badge';
import { User, CalendarDays, FileText, BookOpen, MessageSquare, CheckCircle, XCircle, ClipboardList } from 'lucide-react';
import { type Vertical } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function CandidateProfilePage({ params }: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { data: profile },
    { data: verticals },
    { data: sessions },
    { data: attendance },
    { data: submissions },
    { data: logs },
    { data: interview },
    { data: interviewEvals },
    { data: individualGw },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', candidateId).single(),
    supabase.from('candidate_verticals').select('vertical').eq('candidate_id', candidateId),
    supabase.from('groundwork_sessions').select('*').eq('is_active', true),
    supabase.from('attendance').select('session_id, marked_at').eq('candidate_id', candidateId),
    supabase.from('submissions').select('*, assignments(title, vertical), assignment_evaluations(creativity, practicality, effort, comments, profiles(full_name))').eq('candidate_id', candidateId),
    supabase.from('groundwork_logs').select('*, groundwork_sessions(title)').eq('candidate_id', candidateId),
    supabase.from('interviews').select('*').eq('candidate_id', candidateId).maybeSingle(),
    supabase.from('interview_evaluations').select('*, profiles(full_name)').eq('interview_id', candidateId),
    supabase.from('individual_groundworks').select('*').eq('candidate_id', candidateId),
  ]);

  if (!profile) notFound();

  const verts = (verticals || []).map((v) => v.vertical as Vertical);
  const attendedIds = new Set((attendance || []).map((a) => a.session_id));
  const mandatorySessions = (sessions || []).filter((s) => s.is_mandatory);
  const attendedMandatory = mandatorySessions.filter((s) => attendedIds.has(s.id)).length;

  return (
    <div className="max-w-4xl">
      <PageHeader title={profile.full_name || profile.email} />

      {/* Profile Card */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{profile.full_name}</h2>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                {profile.department && <span>Dept: {profile.department}</span>}
                {profile.year_of_study && <span>Year: {profile.year_of_study}</span>}
              </div>
              <div className="flex gap-2 mt-2">
                {verts.map((v) => <VerticalBadge key={v} vertical={v} />)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{attendedMandatory}/{mandatorySessions.length}</p>
          <p className="text-xs text-muted-foreground">Mandatory Attendance</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{submissions?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Submissions</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{logs?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Reflections</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold">{individualGw?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Individual GWs</p>
        </CardContent></Card>
      </div>

      {/* Application Responses */}
      {profile.form_responses && Object.keys(profile.form_responses).length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />Application Responses
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(profile.form_responses).map(([key, value]) => (
              <div key={key} className="text-sm">
                <p className="font-medium text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                <p className="mt-0.5 leading-relaxed">{value as string}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Session Attendance */}
      <Card className="mb-6">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><CalendarDays className="w-4 h-4" />Session Attendance</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-1">
            {(sessions || []).map((s) => (
              <div key={s.id} className="flex items-center justify-between p-2 rounded border text-sm">
                <div className="flex items-center gap-2">
                  <span>{s.title}</span>
                  {s.is_mandatory && <Badge variant="secondary" className="text-xs">Mandatory</Badge>}
                </div>
                {attendedIds.has(s.id) ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submissions with Evaluations */}
      {submissions && submissions.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" />Submissions & Evaluations</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {submissions.map((sub: any) => (
              <div key={sub.id} className="p-3 rounded-lg border space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{sub.assignments?.title}</span>
                  <VerticalBadge vertical={sub.assignments?.vertical as Vertical} />
                  {sub.is_late && <Badge className="bg-amber-100 text-amber-700 text-xs">Late</Badge>}
                </div>
                {sub.submission_text && <p className="text-sm text-muted-foreground line-clamp-2">{sub.submission_text}</p>}
                {sub.assignment_evaluations?.length > 0 && (
                  <div className="bg-muted/50 rounded p-2 space-y-1">
                    {sub.assignment_evaluations.map((ev: any, i: number) => (
                      <div key={i} className="text-xs">
                        <span className="font-medium">{ev.profiles?.full_name}:</span>{' '}
                        C:{ev.creativity} P:{ev.practicality} E:{ev.effort}{' '}
                        (avg: {((ev.creativity + ev.practicality + ev.effort) / 3).toFixed(1)})
                        {ev.comments && <span className="text-muted-foreground ml-1">— {ev.comments}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Groundwork Logs */}
      {logs && logs.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4" />Reflections</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {logs.map((log: any) => (
              <div key={log.id} className="p-3 rounded-lg border text-sm space-y-1">
                <p className="font-medium text-xs text-muted-foreground">{log.groundwork_sessions?.title}</p>
                <p><span className="font-medium">Insight:</span> {log.key_insight}</p>
                <p><span className="font-medium">Learning:</span> {log.key_learning}</p>
                <p><span className="font-medium">Question:</span> {log.question}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
