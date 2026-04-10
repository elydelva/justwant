import { PACKAGES } from "@/lib/packages";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-2 text-3xl font-bold">@justwant</h1>
      <p className="mb-8 text-neutral-500">
        TypeScript-first library ecosystem. Backend + database + storage = complete platform.
      </p>
      <div className="grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PACKAGES.map((pkg) => (
          <Link
            key={pkg.key}
            href={`/docs/${pkg.key}`}
            className="rounded-lg border border-neutral-200 p-4 hover:border-neutral-400 dark:border-neutral-800 dark:hover:border-neutral-600"
          >
            <div className="mb-1 font-mono text-sm font-semibold">{pkg.label}</div>
            <div className="text-sm text-neutral-500">{pkg.description}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
