import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Booking } from "@/features/bookings/hooks/bookings";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { SortableHeader } from "./sortable-header";

export function getBookingColumns(
  canDelete: (b: Booking) => boolean,
  onDelete: (b: Booking) => void,
  getUserName: (userId: string) => string | undefined,
  mode: "all" | "grouped" | "summary",
): ColumnDef<Booking>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => {
        if (!canDelete(row.original)) return null;
        return (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        );
      },
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "userId",
      header: ({ column }) => (
        <SortableHeader column={column} title="User" />
      ),
      cell: ({ row, table }) => {
        const currentId = row.original.userId;
        const name = getUserName(currentId) ?? currentId;

        if (mode === "grouped") {
          const allRows = table.getRowModel().rows;
          const prev = allRows[row.index - 1];
          const prevId = prev?.original.userId;
          const isSameAsPrev = prev && prevId === currentId;

          if (isSameAsPrev) {
            return <span className="text-sm text-muted-foreground">&nbsp;</span>;
          }
        }

        return <span className="text-sm">{name}</span>;
      },
      sortingFn: (rowA, rowB) => {
        const nameA = getUserName(rowA.original.userId) ?? rowA.original.userId;
        const nameB = getUserName(rowB.original.userId) ?? rowB.original.userId;
        return nameA.localeCompare(nameB);
      },
    },
    {
      accessorKey: "startTime",
      header: ({ column }) => <SortableHeader column={column} title="Start" />,
      cell: ({ row }) => format(new Date(row.original.startTime), "PPp"),
      sortingFn: (rowA, rowB) =>
        new Date(rowA.original.startTime).getTime() -
        new Date(rowB.original.startTime).getTime(),
    },
    {
      accessorKey: "endTime",
      header: ({ column }) => <SortableHeader column={column} title="End" />,
      cell: ({ row }) => format(new Date(row.original.endTime), "PPp"),
      sortingFn: (rowA, rowB) =>
        new Date(rowA.original.endTime).getTime() -
        new Date(rowB.original.endTime).getTime(),
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <SortableHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {format(new Date(row.original.createdAt), "PP")}
        </span>
      ),
      sortingFn: (rowA, rowB) =>
        new Date(rowA.original.createdAt).getTime() -
        new Date(rowB.original.createdAt).getTime(),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const b = row.original;
        if (!canDelete(b)) return null;
        return (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(b)}
            aria-label="Delete booking"
          >
            <Trash2 className="size-4" />
          </Button>
        );
      },
      enableSorting: false,
    },
  ];
}

export function bookingToCsvRow(b: Booking): string[] {
  return [
    b.id,
    format(new Date(b.startTime), "PPp"),
    format(new Date(b.endTime), "PPp"),
    format(new Date(b.createdAt), "PP"),
  ];
}

export const CSV_HEADERS = ["ID", "Start", "End", "Created"];
