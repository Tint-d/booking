import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { api } from "@/lib/api";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronLeft, ChevronRight, Download, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import {
  useUserCreateMutation,
  useUserDeleteMutation,
  useUserUpdateRoleMutation,
  type Role,
  type User,
} from "../hooks/users";
import { getUserColumns } from "./user-columns";

const ROLES: Role[] = ["admin", "owner", "user"];

const addUserSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  role: z.enum(["admin", "owner", "user"]),
});
type AddUserFormValues = z.infer<typeof addUserSchema>;

interface UsersTableProps {
  users: User[];
  currentUser: User;
  isLoading: boolean;
  error: Error | null;
}

export function UsersTable({
  users,
  currentUser,
  isLoading,
  error,
}: UsersTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const addUserForm = useForm<AddUserFormValues>({
    resolver: zodResolver(addUserSchema),
    mode: "onTouched",
    defaultValues: { name: "", role: "user" },
  });

  const createUser = useUserCreateMutation();
  const updateRole = useUserUpdateRoleMutation();
  const deleteUser = useUserDeleteMutation();

  const canDelete = useCallback(
    (u: User) => u.id !== currentUser.id,
    [currentUser.id]
  );

  const onDelete = useCallback((u: User) => setUserToDelete(u), []);

  const onRoleChange = useCallback(
    (u: User, newRole: Role) => {
      updateRole.mutate(
        {
          userId: currentUser.id,
          targetUserId: u.id,
          role: newRole,
        },
        {
          onSuccess: () =>
            toast.success("Role updated successfully.", {
              position: "top-right",
            }),
          onError: (e: Error) =>
            toast.error(e.message, { position: "top-right" }),
        }
      );
    },
    [currentUser.id, updateRole]
  );

  const columns = useMemo(
    () =>
      getUserColumns(
        currentUser.id,
        canDelete,
        onDelete,
        onRoleChange,
        updateRole.isPending
      ),
    [currentUser.id, canDelete, onDelete, onRoleChange, updateRole.isPending]
  );

  // useReactTable uses interior mutability; React Compiler skips this component (see react.dev/reference/eslint-plugin-react-hooks/lints/incompatible-library)
  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table API; safe to suppress
  const table = useReactTable({
    data: users,
    columns,
    getRowId: (row) => row.id,
    state: { sorting, globalFilter, rowSelection },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: (row) => canDelete(row.original),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
    globalFilterFn: (row, _columnId, value) => {
      if (!value || typeof value !== "string") return true;
      const v = value.toLowerCase();
      const u = row.original;
      return (
        u.name.toLowerCase().includes(v) ||
        u.role.toLowerCase().includes(v) ||
        u.id.toLowerCase().includes(v)
      );
    },
  });

  const pageRows = table.getRowModel().rows;
  const filteredRowCount = table.getFilteredRowModel().rows.length;
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;

  const confirmDeleteUser = useCallback(() => {
    if (!currentUser || !userToDelete) return;
    deleteUser.mutate(
      { userId: currentUser.id, targetUserId: userToDelete.id },
      {
        onSuccess: () => {
          toast.success("User deleted successfully.", {
            position: "top-right",
          });
          setUserToDelete(null);
        },
        onError: (e: Error) => {
          toast.error(e.message, { position: "top-right" });
        },
        onSettled: () => setUserToDelete(null),
      }
    );
  }, [currentUser, userToDelete, deleteUser]);

  const confirmBulkDelete = useCallback(() => {
    const rows = table.getFilteredSelectedRowModel().rows;
    const ids = rows.map((r) => r.original.id);
    if (ids.length === 0) {
      setBulkDeleteOpen(false);
      return;
    }
    Promise.all(
      ids.map((id) =>
        deleteUser.mutateAsync({
          userId: currentUser.id,
          targetUserId: id,
        })
      )
    )
      .then(() => {
        toast.success(
          `${ids.length} user${ids.length === 1 ? "" : "s"} deleted successfully.`,
          { position: "top-right" }
        );
        setRowSelection({});
        setBulkDeleteOpen(false);
      })
      .catch((e: Error) => {
        toast.error(e.message ?? "Failed to delete some users.", {
          position: "top-right",
        });
      });
  }, [currentUser.id, table, deleteUser]);

  const handleAddUser = useCallback(
    (data: AddUserFormValues) => {
      const n = data.name.trim();
      const nameLower = n.toLowerCase();
      if (users.some((u) => u.name.trim().toLowerCase() === nameLower)) {
        addUserForm.setError("name", {
          type: "manual",
          message: "A user with this name already exists.",
        });
        return;
      }
      createUser.mutate(
        { userId: currentUser.id, name: n, role: data.role },
        {
          onSuccess: () => {
            addUserForm.reset({ name: "", role: "user" });
            setAddOpen(false);
            toast.success("User created successfully.", {
              position: "top-right",
            });
          },
          onError: (e: Error) => {
            addUserForm.setError("root", { message: e.message });
            toast.error(e.message, { position: "top-right" });
          },
        }
      );
    },
    [users, createUser, currentUser.id, addUserForm]
  );

  if (error) {
    return (
      <p className="text-destructive py-4 text-sm">{error.message}</p>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-9 w-full sm:max-w-xs sm:w-64" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
        <TableSkeleton columnCount={4} rowCount={10} />
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
      <Dialog open={!!userToDelete} onOpenChange={(o) => !o && setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete user</DialogTitle>
            <DialogDescription>
              This will permanently remove <strong>{userToDelete?.name}</strong> and
              all their bookings. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteUser}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search by name or role…"
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
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              try {
                await api.users.exportCsv(currentUser.id);
                toast.success("CSV downloaded.", { position: "top-right" });
              } catch (e) {
                toast.error((e as Error).message ?? "Export failed.", {
                  position: "top-right",
                });
              }
            }}
            className="gap-2"
            title="Download all users as CSV"
          >
            <Download className="size-4" />
            Download CSV
          </Button>
          <Dialog
            open={addOpen}
            onOpenChange={(open) => {
              setAddOpen(open);
              if (!open) {
                addUserForm.reset({ name: "", role: "user" });
                addUserForm.clearErrors();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                Add user
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add user</DialogTitle>
                <DialogDescription>
                  Create a new user and assign a role.
                </DialogDescription>
              </DialogHeader>
              <form
                id="add-user-form"
                onSubmit={addUserForm.handleSubmit(handleAddUser)}
                className="grid gap-4 py-4"
              >
                <FieldGroup>
                  <Controller
                    name="name"
                    control={addUserForm.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={!!fieldState.invalid}>
                        <FieldLabel htmlFor="add-user-name">Name</FieldLabel>
                        <Input
                          {...field}
                          id="add-user-name"
                          placeholder="Display name"
                          aria-invalid={fieldState.invalid}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                  <Controller
                    name="role"
                    control={addUserForm.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={!!fieldState.invalid}>
                        <FieldLabel htmlFor="add-user-role">Role</FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger id="add-user-role">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLES.map((r) => (
                              <SelectItem key={r} value={r}>
                                {r}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>
                {addUserForm.formState.errors.root && (
                  <p className="text-destructive text-sm">
                    {addUserForm.formState.errors.root.message}
                  </p>
                )}
              </form>
              <DialogFooter>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    addUserForm.reset({ name: "", role: "user" });
                    addUserForm.clearErrors();
                    setAddOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="add-user-form"
                  disabled={createUser.isPending}
                >
                  {createUser.isPending ? "Creating…" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Dialog open={bulkDeleteOpen} onOpenChange={(o) => !o && setBulkDeleteOpen(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete selected users</DialogTitle>
            <DialogDescription>
              This will permanently remove {selectedCount} user
              {selectedCount === 1 ? "" : "s"} and all their bookings. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmBulkDelete}
              disabled={deleteUser.isPending}
            >
              {deleteUser.isPending ? "Deleting…" : "Delete"}
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
                          header.getContext()
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
                        cell.getContext()
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
                  {users.length === 0
                    ? "No users yet. Add one above."
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
              of <strong>{filteredRowCount}</strong> users
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
