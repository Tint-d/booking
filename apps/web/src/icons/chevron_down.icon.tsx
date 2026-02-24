import { cn } from "@/lib/utils";

const ChevronDownIcon = ({
  active,
  className,
}: {
  active: "up" | "down" | undefined;
  className?: string;
}) => {
  return (
    <svg
      width="9"
      height="6"
      viewBox="0 0 9 6"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        className={cn(active === "down" ? "fill-accent-1" : "fill-text-3")}
        d="M4.79072 4.4957H4.78799L4.64154 4.64215C4.49501 4.78868 4.25651 4.78868 4.10998 4.64215L0.609977 1.14215C0.501843 1.03402 0.470412 0.875023 0.52929 0.733714C0.589065 0.590255 0.725298 0.5 0.877127 0.5H7.87713C8.02712 0.5 8.16553 0.591086 8.22496 0.733714C8.28264 0.872134 8.25205 1.03256 8.14314 1.14328C8.14288 1.14355 8.14262 1.14382 8.14235 1.14409L4.79072 4.4957Z"
      />
    </svg>
  );
};

export default ChevronDownIcon;
