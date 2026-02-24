import { createContext, useContext } from "react";

export interface BookingContextValue {
  userId: string;
}

export const BookingContext = createContext<BookingContextValue | null>(null);

export function useBookingContext() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error("useBookingContext must be used within Booking");
  return ctx;
}
