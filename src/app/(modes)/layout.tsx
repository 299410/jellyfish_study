import { Sidebar } from '@/components/layout/Sidebar';
import UserOnboarding from '@/components/UserOnboarding';

export default function ModesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserOnboarding>
      <div className="flex min-h-screen bg-gradient-to-br from-indigo-50/80 via-white to-cyan-50/80 selection:bg-indigo-100 selection:text-indigo-900">
        <Sidebar />
        <main className="flex-1 pl-20 md:pl-64 transition-all duration-300">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </UserOnboarding>
  );
}
