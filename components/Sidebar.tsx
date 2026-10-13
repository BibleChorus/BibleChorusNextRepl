import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Headphones,
  Map,
  ListMusic,
  TrendingUp,
  MessageSquare,
  FileText,
  Upload,
  User,
  HelpCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const sections = [
  {
    label: "Discover",
    links: [
      { label: "Listen", href: "/listen", icon: Headphones },
      { label: "Journeys", href: "/journeys", icon: Map },
      { label: "Playlists", href: "/playlists", icon: ListMusic },
      { label: "Scripture coverage", href: "/progress", icon: TrendingUp },
    ],
  },
  {
    label: "Connect & create",
    links: [
      { label: "Forum", href: "/forum", icon: MessageSquare },
      { label: "Bible study", href: "/pdfs", icon: FileText },
      { label: "Upload a song", href: "/upload", icon: Upload },
    ],
  },
  {
    label: "Your space",
    links: [
      { label: "Profile", href: "/profile", icon: User },
      { label: "How to", href: "/how-to", icon: HelpCircle },
    ],
  },
];

export default function Sidebar() {
  const { isOpen, setIsOpen, isMobileOpen, setIsMobileOpen } = useSidebar();
  const router = useRouter();
  const navigation = (expanded: boolean) => (
    <nav aria-label="Main navigation" className="space-y-7">
      {sections.map((section) => (
        <div key={section.label}>
          <p
            className={cn(
              "mb-2 px-3 text-[10px] font-semibold uppercase tracking-[.17em] text-muted-foreground",
              !expanded && "sr-only",
            )}
          >
            {section.label}
          </p>
          <div className="space-y-1">
            {section.links.map(({ label, href, icon: Icon }) => {
              const active =
                router.pathname === href ||
                router.pathname.startsWith(`${href}/`) ||
                (href === "/listen" && router.pathname.startsWith("/Songs/")) ||
                (href === "/forum" && router.pathname.startsWith("/Forum/"));
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setIsMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  title={!expanded ? label : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    !expanded && "justify-center",
                  )}
                >
                  <Icon
                    className="h-[18px] w-[18px] shrink-0"
                    aria-hidden="true"
                  />
                  <span className={!expanded ? "sr-only" : ""}>{label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
  const brand = (expanded: boolean) => (
    <Link
      href="/"
      className="flex h-[72px] items-center gap-3 px-2"
      aria-label="BibleChorus home"
    >
      <Image src="/biblechorus-icon.png" width={36} height={36} alt="" />
      <span
        className={cn(
          "font-serif text-xl tracking-tight",
          !expanded && "sr-only",
        )}
      >
        BibleChorus
      </span>
    </Link>
  );
  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 hidden flex-col border-r border-border bg-card px-3 lg:flex",
          isOpen ? "w-64" : "w-20",
        )}
      >
        {brand(isOpen)}
        <div className="flex-1 overflow-y-auto py-6">{navigation(isOpen)}</div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Collapse navigation" : "Expand navigation"}
          className="my-4 flex min-h-11 items-center justify-center gap-3 rounded-xl border border-border px-3 text-xs text-muted-foreground hover:bg-muted"
        >
          {isOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
          {isOpen && "A little more room"}
        </button>
      </aside>
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent
          side="left"
          id="mobile-navigation"
          className="w-72 overflow-y-auto bg-card px-5"
        >
          <SheetTitle className="sr-only">BibleChorus navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Explore music, journeys, and community.
          </SheetDescription>
          {brand(true)}
          <div className="py-5">{navigation(true)}</div>
        </SheetContent>
      </Sheet>
    </>
  );
}
