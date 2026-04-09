import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, Clock, MapPin, Users, QrCode, MessageSquare, BookOpen } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AdminSessionDetailPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [
    { data: session },
    { data: attendance },
    { data: questions },
    { data: logs },
  ] = await Promise.all([
    supabase.from('groundwork_sessions').select('*').eq('id', sessionId).single(),
    supabase.from('attendance').select('candidate_id, marked_at, profiles(full_name, email)').eq('session_id', sessionId),
    supabase.from('session_questions').select('*').eq('session_id', sessionId).order('created_at', { ascending: false }),
    supabase.from('groundwork_logs').select('*, profiles(full_name)').eq('session_id', sessionId),
  ]);

  if (!session) notFound();

  return (
    <div className="max-w-4xl">
      <PageHeader
        title={session.title}
        actions={
          <div className="flex gap-2">
            <Link href={`/a/sessions/${sessionId}/questions`}>
              <Button variant="outline" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Moderate Q&A
              </Button>
            </Link>
            <Link href={`/a/sessions/${sessionId}/attendance`}>
              <Button className="gap-2">
                <QrCode className="w-4 h-4" />
                Take Attendance
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
          <div className="flex gap-2 mt-3">
            {session.is_mandatory && <Badge variant="secondary">Mandatory</Badge>}
            <Badge variant={session.is_active ? 'default' : 'outline'}>{session.is_active ? 'Active' : 'Inactive'}</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{attendance?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Attended</p>
          </CardContent>
        </Card>
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

      {/* Attendance List */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Attendance ({attendance?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {!attendance || attendance.length === 0 ? (
            <p className="text-sm text-muted-foreground">No one has attended yet.</p>
          ) : (
            <div className="space-y-2">
              {attendance.map((a: any) => (
                <div key={a.candidate_id} className="flex items-center justify-between p-2 rounded border">
                  <div>
                    <p className="text-sm font-medium">{a.profiles?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{a.profiles?.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.marked_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
