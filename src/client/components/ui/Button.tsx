import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import { twMerge } from "tailwind-merge";

export const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 border-0 text-xs font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "rounded-[9px] bg-primary px-[18px] py-[13px] text-white hover:bg-[#6849bb]",
        text: "bg-transparent p-0 text-[#7557c6] hover:text-[#564098]",
        back: "bg-transparent p-0 text-[#7d63c5] hover:text-[#564098]",
      },
      size: { default: "", touch: "min-h-12 shrink-0 text-sm" },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

type Props = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };
export default function Button({
  asChild,
  variant,
  size,
  className,
  type = "button",
  ...props
}: Props) {
  const Component = asChild ? Slot.Root : "button";
  return (
    <Component
      type={asChild ? undefined : type}
      className={twMerge(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
