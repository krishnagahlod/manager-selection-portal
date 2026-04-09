'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { VERTICAL_LABELS, VERTICALS } from '@/lib/constants';
import { type Vertical } from '@/types/database';
import { WhatsAppShareDialog } from '@/components/admin/whatsapp-share-dialog';
import { formatAssignmentMessage } from '@/lib/notifications';

export default function NewAssignmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const assignmentData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      vertical: formData.get('vertical') as string,
      deadline: new Date(formData.get('deadline') as string).toISOString(),
      created_by: user.id,
    };

    const { error: insertError } = await supabase.from('assignments').insert(assignmentData);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      const message = formatAssignmentMessage({
        title: assignmentData.title,
        description: assignmentData.description,
        vertical: assignmentData.vertical as Vertical,
        deadline: assignmentData.deadline,
      });
      setShareMessage(message);
      setShareOpen(true);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <PageHeader title="New Assignment" />
      <Card>
        <CardHeader>
          <CardTitle>Create Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" placeholder="e.g. Campus Sustainability Audit" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" name="description" placeholder="Describe the assignment in detail..." rows={5} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vertical">Vertical *</Label>
              <select id="vertical" name="vertical" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                {VERTICALS.map((v) => (
                  <option key={v} value={v}>{VERTICAL_LABELS[v]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline *</Label>
              <Input id="deadline" name="deadline" type="datetime-local" required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Assignment
            </Button>
          </form>
        </CardContent>
      </Card>

      <WhatsAppShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        message={shareMessage}
        title="Assignment Created — Notify Candidates"
        description="Now share it on your WhatsApp candidates group."
        onDone={() => router.push('/a/assignments')}
      />
    </div>
  );
}
