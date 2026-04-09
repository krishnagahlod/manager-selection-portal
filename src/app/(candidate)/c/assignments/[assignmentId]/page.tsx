'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { VerticalBadge } from '@/components/shared/vertical-badge';
import { Clock, Upload, CheckCircle, Loader2, FileText } from 'lucide-react';
import { type Assignment, type Submission, type Vertical } from '@/types/database';

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = params.assignmentId as string;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: aData }, { data: sData }] = await Promise.all([
        supabase.from('assignments').select('*').eq('id', assignmentId).single(),
        supabase.from('submissions').select('*').eq('assignment_id', assignmentId).eq('candidate_id', user.id).maybeSingle(),
      ]);

      setAssignment(aData);
      if (sData) {
        setSubmission(sData);
        setText(sData.submission_text || '');
      }
      setLoading(false);
    }
    load();
  }, [assignmentId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() && !file) {
      setError('Please provide a text response or upload a file.');
      return;
    }

    setSubmitting(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError('Not authenticated'); setSubmitting(false); return; }

    let fileUrl: string | null = null;
    let fileName: string | null = null;

    if (file) {
      const filePath = `${user.id}/${assignmentId}/${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('assignment-submissions')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        setError('File upload failed: ' + uploadError.message);
        setSubmitting(false);
        return;
      }

      const { data: urlData } = supabase.storage.from('assignment-submissions').getPublicUrl(filePath);
      fileUrl = urlData.publicUrl;
      fileName = file.name;
    }

    const payload = {
      assignment_id: assignmentId,
      candidate_id: user.id,
      submission_text: text.trim() || null,
      file_url: fileUrl || submission?.file_url || null,
      file_name: fileName || submission?.file_name || null,
    };

    let result;
    if (submission) {
      result = await supabase.from('submissions').update(payload).eq('id', submission.id);
    } else {
      result = await supabase.from('submissions').insert(payload);
    }

    if (result.error) {
      setError(result.error.message);
    } else {
      setSuccess(true);
      setTimeout(() => router.push('/c/assignments'), 2000);
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!assignment) {
    return <div className="py-10 text-center text-muted-foreground">Assignment not found</div>;
  }

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-8">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <p className="text-lg font-semibold">{submission ? 'Updated' : 'Submitted'}!</p>
            <p className="text-sm text-muted-foreground">Redirecting...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const deadline = new Date(assignment.deadline);
  const isOverdue = deadline < new Date();

  return (
    <div className="max-w-2xl">
      <PageHeader title={assignment.title} />

      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap">{assignment.description}</p>
          </div>
          <div className="flex items-center gap-3 mt-4">
            <VerticalBadge vertical={assignment.vertical as Vertical} />
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              Due: {deadline.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            {isOverdue && <Badge className="bg-red-100 text-red-700">Overdue</Badge>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {submission ? 'Update Your Submission' : 'Submit Your Work'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="text">Text Response</Label>
              <Textarea
                id="text"
                placeholder="Write your response here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">Upload File (optional)</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf,.docx,.png,.jpg,.jpeg,.zip"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              {submission?.file_name && !file && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Current file: {submission.file_name}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Accepted: PDF, DOCX, PNG, JPG, ZIP (max 10MB)
              </p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {submission ? 'Updating...' : 'Submitting...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {submission ? 'Update Submission' : 'Submit'}
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
