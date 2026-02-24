import { ReactHelmet, type ReactHelmetProps } from "@/components/molecules";
import { useCurrentUser } from "@/contexts/current-user";
import Booking from "@/features/bookings/components/booking_section";
import { useMemo } from "react";

export function BookingsPage() {
  const { user } = useCurrentUser();

  const metadata: ReactHelmetProps = useMemo(
    () => ({
      title: "Meeting Room Booking | Bookings",
      description: "View and manage meeting room bookings.",
    }),
    []
  );

  if (!user) return null;

  return (
    <>
      <ReactHelmet metadata={metadata} />
      <Booking userId={user.id}>
        <Booking.Body />
      </Booking>
    </>
  );
}
