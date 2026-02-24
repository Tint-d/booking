import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/contexts/current-user";
import { useUsersForLoginQuery } from "@/features/auth/hooks/auth";
import { useState } from "react";

export function LoginPage() {
  const [selectedId, setSelectedId] = useState<string>("");
  const { setUser } = useCurrentUser();

  const { data: users = [], isLoading, error } = useUsersForLoginQuery(true);

  const selected = users.find((u) => u.id === selectedId);

  const handleContinue = () => {
    if (selected) setUser(selected);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-4">
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (error || users.length === 0) {
    return null;
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Meeting Room Booking</CardTitle>
          <CardDescription>
            Users already exist. Select your account to continue.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select user" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleContinue}
            disabled={!selectedId}
            className="w-full"
          >
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
