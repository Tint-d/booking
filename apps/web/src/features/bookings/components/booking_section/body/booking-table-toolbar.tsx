import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import CreateDialog from "../create-dialog";
import type { SummaryRow } from "./table.constants";
import { downloadSummaryCsv } from "./table.constants";

type ViewMode = "all" | "grouped" | "summary";

interface BookingTableToolbarProps {
  mode: ViewMode;
  searchInput: string;
  onSearchChange: (value: string) => void;
  selectedCount: number;
  onBulkDeleteClick: () => void;
  userId: string;
  filteredSummaryRows: SummaryRow[];
  summaryTotal: number;
}

export function BookingTableToolbar({
  mode,
  searchInput,
  onSearchChange,
  selectedCount,
  onBulkDeleteClick,
  userId,
  filteredSummaryRows,
  summaryTotal,
}: BookingTableToolbarProps) {
  return (
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
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-4"
        />
      </div>
      <div className="flex items-center gap-2">
        {mode !== "summary" && selectedCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={onBulkDeleteClick}
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
  );
}
