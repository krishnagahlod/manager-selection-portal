'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, UserCircle, MessageSquare, Calendar, X } from 'lucide-react';
import { type IndividualGroundwork } from '@/types/database';

interface Props {
  userId: string;
  existing: IndividualGroundwork[];
}

export function IndividualGroundworkSection({ userId, existing }: Props) {
  const [entries, setEntries] = useState<IndividualGroundwork[]>(existing);
  const [showForm, setShowForm] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [takeaway, setTakeaway] = useState('');
  const [metOn, setMetOn] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberName.trim() || !takeaway.trim()) return;

    setSaving(true);
    setError('');

    const { data, error: insertError } = await supabase
      .from('individual_groundworks')
      .insert({
        candidate_id: userId,
        member_name: memberName.trim(),
        key_takeaway: takeaway.trim(),
        met_on: metOn || null,
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      setEntries([data, ...entries]);
      setMemberName('');
      setTakeaway('');
      setMetOn('');
      setShowForm(false);
    }
    setSaving(false);
  };

  return (
    <div>
      {/* Add button */}
      {!showForm && (
        <Button
          onClick={() => setShowForm(true)}
          variant="outline"
          className="gap-2 mb-4 border-dashed border-2 hover:border-primary/40 hover:bg-primary/5 transition-all"
        >
          <Plus className="w-4 h-4" />
          Log a conversation
        </Button>
      )}

      {/* Form */}
      {showForm && (
        <Card className="mb-4 border-primary/20 shadow-card-hover">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold">New Individual Groundwork</p>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Team member name *</Label>
                  <Input
                    placeholder="e.g. Rahul Sharma"
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    required
                    className="h-9 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Date (optional)</Label>
                  <Input
                    type="date"
                    value={metOn}
                    onChange={(e) => setMetOn(e.target.value)}
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Key takeaway *</Label>
                <Textarea
                  placeholder="What did you learn from this conversation? What stood out?"
                  value={takeaway}
                  onChange={(e) => setTakeaway(e.target.value)}
                  required
                  rows={3}
                  className="text-sm resize-none"
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving || !memberName.trim() || !takeaway.trim()} className="gap-1.5">
                  {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Save
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Entries list */}
      {entries.length === 0 && !showForm ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-8 text-center">
            <UserCircle className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No individual groundworks logged yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Talking to team members on your own shows initiative!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => (
            <Card key={entry.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <UserCircle className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{entry.member_name}</span>
                      {entry.met_on && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(entry.met_on).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                      <MessageSquare className="w-3 h-3 inline mr-1 -mt-0.5" />
                      {entry.key_takeaway}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
