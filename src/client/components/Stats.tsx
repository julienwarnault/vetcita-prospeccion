import type { ReactNode } from "react";
import { cva } from "class-variance-authority";

const statsVariants = cva("grid grid-cols-3 gap-3.5 max-[800px]:gap-2", {
  variants: {
    compact: {
      true: "mt-[26px] mb-[30px] max-[800px]:mt-[22px] max-[800px]:mb-[26px]",
      false: "mt-[34px] mb-12 max-[800px]:mt-[25px] max-[800px]:mb-[35px]",
    },
  },
  defaultVariants: { compact: false },
});
export default function Stats({
  items,
  compact = false,
}: {
  items: { label: string; value: ReactNode }[];
  compact?: boolean;
}) {
  return (
    <div className={statsVariants({ compact })}>
      {items.map(({ label, value }) => (
        <div
          key={label}
          className={`flex min-w-0 flex-col rounded-[15px] border border-[#efedf3] bg-white ${compact ? "px-5 py-4 max-[800px]:px-[11px] max-[800px]:py-[13px]" : "min-h-[126px] px-6 py-[22px] max-[800px]:min-h-[102px] max-[800px]:px-3 max-[800px]:py-[15px]"}`}
        >
          <small className="block text-[10px] font-bold leading-[1.35] tracking-[1px] wrap-anywhere text-[#a6a2af] max-[800px]:text-[8px] max-[420px]:tracking-[.045em]">
            {label}
          </small>
          <strong
            className={`block font-display text-[29px] font-extrabold text-[#343047] max-[800px]:text-[22px] ${compact ? "mt-auto pt-2 tabular-nums max-[420px]:text-[clamp(18px,5.3vw,22px)]" : "mt-2.5 mb-1"}`}
          >
            {value}
          </strong>
        </div>
      ))}
    </div>
  );
}
