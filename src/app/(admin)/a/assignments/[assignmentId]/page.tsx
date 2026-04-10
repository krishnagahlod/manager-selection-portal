import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VerticalBadge } from '@/components/shared/vertical-badge';
import { EvaluationForm } from '@/components/admin/evaluation-form';
import { Clock, FileText, ExternalLink } from 'lucide-react';
import { EditAssignmentDialog } from '@/components/admin/edit-assignment-dialog';
import { type Vertical } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminAssignmentDetailPage({ params }: { params: Promise<{ assignmentId: string }> }) {
  const { assignmentId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: assignment }, { data: submissions }, { data: verticalCandidates }] = await Promise.all([
    supabase.from('assignments').select('*').eq('id', assignmentId).single(),
    supabase.from('submissions')
      .select('*, profiles(full_name, email), assignment_evaluations(creativity, practicality, effort, comments, evaluator_id)')
      .eq('assignment_id', assignmentId)
      .order('submitted_at', { ascending: false }),
    supabase.from('candidate_verticals')
      .select('candidate_id, vertical, profiles(full_name, email)'),
  ]);

  if (!assignment) notFound();

  // Find candidates in this assignment's vertical who haven't submitted
  const candidatesInVertical = (verticalCandidates || []).filter(
    (cv: any) => cv.vertical === assignment.vertical
  );
  const submittedCandidateIds = new Set((submissions || []).map((s: any) => s.candidate_id));
  const missingCandidates = candidatesInVertical.filter(
    (cv: any) => !submittedCandidateIds.has(cv.candidate_id)
  );

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={assignment.title}
        actions={<EditAssignmentDialog assignment={assignment} />}
      />

      <Card className="mb-6">
        <CardContent className="p-5">
          <p className="text-sm whitespace-pre-wrap">{assignment.description}</p>
          <div className="flex items-center gap-3 mt-3">
            <VerticalBadge vertical={assignment.vertical as Vertical} />
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              Deadline: {new Date(assignment.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold mb-3">Submissions ({submissions?.length || 0})</h2>

      {!submissions || submissions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No submissions yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub: any) => {
            const existingEval = sub.assignment_evaluations?.find((e: any) => e.evaluator_id === user.id);
            return (
              <Card key={sub.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{sub.profiles?.full_name}</CardTitle>
                      <p className="text-xs text-muted-foreground">{sub.profiles?.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {sub.is_late && <Badge className="bg-amber-100 text-amber-700">Late</Badge>}
                      <span className="text-xs text-muted-foreground">
                        {new Date(sub.submitted_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {sub.submission_text && (
                    <div className="bg-muted/50 rounded-lg p-3">
                      <p className="text-sm whitespace-pre-wrap">{sub.submission_text}</p>
                    </div>
                  )}
                  {sub.file_url && (
                    <a
                      href={sub.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                    >
                      <FileText className="w-4 h-4" />
                      {sub.file_name || 'Download file'}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  {/* Evaluation */}
                  <div className="border-t pt-3">
                    <EvaluationForm
                      submissionId={sub.id}
                      existingEval={existingEval}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Not Submitted */}
      {missingCandidates.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3 text-destructive/80">Not Submitted ({missingCandidates.length})</h2>
          <Card className="border-destructive/20">
            <CardContent className="p-4">
              <div className="space-y-2">
                {missingCandidates.map((cv: any) => (
                  <div key={cv.candidate_id} className="flex items-center justify-between p-2 rounded border border-border/60">
                    <div>
                      <p className="text-sm font-medium">{cv.profiles?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{cv.profiles?.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs text-destructive border-destructive/30">Missing</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
