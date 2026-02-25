import { Button } from "@/components/ui/button";
import ChevronUpDownIcon from "@/icons/chevron_updown.icon";
import type { Column } from "@tanstack/react-table";

type SortableHeaderProps<TData = unknown> = {
  column: Column<TData, unknown>;
  title: string;
};

export function SortableHeader<TData = unknown>({ column, title }: SortableHeaderProps<TData>) {
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
