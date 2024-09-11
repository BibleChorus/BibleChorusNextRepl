import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function AuthButtons() {
  return (
    <div className="flex space-x-2">
      <Link href="/login?view=login">
        <Button variant="outline">Login</Button>
      </Link>
      <Link href="/login?view=signup">
        <Button>Sign Up</Button>
      </Link>
    </div>
  );
}