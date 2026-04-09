import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { ChangePasswordCard } from '@/components/shared/change-password-card';
import { User, Mail, Phone, GraduationCap, Building2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function CandidateAccountPage() {
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
                <p className="font-semibold">{profile?.full_name || 'Candidate'}</p>
                <p className="text-xs text-muted-foreground capitalize">{profile?.role}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>{profile?.email}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile?.department && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="w-4 h-4" />
                  <span>{profile.department}</span>
                </div>
              )}
              {profile?.year_of_study && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <GraduationCap className="w-4 h-4" />
                  <span>Year {profile.year_of_study}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground pt-2 border-t">
              To update profile details, contact your OC.
            </p>
          </CardContent>
        </Card>

        <ChangePasswordCard />
      </div>
    </div>
  );
}
