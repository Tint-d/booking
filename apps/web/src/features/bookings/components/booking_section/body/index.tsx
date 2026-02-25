import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCurrentUser } from "@/contexts/current-user";
import { useState } from "react";
import BookingTable from "./table";

interface BookingBodyProps {
  title?: string;
  description?: string;
}

/**
 * Booking.Body – Card wrapper with table of bookings
 */
function BookingBody({
  title = "Booking Management",
  description = "View and manage all bookings. Use the search to find specific bookings and click the column headers to sort.",
}: BookingBodyProps) {
  const { isOwnerOrAdmin } = useCurrentUser();
  const [view, setView] = useState<"all" | "grouped" | "summary">("all");

  return (
    <Card className="bg-background w-full ">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {isOwnerOrAdmin && (
          <div className="mb-4 flex gap-2 border-b pb-2 text-sm">
            <button
              type="button"
              className={`cursor-pointer rounded-md px-3 py-1 ${view === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              onClick={() => setView("all")}
            >
              All bookings
            </button>
            <button
              type="button"
              className={`cursor-pointer rounded-md px-3 py-1 ${view === "grouped" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              onClick={() => setView("grouped")}
            >
              Grouped by user
            </button>
            <button
              type="button"
              className={`cursor-pointer rounded-md px-3 py-1 ${view === "summary" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
              onClick={() => setView("summary")}
            >
              Summary
            </button>
          </div>
        )}

        {/* Single table – mode changes content (list / grouped / summary) */}
        <BookingTable mode={view} />
      </CardContent>
    </Card>
  );
}

BookingBody.Table = BookingTable;

export default BookingBody;
