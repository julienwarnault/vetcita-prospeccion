import { useId } from "react";
import { RadioGroup } from "radix-ui";
import { cva } from "class-variance-authority";

const choiceVariants = cva(
  "relative flex min-h-[46px] min-w-[76px] items-center justify-center rounded-[10px] border border-[#e4e0eb] bg-white px-[17px] py-2.5 text-[13px] text-[#716b7e] cursor-pointer data-[state=checked]:border-[#8b70db] data-[state=checked]:bg-[#f1ecff] data-[state=checked]:text-[#6849bb] focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-[#b6a1ec] disabled:cursor-not-allowed disabled:opacity-60 max-[800px]:min-w-0 max-[800px]:px-2 max-[420px]:text-xs",
);

export default function Choices<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly T[];
  onChange: (value: T) => void;
}) {
  const id = useId();
  return (
    <fieldset className="mb-6 min-w-0 border-0 p-0">
      <legend id={id} className="mb-[9px] p-0 text-xs font-bold text-[#625d6e]">
        {label}
      </legend>
      <RadioGroup.Root
        aria-labelledby={id}
        value={value}
        onValueChange={(value) => {
          const option = options.find((option) => option === value);
          if (option !== undefined) onChange(option);
        }}
        className="flex flex-wrap gap-2 max-[800px]:grid max-[800px]:grid-cols-2"
      >
        {options.map((option) => (
          <RadioGroup.Item
            key={option}
            value={option}
            className={choiceVariants()}
          >
            {option}
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </fieldset>
  );
}
