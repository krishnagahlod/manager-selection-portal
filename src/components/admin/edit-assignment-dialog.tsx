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
import { VERTICAL_LABELS, VERTICALS } from '@/lib/constants';

interface Props {
  assignment: {
    id: string;
    title: string;
    description: string;
    vertical: string;
    deadline: string;
  };
}

export function EditAssignmentDialog({ assignment }: Props) {
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

    await supabase.from('assignments').update({
      title: fd.get('title') as string,
      description: fd.get('description') as string,
      vertical: fd.get('vertical') as string,
      deadline: new Date(fd.get('deadline') as string).toISOString(),
    }).eq('id', assignment.id);

    setSaving(false);
    setEditOpen(false);
    router.refresh();
  };

  const handleDelete = async () => {
    setDeleting(true);
    await supabase.from('assignments').delete().eq('id', assignment.id);
    router.push('/a/assignments');
  };

  const deadlineLocal = new Date(assignment.deadline).toISOString().slice(0, 16);

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
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input name="title" defaultValue={assignment.title} required />
            </div>
            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea name="description" defaultValue={assignment.description} rows={5} required />
            </div>
            <div className="space-y-2">
              <Label>Vertical *</Label>
              <select name="vertical" defaultValue={assignment.vertical} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                {VERTICALS.map((v) => (
                  <option key={v} value={v}>{VERTICAL_LABELS[v]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Deadline *</Label>
              <Input name="deadline" type="datetime-local" defaultValue={deadlineLocal} required />
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
