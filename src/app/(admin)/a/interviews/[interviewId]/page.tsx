'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { VerticalBadge } from '@/components/shared/vertical-badge';
import { Loader2, User, FileText, BookOpen, CheckCircle } from 'lucide-react';
import { type Vertical } from '@/types/database';

export default function InterviewPanelPage() {
  const params = useParams();
  const interviewId = params.interviewId as string;

  const [interview, setInterview] = useState<any>(null);
  const [candidate, setCandidate] = useState<any>(null);
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Evaluation state
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [redFlags, setRedFlags] = useState('');
  const [score, setScore] = useState(0);
  const [evalComments, setEvalComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: intData } = await supabase
        .from('interviews')
        .select('*, profiles(full_name, email, department, year_of_study)')
        .eq('id', interviewId)
        .single();

      if (!intData) { setLoading(false); return; }
      setInterview(intData);
      setCandidate(intData.profiles);

      const candidateId = intData.candidate_id;

      const [
        { data: verts },
        { data: subs },
        { data: logData },
        { data: existingEval },
      ] = await Promise.all([
        supabase.from('candidate_verticals').select('vertical').eq('candidate_id', candidateId),
        supabase.from('submissions').select('*, assignments(title, vertical)').eq('candidate_id', candidateId),
        supabase.from('groundwork_logs').select('*, groundwork_sessions(title)').eq('candidate_id', candidateId),
        supabase.from('interview_evaluations').select('*').eq('interview_id', interviewId).eq('evaluator_id', user.id).maybeSingle(),
      ]);

      setVerticals((verts || []).map((v) => v.vertical as Vertical));
      setSubmissions(subs || []);
      setLogs(logData || []);

      if (existingEval) {
        setStrengths(existingEval.strengths || '');
        setWeaknesses(existingEval.weaknesses || '');
        setRedFlags(existingEval.red_flags || '');
        setScore(existingEval.final_score);
        setEvalComments(existingEval.comments || '');
        setSubmitted(true);
      }

      setLoading(false);
    }
    load();
  }, [interviewId]);

  const handleSubmitEval = async () => {
    if (!score) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      interview_id: interviewId,
      evaluator_id: user.id,
      strengths: strengths.trim() || null,
      weaknesses: weaknesses.trim() || null,
      red_flags: redFlags.trim() || null,
      final_score: score,
      comments: evalComments.trim() || null,
    };

    if (submitted) {
      await supabase.from('interview_evaluations').update(payload).eq('interview_id', interviewId).eq('evaluator_id', user.id);
    } else {
      await supabase.from('interview_evaluations').insert(payload);
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!interview || !candidate) return <p className="text-center py-10 text-muted-foreground">Interview not found</p>;

  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200' },
  ];

  const [currentStatus, setCurrentStatus] = useState(interview.status);
  const [statusSaving, setStatusSaving] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setStatusSaving(true);
    await supabase.from('interviews').update({ status: newStatus }).eq('id', interviewId);
    setCurrentStatus(newStatus);
    setStatusSaving(false);
  };

  return (
    <div className="max-w-4xl">
      <PageHeader title={`Interview: ${candidate.full_name}`} />

      {/* Interview Status Control */}
      <Card className="mb-6 border-border/60">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="text-sm">
              <p className="text-muted-foreground text-xs font-medium mb-2">Status</p>
              <div className="flex gap-1.5 flex-wrap">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleStatusChange(opt.value)}
                    disabled={statusSaving}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      currentStatus === opt.value
                        ? `${opt.color} ring-2 ring-offset-1 ring-current`
                        : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-x-4 gap-y-1 text-xs text-muted-foreground flex-wrap pt-1 border-t">
              {interview.scheduled_at && (
                <span>{new Date(interview.scheduled_at).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} at {new Date(interview.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
              )}
              {interview.location && <span>{interview.location}</span>}
              {interview.duration_min && <span>{interview.duration_min} min</span>}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Candidate Info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Profile */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" />Candidate Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="truncate"><span className="text-muted-foreground">Email:</span> {candidate.email}</div>
                {candidate.department && <div><span className="text-muted-foreground">Dept:</span> {candidate.department}</div>}
                {candidate.year_of_study && <div><span className="text-muted-foreground">Year:</span> {candidate.year_of_study}</div>}
                <div className="sm:col-span-2 flex items-center gap-1 flex-wrap">
                  <span className="text-muted-foreground">Verticals:</span>
                  {verticals.map((v) => <VerticalBadge key={v} vertical={v} />)}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Badge variant="secondary">Submissions: {submissions.length}</Badge>
                <Badge variant="secondary">Reflections: {logs.length}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Submissions */}
          {submissions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><FileText className="w-4 h-4" />Assignment Submissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {submissions.map((sub: any) => (
                  <div key={sub.id} className="p-3 rounded-lg border">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{sub.assignments?.title}</span>
                      <VerticalBadge vertical={sub.assignments?.vertical as Vertical} />
                    </div>
                    {sub.submission_text && (
                      <p className="text-sm text-muted-foreground line-clamp-3">{sub.submission_text}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Groundwork Logs */}
          {logs.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><BookOpen className="w-4 h-4" />Groundwork Reflections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {logs.map((log: any) => (
                  <div key={log.id} className="p-3 rounded-lg border text-sm space-y-1">
                    <p className="font-medium text-xs text-muted-foreground">{log.groundwork_sessions?.title}</p>
                    <p><span className="font-medium">Insight:</span> {log.key_insight}</p>
                    <p><span className="font-medium">Learning:</span> {log.key_learning}</p>
                    <p><span className="font-medium">Question:</span> {log.question}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Evaluation Form */}
        <div>
          <Card className="lg:sticky lg:top-6">
            <CardHeader>
              <CardTitle className="text-base">Your Evaluation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm">Final Score (1-10) *</Label>
                <div className="flex gap-1 flex-wrap">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setScore(n)}
                      className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                        n <= score ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Strengths</Label>
                <Textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} rows={2} placeholder="Key strengths..." />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Weaknesses</Label>
                <Textarea value={weaknesses} onChange={(e) => setWeaknesses(e.target.value)} rows={2} placeholder="Areas of concern..." />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Red Flags</Label>
                <Textarea value={redFlags} onChange={(e) => setRedFlags(e.target.value)} rows={2} placeholder="Anything concerning..." />
              </div>
              <div className="space-y-2">
                <Label className="text-sm">Additional Comments</Label>
                <Textarea value={evalComments} onChange={(e) => setEvalComments(e.target.value)} rows={2} />
              </div>

              <Button onClick={handleSubmitEval} className="w-full" disabled={submitting || !score}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {submitted ? 'Update Evaluation' : 'Submit Evaluation'}
              </Button>

              {submitted && (
                <p className="text-xs text-emerald-600 flex items-center gap-1 justify-center">
                  <CheckCircle className="w-3 h-3" />Evaluation saved
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
