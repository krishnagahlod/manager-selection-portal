import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { VerticalBadge } from '@/components/shared/vertical-badge';
import { FileText, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { type Vertical } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AssignmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: verticals }, { data: assignments }, { data: submissions }] = await Promise.all([
    supabase.from('candidate_verticals').select('vertical').eq('candidate_id', user.id),
    supabase.from('assignments').select('*').eq('is_active', true).order('deadline', { ascending: true }),
    supabase.from('submissions').select('assignment_id').eq('candidate_id', user.id),
  ]);

  const myVerticals = (verticals || []).map((v) => v.vertical as Vertical);
  const myAssignments = (assignments || []).filter((a) => myVerticals.includes(a.vertical as Vertical));
  const submittedIds = new Set((submissions || []).map((s) => s.assignment_id));

  return (
    <div className="max-w-3xl">
      <PageHeader title="Assignments" description="Complete and submit your assignments before the deadline" />

      {myAssignments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No assignments available for your verticals yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {myAssignments.map((assignment) => {
            const submitted = submittedIds.has(assignment.id);
            const deadline = new Date(assignment.deadline);
            const isOverdue = !submitted && deadline < new Date();
            const daysLeft = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

            return (
              <Link key={assignment.id} href={`/c/assignments/${assignment.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">{assignment.title}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{assignment.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <VerticalBadge vertical={assignment.vertical as Vertical} />
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            Due: {deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                            {!submitted && !isOverdue && daysLeft > 0 && (
                              <span className="ml-1">({daysLeft} day{daysLeft !== 1 ? 's' : ''} left)</span>
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {submitted ? (
                          <Badge className="bg-emerald-100 text-emerald-700">
                            <CheckCircle className="w-3 h-3 mr-1" />Submitted
                          </Badge>
                        ) : isOverdue ? (
                          <Badge className="bg-red-100 text-red-700">
                            <AlertCircle className="w-3 h-3 mr-1" />Overdue
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
