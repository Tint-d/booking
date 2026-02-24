import type { ReactNode } from "react";
import { BookingContextProvider } from "./_context";
import BookingBody from "./body";
import CreateDialog from "./create-dialog";
import BookingHeader from "./header";

type BookingRootProps = {
  userId: string;
  children: ReactNode;
  className?: string;
};

/**
 * Booking – Compound component for the bookings section
 *
 * Usage:
 * <Booking userId={user.id}>
 *   <Booking.Header title="Bookings" description="..." action={<Booking.CreateDialog />} />
 *   <Booking.Body />
 * </Booking>
 */
function BookingRoot({ userId, children, className = "" }: BookingRootProps) {
  return (
    <BookingContextProvider userId={userId}>
      <div className={`mx-auto max-w-6xl space-y-6 p-4 ${className}`}>
        {children}
      </div>
    </BookingContextProvider>
  );
}

BookingRoot.Header = BookingHeader;
BookingRoot.Body = BookingBody;
BookingRoot.CreateDialog = CreateDialog;

export default BookingRoot;
