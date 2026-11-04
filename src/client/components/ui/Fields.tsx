import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

const field =
  "block w-full min-w-0 rounded-[9px] border border-[#e7e5ed] bg-white p-3 text-[#393547] font-normal outline-none focus:border-[#a58be5] disabled:cursor-not-allowed disabled:opacity-60 max-[800px]:min-h-12 max-[800px]:text-base";
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={twMerge(field, className)} {...props} />;
}
export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={twMerge(field, className)} {...props} />;
}
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={twMerge(field, "min-h-[100px] resize-y", className)}
      {...props}
    />
  );
}
export function Field({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={twMerge(
        "mb-[18px] block text-xs font-bold text-[#625d6e] [&_input]:mt-2 [&_select]:mt-2 [&_textarea]:mt-2",
        className,
      )}
      {...props}
    />
  );
}
