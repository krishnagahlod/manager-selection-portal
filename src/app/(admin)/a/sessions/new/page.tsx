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
import { WhatsAppShareDialog } from '@/components/admin/whatsapp-share-dialog';
import { formatSessionMessage } from '@/lib/notifications';

export default function NewSessionPage() {
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

    const sessionData = {
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || null,
      session_date: formData.get('date') as string,
      start_time: formData.get('start_time') as string,
      end_time: formData.get('end_time') as string,
      location: (formData.get('location') as string) || null,
      is_mandatory: formData.get('mandatory') === 'on',
      recording_url: (formData.get('recording_url') as string) || null,
      created_by: user.id,
    };

    const { error: insertError } = await supabase.from('groundwork_sessions').insert(sessionData);

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
    } else {
      // Build WhatsApp message and show share dialog
      const message = formatSessionMessage({
        title: sessionData.title,
        description: sessionData.description,
        date: sessionData.session_date,
        startTime: sessionData.start_time,
        endTime: sessionData.end_time,
        location: sessionData.location,
        isMandatory: sessionData.is_mandatory,
      });
      setShareMessage(message);
      setShareOpen(true);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <PageHeader title="New Session" />
      <Card>
        <CardHeader>
          <CardTitle>Create Groundwork Session</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" name="title" placeholder="e.g. Groundwork Session 1" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="What will this session cover?" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date *</Label>
                <Input id="date" name="date" type="date" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input id="location" name="location" placeholder="e.g. LC 101" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time *</Label>
                <Input id="start_time" name="start_time" type="time" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time *</Label>
                <Input id="end_time" name="end_time" type="time" required />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="mandatory" name="mandatory" defaultChecked className="rounded" />
              <Label htmlFor="mandatory" className="font-normal">Mandatory session</Label>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recording_url">Recording Link (optional)</Label>
              <Input id="recording_url" name="recording_url" type="url" placeholder="https://..." />
              <p className="text-xs text-muted-foreground">Add later via Edit if recording isn't ready yet.</p>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Create Session
            </Button>
          </form>
        </CardContent>
      </Card>

      <WhatsAppShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        message={shareMessage}
        title="Session Created — Notify Candidates"
        description="The session is created. Now share it on your WhatsApp candidates group."
        onDone={() => router.push('/a/sessions')}
      />
    </div>
  );
}
