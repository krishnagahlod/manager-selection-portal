import { Sidebar } from '@/components/layout/sidebar';

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role="candidate" />
      <main className="flex-1 p-4 md:p-6 lg:p-8 pt-14 md:pt-6">{children}</main>
    </div>
  );
}
