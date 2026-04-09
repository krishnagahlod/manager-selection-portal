'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star } from 'lucide-react';

interface EvaluationFormProps {
  submissionId: string;
  existingEval?: {
    creativity: number;
    practicality: number;
    effort: number;
    comments: string | null;
  };
}

function ScoreSelector({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
              n <= value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export function EvaluationForm({ submissionId, existingEval }: EvaluationFormProps) {
  const [creativity, setCreativity] = useState(existingEval?.creativity || 0);
  const [practicality, setPracticality] = useState(existingEval?.practicality || 0);
  const [effort, setEffort] = useState(existingEval?.effort || 0);
  const [comments, setComments] = useState(existingEval?.comments || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(!!existingEval);

  const handleSave = async () => {
    if (!creativity || !practicality || !effort) return;
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      submission_id: submissionId,
      evaluator_id: user.id,
      creativity,
      practicality,
      effort,
      comments: comments.trim() || null,
    };

    if (existingEval) {
      await supabase.from('assignment_evaluations')
        .update(payload)
        .eq('submission_id', submissionId)
        .eq('evaluator_id', user.id);
    } else {
      await supabase.from('assignment_evaluations').insert(payload);
    }

    setSaved(true);
    setLoading(false);
  };

  if (saved && existingEval) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Badge className="bg-emerald-100 text-emerald-700">Evaluated</Badge>
        <span className="text-muted-foreground">
          C: {existingEval.creativity} | P: {existingEval.practicality} | E: {existingEval.effort}
          {' '}({((existingEval.creativity + existingEval.practicality + existingEval.effort) / 3).toFixed(1)} avg)
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium flex items-center gap-1">
        <Star className="w-4 h-4 text-primary" />
        {existingEval ? 'Update Evaluation' : 'Evaluate'}
      </p>
      <div className="grid grid-cols-3 gap-4">
        <ScoreSelector label="Creativity" value={creativity} onChange={setCreativity} />
        <ScoreSelector label="Practicality" value={practicality} onChange={setPracticality} />
        <ScoreSelector label="Effort" value={effort} onChange={setEffort} />
      </div>
      <Textarea
        placeholder="Comments (optional)..."
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        rows={2}
        className="text-sm"
      />
      <Button onClick={handleSave} size="sm" disabled={loading || !creativity || !practicality || !effort}>
        {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : null}
        {saved ? 'Updated!' : existingEval ? 'Update' : 'Save Evaluation'}
      </Button>
    </div>
  );
}
