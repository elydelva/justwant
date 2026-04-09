import { PackageSwitcher } from "@/components/PackageSwitcher";
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
      nav={{ title: "@justwant" }}
      sidebar={{ tabs: false, banner: <PackageSwitcher /> }}
    >
      {children}
    </DocsLayout>
  );
}
