import { Sidebar } from '@/components/layout/sidebar';

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role="candidate" />
      <main className="flex-1 min-w-0 px-4 pt-16 pb-6 md:p-6 lg:p-8">{children}</main>
    </div>
  );
}
