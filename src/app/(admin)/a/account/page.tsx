import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { ChangePasswordCard } from '@/components/shared/change-password-card';
import { User, Mail, Shield } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/constants';
import { type UserRole } from '@/types/database';

export const dynamic = 'force-dynamic';

export default async function AdminAccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return (
    <div className="max-w-3xl">
      <PageHeader title="Account" description="Manage your profile and password" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Info */}
        <Card className="border-border/60 h-fit">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{profile?.full_name || profile?.email}</p>
                <p className="text-xs text-muted-foreground">{ROLE_LABELS[profile?.role as UserRole] || profile?.role}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{profile?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>{ROLE_LABELS[profile?.role as UserRole] || profile?.role}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <ChangePasswordCard />
      </div>
    </div>
  );
}
