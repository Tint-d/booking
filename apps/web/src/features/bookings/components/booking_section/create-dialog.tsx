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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useBookingCreateMutation } from "@/features/bookings/hooks/bookings";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useBookingContext } from "./booking-context";

function parseTime(s: string): { hours: number; minutes: number } {
  if (!s?.trim()) return { hours: 0, minutes: 0 };
  const [h, m] = s.split(":").map(Number);
  return { hours: Number.isNaN(h) ? 0 : h, minutes: Number.isNaN(m) ? 0 : m };
}

function combine(date: Date, timeStr: string): Date {
  const d = new Date(date);
  const { hours, minutes } = parseTime(timeStr);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const bookingFormSchema = z
  .object({
    startDate: z.date().optional(),
    startTime: z.string().min(1, { message: "Start time is required." }),
    endDate: z.date().optional(),
    endTime: z.string().min(1, { message: "End time is required." }),
  })
  .refine((d) => d.startDate != null, {
    message: "Start date is required.",
    path: ["startDate"],
  })
  .refine((d) => d.endDate != null, {
    message: "End date is required.",
    path: ["endDate"],
  })
  .refine(
    (d) => {
      if (d.startDate == null || d.endDate == null) return true;
      const start = combine(d.startDate, d.startTime);
      const end = combine(d.endDate, d.endTime);
      return start < end;
    },
    { message: "Start must be before end.", path: ["endTime"] }
  );

type BookingFormValues = z.infer<typeof bookingFormSchema>;

/**
 * Booking.CreateDialog – Trigger + dialog for creating a booking
 */
function CreateDialog() {
  const { userId } = useBookingContext();
  const [open, setOpen] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    mode: "onTouched",
    defaultValues: {
      startDate: undefined,
      startTime: "",
      endDate: undefined,
      endTime: "",
    },
  });

  const createBooking = useBookingCreateMutation();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      form.reset({
        startDate: undefined,
        startTime: "",
        endDate: undefined,
        endTime: "",
      });
    }
  };

  function getErrorMessage(e: Error): string {
    const msg = e.message ?? "";
    if (/overlap|conflicting/i.test(msg)) {
      return "This booking overlaps with an existing booking. Please choose a different date or time.";
    }
    return msg || "Something went wrong. Please try again.";
  }

  function onSubmit(data: BookingFormValues) {
    const startDate = data.startDate!;
    const endDate = data.endDate!;
    const start = combine(startDate, data.startTime);
    const end = combine(endDate, data.endTime);
    createBooking.mutate(
      {
        userId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      },
      {
        onSuccess: () => {
          form.reset({
            startDate: undefined,
            startTime: "",
            endDate: undefined,
            endTime: "",
          });
          toast.success("Booking created successfully.", {
            position: "top-right",
          });
          setOpen(false);
        },
        onError: (e: Error) => {
          toast.error(getErrorMessage(e), { position: "top-right" });
        },
      }
    );
  }

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
        <form
          id="create-booking-form"
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid gap-4 py-4"
        >
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="startDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.invalid}>
                    <FieldLabel>Start date</FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            fieldState.invalid && "border-destructive ring-destructive/20"
                          )}
                          type="button"
                          aria-invalid={fieldState.invalid}
                        >
                          <CalendarIcon className="mr-2 size-4" />
                          {field.value
                            ? format(field.value, "PPP")
                            : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          defaultMonth={field.value ?? startOfToday()}
                          disabled={{ before: startOfToday() }}
                        />
                      </PopoverContent>
                    </Popover>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="startTime"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.invalid}>
                    <FieldLabel>Start time</FieldLabel>
                    <Input
                      {...field}
                      type="time"
                      step="900"
                      className="cursor-pointer"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="endDate"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.invalid}>
                    <FieldLabel>End date</FieldLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            fieldState.invalid && "border-destructive ring-destructive/20"
                          )}
                          type="button"
                          aria-invalid={fieldState.invalid}
                        >
                          <CalendarIcon className="mr-2 size-4" />
                          {field.value
                            ? format(field.value, "PPP")
                            : "Pick date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          defaultMonth={
                            field.value ??
                            form.getValues("startDate") ??
                            startOfToday()
                          }
                          disabled={{ before: startOfToday() }}
                        />
                      </PopoverContent>
                    </Popover>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="endTime"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={!!fieldState.invalid}>
                    <FieldLabel>End time</FieldLabel>
                    <Input
                      {...field}
                      type="time"
                      step="900"
                      className="cursor-pointer"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-booking-form"
            disabled={createBooking.isPending}
          >
            {createBooking.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateDialog;
