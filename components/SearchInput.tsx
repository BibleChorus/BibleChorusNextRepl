import { useState } from "react";
import { useRouter } from "next/router";
import { Search } from "lucide-react";

export function SearchInput() {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (search.trim()) {
      router.push({ pathname: "/listen", query: { search: search.trim() } });
      setSearch("");
    }
  };
  return (
    <form role="search" onSubmit={submit} className="w-full max-w-xl">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <label htmlFor="global-search" className="sr-only">
          Search songs, lyrics, or scripture
        </label>
        <input
          id="global-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search music & scripture"
          className="h-11 w-full rounded-full border border-border bg-muted/40 pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/15"
        />
      </div>
    </form>
  );
}
