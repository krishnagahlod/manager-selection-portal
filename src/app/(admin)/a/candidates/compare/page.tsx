import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VerticalBadge } from '@/components/shared/vertical-badge';
import { Button } from '@/components/ui/button';
import { User, CalendarDays, FileText, BookOpen, MessageSquare, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { type Vertical } from '@/types/database';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface CandidateData {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
  year_of_study: number | null;
  verticals: Vertical[];
  attPct: number;
  attendedMandatory: number;
  totalMandatory: number;
  subCount: number;
  logCount: number;
  intStatus: string;
  intScore: number | null;
  form_responses: Record<string, string> | null;
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ ids?: string }> }) {
  const { ids } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  if (!ids) redirect('/a/candidates');
  const candidateIds = ids.split(',').filter(Boolean).slice(0, 4);
  if (candidateIds.length < 2) redirect('/a/candidates');

  // Fetch all data
  const [
    { data: profiles },
    { data: allVerticals },
    { data: sessions },
    { data: allAttendance },
    { data: allSubmissions },
    { data: allLogs },
    { data: interviews },
    { data: intEvals },
  ] = await Promise.all([
    supabase.from('profiles').select('*').in('id', candidateIds),
    supabase.from('candidate_verticals').select('candidate_id, vertical').in('candidate_id', candidateIds),
    supabase.from('groundwork_sessions').select('id, is_mandatory').eq('is_active', true).eq('is_mandatory', true),
    supabase.from('attendance').select('candidate_id, session_id').in('candidate_id', candidateIds),
    supabase.from('submissions').select('candidate_id').in('candidate_id', candidateIds),
    supabase.from('groundwork_logs').select('candidate_id').in('candidate_id', candidateIds),
    supabase.from('interviews').select('candidate_id, status').in('candidate_id', candidateIds),
    supabase.from('interview_evaluations').select('final_score, interviews(candidate_id)').in('interview_id',
      (await supabase.from('interviews').select('id').in('candidate_id', candidateIds)).data?.map((i) => i.id) || []
    ),
  ]);

  const totalMandatory = sessions?.length || 0;

  const candidates: CandidateData[] = candidateIds.map((cid) => {
    const profile = (profiles || []).find((p) => p.id === cid);
    const verts = (allVerticals || []).filter((v) => v.candidate_id === cid).map((v) => v.vertical as Vertical);
    const attCount = (allAttendance || []).filter((a) => a.candidate_id === cid).length;
    const attPct = totalMandatory > 0 ? Math.round((attCount / totalMandatory) * 100) : 0;
    const subCount = (allSubmissions || []).filter((s) => s.candidate_id === cid).length;
    const logCount = (allLogs || []).filter((l) => l.candidate_id === cid).length;
    const interview = (interviews || []).find((i) => i.candidate_id === cid);
    const intEval = (intEvals || []).find((e: any) => e.interviews?.candidate_id === cid);

    return {
      id: cid,
      full_name: profile?.full_name || profile?.email || 'Unknown',
      email: profile?.email || '',
      department: profile?.department || null,
      year_of_study: profile?.year_of_study || null,
      verticals: verts,
      attPct,
      attendedMandatory: attCount,
      totalMandatory,
      subCount,
      logCount,
      intStatus: interview?.status || 'not_scheduled',
      intScore: (intEval as any)?.final_score || null,
      form_responses: profile?.form_responses || null,
    };
  });

  // Helper: highlight best value
  const bestClass = (values: (number | null)[], index: number) => {
    const nums = values.map((v) => v ?? -1);
    const max = Math.max(...nums);
    if (nums[index] === max && max > 0) return 'bg-emerald-50 text-emerald-700 font-bold';
    return '';
  };

  // On mobile: single column stack. On md+: side-by-side.
  const mdColClass =
    candidates.length === 2 ? 'md:grid-cols-2' :
    candidates.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-4';

  return (
    <div className="max-w-6xl">
      <PageHeader
        title="Candidate Comparison"
        description={`Comparing ${candidates.length} candidates`}
        actions={
          <Link href="/a/candidates">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />Back
            </Button>
          </Link>
        }
      />

      <div className={`grid grid-cols-1 ${mdColClass} gap-4`}>
        {candidates.map((c, i) => (
          <div key={c.id} className="space-y-4">
            {/* Profile */}
            <Card className="border-border/60">
              <CardContent className="p-4 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <Link href={`/a/candidates/${c.id}`} className="hover:text-primary transition-colors">
                  <h3 className="font-semibold">{c.full_name}</h3>
                </Link>
                <p className="text-xs text-muted-foreground">{c.email}</p>
                {c.department && <p className="text-xs text-muted-foreground mt-0.5">{c.department} · Year {c.year_of_study}</p>}
                <div className="flex gap-1 justify-center mt-2 flex-wrap">
                  {c.verticals.map((v) => <VerticalBadge key={v} vertical={v} />)}
                </div>
              </CardContent>
            </Card>

            {/* Attendance */}
            <Card className="border-border/60">
              <CardContent className={cn('p-4 text-center', bestClass(candidates.map((x) => x.attPct), i))}>
                <CalendarDays className="w-5 h-5 mx-auto mb-1 opacity-60" />
                <p className="text-2xl font-bold">{c.attPct}%</p>
                <p className="text-xs text-muted-foreground">{c.attendedMandatory}/{c.totalMandatory} mandatory</p>
              </CardContent>
            </Card>

            {/* Submissions */}
            <Card className="border-border/60">
              <CardContent className={cn('p-4 text-center', bestClass(candidates.map((x) => x.subCount), i))}>
                <FileText className="w-5 h-5 mx-auto mb-1 opacity-60" />
                <p className="text-2xl font-bold">{c.subCount}</p>
                <p className="text-xs text-muted-foreground">Submissions</p>
              </CardContent>
            </Card>

            {/* Reflections */}
            <Card className="border-border/60">
              <CardContent className={cn('p-4 text-center', bestClass(candidates.map((x) => x.logCount), i))}>
                <BookOpen className="w-5 h-5 mx-auto mb-1 opacity-60" />
                <p className="text-2xl font-bold">{c.logCount}</p>
                <p className="text-xs text-muted-foreground">Reflections</p>
              </CardContent>
            </Card>

            {/* Interview */}
            <Card className="border-border/60">
              <CardContent className={cn('p-4 text-center', bestClass(candidates.map((x) => x.intScore), i))}>
                <MessageSquare className="w-5 h-5 mx-auto mb-1 opacity-60" />
                <p className="text-2xl font-bold">{c.intScore !== null ? `${c.intScore}/10` : '—'}</p>
                <Badge variant="outline" className="text-xs mt-1">{c.intStatus.replace('_', ' ')}</Badge>
              </CardContent>
            </Card>

            {/* Form Responses */}
            {c.form_responses && Object.keys(c.form_responses).length > 0 && (
              <Card className="border-border/60">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Application</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {Object.entries(c.form_responses).map(([key, value]) => (
                    <div key={key} className="text-xs">
                      <p className="font-medium text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="mt-0.5 line-clamp-3">{value as string}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
