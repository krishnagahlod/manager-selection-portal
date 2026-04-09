'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsUp, CheckCircle, Loader2, Send } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  is_answered: boolean;
  created_at: string;
  upvote_count: number;
  user_has_upvoted: boolean;
}

export function QuestionSection({ sessionId, userId }: { sessionId: string; userId: string }) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchQuestions = async () => {
    const { data: rawQuestions } = await supabase
      .from('session_questions')
      .select('id, question_text, is_answered, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (!rawQuestions) { setLoading(false); return; }

    const { data: upvotes } = await supabase
      .from('question_upvotes')
      .select('question_id, user_id')
      .in('question_id', rawQuestions.map((q) => q.id));

    const upvoteMap = new Map<string, { count: number; userVoted: boolean }>();
    (upvotes || []).forEach((u) => {
      const existing = upvoteMap.get(u.question_id) || { count: 0, userVoted: false };
      existing.count++;
      if (u.user_id === userId) existing.userVoted = true;
      upvoteMap.set(u.question_id, existing);
    });

    const enriched: Question[] = rawQuestions.map((q) => ({
      ...q,
      upvote_count: upvoteMap.get(q.id)?.count || 0,
      user_has_upvoted: upvoteMap.get(q.id)?.userVoted || false,
    }));

    // Sort by upvotes desc
    enriched.sort((a, b) => b.upvote_count - a.upvote_count);
    setQuestions(enriched);
    setLoading(false);
  };

  useEffect(() => {
    fetchQuestions();
  }, [sessionId]);

  const handleSubmitQuestion = async () => {
    if (!newQuestion.trim()) return;
    setSubmitting(true);

    await supabase.from('session_questions').insert({
      session_id: sessionId,
      asked_by: userId,
      question_text: newQuestion.trim(),
      is_anonymous: true,
    });

    setNewQuestion('');
    setSubmitting(false);
    fetchQuestions();
  };

  const handleUpvote = async (questionId: string, hasUpvoted: boolean) => {
    if (hasUpvoted) {
      await supabase.from('question_upvotes').delete().eq('question_id', questionId).eq('user_id', userId);
    } else {
      await supabase.from('question_upvotes').insert({ question_id: questionId, user_id: userId });
    }
    fetchQuestions();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-primary" />
          Questions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Submit question */}
        <div className="flex gap-2 mb-4">
          <Textarea
            placeholder="Ask a question (anonymous)..."
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            rows={2}
            className="resize-none"
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

        {/* Questions list */}
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : questions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No questions yet. Be the first to ask!
          </p>
        ) : (
          <div className="space-y-2">
            {questions.map((q) => (
              <div
                key={q.id}
                className="flex items-start gap-3 p-3 rounded-lg border"
              >
                <button
                  onClick={() => handleUpvote(q.id, q.user_has_upvoted)}
                  className={`flex flex-col items-center gap-0.5 pt-0.5 shrink-0 ${
                    q.user_has_upvoted ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-xs font-medium">{q.upvote_count}</span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{q.question_text}</p>
                </div>
                {q.is_answered && (
                  <Badge className="bg-emerald-100 text-emerald-700 text-xs shrink-0">
                    <CheckCircle className="w-3 h-3 mr-1" />Answered
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
