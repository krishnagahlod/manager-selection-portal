'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Pencil, Trash2 } from 'lucide-react';

interface Props {
  session: {
    id: string;
    title: string;
    description: string | null;
    session_date: string;
    start_time: string;
    end_time: string;
    location: string | null;
    is_mandatory: boolean;
    recording_url: string | null;
  };
}

export function EditSessionDialog({ session }: Props) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const supabase = createClient();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);

    await supabase.from('groundwork_sessions').update({
      title: fd.get('title') as string,
      description: (fd.get('description') as string) || null,
      session_date: fd.get('date') as string,
      start_time: fd.get('start_time') as string,
      end_time: fd.get('end_time') as string,
      location: (fd.get('location') as string) || null,
      is_mandatory: fd.get('mandatory') === 'on',
      recording_url: (fd.get('recording_url') as string) || null,
    }).eq('id', session.id);

    setSaving(false);
    setEditOpen(false);
    router.refresh();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await supabase.from('groundwork_sessions').delete().eq('id', session.id);
    router.push('/a/sessions');
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}>
        <Pencil className="w-3.5 h-3.5" />Edit
      </Button>

      {!deleteConfirm ? (
        <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirm(true)}>
          <Trash2 className="w-3.5 h-3.5" />Delete
        </Button>
      ) : (
        <div className="flex gap-1">
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Delete'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(false)}>Cancel</Button>
        </div>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Session</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input name="title" defaultValue={session.title} required />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea name="description" defaultValue={session.description || ''} rows={3} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input name="date" type="date" defaultValue={session.session_date} required />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input name="location" defaultValue={session.location || ''} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Start Time *</Label>
                <Input name="start_time" type="time" defaultValue={session.start_time?.slice(0, 5)} required />
              </div>
              <div className="space-y-2">
                <Label>End Time *</Label>
                <Input name="end_time" type="time" defaultValue={session.end_time?.slice(0, 5)} required />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="edit_mandatory" name="mandatory" defaultChecked={session.is_mandatory} className="rounded" />
              <Label htmlFor="edit_mandatory" className="font-normal">Mandatory session</Label>
            </div>
            <div className="space-y-2">
              <Label>Recording Link</Label>
              <Input name="recording_url" type="url" defaultValue={session.recording_url || ''} placeholder="https://..." />
            </div>
            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Changes
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
