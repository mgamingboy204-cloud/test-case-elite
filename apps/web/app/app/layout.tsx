import ProtectedRoute from '@/components/ProtectedRoute';
import AppHeader from '@/components/app/AppHeader';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
        <AppHeader />
        <main className="pb-24">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
