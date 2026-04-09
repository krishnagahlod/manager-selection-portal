'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, CalendarDays, Clock, MapPin, Loader2, Pencil } from 'lucide-react';
import Link from 'next/link';
import { WhatsAppShareDialog } from '@/components/admin/whatsapp-share-dialog';
import { formatInterviewMessage } from '@/lib/notifications';

interface InterviewRow {
  id: string;
  candidate_id: string;
  scheduled_at: string | null;
  duration_min: number;
  location: string | null;
  status: string;
  candidate_name: string;
  candidate_email: string;
}

export default function AdminInterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [candidates, setCandidates] = useState<{ id: string; full_name: string; email: string; phone: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<InterviewRow | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [sharePhone, setSharePhone] = useState<string | null>(null);
  const [shareCandidateName, setShareCandidateName] = useState('');

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const [{ data: intData }, { data: candData }] = await Promise.all([
        supabase.from('interviews').select('*, profiles(full_name, email)').order('scheduled_at', { ascending: true }),
        supabase.from('profiles').select('id, full_name, email, phone').eq('role', 'candidate'),
      ]);

      setInterviews((intData || []).map((i: any) => ({
        ...i,
        candidate_name: i.profiles?.full_name || '',
        candidate_email: i.profiles?.email || '',
      })));
      setCandidates(candData || []);
      setLoading(false);
    }
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCreating(true);

    const formData = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const scheduledAt = formData.get('scheduled_at') as string;
    const candidateId = formData.get('candidate_id') as string;
    const duration = parseInt(formData.get('duration') as string) || 60;
    const location = (formData.get('location') as string) || null;

    await supabase.from('interviews').insert({
      candidate_id: candidateId,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      duration_min: duration,
      location,
      status: scheduledAt ? 'scheduled' : 'not_scheduled',
      created_by: user.id,
    });

    setDialogOpen(false);
    setCreating(false);

    // If scheduled, show WhatsApp share dialog for this specific candidate
    if (scheduledAt) {
      const candidate = candidates.find((c) => c.id === candidateId);
      if (candidate) {
        const message = formatInterviewMessage({
          candidateName: candidate.full_name,
          scheduledAt: new Date(scheduledAt).toISOString(),
          duration,
          location,
        });
        setShareMessage(message);
        setSharePhone(candidate.phone);
        setShareCandidateName(candidate.full_name);
        setShareOpen(true);
      } else {
        window.location.reload();
      }
    } else {
      window.location.reload();
    }
  };

  const handleEditSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingInterview) return;
    setEditSaving(true);

    const formData = new FormData(e.currentTarget);
    const scheduledAt = formData.get('edit_scheduled_at') as string;

    await supabase.from('interviews').update({
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
      duration_min: parseInt(formData.get('edit_duration') as string) || 60,
      location: (formData.get('edit_location') as string) || null,
    }).eq('id', editingInterview.id);

    setEditDialogOpen(false);
    setEditingInterview(null);
    setEditSaving(false);
    window.location.reload();
  };

  const statusColors: Record<string, string> = {
    not_scheduled: 'bg-gray-100 text-gray-700',
    scheduled: 'bg-blue-100 text-blue-700',
    in_progress: 'bg-amber-100 text-amber-700',
    completed: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Interviews"
        description="Schedule and manage candidate interviews"
        actions={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />Schedule Interview
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule Interview</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Candidate *</Label>
                  <select name="candidate_id" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                    <option value="">Select candidate</option>
                    {candidates.map((c) => (
                      <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Date & Time</Label>
                  <Input name="scheduled_at" type="datetime-local" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Duration (min)</Label>
                    <Input name="duration" type="number" defaultValue="60" />
                  </div>
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Input name="location" placeholder="e.g. SOM 101" />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={creating}>
                  {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Schedule
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {interviews.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <CalendarDays className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No interviews scheduled yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => (
            <Card key={interview.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center justify-between gap-2 p-4">
                <Link href={`/a/interviews/${interview.id}`} className="flex-1 min-w-0 group">
                  <p className="font-medium group-hover:text-primary transition-colors truncate">{interview.candidate_name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                    {interview.scheduled_at && (
                      <>
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3" />
                          {new Date(interview.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(interview.scheduled_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </>
                    )}
                    {interview.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {interview.location}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge className={statusColors[interview.status] || ''}>
                    {interview.status.replace('_', ' ')}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.preventDefault();
                      setEditingInterview(interview);
                      setEditDialogOpen(true);
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Interview Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Interview — {editingInterview?.candidate_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Date & Time</Label>
              <Input
                name="edit_scheduled_at"
                type="datetime-local"
                defaultValue={editingInterview?.scheduled_at ? new Date(editingInterview.scheduled_at).toISOString().slice(0, 16) : ''}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration (min)</Label>
                <Input name="edit_duration" type="number" defaultValue={editingInterview?.duration_min || 60} />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input name="edit_location" placeholder="e.g. SOM 101" defaultValue={editingInterview?.location || ''} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={editSaving}>
              {editSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <WhatsAppShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        message={shareMessage}
        phone={sharePhone}
        title={`Interview Scheduled — Notify ${shareCandidateName.split(' ')[0]}`}
        description="Send the interview details directly to the candidate."
        onDone={() => window.location.reload()}
      />
    </div>
  );
}
