import { useState } from "react";
import { useCurrentUser } from "@/contexts/current-user";
import { useSeedMutation } from "@/features/auth/hooks/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function SeedPage() {
  const [error, setError] = useState<string | null>(null);
  const { setUser } = useCurrentUser();

  const seed = useSeedMutation();
  const runSeed = () => {
    seed.mutate(undefined, {
      onSuccess: (user) => {
        setUser(user);
        setError(null);
      },
      onError: (e: Error) => setError(e.message),
    });
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Meeting Room Booking</CardTitle>
          <CardDescription>
            No users yet. Create the first admin to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-destructive text-sm">{error}</p>}
          <Button
            onClick={runSeed}
            disabled={seed.isPending}
            className="w-full"
          >
            {seed.isPending ? "Creating…" : "Create first admin"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
