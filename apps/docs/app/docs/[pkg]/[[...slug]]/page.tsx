import { isValidPackage, sources } from "@/lib/sources";
import { getMDXComponents } from "@/mdx-components";
import { createRelativeLink } from "fumadocs-ui/mdx";
import { DocsBody, DocsDescription, DocsPage, DocsTitle } from "fumadocs-ui/page";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ pkg: string; slug?: string[] }>;
};

export default async function Page(props: PageProps) {
  const params = await props.params;
  const { pkg, slug } = params;

  if (!isValidPackage(pkg)) notFound();

  const source = sources[pkg];
  const page = source.getPage(slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <DocsBody>
        <MDX
          components={getMDXComponents({
            a: createRelativeLink(source, page),
          })}
        />
      </DocsBody>
    </DocsPage>
  );
}

export async function generateStaticParams() {
  const allParams: { pkg: string; slug?: string[] }[] = [];

  const pkgKeys = [
    "cache",
    "flag",
    "permission",
    "lock",
    "job",
    "crypto",
    "storage",
    "notify",
    "event",
    "db",
    "user",
    "organisation",
    "membership",
    "waitlist",
    "referral",
    "env",
    "id",
  ] as const;

  for (const pkg of pkgKeys) {
    const source = sources[pkg];
    const pages = source.generateParams();
    for (const p of pages) {
      allParams.push({ pkg, ...p });
    }
  }

  return allParams;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  const { pkg, slug } = params;

  if (!isValidPackage(pkg)) notFound();

  const source = sources[pkg];
  const page = source.getPage(slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
