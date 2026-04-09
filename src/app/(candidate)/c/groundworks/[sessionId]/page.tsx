import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, MapPin, CheckCircle, QrCode, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { QuestionSection } from '@/components/candidate/question-section';

export const dynamic = 'force-dynamic';

export default async function SessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: session }, { data: attendance }, { data: log }] = await Promise.all([
    supabase.from('groundwork_sessions').select('*').eq('id', sessionId).single(),
    supabase.from('attendance').select('id').eq('session_id', sessionId).eq('candidate_id', user.id).maybeSingle(),
    supabase.from('groundwork_logs').select('id').eq('session_id', sessionId).eq('candidate_id', user.id).maybeSingle(),
  ]);

  if (!session) notFound();

  const attended = !!attendance;
  const hasLog = !!log;
  const today = new Date().toISOString().split('T')[0];
  const isPast = session.session_date < today;

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
          <div className="flex items-center gap-2 mt-4">
            {session.is_mandatory && <Badge variant="secondary">Mandatory</Badge>}
            {attended ? (
              <Badge className="bg-emerald-100 text-emerald-700">
                <CheckCircle className="w-3 h-3 mr-1" />Attended
              </Badge>
            ) : (
              <Badge variant="outline">Not attended</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        {!attended && !isPast && (
          <Link href={`/c/groundworks/${sessionId}/attend`}>
            <Button className="gap-2">
              <QrCode className="w-4 h-4" />
              Mark Attendance
            </Button>
          </Link>
        )}
        {isPast && !hasLog && (
          <Link href={`/c/groundworks/${sessionId}/log`}>
            <Button variant="outline" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Submit Reflection
            </Button>
          </Link>
        )}
        {hasLog && (
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
