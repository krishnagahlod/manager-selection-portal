'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ThumbsUp, CheckCircle, Circle, User, Loader2, MessageSquare, Eye } from 'lucide-react';

interface ModQuestion {
  id: string;
  question_text: string;
  is_anonymous: boolean;
  is_answered: boolean;
  created_at: string;
  author_name: string;
  author_email: string;
  upvote_count: number;
}

export default function QAModerationPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [questions, setQuestions] = useState<ModQuestion[]>([]);
  const [sessionTitle, setSessionTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const supabase = createClient();

  const fetchData = async () => {
    const [{ data: session }, { data: rawQuestions }] = await Promise.all([
      supabase.from('groundwork_sessions').select('title').eq('id', sessionId).single(),
      supabase.from('session_questions')
        .select('id, question_text, is_anonymous, is_answered, created_at, asked_by, profiles(full_name, email)')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false }),
    ]);

    setSessionTitle(session?.title || '');

    if (!rawQuestions) { setLoading(false); return; }

    const questionIds = rawQuestions.map((q) => q.id);
    const { data: upvotes } = await supabase
      .from('question_upvotes')
      .select('question_id')
      .in('question_id', questionIds);

    const upvoteMap = new Map<string, number>();
    (upvotes || []).forEach((u) => {
      upvoteMap.set(u.question_id, (upvoteMap.get(u.question_id) || 0) + 1);
    });

    const enriched: ModQuestion[] = rawQuestions.map((q: any) => ({
      id: q.id,
      question_text: q.question_text,
      is_anonymous: q.is_anonymous,
      is_answered: q.is_answered,
      created_at: q.created_at,
      author_name: q.profiles?.full_name || 'Unknown',
      author_email: q.profiles?.email || '',
      upvote_count: upvoteMap.get(q.id) || 0,
    }));

    enriched.sort((a, b) => b.upvote_count - a.upvote_count);
    setQuestions(enriched);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [sessionId]);

  const toggleAnswered = async (questionId: string, currentlyAnswered: boolean) => {
    setTogglingId(questionId);
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('session_questions').update({
      is_answered: !currentlyAnswered,
      answered_by: !currentlyAnswered ? user?.id : null,
      answered_at: !currentlyAnswered ? new Date().toISOString() : null,
    }).eq('id', questionId);

    setQuestions((prev) =>
      prev.map((q) => q.id === questionId ? { ...q, is_answered: !currentlyAnswered } : q)
    );
    setTogglingId(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Q&A Moderation"
        description={sessionTitle ? `Session: ${sessionTitle}` : undefined}
      />

      {questions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No questions asked for this session yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{questions.length} question{questions.length !== 1 ? 's' : ''} &middot; Sorted by upvotes</p>
          {questions.map((q) => (
            <Card key={q.id} className={`border-border/60 transition-all ${q.is_answered ? 'bg-emerald-50/30 border-emerald-200/50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Upvote count */}
                  <div className="flex flex-col items-center gap-0.5 pt-0.5 shrink-0 min-w-[32px]">
                    <ThumbsUp className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-semibold">{q.upvote_count}</span>
                  </div>

                  {/* Question content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed">{q.question_text}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        {q.is_anonymous ? <Eye className="w-3 h-3" /> : <User className="w-3 h-3" />}
                        {q.author_name}
                        {q.is_anonymous && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">Anonymous</Badge>}
                      </span>
                      <span>&middot;</span>
                      <span>{q.author_email}</span>
                      <span>&middot;</span>
                      <span>{new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>

                  {/* Toggle answered */}
                  <Button
                    variant={q.is_answered ? 'default' : 'outline'}
                    size="sm"
                    className={`shrink-0 gap-1.5 text-xs ${q.is_answered ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                    onClick={() => toggleAnswered(q.id, q.is_answered)}
                    disabled={togglingId === q.id}
                  >
                    {togglingId === q.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : q.is_answered ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <Circle className="w-3 h-3" />
                    )}
                    {q.is_answered ? 'Answered' : 'Mark Answered'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
