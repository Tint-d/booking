import { Header } from "@/components/layout/header";
import { ReactHelmet, type ReactHelmetProps } from "@/components/molecules";
import { Toaster } from "@/components/ui/sonner";
import { CurrentUserProvider, useCurrentUser } from "@/contexts/current-user";
import { ThemeProvider } from "@/contexts/theme";
import { useUsersForLoginQuery } from "@/features/auth/hooks/auth";
import { useUsersQuery } from "@/features/auth/hooks/users";
import { BookingsPage } from "@/pages/bookings-page";
import { LoginPage } from "@/pages/login-page";
import { SeedPage } from "@/pages/seed-page";
import { UsersPage } from "@/pages/users-page";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import faviconUrl from "@/assets/visibleone.jpg";

const defaultMetadata: ReactHelmetProps = {
  title: "Meeting Room Booking",
  description: "View and manage meeting room bookings.",
  faviconUrl,
};

function AppLayout() {
  const { user } = useCurrentUser();
  const usersQuery = useUsersQuery({
    userId: user?.id ?? null,
    enabled: !!user?.id && user?.role === "admin",
  });
  const usersForSwitcher =
    user?.role === "admin" ? (usersQuery.data ?? []) : user ? [user] : [];

  return (
    <div className="min-h-screen bg-background">
      <Header users={usersForSwitcher} />
      <main>
        <Routes>
          <Route path="/" element={<BookingsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useCurrentUser();
  const { data: existingUsers = [], isLoading } = useUsersForLoginQuery(!user);

  if (user) return <AppLayout />;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (existingUsers.length > 0) return <LoginPage />;
  return <SeedPage />;
}

export default function App() {
  return (
    <ThemeProvider>
      <ReactHelmet metadata={defaultMetadata} />
      <BrowserRouter>
        <CurrentUserProvider>
          <AppRoutes />
        </CurrentUserProvider>
      </BrowserRouter>
      <Toaster />
    </ThemeProvider>
  );
}
