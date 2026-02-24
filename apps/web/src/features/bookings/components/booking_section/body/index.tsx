import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  return (
    <Card className="bg-background w-full ">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <BookingTable />
        
      </CardContent>
    </Card>
  );
}

BookingBody.Table = BookingTable;

export default BookingBody;
