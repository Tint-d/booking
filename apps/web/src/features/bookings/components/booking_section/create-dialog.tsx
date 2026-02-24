import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useBookingCreateMutation } from "@/features/bookings/hooks/bookings";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useBookingContext } from "./booking-context";

function parseTime(s: string): { hours: number; minutes: number } {
  if (!s?.trim()) return { hours: 0, minutes: 0 };
  const [h, m] = s.split(":").map(Number);
  return { hours: Number.isNaN(h) ? 0 : h, minutes: Number.isNaN(m) ? 0 : m };
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Booking.CreateDialog – Trigger + dialog for creating a booking
 */
function CreateDialog() {
  const { userId } = useBookingContext();
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [startTimeStr, setStartTimeStr] = useState("");
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [endTimeStr, setEndTimeStr] = useState("");

  const createBooking = useBookingCreateMutation();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setStartDate(undefined);
      setEndDate(undefined);
      setStartTimeStr("");
      setEndTimeStr("");
    }
  };

  /** User-friendly message for API errors (e.g. overlap) */
  function getErrorMessage(e: Error): string {
    const msg = e.message ?? "";
    if (/overlap|conflicting/i.test(msg)) {
      return "This booking overlaps with an existing booking. Please choose a different date or time.";
    }
    return msg || "Something went wrong. Please try again.";
  }

  const handleCreate = () => {
    if (!startDate || !endDate) {
      toast.error("Start and end date required.", { position: "top-right" });
      return;
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const { hours: sh, minutes: sm } = parseTime(startTimeStr);
    const { hours: eh, minutes: em } = parseTime(endTimeStr);
    start.setHours(sh, sm, 0, 0);
    end.setHours(eh, em, 0, 0);
    if (start >= end) {
      toast.error("Start must be before end.", { position: "top-right" });
      return;
    }
    createBooking.mutate(
      {
        userId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
      {
        onSuccess: () => {
          setStartDate(undefined);
          setEndDate(undefined);
          setStartTimeStr("");
          setEndTimeStr("");
          toast.success("Booking created successfully.", {
            position: "top-right",
          });
          setOpen(false);
        },
        onError: (e: Error) => {
          toast.error(getErrorMessage(e), { position: "top-right" });
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          Create Booking
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New booking</DialogTitle>
          <DialogDescription>
            Choose start and end date and time (no overlapping slots).
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-muted-foreground text-sm">
                Start date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {startDate ? format(startDate, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    defaultMonth={startDate ?? startOfToday()}
                    disabled={{ before: startOfToday() }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <label className="text-muted-foreground text-sm">
                Start time
              </label>
              <Input
                className="cursor-pointer"
                type="time"
                value={startTimeStr}
                onChange={(e) => setStartTimeStr(e.target.value)}
                step="900"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-muted-foreground text-sm">End date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {endDate ? format(endDate, "PPP") : "Pick date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    defaultMonth={endDate ?? startDate ?? startOfToday()}
                    disabled={{ before: startOfToday() }}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <label className="text-muted-foreground text-sm">End time</label>
              <Input
                className="cursor-pointer"
                type="time"
                value={endTimeStr}
                onChange={(e) => setEndTimeStr(e.target.value)}
                step="900"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={createBooking.isPending}>
            {createBooking.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateDialog;
