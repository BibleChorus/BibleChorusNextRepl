import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from "@/components/icons";

export function AuthButtons() {
  return (
    <div className="flex space-x-2">
      <Link href="/login?view=login">
        <Button variant="outline" className="sm:w-auto">
          <Icons.login className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Login</span>
        </Button>
      </Link>
      <Link href="/login?view=signup">
        <Button className="sm:w-auto">
          <Icons.userPlus className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Sign Up</span>
        </Button>
      </Link>
    </div>
  );
}
