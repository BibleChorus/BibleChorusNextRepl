import Link from "next/link";
import Image from "next/image";
import { Menu } from "lucide-react";
import { useSidebar } from "@/contexts/SidebarContext";
import { SearchInput } from "@/components/SearchInput";
import { AuthButtons } from "@/components/AuthButtons";
import { UserDropdown } from "@/components/UserDropdown";
import { useAuth } from "@/contexts/AuthContext";
import Sidebar from "@/components/Sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

export default function Layout({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const { user } = useAuth();
  const { isOpen, setIsOpen, isMobileOpen, setIsMobileOpen } = useSidebar();
  const { currentSong } = useMusicPlayer();
  const toggleNavigation = () => {
    if (window.matchMedia("(min-width: 1024px)").matches) setIsOpen(!isOpen);
    else setIsMobileOpen(!isMobileOpen);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <Sidebar />
      <div
        className={`min-w-0 transition-[margin] duration-200 ${isOpen ? "lg:ml-64" : "lg:ml-20"}`}
      >
        <header
          className={`fixed inset-x-0 top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl transition-[left] duration-200 ${isOpen ? "lg:left-64" : "lg:left-20"}`}
        >
          <div className="flex h-[72px] items-center gap-3 px-4 sm:gap-5 sm:px-8">
            <button
              type="button"
              className="icon-button lg:hidden"
              onClick={toggleNavigation}
              aria-label="Open navigation"
              aria-expanded={isMobileOpen}
              aria-controls="mobile-navigation"
            >
              <Menu className="h-5 w-5" />
            </button>
            <Link
              href="/"
              className="shrink-0 lg:hidden"
              aria-label="BibleChorus home"
            >
              <Image
                src="/biblechorus-icon.png"
                alt=""
                width={32}
                height={32}
              />
            </Link>
            <div className="min-w-0 flex-1">
              <SearchInput />
            </div>
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              <ThemeToggle />
              {user ? <UserDropdown user={user} /> : <AuthButtons />}
            </div>
          </div>
        </header>
        <main
          id="main-content"
          tabIndex={-1}
          className={`mx-auto max-w-[1600px] px-4 pt-28 sm:px-8 lg:px-10 ${currentSong ? "pb-52 sm:pb-40" : "pb-16"} ${className}`}
        >
          {children}
        </main>
        <footer
          className={`mx-4 border-t border-border py-6 text-xs text-muted-foreground sm:mx-8 ${currentSong ? "pb-44" : ""}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>Scripture, song, and the stories between.</span>
            <Link href="/how-to" className="hover:text-foreground">
              A little help getting started →
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
