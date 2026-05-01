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
import { Loader2, User, FileText, BookOpen, CheckCircle, Mic, ClipboardList, MessageCircle, Zap, Users } from 'lucide-react';
import { type Vertical } from '@/types/database';

interface InterviewSections {
  intro_pitch: { pitch: string; motivation: string; score: number };
  assignment: { q1: string; q2: string; initiative: string; score: number };
  situations: { notes: string; score: number };
  rapid_fire: { notes: string; score: number };
  peer_review: { notes: string };
}

const EMPTY_SECTIONS: InterviewSections = {
  intro_pitch: { pitch: '', motivation: '', score: 0 },
  assignment: { q1: '', q2: '', initiative: '', score: 0 },
  situations: { notes: '', score: 0 },
  rapid_fire: { notes: '', score: 0 },
  peer_review: { notes: '' },
};

function SectionScore({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wider mr-1">Score</span>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n === value ? 0 : n)}
          className={`w-7 h-7 rounded-md text-xs font-semibold transition-colors ${
            n <= value
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-accent'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export default function InterviewPanelPage() {
  const params = useParams();
  const interviewId = params.interviewId as string;

  const [interview, setInterview] = useState<any>(null);
  const [candidate, setCandidate] = useState<any>(null);
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [allEvaluations, setAllEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Evaluation state
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [redFlags, setRedFlags] = useState('');
  const [score, setScore] = useState(0);
  const [evalComments, setEvalComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('scheduled');
  const [statusSaving, setStatusSaving] = useState(false);
  const [sections, setSections] = useState<InterviewSections>(EMPTY_SECTIONS);
  const [saveError, setSaveError] = useState('');

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: intData } = await supabase
        .from('interviews')
        .select('*, profiles!interviews_candidate_id_fkey(full_name, email, department, year_of_study)')
        .eq('id', interviewId)
        .single();

      if (!intData) { setLoading(false); return; }
      setInterview(intData);
      setCandidate(intData.profiles);
      setCurrentStatus(intData.status);

      const candidateId = intData.candidate_id;

      const [
        { data: verts },
        { data: subs },
        { data: logData },
        { data: existingEval },
        { data: allEvalsData },
      ] = await Promise.all([
        supabase.from('candidate_verticals').select('vertical').eq('candidate_id', candidateId),
        supabase.from('submissions').select('*, assignments(title, vertical)').eq('candidate_id', candidateId),
        supabase.from('groundwork_logs').select('*, groundwork_sessions(title)').eq('candidate_id', candidateId),
        supabase.from('interview_evaluations').select('*').eq('interview_id', interviewId).eq('evaluator_id', user.id).maybeSingle(),
        supabase.from('interview_evaluations').select('*, profiles(full_name)').eq('interview_id', interviewId),
      ]);

      setVerticals((verts || []).map((v) => v.vertical as Vertical));
      setSubmissions(subs || []);
      setLogs(logData || []);
      setAllEvaluations(allEvalsData || []);

      if (existingEval) {
        setStrengths(existingEval.strengths || '');
        setWeaknesses(existingEval.weaknesses || '');
        setRedFlags(existingEval.red_flags || '');
        setScore(existingEval.final_score);
        setEvalComments(existingEval.comments || '');
        setSubmitted(true);
        // Merge stored sections with defaults to handle partial/missing data
        if (existingEval.sections) {
          setSections({
            intro_pitch: { ...EMPTY_SECTIONS.intro_pitch, ...(existingEval.sections.intro_pitch || {}) },
            assignment: { ...EMPTY_SECTIONS.assignment, ...(existingEval.sections.assignment || {}) },
            situations: { ...EMPTY_SECTIONS.situations, ...(existingEval.sections.situations || {}) },
            rapid_fire: { ...EMPTY_SECTIONS.rapid_fire, ...(existingEval.sections.rapid_fire || {}) },
            peer_review: { ...EMPTY_SECTIONS.peer_review, ...(existingEval.sections.peer_review || {}) },
          });
        }
      }

      setLoading(false);
    }
    load();
  }, [interviewId]);

  const handleSubmitEval = async () => {
    if (!score) return;
    setSaveError('');
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setSaveError('Not signed in.');
      setSubmitting(false);
      return;
    }

    const payload = {
      interview_id: interviewId,
      evaluator_id: user.id,
      strengths: strengths.trim() || null,
      weaknesses: weaknesses.trim() || null,
      red_flags: redFlags.trim() || null,
      final_score: score,
      comments: evalComments.trim() || null,
      sections,
    };

    const result = submitted
      ? await supabase.from('interview_evaluations').update(payload).eq('interview_id', interviewId).eq('evaluator_id', user.id)
      : await supabase.from('interview_evaluations').insert(payload);

    if (result.error) {
      setSaveError(`Could not save: ${result.error.message}`);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  const handleStatusChange = async (newStatus: string) => {
    setStatusSaving(true);
    await supabase.from('interviews').update({ status: newStatus }).eq('id', interviewId);
    setCurrentStatus(newStatus);
    setStatusSaving(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!interview || !candidate) return <p className="text-center py-10 text-muted-foreground">Interview not found</p>;

  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled', color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { value: 'completed', label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200' },
  ];

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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Candidate Info — narrower */}
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

        {/* Right: Evaluations & Form — wider */}
        <div className="lg:col-span-3 space-y-4">
          {/* All Evaluators' Scores */}
          {allEvaluations.length > 0 && (
            <Card className="border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">All Evaluator Scores ({allEvaluations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {allEvaluations.map((ev: any) => (
                    <div key={ev.id} className="flex items-center justify-between p-2 rounded-lg border text-sm">
                      <span className="font-medium text-xs">{ev.profiles?.full_name || 'Evaluator'}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-primary">{ev.final_score}</span>
                        <span className="text-xs text-muted-foreground">/10</span>
                      </div>
                    </div>
                  ))}
                  {allEvaluations.length > 1 && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm font-medium">
                      <span className="text-xs">Average</span>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                          {(allEvaluations.reduce((s: number, e: any) => s + e.final_score, 0) / allEvaluations.length).toFixed(1)}
                        </span>
                        <span className="text-xs text-muted-foreground">/10</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 1: Introduction & Pitch */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Mic className="w-4 h-4 text-blue-600" />
                  </div>
                  1. Introduction & Pitch
                </CardTitle>
                <SectionScore
                  value={sections.intro_pitch.score}
                  onChange={(v) => setSections({ ...sections, intro_pitch: { ...sections.intro_pitch, score: v } })}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Pitch — why should we select them as a manager / what do they bring?</Label>
                <Textarea
                  value={sections.intro_pitch.pitch}
                  onChange={(e) => setSections({ ...sections, intro_pitch: { ...sections.intro_pitch, pitch: e.target.value } })}
                  rows={3}
                  placeholder="Notes on their pitch..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Motivation — why do they want to join the cell?</Label>
                <Textarea
                  value={sections.intro_pitch.motivation}
                  onChange={(e) => setSections({ ...sections, intro_pitch: { ...sections.intro_pitch, motivation: e.target.value } })}
                  rows={3}
                  placeholder="Notes on their motivation..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Assignment Discussion */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-violet-600" />
                  </div>
                  2. Assignment Discussion
                </CardTitle>
                <SectionScore
                  value={sections.assignment.score}
                  onChange={(v) => setSections({ ...sections, assignment: { ...sections.assignment, score: v } })}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Question 1 (one of the 2 attempted)</Label>
                <Textarea
                  value={sections.assignment.q1}
                  onChange={(e) => setSections({ ...sections, assignment: { ...sections.assignment, q1: e.target.value } })}
                  rows={3}
                  placeholder="Notes on their answer / discussion..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Question 2 (the other attempted)</Label>
                <Textarea
                  value={sections.assignment.q2}
                  onChange={(e) => setSections({ ...sections, assignment: { ...sections.assignment, q2: e.target.value } })}
                  rows={3}
                  placeholder="Notes on their answer / discussion..."
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Proposed Initiative (their own idea)</Label>
                <Textarea
                  value={sections.assignment.initiative}
                  onChange={(e) => setSections({ ...sections, assignment: { ...sections.assignment, initiative: e.target.value } })}
                  rows={3}
                  placeholder="Notes on their proposed initiative..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Situation-Based Questions */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-amber-600" />
                  </div>
                  3. Situation-Based Questions
                </CardTitle>
                <SectionScore
                  value={sections.situations.score}
                  onChange={(v) => setSections({ ...sections, situations: { ...sections.situations, score: v } })}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={sections.situations.notes}
                onChange={(e) => setSections({ ...sections, situations: { ...sections.situations, notes: e.target.value } })}
                rows={4}
                placeholder="Situations asked + their responses + assessment..."
              />
            </CardContent>
          </Card>

          {/* Section 4: Rapid Fire */}
          <Card className="border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-red-600" />
                  </div>
                  4. Rapid Fire — Sustainability Knowledge
                </CardTitle>
                <SectionScore
                  value={sections.rapid_fire.score}
                  onChange={(v) => setSections({ ...sections, rapid_fire: { ...sections.rapid_fire, score: v } })}
                />
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={sections.rapid_fire.notes}
                onChange={(e) => setSections({ ...sections, rapid_fire: { ...sections.rapid_fire, notes: e.target.value } })}
                rows={3}
                placeholder="Terms tested + how well they answered..."
              />
            </CardContent>
          </Card>

          {/* Section 5: Peer Review (non-evaluative) */}
          <Card className="border-border/60 bg-muted/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                5. Peer Review
                <Badge variant="outline" className="text-[10px] ml-1">Non-evaluative</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={sections.peer_review.notes}
                onChange={(e) => setSections({ ...sections, peer_review: { ...sections.peer_review, notes: e.target.value } })}
                rows={4}
                placeholder="What they shared about fellow candidates (general observations, not for evaluation but useful for selection)..."
              />
            </CardContent>
          </Card>

          {/* Final Assessment */}
          <Card className="border-primary/30 bg-primary/[0.02]">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-primary" />
                </div>
                Final Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Overall Score (1-10) *</Label>
                <div className="flex gap-1 flex-wrap">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setScore(n)}
                      className={`w-9 h-9 rounded-md text-sm font-bold transition-colors ${
                        n <= score ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Strengths</Label>
                  <Textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} rows={2} placeholder="Key strengths..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Weaknesses</Label>
                  <Textarea value={weaknesses} onChange={(e) => setWeaknesses(e.target.value)} rows={2} placeholder="Areas of concern..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Red Flags</Label>
                  <Textarea value={redFlags} onChange={(e) => setRedFlags(e.target.value)} rows={2} placeholder="Anything concerning..." />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Additional Comments</Label>
                  <Textarea value={evalComments} onChange={(e) => setEvalComments(e.target.value)} rows={2} />
                </div>
              </div>

              {saveError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
                  <p className="text-sm text-destructive">{saveError}</p>
                </div>
              )}

              <Button onClick={handleSubmitEval} className="w-full" disabled={submitting || !score} size="lg">
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {submitted ? 'Update Evaluation' : 'Submit Evaluation'}
              </Button>

              {submitted && !saveError && (
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
