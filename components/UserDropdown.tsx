import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { LogOut, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface UserDropdownProps {
  user: {
    username: string;
    profile_image_url?: string;
  };
}

export function UserDropdown({ user }: UserDropdownProps) {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getInitial = (username: string) => username.charAt(0).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
          {user.profile_image_url ? (
            <Image
              src={user.profile_image_url}
              alt={user.username}
              className="h-8 w-8 rounded-full"
              width={32}
              height={32}
            />
          ) : (
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-br from-purple-600 to-pink-500">
              {getInitial(user.username)}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.username}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/profile')}>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
