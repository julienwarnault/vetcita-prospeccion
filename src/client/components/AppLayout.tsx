import type { ReactNode } from "react";
import { cva } from "class-variance-authority";
import {
  Asterisk,
  Building2,
  ChartNoAxesColumn,
  History,
  House,
  LocateFixed,
} from "lucide-react";
import type { Page } from "../model";

const navigation = [
  { page: "home", label: "Inicio", mobileLabel: "Inicio", icon: House },
  {
    page: "near",
    label: "Cerca de mí",
    mobileLabel: "Cerca",
    icon: LocateFixed,
  },
  {
    page: "list",
    label: "Todas las clínicas",
    mobileLabel: "Clínicas",
    icon: Building2,
  },
  {
    page: "history",
    label: "Historial",
    mobileLabel: "Historial",
    icon: History,
  },
  {
    page: "admin",
    label: "Resumen",
    mobileLabel: "Resumen",
    icon: ChartNoAxesColumn,
  },
] satisfies {
  page: Page;
  label: string;
  mobileLabel: string;
  icon: typeof House;
}[];
const navVariants = cva(
  "my-0.5 flex items-center gap-2 rounded-[10px] border-0 px-3.5 py-[13px] text-left font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  {
    variants: {
      active: {
        true: "bg-[#f0ebff] text-[#7355c9]",
        false: "bg-transparent text-[#777586] hover:bg-[#f8f8fb]",
      },
    },
  },
);

export default function AppLayout({
  page,
  go,
  children,
}: {
  page: Page;
  go: (page: Page) => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="fixed flex h-screen w-[235px] shrink-0 flex-col border-r border-[#eeeef3] bg-white px-[18px] py-8 max-[800px]:hidden">
        <div className="flex items-center gap-2.5 px-2 font-display text-2xl font-extrabold tracking-[-1.3px] text-[#564098]">
          <span className="grid size-[35px] place-items-center rounded-[11px] bg-[#8265d9] text-white">
            <Asterisk aria-hidden="true" size={28} />
          </span>
          <span>
            vetcita
            <small className="-mt-[3px] block text-[8px] tracking-[2px] text-[#aaa4b8]">
              PROSPECCIÓN
            </small>
          </span>
        </div>
        <div className="mx-2.5 mt-[55px] mb-3.5 text-[10px] font-bold tracking-[1.6px] text-[#b3b0bd]">
          ESPACIO DE TRABAJO
        </div>
        <nav aria-label="Navegación principal" className="flex flex-col">
          {navigation.map(({ page: target, label, icon: Icon }) => (
            <button
              type="button"
              key={target}
              aria-current={page === target ? "page" : undefined}
              className={navVariants({ active: page === target })}
              onClick={() => go(target)}
            >
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto border-t border-[#efedf3] px-2.5 py-5 text-xs font-bold text-[#6b6779]">
          Ciudad de México
          <br />
          <span className="font-normal leading-[2] text-[#aaa5b5]">
            Tu trabajo, más cerca.
          </span>
        </div>
      </aside>
      <main className="ml-[235px] min-w-0 flex-1 max-[800px]:ml-0">
        <header className="flex h-[76px] items-center justify-end border-b border-[#eeeef3] bg-white px-[6%] text-xs font-semibold text-[#777282] max-[800px]:h-16 max-[800px]:justify-between max-[800px]:px-5">
          <div className="hidden items-center gap-1.5 text-[21px] text-[#7255c5] max-[800px]:flex">
            <Asterisk aria-hidden="true" className="size-6" />
            <b>vetcita</b>
            <span className="text-[11px] text-[#aaa3b2]">/ prospección</span>
          </div>
          <div className="flex items-center gap-3 max-[420px]:gap-[5px]">
            <span
              className="size-1.5 rounded-full bg-[#8fc5ab] max-[800px]:hidden"
              aria-hidden="true"
            />
            <span className="max-[800px]:hidden">Ciudad de México</span>
            <span className="grid size-[34px] place-items-center rounded-full bg-[#eee8ff] font-bold text-[#7355c9]">
              V
            </span>
          </div>
        </header>
        <div className="mx-auto max-w-[1200px] px-[6%] pt-12 pb-[70px] max-[800px]:px-5 max-[800px]:pt-8 max-[800px]:pb-[100px]">
          {children}
        </div>
      </main>
      <nav
        aria-label="Navegación móvil"
        className="fixed inset-x-0 bottom-0 z-[1000] hidden justify-around border-t border-[#eeedf3] bg-white px-[3px] pt-[7px] pb-[max(8px,env(safe-area-inset-bottom))] max-[800px]:flex"
      >
        {navigation.map(({ page: target, mobileLabel, icon: Icon }) => (
          <button
            type="button"
            key={target}
            aria-current={page === target ? "page" : undefined}
            className={`flex min-w-[55px] flex-col items-center border-0 bg-transparent text-[9px] font-bold focus-visible:outline-2 focus-visible:outline-primary ${page === target ? "text-primary" : "text-[#aaa5b4]"}`}
            onClick={() => go(target)}
          >
            <Icon aria-hidden="true" className="mb-[3px] size-[21px]" />
            {mobileLabel}
          </button>
        ))}
      </nav>
    </div>
  );
}
