import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCurrentUser } from "@/contexts/current-user";
import { useUsersForLoginQuery } from "@/features/auth/hooks/auth";
import {
  useBookingDeleteMutation,
  useBookingsQuery,
  useBookingsSummaryQuery,
  type Booking,
} from "@/features/bookings/hooks/bookings";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useBookingContext } from "../booking-context";
import { BulkDeleteDialog } from "./bulk-delete-dialog";
import { BookingTablePagination } from "./booking-table-pagination";
import { BookingTableSkeleton } from "./booking-table-skeleton";
import { BookingTableToolbar } from "./booking-table-toolbar";
import { getBookingColumns } from "./columns";
import { DeleteBookingDialog } from "./delete-booking-dialog";
import { SUMMARY_COLUMNS } from "./summary-columns";
import { PAGE_SIZE, SORT_FIELDS, type SortField, type SummaryRow } from "./table.constants";

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
  const sortBy: SortField = SORT_FIELDS.includes(
    sortByRaw as SortField,
  )
    ? (sortByRaw as SortField)
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
    return summaryRows.filter((r) => r.name.toLowerCase().includes(q));
  }, [mode, summaryRows, searchInput]);

  useEffect(() => {
    const t = setTimeout(() => setSearchSent(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [searchSent, sortBy, sortOrder]);

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

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table; safe to suppress
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
    (k) => rowSelection[k],
  ).length;
  const summaryTotal = mode === "summary" ? summaryQuery.data?.totalBookings ?? 0 : 0;

  const confirmBulkDelete = useCallback(() => {
    const ids = table.getSelectedRowModel().rows.map((r) => r.original.id);
    if (ids.length === 0) {
      setBulkDeleteOpen(false);
      return;
    }
    Promise.all(
      ids.map((id) => deleteBooking.mutateAsync({ userId, bookingId: id })),
    )
      .then(() => {
        toast.success(
          `${ids.length} booking${ids.length === 1 ? "" : "s"} deleted successfully.`,
          { position: "top-right" },
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
    return <BookingTableSkeleton isSummary={mode === "summary"} />;
  }

  return (
    <div className="w-full space-y-4">
      <DeleteBookingDialog
        booking={bookingToDelete}
        onClose={() => setBookingToDelete(null)}
        onConfirm={confirmDeleteBooking}
        isDeleting={deleteBooking.isPending}
      />

      <BookingTableToolbar
        mode={mode}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        selectedCount={selectedCount}
        onBulkDeleteClick={() => setBulkDeleteOpen(true)}
        userId={userId}
        filteredSummaryRows={filteredSummaryRows}
        summaryTotal={summaryTotal}
      />

      <BulkDeleteDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        selectedCount={selectedCount}
        onConfirm={confirmBulkDelete}
        isDeleting={deleteBooking.isPending}
      />

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

      {mode !== "summary" && meta && (
        <BookingTablePagination
          selectedCount={selectedCount}
          page={meta.page ?? 1}
          total={meta.total ?? 0}
          totalPages={meta.totalPages ?? 1}
          hasPrevPage={meta.hasPrevPage ?? false}
          hasNextPage={meta.hasNextPage ?? false}
          onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
          onNextPage={() => setPage((p) => p + 1)}
        />
      )}
    </div>
  );
}

export default BookingTable;
