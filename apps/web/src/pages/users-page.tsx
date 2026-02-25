import { ReactHelmet, type ReactHelmetProps } from "@/components/molecules";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCurrentUser } from "@/contexts/current-user";
import { UsersTable } from "@/features/auth/components/users-table";
import { useUsersQuery } from "@/features/auth/hooks/users";
import { useMemo } from "react";

export function UsersPage() {
  const { user: currentUser } = useCurrentUser();

  const metadata: ReactHelmetProps = useMemo(
    () => ({
      title: "Meeting Room Booking | Users",
      description:
        "View and manage users. Deleting a user also removes their bookings.",
    }),
    []
  );

  const usersQuery = useUsersQuery({
    userId: currentUser?.id ?? null,
    enabled: !!currentUser?.id && currentUser?.role === "admin",
    limit: 10,
  });

  const users = usersQuery.data?.data ?? [];
  const isLoading = usersQuery.isLoading;
  const error = usersQuery.error as Error | null;

  if (!currentUser || currentUser.role !== "admin") return null;

  return (
    <>
      <ReactHelmet metadata={metadata} />
      <div className="mx-auto max-w-6xl space-y-6 p-4">
        <Card className="bg-background w-full">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              View and manage users. Use the search to find specific users and
              click the column headers to sort. Deleting a user also removes their
              bookings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UsersTable
              users={users}
              currentUser={currentUser}
              isLoading={isLoading}
              error={error}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
