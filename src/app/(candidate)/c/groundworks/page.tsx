import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Clock, MapPin, UserCircle } from 'lucide-react';
import Link from 'next/link';
import { IndividualGroundworkSection } from '@/components/candidate/individual-groundwork-section';

export const dynamic = 'force-dynamic';

export default async function GroundworksPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ data: sessions }, { data: individualGws }] = await Promise.all([
    supabase.from('groundwork_sessions').select('*').eq('is_active', true).order('session_date', { ascending: true }),
    supabase.from('individual_groundworks').select('*').eq('candidate_id', user.id).order('created_at', { ascending: false }),
  ]);

  const today = new Date().toLocaleDateString('en-CA');
  const upcoming = (sessions || []).filter((s) => s.session_date >= today);
  const past = (sessions || []).filter((s) => s.session_date < today);

  const SessionList = ({ items, label }: { items: typeof sessions; label: string }) => (
    <div className="mb-8">
      <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">{label}</h2>
      {!items || items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No {label.toLowerCase()}</p>
      ) : (
        <div className="space-y-3">
          {items.map((session) => (
            <Link key={session.id} href={`/c/groundworks/${session.id}`}>
              <Card className="hover:shadow-card-hover border-border/60 transition-all duration-200 cursor-pointer">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{session.title}</p>
                      {session.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{session.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(session.session_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' '}{session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}
                        </span>
                        {session.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {session.location}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {session.is_mandatory && (
                    <Badge variant="secondary" className="text-xs shrink-0">Mandatory</Badge>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-3xl">
      <PageHeader title="Groundwork Sessions" description="Sessions to learn about the cell and show your engagement" />
      <SessionList items={upcoming} label="Upcoming Sessions" />
      <SessionList items={past} label="Past Sessions" />

      {/* Individual Groundworks */}
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
            <UserCircle className="w-4 h-4 text-violet-600" />
          </div>
          <h2 className="text-base font-semibold">Individual Groundworks</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Log conversations with team members you had on your own initiative.
        </p>
        <IndividualGroundworkSection userId={user.id} existing={individualGws || []} />
      </div>
    </div>
  );
}
