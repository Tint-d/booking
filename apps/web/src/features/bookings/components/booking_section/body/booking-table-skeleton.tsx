import { Skeleton } from "@/components/ui/skeleton";
import { TableSkeleton } from "@/components/ui/table-skeleton";

interface BookingTableSkeletonProps {
  isSummary: boolean;
}

export function BookingTableSkeleton({ isSummary }: BookingTableSkeletonProps) {
  const colCount = isSummary ? 2 : 5;
  const rowCount = isSummary ? 6 : 10;
  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Skeleton className="h-9 w-full sm:max-w-xs sm:w-64" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-28" />
        </div>
      </div>
      <TableSkeleton columnCount={colCount} rowCount={rowCount} />
      {!isSummary && (
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
