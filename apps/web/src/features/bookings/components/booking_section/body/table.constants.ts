export const PAGE_SIZE = 10;
export const SORT_FIELDS = ["startTime", "endTime", "createdAt", "userId"] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export type SummaryRow = { id: string; name: string; count: number };

export function downloadSummaryCsv(rows: SummaryRow[], total: number): void {
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
