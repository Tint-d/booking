import type { ReactNode } from "react";
import { BookingContext } from "./booking-context";
import type { BookingContextValue } from "./booking-context";

export function BookingContextProvider({
  userId,
  children,
}: {
  userId: string;
  children: ReactNode;
}) {
  const value: BookingContextValue = { userId };
  return (
    <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
  );
}
