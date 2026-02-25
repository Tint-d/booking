import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortableHeader } from "@/features/bookings/components/booking_section/body/sortable-header";
import type { ColumnDef } from "@tanstack/react-table";
import { Trash2 } from "lucide-react";
import type { Role, User } from "../hooks/users";

const ROLES: Role[] = ["admin", "owner", "user"];

export function getUserColumns(
  currentUserId: string,
  canDelete: (u: User) => boolean,
  onDelete: (u: User) => void,
  onRoleChange: (user: User, role: Role) => void,
  isUpdating: boolean
): ColumnDef<User>[] {
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
      accessorKey: "name",
      header: ({ column }) => (
        <SortableHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name}</span>
      ),
      sortingFn: (a, b) =>
        (a.original.name ?? "").localeCompare(b.original.name ?? ""),
    },
    {
      accessorKey: "role",
      header: ({ column }) => (
        <SortableHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const u = row.original;
        return (
          <Select
            value={u.role}
            onValueChange={(v) => onRoleChange(u, v as Role)}
            disabled={u.id === currentUserId || isUpdating}
          >
            <SelectTrigger className="w-[120px]">
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
        );
      },
      enableSorting: true,
      sortingFn: (a, b) =>
        (a.original.role ?? "").localeCompare(b.original.role ?? ""),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const u = row.original;
        if (!canDelete(u)) return null;
        return (
          <Button
            variant="ghost"
            size="icon-xs"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(u)}
            aria-label="Delete user"
          >
            <Trash2 className="size-4" />
          </Button>
        );
      },
      enableSorting: false,
    },
  ];
}
