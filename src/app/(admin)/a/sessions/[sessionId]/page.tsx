import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, MapPin, MessageSquare, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { EditSessionDialog } from '@/components/admin/edit-session-dialog';

export const dynamic = 'force-dynamic';

export default async function AdminSessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { data: session },
    { data: questions },
    { data: logs },
  ] = await Promise.all([
    supabase.from('groundwork_sessions').select('*').eq('id', sessionId).single(),
    supabase.from('session_questions').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }),
    supabase.from('groundwork_logs').select('*, profiles(full_name)').eq('session_id', sessionId),
  ]);

  if (!session) notFound();

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={session.title}
        actions={
          <div className="flex gap-2 flex-wrap">
            <EditSessionDialog session={session} />
            <Link href={`/a/sessions/${sessionId}/questions`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Moderate Q&A
              </Button>
            </Link>
          </div>
        }
      />

      {/* Session Info */}
      <Card className="mb-6">
        <CardContent className="p-5">
          {session.description && <p className="text-sm text-muted-foreground mb-3">{session.description}</p>}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4" />{new Date(session.session_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />{session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}</span>
            {session.location && <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" />{session.location}</span>}
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            {session.is_mandatory && <Badge variant="secondary">Mandatory</Badge>}
            <Badge variant={session.is_active ? 'default' : 'outline'}>{session.is_active ? 'Active' : 'Inactive'}</Badge>
          </div>
          {session.recording_url && (
            <a
              href={session.recording_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-3"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Session Recording
            </a>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{questions?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Questions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{logs?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Reflections</p>
          </CardContent>
        </Card>
      </div>

      {/* Groundwork Logs */}
      {logs && logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reflections ({logs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logs.map((log: any) => (
                <div key={log.id} className="p-3 rounded-lg border space-y-2">
                  <p className="text-sm font-medium">{log.profiles?.full_name}</p>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div><span className="font-medium text-muted-foreground">Insight:</span> {log.key_insight}</div>
                    <div><span className="font-medium text-muted-foreground">Learning:</span> {log.key_learning}</div>
                    <div><span className="font-medium text-muted-foreground">Question:</span> {log.question}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
