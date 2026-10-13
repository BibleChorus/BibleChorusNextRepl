import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AuthButtons() {
  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="ghost" className="hidden sm:inline-flex">
        <Link href="/login?view=login">Log in</Link>
      </Button>
      <Button asChild size="sm" className="rounded-full px-4">
        <Link href="/login?view=signup">
          <span className="sm:hidden">Join</span>
          <span className="hidden sm:inline">Join the community</span>
        </Link>
      </Button>
    </div>
  );
}
