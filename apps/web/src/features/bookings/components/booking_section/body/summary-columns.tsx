import type { ColumnDef } from "@tanstack/react-table";
import type { SummaryRow } from "./table.constants";

export const SUMMARY_COLUMNS: ColumnDef<SummaryRow>[] = [
  { id: "name", accessorKey: "name", header: "User" },
  {
    id: "count",
    accessorKey: "count",
    header: "Bookings",
    cell: ({ getValue }) => (
      <span className="block text-right">{getValue() as number}</span>
    ),
  },
];
