'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, Loader2, BookOpen } from 'lucide-react';

export default function GroundworkLogPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [insight, setInsight] = useState('');
  const [learning, setLearning] = useState('');
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setLoading(false); return; }

    const { error: insertError } = await supabase.from('groundwork_logs').insert({
      session_id: sessionId,
      candidate_id: user.id,
      key_insight: insight.trim(),
      key_learning: learning.trim(),
      question: question.trim(),
    });

    if (insertError) {
      if (insertError.code === '23505') {
        setError('You have already submitted a reflection for this session.');
      } else {
        setError(insertError.message);
      }
    } else {
      setSuccess(true);
      setTimeout(() => router.push(`/c/groundworks/${sessionId}`), 2000);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl gradient-emerald flex items-center justify-center mx-auto mb-5 shadow-glow">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Reflection Submitted!</h2>
          <p className="text-muted-foreground mt-2">Thank you for sharing. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-7 h-7 text-purple-600" />
        </div>
        <h1 className="text-xl font-bold">Post-Session Reflection</h1>
        <p className="text-sm text-muted-foreground mt-1">Share what you learned</p>
      </div>
      <Card className="shadow-card-hover border-border/60">
        <CardHeader>
          <CardTitle>Share your thoughts</CardTitle>
          <CardDescription>
            Reflect on the session — this helps us improve and helps you internalize what you learned.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="insight">1 Key Insight</Label>
              <Textarea
                id="insight"
                placeholder="What was the most interesting thing you learned?"
                value={insight}
                onChange={(e) => setInsight(e.target.value)}
                required
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="learning">1 Important Learning</Label>
              <Textarea
                id="learning"
                placeholder="What's something you'll take away from this session?"
                value={learning}
                onChange={(e) => setLearning(e.target.value)}
                required
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="question">1 Remaining Question</Label>
              <Textarea
                id="question"
                placeholder="What's still on your mind after this session?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
                rows={3}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Submit Reflection
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
