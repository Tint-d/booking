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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrentUser } from "@/contexts/current-user";
import {
  useBookingDeleteMutation,
  useBookingsQuery,
  type Booking,
} from "@/features/bookings/hooks/bookings";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
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
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { useBookingContext } from "../booking-context";
import CreateDialog from "../create-dialog";
import { TableSkeleton } from "@/components/ui/table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { bookingToCsvRow, CSV_HEADERS, getBookingColumns } from "./columns";

function downloadBookingsCsv(bookings: Booking[]) {
  const rows = [CSV_HEADERS, ...bookings.map(bookingToCsvRow)];
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "bookings.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Booking.Body.Table – Data table with sorting, search, and CSV download
 */
function BookingTable() {
  const { userId } = useBookingContext();
  const { user } = useCurrentUser();
  const {
    data: bookings = [],
    isLoading,
    error,
  } = useBookingsQuery({ userId });
  const deleteBooking = useBookingDeleteMutation();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [bookingToDelete, setBookingToDelete] = useState<Booking | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

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
        },
        onError: (e: Error) => {
          toast.error(e.message, { position: "top-right" });
        },
        onSettled: () => setBookingToDelete(null),
      },
    );
  }, [userId, bookingToDelete, deleteBooking]);

  const columns = useMemo(
    () => getBookingColumns(canDelete, onDelete),
    [canDelete, onDelete],
  );

  const table = useReactTable({
    data: bookings,
    columns,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    globalFilterFn: (row, _columnId, value) => {
      if (!value || typeof value !== "string") return true;
      const v = value.toLowerCase();
      const b = row.original;
      const start = new Date(b.startTime).toLocaleString().toLowerCase();
      const end = new Date(b.endTime).toLocaleString().toLowerCase();
      const created = new Date(b.createdAt).toLocaleString().toLowerCase();
      const id = b.id.toLowerCase();
      return [start, end, created, id].some((s) => s.includes(v));
    },
  });

  const pageRows = table.getRowModel().rows;
  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  const confirmBulkDelete = useCallback(() => {
    const rows = table.getFilteredSelectedRowModel().rows;
    const ids = rows.map((r) => r.original.id);
    if (ids.length === 0) {
      setBulkDeleteOpen(false);
      return;
    }
    Promise.all(
      ids.map((id) =>
        deleteBooking.mutateAsync({ userId, bookingId: id })
      )
    )
      .then(() => {
        toast.success(
          `${ids.length} booking${ids.length === 1 ? "" : "s"} deleted successfully.`,
          { position: "top-right" }
        );
        setRowSelection({});
        setBulkDeleteOpen(false);
      })
      .catch((e: Error) => {
        toast.error(e.message ?? "Failed to delete some bookings.", {
          position: "top-right",
        });
      });
  }, [userId, table, deleteBooking]);

  if (error) {
    return (
      <p className="text-destructive py-4 text-sm">
        {(error as Error).message}
      </p>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-full sm:max-w-xs sm:w-64" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <TableSkeleton columnCount={5} rowCount={10} />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-5 w-40" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-8 w-14" />
          </div>
        </div>
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
            placeholder="Search by date, time or booking…"
            value={globalFilter ?? ""}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 pr-4"
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
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
            onClick={() => downloadBookingsCsv(bookings)}
            className="gap-2"
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
                  <TableHead key={header.id}>
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
              pageRows.map((row) => (
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
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-muted-foreground h-24 text-center text-sm"
                >
                  {bookings.length === 0
                    ? "No bookings yet. Create one above."
                    : "No results match your search."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {selectedCount > 0 ? (
            <>
              <strong>{selectedCount}</strong> of{" "}
              <strong>{filteredRowCount}</strong> row(s) selected.
            </>
          ) : (
            <>
              Showing{" "}
              <strong>
                {filteredRowCount === 0
                  ? 0
                  : table.getState().pagination.pageIndex *
                      table.getState().pagination.pageSize +
                    1}
                -
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  filteredRowCount
                )}
              </strong>{" "}
              of <strong>{filteredRowCount}</strong> bookings
            </>
          )}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount() || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BookingTable;
