import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { VerticalBadge } from '@/components/shared/vertical-badge';
import { FileText, Clock, Plus, Users } from 'lucide-react';
import Link from 'next/link';
import { type Vertical } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminAssignmentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: assignments }, { data: submissions }] = await Promise.all([
    supabase.from('assignments').select('*').order('created_at', { ascending: false }),
    supabase.from('submissions').select('assignment_id'),
  ]);

  const subCountMap = new Map<string, number>();
  (submissions || []).forEach((s) => {
    subCountMap.set(s.assignment_id, (subCountMap.get(s.assignment_id) || 0) + 1);
  });

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Assignments"
        description="Create and manage assignments for each vertical"
        actions={
          <Link href="/a/assignments/new">
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Assignment
            </Button>
          </Link>
        }
      />

      {!assignments || assignments.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No assignments created yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <Link key={a.id} href={`/a/assignments/${a.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="min-w-0">
                    <p className="font-medium">{a.title}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <VerticalBadge vertical={a.vertical as Vertical} />
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        Due: {new Date(a.deadline).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="w-3 h-3" />
                        {subCountMap.get(a.id) || 0} submissions
                      </span>
                    </div>
                  </div>
                  <Badge variant={a.is_active ? 'default' : 'outline'}>
                    {a.is_active ? 'Active' : 'Closed'}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
