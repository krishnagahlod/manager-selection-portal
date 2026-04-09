'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, UserPlus, Upload, Mail, Users, CheckCircle } from 'lucide-react';
import { VERTICAL_LABELS, VERTICALS } from '@/lib/constants';
import { type Vertical, type UserRole } from '@/types/database';

export default function SettingsPage() {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('candidate');
  const [selectedVerticals, setSelectedVerticals] = useState<Vertical[]>([]);
  const [formMotivation, setFormMotivation] = useState('');
  const [formSkills, setFormSkills] = useState('');
  const [formExperience, setFormExperience] = useState('');
  const [formWhySustainability, setFormWhySustainability] = useState('');
  const [formAdditional, setFormAdditional] = useState('');
  const [rawJsonMode, setRawJsonMode] = useState(false);
  const [rawJson, setRawJson] = useState('');
  const [inviting, setInviting] = useState(false);
  const [inviteResult, setInviteResult] = useState<{ success: boolean; message: string } | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const [{ data: invData }, { data: adminData }] = await Promise.all([
        supabase.from('invitations').select('*').order('created_at', { ascending: false }).limit(50),
        supabase.from('profiles').select('id, full_name, email, role').in('role', ['super_admin', 'evaluator']),
      ]);
      setInvitations(invData || []);
      setAdmins(adminData || []);
    }
    load();
  }, []);

  const handleInvite = async () => {
    if (!inviteEmail || !invitePassword) return;
    if (invitePassword.length < 6) {
      setInviteResult({ success: false, message: 'Password must be at least 6 characters' });
      return;
    }
    setInviting(true);
    setInviteResult(null);

    // Build form_responses
    let form_responses: Record<string, string> | null = null;
    if (inviteRole === 'candidate') {
      if (rawJsonMode && rawJson.trim()) {
        try { form_responses = JSON.parse(rawJson); } catch { setInviteResult({ success: false, message: 'Invalid JSON' }); setInviting(false); return; }
      } else {
        const fields: Record<string, string> = {};
        if (formMotivation.trim()) fields.motivation = formMotivation.trim();
        if (formSkills.trim()) fields.skills = formSkills.trim();
        if (formExperience.trim()) fields.previous_experience = formExperience.trim();
        if (formWhySustainability.trim()) fields.why_sustainability = formWhySustainability.trim();
        if (formAdditional.trim()) fields.additional_info = formAdditional.trim();
        if (Object.keys(fields).length > 0) form_responses = fields;
      }
    }

    const res = await fetch('/api/admin/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inviteEmail,
        full_name: inviteName,
        password: invitePassword,
        role: inviteRole,
        verticals: selectedVerticals,
        form_responses,
      }),
    });
    const data = await res.json();

    setInviteResult({ success: !data.error, message: data.error || `Account created! They can sign in with: ${inviteEmail} / ${invitePassword}` });
    if (!data.error) {
      setInviteEmail('');
      setInviteName('');
      setInvitePassword('');
      setSelectedVerticals([]);
      setFormMotivation(''); setFormSkills(''); setFormExperience('');
      setFormWhySustainability(''); setFormAdditional(''); setRawJson('');
      // Refresh invitations list
      const { data: updated } = await supabase.from('invitations').select('*').order('created_at', { ascending: false }).limit(50);
      setInvitations(updated || []);
    }
    setInviting(false);
  };

  const handleCSVUpload = async () => {
    if (!csvFile) return;
    setCsvUploading(true);
    setCsvResult(null);

    const text = await csvFile.text();
    const lines = text.split('\n').filter((l) => l.trim());
    const header = lines[0].toLowerCase();
    const hasHeader = header.includes('email');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    let successCount = 0;
    let failCount = 0;

    for (const line of dataLines) {
      const parts = line.split(',').map((p) => p.trim());
      const email = parts[0];
      const name = parts[1] || '';
      const verticalStr = parts[2] || '';

      if (!email || !email.includes('@')) { failCount++; continue; }

      const verts = verticalStr
        .split(';')
        .map((v) => v.trim())
        .filter((v) => VERTICALS.includes(v as Vertical)) as Vertical[];

      const res = await fetch('/api/admin/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, full_name: name, password: parts[3] || 'SusCell2026', role: 'candidate', verticals: verts }),
      });
      const data = await res.json();
      if (data.error) failCount++;
      else successCount++;
    }

    setCsvResult(`Done: ${successCount} invited, ${failCount} failed`);
    setCsvUploading(false);
    setCsvFile(null);

    const { data: updated } = await supabase.from('invitations').select('*').order('created_at', { ascending: false }).limit(50);
    setInvitations(updated || []);
  };

  const toggleVertical = (v: Vertical) => {
    setSelectedVerticals((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    );
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" description="Manage users and invitations" />

      <Tabs defaultValue="invite">
        <TabsList className="mb-4">
          <TabsTrigger value="invite">Invite Users</TabsTrigger>
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          <TabsTrigger value="history">Invitation History</TabsTrigger>
          <TabsTrigger value="admins">Admin Team</TabsTrigger>
        </TabsList>

        <TabsContent value="invite">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserPlus className="w-5 h-5" />Invite User</CardTitle>
              <CardDescription>Send a magic link invitation to a candidate or evaluator</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    placeholder="student@iitb.ac.in"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    placeholder="e.g. Aarav Sharma"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Password *</Label>
                <Input
                  type="text"
                  placeholder="Set a password (min 6 characters)"
                  value={invitePassword}
                  onChange={(e) => setInvitePassword(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Share this password with the user so they can sign in.</p>
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                >
                  <option value="candidate">Candidate</option>
                  <option value="evaluator">Evaluator</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
              {inviteRole === 'candidate' && (
                <div className="space-y-2">
                  <Label>Verticals</Label>
                  <div className="flex gap-2">
                    {VERTICALS.map((v) => (
                      <Button
                        key={v}
                        type="button"
                        variant={selectedVerticals.includes(v) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleVertical(v)}
                      >
                        {VERTICAL_LABELS[v]}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
              {inviteRole === 'candidate' && (
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Application / Form Responses</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setRawJsonMode(!rawJsonMode)}
                    >
                      {rawJsonMode ? 'Structured fields' : 'Paste raw JSON'}
                    </Button>
                  </div>
                  {rawJsonMode ? (
                    <div className="space-y-1.5">
                      <Textarea
                        placeholder='{"motivation": "...", "skills": "...", ...}'
                        value={rawJson}
                        onChange={(e) => setRawJson(e.target.value)}
                        rows={5}
                        className="font-mono text-xs"
                      />
                      <p className="text-xs text-muted-foreground">Paste JSON from Google Sheets export</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Motivation</Label>
                        <Textarea placeholder="Why do they want to join?" value={formMotivation} onChange={(e) => setFormMotivation(e.target.value)} rows={2} className="text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Skills</Label>
                        <Textarea placeholder="Relevant skills and abilities" value={formSkills} onChange={(e) => setFormSkills(e.target.value)} rows={2} className="text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Previous Experience</Label>
                        <Textarea placeholder="Past roles, clubs, projects" value={formExperience} onChange={(e) => setFormExperience(e.target.value)} rows={2} className="text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Why Sustainability?</Label>
                        <Textarea placeholder="Connection to sustainability" value={formWhySustainability} onChange={(e) => setFormWhySustainability(e.target.value)} rows={2} className="text-sm" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Additional Info</Label>
                        <Textarea placeholder="Anything else noteworthy" value={formAdditional} onChange={(e) => setFormAdditional(e.target.value)} rows={2} className="text-sm" />
                      </div>
                    </div>
                  )}
                </div>
              )}
              {inviteResult && (
                <p className={`text-sm ${inviteResult.success ? 'text-emerald-600' : 'text-destructive'}`}>
                  {inviteResult.message}
                </p>
              )}
              <Button onClick={handleInvite} disabled={inviting || !inviteEmail || !invitePassword} className="gap-2">
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Create Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="csv">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Upload className="w-5 h-5" />CSV Bulk Upload</CardTitle>
              <CardDescription>
                Upload a CSV with columns: email, name, verticals (semicolon-separated).
                Example: student@iitb.ac.in, Aarav Sharma, events_operations;web_design
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="file"
                accept=".csv"
                onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              />
              {csvResult && <p className="text-sm text-emerald-600">{csvResult}</p>}
              <Button onClick={handleCSVUpload} disabled={csvUploading || !csvFile} className="gap-2">
                {csvUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload & Invite
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Mail className="w-5 h-5" />Recent Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              {invitations.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invitations sent yet.</p>
              ) : (
                <div className="space-y-2">
                  {invitations.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <p className="text-sm font-medium">{inv.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv.full_name} &middot; {inv.role}
                          {inv.verticals?.length > 0 && ` &middot; ${inv.verticals.join(', ')}`}
                        </p>
                      </div>
                      <Badge variant={inv.status === 'accepted' ? 'default' : 'outline'}>
                        {inv.status === 'accepted' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {inv.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5" />Admin Team</CardTitle>
            </CardHeader>
            <CardContent>
              {admins.length === 0 ? (
                <p className="text-sm text-muted-foreground">No admin users found.</p>
              ) : (
                <div className="space-y-2">
                  {admins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-2 rounded border">
                      <div>
                        <p className="text-sm font-medium">{admin.full_name || admin.email}</p>
                        <p className="text-xs text-muted-foreground">{admin.email}</p>
                      </div>
                      <Badge variant={admin.role === 'super_admin' ? 'default' : 'secondary'}>
                        {admin.role === 'super_admin' ? 'Super Admin' : 'Evaluator'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
