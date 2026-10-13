import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import db from "@/db";
import { getAuthenticatedUser } from "@/lib/server-auth";
import { Pdf } from "@/types";
import {
  ArrowUpRight,
  BookCheck,
  BookOpen,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import type { GetServerSideProps, NextApiRequest, NextApiResponse } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || "";
const getImageUrl = (path: string) =>
  /^https?:\/\//.test(path) ? path : CDN_URL ? `${CDN_URL}${path}` : `/${path}`;
interface PdfWithUser extends Pdf {
  username: string;
}

export default function PdfDashboard({
  pdfs,
  loadError = false,
}: {
  pdfs: PdfWithUser[];
  loadError?: boolean;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return pdfs.filter(
      (pdf) =>
        pdf.title.toLowerCase().includes(term) ||
        pdf.author?.toLowerCase().includes(term) ||
        pdf.themes.some((theme) => theme.toLowerCase().includes(term)),
    );
  }, [pdfs, search]);

  return (
    <>
      <Head>
        <title>Study library · BibleChorus</title>
        <meta
          name="description"
          content="Read, reflect, and take notes with the BibleChorus Scripture study library."
        />
      </Head>
      <main className="page-shell">
        <header className="page-header flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="page-eyebrow flex items-center gap-2">
              <BookOpen className="h-4 w-4" /> A little room for reflection
            </p>
            <h1 className="page-title">Go deeper into the Word.</h1>
            <p className="page-description">
              A library of sermons, books, and Scripture. Read at your own pace,
              explore the passages, and keep your thoughts close.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/pdfs/upload">
              <Plus className="mr-2 h-4 w-4" /> Share a resource
            </Link>
          </Button>
        </header>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search study resources"
              placeholder="Search by title, author, or theme…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-12 pl-10"
            />
          </div>
          <p className="shrink-0 text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "resource" : "resources"}{" "}
            to explore
          </p>
        </div>
        {loadError ? (
          <div role="alert" className="surface-card px-6 py-16 text-center">
            <h2 className="text-xl font-semibold">
              The library couldn’t load.
            </h2>
            <p className="mb-5 mt-2 text-muted-foreground">
              Please try again in a moment.
            </p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try again
            </Button>
          </div>
        ) : filtered.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((pdf) => (
              <article
                key={pdf.id}
                className="surface-card group overflow-hidden transition-colors hover:border-primary/30"
              >
                <Link
                  href={`/pdfs/${pdf.id}`}
                  className="flex h-full flex-col rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="relative flex aspect-[16/9] items-center justify-center overflow-hidden bg-secondary">
                    {pdf.image_url ? (
                      <Image
                        src={getImageUrl(pdf.image_url)}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <FileText className="h-14 w-14 text-primary/40" />
                    )}
                    {pdf.is_bible_book && (
                      <Badge
                        variant="secondary"
                        className="absolute right-3 top-3 gap-1 rounded-full"
                      >
                        <BookCheck className="h-3 w-3" /> Scripture
                      </Badge>
                    )}
                    <span className="absolute bottom-3 right-3 rounded-full bg-background/95 p-2 text-foreground">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h2 className="line-clamp-2 text-xl font-semibold tracking-tight group-hover:text-primary">
                      {pdf.title}
                    </h2>
                    {pdf.author && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        by {pdf.author}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {pdf.themes.slice(0, 3).map((theme) => (
                        <Badge
                          variant="secondary"
                          key={theme}
                          className="rounded-full font-normal"
                        >
                          {theme}
                        </Badge>
                      ))}
                      {pdf.themes.length > 3 && (
                        <span className="self-center text-xs text-muted-foreground">
                          +{pdf.themes.length - 3}
                        </span>
                      )}
                    </div>
                    <div className="mt-auto flex items-center justify-between gap-2 pt-5 text-xs text-muted-foreground">
                      <span className="truncate">Shared by {pdf.username}</span>
                      <time dateTime={pdf.created_at} className="shrink-0">
                        {new Date(pdf.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </time>
                    </div>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        ) : (
          <div className="surface-card px-6 py-16 text-center">
            <FileText className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <h2 className="text-xl font-semibold">
              {search
                ? "No resources match your search."
                : "The next chapter starts with you."}
            </h2>
            <p className="mx-auto mb-5 mt-2 max-w-md text-muted-foreground">
              {search
                ? "Try another title, author, or theme."
                : "Share a study resource for the community to read and reflect on."}
            </p>
            {search ? (
              <Button variant="outline" onClick={() => setSearch("")}>
                Clear search
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link href="/pdfs/upload">Share a resource</Link>
              </Button>
            )}
          </div>
        )}
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  try {
    const viewer = await getAuthenticatedUser(
      req as NextApiRequest,
      res as NextApiResponse,
    );
    const pdfs = await db("pdfs")
      .join("users", "pdfs.uploaded_by", "users.id")
      .where(function () {
        this.where("pdfs.is_public", true);
        if (viewer) this.orWhere("pdfs.uploaded_by", viewer.id);
      })
      .select("pdfs.*", "users.username")
      .orderBy("pdfs.created_at", "desc");
    const parsed = pdfs.map((p) => ({
      ...p,
      themes: Array.isArray(p.themes)
        ? p.themes
        : typeof p.themes === "string"
          ? p.themes
              .replace(/^{|}$/g, "")
              .split(",")
              .map((t: string) => t.trim())
          : [],
    }));
    return { props: { pdfs: JSON.parse(JSON.stringify(parsed)) } };
  } catch (error) {
    console.error("Error fetching PDFs:", error);
    return { props: { pdfs: [], loadError: true } };
  }
};
