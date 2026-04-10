"use client";

import { PACKAGES, type PackageCategory } from "@/lib/packages";
import { Popover, PopoverContent, PopoverTrigger } from "fumadocs-ui/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const CATEGORY_ORDER: PackageCategory[] = [
  "Foundation",
  "Data",
  "Auth & Access",
  "Product",
  "Infrastructure",
];

const grouped = CATEGORY_ORDER.map((category) => ({
  category,
  packages: PACKAGES.filter((p) => p.category === category),
}));

function currentPkg(pathname: string): (typeof PACKAGES)[number] | undefined {
  return PACKAGES.find((p) => pathname.startsWith(`/docs/${p.key}`));
}

export function PackageSwitcher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = currentPkg(pathname);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex w-full items-center gap-2 rounded-lg border border-fd-border bg-fd-secondary/50 px-3 py-2 text-sm font-medium text-fd-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground">
        <span className="flex-1 truncate text-left">
          {active ? <span className="capitalize">{active.key}</span> : "Select a package"}
        </span>
        <ChevronsUpDown className="size-4 shrink-0 text-fd-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-1"
        align="start"
        sideOffset={4}
      >
        <div className="max-h-[60vh] overflow-y-auto">
          {grouped.map(({ category, packages }) => (
            <div key={category}>
              <p className="px-2 py-1.5 text-xs font-semibold text-fd-muted-foreground">
                {category}
              </p>
              {packages.map((pkg) => (
                <Link
                  key={pkg.key}
                  href={`/docs/${pkg.key}`}
                  onClick={() => setOpen(false)}
                  className={[
                    "flex flex-col rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground",
                    pkg.key === active?.key
                      ? "bg-fd-accent text-fd-accent-foreground"
                      : "text-fd-foreground",
                  ].join(" ")}
                >
                  <span className="font-medium capitalize">{pkg.key}</span>
                  <span className="text-xs text-fd-muted-foreground">{pkg.description}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
