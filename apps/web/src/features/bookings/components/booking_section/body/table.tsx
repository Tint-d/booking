import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { useCurrentUser } from "@/contexts/current-user";
import { useUsersForLoginQuery } from "@/features/auth/hooks/auth";
import {
  useBookingDeleteMutation,
  useBookingsQuery,
  useBookingsSummaryQuery,
  type Booking,
} from "@/features/bookings/hooks/bookings";
import { api } from "@/lib/api";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useBookingContext } from "../booking-context";
import CreateDialog from "../create-dialog";
import { getBookingColumns } from "./columns";

const PAGE_SIZE = 10;
const SORT_FIELDS = ["startTime", "endTime", "createdAt", "userId"] as const;

type SummaryRow = { id: string; name: string; count: number };

const SUMMARY_COLUMNS: ColumnDef<SummaryRow>[] = [
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

function downloadSummaryCsv(rows: SummaryRow[], total: number) {
  const header = ["User", "Bookings"];
  const dataRows = rows.map((r) => [r.name, String(r.count)]);
  const totalRow = ["Total", String(total)];
  const csv = [header, ...dataRows, totalRow]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bookings-summary.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Booking.Body.Table – Server-side pagination, search, filter, sort
 */
function BookingTable({ mode = "all" }: { mode?: "all" | "grouped" | "summary" }) {
  const { userId } = useBookingContext();
  const { user } = useCurrentUser();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchSent, setSearchSent] = useState("");
  const [sorting, setSorting] = useState<SortingState>([
    { id: mode === "grouped" ? "userId" : "startTime", desc: false },
  ]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const sortByRaw = sorting[0]?.id ?? (mode === "grouped" ? "userId" : "startTime");
  const sortBy: (typeof SORT_FIELDS)[number] = SORT_FIELDS.includes(
    sortByRaw as (typeof SORT_FIELDS)[number]
  )
    ? (sortByRaw as (typeof SORT_FIELDS)[number])
    : "startTime";
  const sortOrder = sorting[0]?.desc ? "desc" : "asc";

  const { data: allUsers = [] } = useUsersForLoginQuery(true);
  const userNameById = useMemo(
    () => new Map(allUsers.map((u) => [u.id, u.name])),
    [allUsers],
  );
  const getUserName = useCallback(
    (id: string) => userNameById.get(id),
    [userNameById],
  );

  const { data, isLoading, error, refetch } = useBookingsQuery({
    userId,
    page,
    limit: PAGE_SIZE,
    search: searchSent || undefined,
    sortBy,
    sortOrder,
  });

  const summaryQuery = useBookingsSummaryQuery(
    mode === "summary" ? userId : null,
  );

  const bookings = data?.data ?? [];
  const meta = data?.meta;

  const summaryRows = useMemo((): SummaryRow[] => {
    if (mode !== "summary" || !summaryQuery.data) return [];
    return summaryQuery.data.byUser
      .map((row) => ({
        id: row.userId,
        name: getUserName(row.userId) ?? row.userId,
        count: row.count,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [mode, summaryQuery.data, getUserName]);

  const filteredSummaryRows = useMemo(() => {
    if (mode !== "summary") return [];
    const q = searchInput.trim().toLowerCase();
    if (!q) return summaryRows;
    return summaryRows.filter((r) =>
      r.name.toLowerCase().includes(q),
    );
  }, [mode, summaryRows, searchInput]);

  useEffect(() => {
    const t = setTimeout(() => setSearchSent(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [searchSent, sortBy, sortOrder]);

  // When the owner switches between views, reset sort + page.
  useEffect(() => {
    if (mode === "summary") return;
    setSorting([{ id: mode === "grouped" ? "userId" : "startTime", desc: false }]);
    setPage(1);
  }, [mode]);

  const deleteBooking = useBookingDeleteMutation();
  const canDelete = useCallback(
    (b: Booking) =>
      user?.role === "admin" || user?.role === "owner" || b.userId === user?.id,
    [user?.id, user?.role],
  );

  const onDelete = useCallback((b: Booking) => {
    setBookingToDelete(b);
  }, []);

  const confirmDeleteBooking = useCallback(() => {
    if (!bookingToDelete) return;
    deleteBooking.mutate(
      { userId, bookingId: bookingToDelete.id },
      {
        onSuccess: () => {
          toast.success("Booking deleted successfully.", {
            position: "top-right",
          });
          setBookingToDelete(null);
          refetch();
        },
        onError: (e: Error) => {
          toast.error(e.message, { position: "top-right" });
        },
        onSettled: () => setBookingToDelete(null),
      },
    );
  }, [userId, bookingToDelete, deleteBooking, refetch]);

  const bookingColumns = useMemo(
    () => getBookingColumns(canDelete, onDelete, getUserName, mode),
    [canDelete, onDelete, getUserName, mode],
  );

  const tableData = mode === "summary" ? filteredSummaryRows : bookings;
  const tableColumns = mode === "summary" ? SUMMARY_COLUMNS : bookingColumns;

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable<Booking | SummaryRow>({
    data: tableData as (Booking | SummaryRow)[],
    columns: tableColumns as ColumnDef<Booking | SummaryRow>[],
    getRowId: mode === "summary" ? (row) => (row as SummaryRow).id : undefined,
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: mode !== "summary",
    manualSorting: true,
    manualFiltering: true,
    pageCount: mode === "summary" ? 1 : (meta?.totalPages ?? 0),
  });

  const pageRows = table.getRowModel().rows;
  const selectedCount = Object.keys(rowSelection).filter(
    (k) => rowSelection[k]
  ).length;
  const summaryTotal = mode === "summary" ? summaryQuery.data?.totalBookings ?? 0 : 0;

  const confirmBulkDelete = useCallback(() => {
    const ids = table.getSelectedRowModel().rows.map((r) => r.original.id);
    if (ids.length === 0) {
      setBulkDeleteOpen(false);
      return;
    }
    Promise.all(
      ids.map((id) => deleteBooking.mutateAsync({ userId, bookingId: id }))
    )
      .then(() => {
        toast.success(
          `${ids.length} booking${ids.length === 1 ? "" : "s"} deleted successfully.`,
          { position: "top-right" }
        );
        setRowSelection({});
        setBulkDeleteOpen(false);
        refetch();
      })
      .catch((e: Error) => {
        toast.error(e.message ?? "Failed to delete some bookings.", {
          position: "top-right",
        });
      });
  }, [userId, table, deleteBooking, refetch]);

  if (mode === "summary" && summaryQuery.error) {
    return (
      <p className="text-destructive py-4 text-sm">
        {(summaryQuery.error as Error).message}
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-destructive py-4 text-sm">
        {(error as Error).message}
      </p>
    );
  }

  const isLoadingTable =
    mode === "summary" ? summaryQuery.isLoading : isLoading;
  if (isLoadingTable) {
    const colCount = mode === "summary" ? 2 : 5;
    return (
      <div className="w-full space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-full sm:max-w-xs sm:w-64" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <TableSkeleton columnCount={colCount} rowCount={mode === "summary" ? 6 : 10} />
        {mode !== "summary" && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Skeleton className="h-5 w-40" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-8 w-14" />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <Dialog
        open={!!bookingToDelete}
        onOpenChange={(open) => !open && setBookingToDelete(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete booking</DialogTitle>
            <DialogDescription>
              This will permanently remove this booking. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteBooking}
              disabled={deleteBooking.isPending}
            >
              {deleteBooking.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder={
              mode === "summary"
                ? "Search by user name…"
                : "Search by date, time or booking…"
            }
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9 pr-4"
          />
        </div>
        <div className="flex items-center gap-2">
          {mode !== "summary" && selectedCount > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              className="gap-2"
            >
              <Trash2 className="size-4" />
              Delete selected ({selectedCount})
            </Button>
          )}
          <CreateDialog />
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              if (mode === "summary") {
                downloadSummaryCsv(filteredSummaryRows, summaryTotal);
                return;
              }
              try {
                await api.bookings.exportCsv(userId);
                toast.success("CSV downloaded.", { position: "top-right" });
              } catch (e) {
                toast.error((e as Error).message ?? "Export failed.", {
                  position: "top-right",
                });
              }
            }}
            className="gap-2"
            title={
              mode === "summary"
                ? "Download summary as CSV"
                : "Download all bookings as CSV (from server)"
            }
          >
            <Download className="size-4" />
            Download CSV
          </Button>
        </div>
      </div>

      <Dialog
        open={bulkDeleteOpen}
        onOpenChange={(open) => !open && setBulkDeleteOpen(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete selected bookings</DialogTitle>
            <DialogDescription>
              This will permanently remove {selectedCount} booking
              {selectedCount === 1 ? "" : "s"}. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBulkDelete}
              disabled={deleteBooking.isPending}
            >
              {deleteBooking.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      mode === "summary" && header.column.id === "count"
                        ? "text-right"
                        : undefined
                    }
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {pageRows.length ? (
              <>
                {pageRows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                {mode === "summary" && (
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{summaryTotal}</TableCell>
                  </TableRow>
                )}
              </>
            ) : (
              <>
                <TableRow>
                  <TableCell
                    colSpan={tableColumns.length}
                    className="text-muted-foreground h-24 text-center text-sm"
                  >
                    {mode === "summary"
                      ? "No usage data."
                      : (meta?.total ?? 0) === 0
                        ? "No bookings yet. Create one above."
                        : "No results match your search."}
                  </TableCell>
                </TableRow>
                {mode === "summary" && (
                  <TableRow className="bg-muted/50 font-medium">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{summaryTotal}</TableCell>
                  </TableRow>
                )}
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {mode !== "summary" && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {selectedCount > 0 ? (
              <>
                <strong>{selectedCount}</strong> row(s) selected on this page.
              </>
            ) : (
              <>
                Showing{" "}
                <strong>
                  {meta?.total === 0
                    ? 0
                    : ((meta?.page ?? 1) - 1) * (meta?.limit ?? PAGE_SIZE) + 1}
                  -
                  {Math.min(
                    (meta?.page ?? 1) * (meta?.limit ?? PAGE_SIZE),
                    meta?.total ?? 0
                  )}
                </strong>{" "}
                of <strong>{meta?.total ?? 0}</strong> bookings
              </>
            )}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!meta?.hasPrevPage}
            >
              <ChevronLeft className="size-4" />
              Previous
            </Button>
            <span className="text-muted-foreground text-sm">
              Page {meta?.page ?? 1} of {meta?.totalPages ?? 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={!meta?.hasNextPage}
            >
              Next
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingTable;
