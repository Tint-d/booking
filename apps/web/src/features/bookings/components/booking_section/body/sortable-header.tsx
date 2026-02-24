import { Button } from "@/components/ui/button";
import ChevronUpDownIcon from "@/icons/chevron_updown.icon";
import type { HeaderContext } from "@tanstack/react-table";
import type { Booking } from "@/features/bookings/hooks/bookings";

type SortableHeaderProps = {
  column: HeaderContext<Booking, unknown>["column"];
  title: string;
};

export function SortableHeader({ column, title }: SortableHeaderProps) {
  const sorted = column.getIsSorted();
  const active =
    sorted === "asc" ? "up" : sorted === "desc" ? "down" : undefined;
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 font-medium"
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      <ChevronUpDownIcon active={active} className="ml-1 size-[14px]" />
    </Button>
  );
}
