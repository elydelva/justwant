import { PackageSelector } from "@/components/PackageSelector";
import { isValidPackage, sources } from "@/lib/sources";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { notFound } from "next/navigation";

type Props = {
  children: React.ReactNode;
  params: Promise<{ pkg: string }>;
};

export default async function Layout({ children, params }: Props) {
  const { pkg } = await params;
  if (!isValidPackage(pkg)) notFound();

  const source = sources[pkg];

  return (
    <DocsLayout
      tree={source.getPageTree()}
      nav={{
        title: (
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-fd-muted-foreground">@justwant</span>
            <PackageSelector />
          </div>
        ),
      }}
    >
      {children}
    </DocsLayout>
  );
}
