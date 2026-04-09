"use client";

import { PACKAGES } from "@/lib/packages";
import { usePathname, useRouter } from "next/navigation";

export function PackageSelector() {
  const pathname = usePathname();
  const router = useRouter();

  const current = PACKAGES.find((p) => pathname.startsWith(`/docs/${p.key}`));

  return (
    <select
      value={current?.key ?? ""}
      onChange={(e) => {
        if (e.target.value) router.push(`/docs/${e.target.value}`);
      }}
      className="h-8 rounded-md border border-fd-border bg-fd-background px-2 text-sm text-fd-foreground"
    >
      {PACKAGES.map((pkg) => (
        <option key={pkg.key} value={pkg.key}>
          {pkg.label}
        </option>
      ))}
    </select>
  );
}
