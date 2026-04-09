import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, MapPin, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function InterviewsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: interviews } = await supabase
    .from('interviews')
    .select('*')
    .eq('candidate_id', user.id)
    .order('scheduled_at', { ascending: true });

  const statusColors: Record<string, string> = {
    not_scheduled: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    not_scheduled: 'Not Scheduled',
    scheduled: 'Scheduled',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Interviews" description="Your interview schedule and status" />

      {!interviews || interviews.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No interviews scheduled yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              You'll be notified when your interview is scheduled.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => (
            <Card key={interview.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">Interview</p>
                    {interview.scheduled_at && (
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-4 h-4" />
                          {new Date(interview.scheduled_at).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {new Date(interview.scheduled_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {interview.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {interview.location}
                          </span>
                        )}
                      </div>
                    )}
                    {interview.duration_min && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Duration: ~{interview.duration_min} minutes
                      </p>
                    )}
                  </div>
                  <Badge className={statusColors[interview.status] || ''}>
                    {statusLabels[interview.status] || interview.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
