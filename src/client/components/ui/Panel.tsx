import type { ComponentProps } from "react";
import { cva } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

export const panelVariants = cva(
  "mb-[15px] rounded-[15px] border border-[#eeedf3] bg-white p-[25px] max-[800px]:p-5 [&_h2]:mb-5 [&_h2]:text-[17px]",
);
export default function Panel({
  className,
  ...props
}: ComponentProps<"section">) {
  return <section className={twMerge(panelVariants(), className)} {...props} />;
}
