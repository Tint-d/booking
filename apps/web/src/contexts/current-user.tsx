import type { User } from "@/lib/api";
import { createContext, useContext, useState, type ReactNode } from "react";

type CurrentUserContextValue = {
  user: User | null;
  setUser: (u: User | null) => void;
  isAdmin: boolean;
  isOwnerOrAdmin: boolean;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const isAdmin = user?.role === "admin";
  const isOwnerOrAdmin = user?.role === "admin" || user?.role === "owner";

  const value: CurrentUserContextValue = {
    user,
    setUser,
    isAdmin,
    isOwnerOrAdmin,
  };

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx)
    throw new Error("useCurrentUser must be used within CurrentUserProvider");
  return ctx;
}
