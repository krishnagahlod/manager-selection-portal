import { Sidebar } from '@/components/layout/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role="admin" />
      <main className="flex-1 min-w-0 px-4 pt-16 pb-6 md:p-6 lg:p-8">{children}</main>
    </div>
  );
}
