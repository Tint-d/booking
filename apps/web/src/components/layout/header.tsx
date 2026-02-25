import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCurrentUser } from "@/contexts/current-user";
import { useTheme } from "@/contexts/theme";
import { Calendar, LogOut, Moon, Sun, Users } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export function Header() {
  const { user, setUser, isAdmin } = useCurrentUser();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const handleLogout = () => {
    setUser(null);
    setLogoutOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background text-foreground">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <nav className="flex items-center gap-1">
          <Link
            to="/"
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium hover:text-foreground/80 ${
              location.pathname === "/"
                ? "text-foreground"
                : "text-muted-foreground"
            }`}
          >
            <Calendar className="size-4" />
            Bookings
          </Link>
          {isAdmin && (
            <Link
              to="/users"
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium hover:text-foreground/80 ${
                location.pathname === "/users"
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <Users className="size-4" />
              Users
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={toggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
            }
          >
            {theme === "dark" ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>
            <div
              className="border-input bg-background flex h-9 w-[200px] items-center rounded-md border px-3 py-2 text-sm"
              title={user?.name}
            >
              <span className="truncate">{user?.name ?? "—"}</span>
            </div>
          {user && <Badge variant="secondary">{user.role}</Badge>}
          <Button variant="ghost" size="sm" onClick={() => setLogoutOpen(true)}>
            <LogOut className="size-4" />
            Log out
          </Button>
          <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log out</DialogTitle>
                <DialogDescription>
                  Are you sure you want to log out?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setLogoutOpen(false)}>
                  Cancel
                </Button>
                <Button variant="default" onClick={handleLogout}>
                  Log out
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </header>
  );
}
