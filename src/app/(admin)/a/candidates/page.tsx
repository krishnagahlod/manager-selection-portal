import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { type Vertical } from '@/types/database';
import { CandidateList } from '@/components/admin/candidate-list';

export const dynamic = 'force-dynamic';

export default async function AdminCandidatesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Fetch all candidates with their verticals
  const { data: candidates } = await supabase
    .from('profiles')
    .select('id, full_name, email, department, year_of_study, created_at')
    .eq('role', 'candidate')
    .eq('is_active', true)
    .order('full_name', { ascending: true });

  const { data: allVerticals } = await supabase
    .from('candidate_verticals')
    .select('candidate_id, vertical');

  const { data: allAttendance } = await supabase
    .from('attendance')
    .select('candidate_id');

  const { data: allSubmissions } = await supabase
    .from('submissions')
    .select('candidate_id');

  const { data: mandatorySessions } = await supabase
    .from('groundwork_sessions')
    .select('id')
    .eq('is_mandatory', true)
    .eq('is_active', true);

  const totalMandatory = mandatorySessions?.length || 0;

  // Build maps
  const verticalMap = new Map<string, Vertical[]>();
  (allVerticals || []).forEach((v) => {
    const arr = verticalMap.get(v.candidate_id) || [];
    arr.push(v.vertical as Vertical);
    verticalMap.set(v.candidate_id, arr);
  });

  const attCountMap = new Map<string, number>();
  (allAttendance || []).forEach((a) => {
    attCountMap.set(a.candidate_id, (attCountMap.get(a.candidate_id) || 0) + 1);
  });

  const subCountMap = new Map<string, number>();
  (allSubmissions || []).forEach((s) => {
    subCountMap.set(s.candidate_id, (subCountMap.get(s.candidate_id) || 0) + 1);
  });

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Candidates"
        description={`${candidates?.length || 0} registered candidates`}
      />

      {!candidates || candidates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No candidates registered yet.</p>
          </CardContent>
        </Card>
      ) : (
        <CandidateList
          candidates={(candidates || []).map((candidate) => {
            const verts = verticalMap.get(candidate.id) || [];
            const attCount = attCountMap.get(candidate.id) || 0;
            const subCount = subCountMap.get(candidate.id) || 0;
            const attPct = totalMandatory > 0 ? Math.round((attCount / totalMandatory) * 100) : 0;
            return {
              id: candidate.id,
              full_name: candidate.full_name || candidate.email,
              email: candidate.email,
              verticals: verts,
              attPct,
              subCount,
            };
          })}
        />
      )}
    </div>
  );
}
