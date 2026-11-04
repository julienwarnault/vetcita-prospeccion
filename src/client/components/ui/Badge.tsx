import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

const badgeVariants = cva("whitespace-nowrap rounded-full font-bold", {
  variants: {
    tone: {
      default: "bg-[#f4f2f7] text-[#8d8999]",
      success: "bg-[#e6f5ed] text-[#529674]",
    },
    size: {
      default: "px-2.5 py-1.5 text-[10px]",
      large: "px-[13px] py-[9px] text-xs max-[420px]:text-[10px]",
    },
  },
  defaultVariants: { tone: "default", size: "default" },
});
export default function Badge({
  tone,
  size,
  className,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      className={twMerge(badgeVariants({ tone, size }), className)}
      {...props}
    />
  );
}
