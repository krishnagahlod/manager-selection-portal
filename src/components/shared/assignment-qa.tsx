'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Loader2, CheckCircle, Reply, Pencil, X } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  answer_text: string | null;
  created_at: string;
  answered_at: string | null;
  asker_name: string;
  answerer_name: string | null;
}

interface Props {
  assignmentId: string;
  isAdmin: boolean;
}

export function AssignmentQA({ assignmentId, isAdmin }: Props) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);

  const supabase = createClient();

  const fetchQuestions = async () => {
    const { data } = await supabase
      .from('assignment_questions')
      .select('id, question_text, answer_text, created_at, answered_at, asked_by, answered_by, asker:profiles!asked_by(full_name), answerer:profiles!answered_by(full_name)')
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: false });

    if (data) {
      setQuestions(
        data.map((q: any) => ({
          id: q.id,
          question_text: q.question_text,
          answer_text: q.answer_text,
          created_at: q.created_at,
          answered_at: q.answered_at,
          // Admins see real names, candidates see "Anonymous"
          asker_name: isAdmin ? (q.asker?.full_name || 'Candidate') : 'Anonymous',
          answerer_name: q.answerer?.full_name || null,
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
  }, [assignmentId]);

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim()) return;
    setSubmitting(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('assignment_questions').insert({
      assignment_id: assignmentId,
      asked_by: user.id,
      question_text: newQuestion.trim(),
    });

    setNewQuestion('');
    setSubmitting(false);
    fetchQuestions();
  };

  const handleSubmitReply = async (questionId: string) => {
    if (!replyText.trim()) return;
    setSavingReply(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('assignment_questions')
      .update({
        answer_text: replyText.trim(),
        answered_by: user.id,
        answered_at: new Date().toISOString(),
      })
      .eq('id', questionId);

    setReplyingTo(null);
    setReplyText('');
    setSavingReply(false);
    fetchQuestions();
  };

  const startReply = (q: Question) => {
    setReplyingTo(q.id);
    setReplyText(q.answer_text || '');
  };

  const unansweredCount = questions.filter((q) => !q.answer_text).length;

  return (
    <Card className="shadow-card border-border/60">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary" />
          </div>
          Discussion & Doubts
          {questions.length > 0 && (
            <Badge variant="outline" className="text-xs ml-1">
              {questions.length}
            </Badge>
          )}
          {isAdmin && unansweredCount > 0 && (
            <Badge className="bg-amber-100 text-amber-700 text-xs border-amber-200">
              {unansweredCount} unanswered
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Ask question form (candidates only, but admins can also ask if they want) */}
        {!isAdmin && (
          <div className="mb-5 pb-5 border-b">
            <p className="text-xs font-medium text-muted-foreground mb-2">Have a doubt? Ask here.</p>
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your question about this assignment..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                rows={2}
                className="resize-none text-sm"
              />
              <Button
                onClick={handleSubmitQuestion}
                disabled={submitting || !newQuestion.trim()}
                size="icon"
                className="shrink-0 self-end"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Your question will be posted anonymously and visible to all candidates in your vertical.
            </p>
          </div>
        )}

        {/* Questions list */}
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : questions.length === 0 ? (
          <div className="py-6 text-center">
            <MessageSquare className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No questions asked yet.</p>
            {!isAdmin && (
              <p className="text-xs text-muted-foreground mt-1">Be the first to ask a doubt!</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => (
              <div key={q.id} className="rounded-xl border border-border/60 overflow-hidden">
                {/* Question */}
                <div className="p-3.5 bg-muted/30">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-foreground">{q.asker_name}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(q.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{q.question_text}</p>
                </div>

                {/* Answer */}
                {q.answer_text && replyingTo !== q.id && (
                  <div className="p-3.5 border-t bg-emerald-50/40">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-xs font-semibold text-emerald-700">
                          {q.answerer_name || 'Admin'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {q.answered_at && (
                          <span className="text-[11px] text-muted-foreground">
                            {new Date(q.answered_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => startReply(q)}
                            className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" />Edit
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{q.answer_text}</p>
                  </div>
                )}

                {/* Admin reply form */}
                {isAdmin && (replyingTo === q.id || !q.answer_text) && (
                  <div className="p-3.5 border-t bg-background">
                    {replyingTo === q.id ? (
                      <div>
                        <Textarea
                          placeholder="Write your answer..."
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          rows={3}
                          className="resize-none text-sm mb-2"
                          autoFocus
                        />
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => { setReplyingTo(null); setReplyText(''); }}
                          >
                            <X className="w-3.5 h-3.5 mr-1" />Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleSubmitReply(q.id)}
                            disabled={savingReply || !replyText.trim()}
                            className="gap-1.5"
                          >
                            {savingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                            {q.answer_text ? 'Update' : 'Reply'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startReply(q)}
                        className="gap-1.5 w-full"
                      >
                        <Reply className="w-3.5 h-3.5" />Reply
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
