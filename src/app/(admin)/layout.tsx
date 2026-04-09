import { Sidebar } from '@/components/layout/sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role="admin" />
      <main className="flex-1 p-4 md:p-6 lg:p-8 pt-14 md:pt-6">{children}</main>
    </div>
  );
}
