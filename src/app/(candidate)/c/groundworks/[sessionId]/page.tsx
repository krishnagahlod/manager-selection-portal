import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, MapPin, CheckCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { QuestionSection } from '@/components/candidate/question-section';

export const dynamic = 'force-dynamic';

export default async function SessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: session }, { data: log }] = await Promise.all([
    supabase.from('groundwork_sessions').select('*').eq('id', sessionId).single(),
    supabase.from('groundwork_logs').select('id').eq('session_id', sessionId).eq('candidate_id', user.id).maybeSingle(),
  ]);

  if (!session) notFound();

  const hasLog = !!log;

  return (
    <div className="max-w-3xl">
      <PageHeader title={session.title} />

      <Card className="mb-6">
        <CardContent className="p-5">
          {session.description && (
            <p className="text-sm text-muted-foreground mb-4">{session.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" />
              {new Date(session.session_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              {session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}
            </span>
            {session.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {session.location}
              </span>
            )}
          </div>
          {session.is_mandatory && (
            <div className="mt-4">
              <Badge variant="secondary">Mandatory</Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reflection */}
      <div className="flex flex-wrap gap-3 mb-6">
        {!hasLog ? (
          <Link href={`/c/groundworks/${sessionId}/log`}>
            <Button variant="outline" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Submit Reflection
            </Button>
          </Link>
        ) : (
          <Badge className="bg-emerald-100 text-emerald-700 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />Reflection submitted
          </Badge>
        )}
      </div>

      {/* Q&A Section */}
      <QuestionSection sessionId={sessionId} userId={user.id} />
    </div>
  );
}
