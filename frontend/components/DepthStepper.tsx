import type { DepthLevel } from "@/lib/types";

const DEPTH_ORDER: DepthLevel[] = ["aware", "used", "owned", "led"];

function ordinal(depth: DepthLevel | null): number {
  return depth ? DEPTH_ORDER.indexOf(depth) : -1;
}

/** The 4-segment Aware->Used->Owned->Led bar used for both "Job Wants" and "Your Resume" rows. */
export function DepthStepper({
  label,
  depth,
  filledClassName,
  labelClassName,
}: {
  label: string;
  depth: DepthLevel | null;
  filledClassName: string;
  labelClassName: string;
}) {
  const filled = ordinal(depth) + 1;

  return (
    <div className="flex items-center gap-4">
      <span className="w-24 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider shrink-0">
        {label}
      </span>
      <div className="flex-1 flex gap-1 h-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex-1 ${i < filled ? filledClassName : "bg-surface-variant"} ${i === 0 ? "rounded-l-full" : ""} ${i === 3 ? "rounded-r-full" : ""}`}
          />
        ))}
      </div>
      <span className={`w-16 text-right font-label-sm text-label-sm font-bold uppercase shrink-0 ${labelClassName}`}>
        {depth ?? "none"}
      </span>
    </div>
  );
}
