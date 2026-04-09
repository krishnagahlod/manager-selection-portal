'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/layout/page-header';
import { Loader2, RefreshCw, Square, Users } from 'lucide-react';
import { ATTENDANCE_CODE_VALIDITY_SECONDS } from '@/lib/constants';

interface AttendeeInfo {
  candidate_id: string;
  full_name: string;
  email: string;
  marked_at: string;
}

export default function AttendanceLivePage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [code, setCode] = useState<string | null>(null);
  const [validUntil, setValidUntil] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [attendees, setAttendees] = useState<AttendeeInfo[]>([]);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  const generateCode = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/attendance/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();
      if (data.code) {
        setCode(data.code);
        setValidUntil(new Date(data.validUntil));
        setRunning(true);
      }
    } catch (err) {
      console.error('Failed to generate code', err);
    }
    setLoading(false);
  }, [sessionId]);

  // Countdown timer
  useEffect(() => {
    if (!validUntil || !running) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((validUntil.getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining === 0) {
        generateCode(); // Auto-rotate
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [validUntil, running, generateCode]);

  // Fetch existing attendees and subscribe to new ones
  useEffect(() => {
    async function fetchAttendees() {
      const { data } = await supabase
        .from('attendance')
        .select('candidate_id, marked_at, profiles(full_name, email)')
        .eq('session_id', sessionId)
        .order('marked_at', { ascending: false });

      if (data) {
        setAttendees(data.map((a: any) => ({
          candidate_id: a.candidate_id,
          full_name: a.profiles?.full_name || 'Unknown',
          email: a.profiles?.email || '',
          marked_at: a.marked_at,
        })));
      }
    }
    fetchAttendees();

    const channel = supabase
      .channel(`attendance-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'attendance',
        filter: `session_id=eq.${sessionId}`,
      }, async (payload) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', payload.new.candidate_id)
          .single();

        setAttendees((prev) => [{
          candidate_id: payload.new.candidate_id,
          full_name: profile?.full_name || 'Unknown',
          email: profile?.email || '',
          marked_at: payload.new.marked_at,
        }, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sessionId]);

  const stopAttendance = () => {
    setRunning(false);
    setCode(null);
    setValidUntil(null);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <PageHeader title="Live Attendance" />

      {/* Code Display */}
      <Card className="mb-6">
        <CardContent className="py-8">
          {!running ? (
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Start attendance to generate a code</p>
              <Button onClick={generateCode} disabled={loading} size="lg" className="gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Start Attendance
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Current Code</p>
              <div className="text-6xl md:text-8xl font-mono font-bold tracking-[0.3em] gradient-emerald bg-clip-text text-transparent mb-4 select-all">
                {code}
              </div>
              <div className="flex items-center justify-center gap-2 mb-6">
                <div className={`w-2 h-2 rounded-full ${secondsLeft > 30 ? 'bg-emerald-500' : secondsLeft > 10 ? 'bg-amber-500' : 'bg-red-500 animate-pulse'}`} />
                <span className="text-sm font-medium">
                  {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')} remaining
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-2 mb-6">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(secondsLeft / ATTENDANCE_CODE_VALIDITY_SECONDS) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button onClick={generateCode} variant="outline" className="gap-2" disabled={loading}>
                  <RefreshCw className="w-4 h-4" />
                  New Code
                </Button>
                <Button onClick={stopAttendance} variant="destructive" className="gap-2">
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Attendee List */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="font-medium text-sm">Attended</span>
            </div>
            <Badge variant="secondary">{attendees.length}</Badge>
          </div>
          {attendees.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No attendees yet</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {attendees.map((a) => (
                <div key={a.candidate_id} className="flex items-center justify-between p-2 rounded border">
                  <div>
                    <p className="text-sm font-medium">{a.full_name}</p>
                    <p className="text-xs text-muted-foreground">{a.email}</p>
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
    </div>
  );
}
