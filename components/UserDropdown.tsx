import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { LogOut, User, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';

interface UserDropdownProps {
  user: {
    id: number;
    username: string;
    profile_image_url?: string;
  };
}

export function UserDropdown({ user }: UserDropdownProps) {
  const router = useRouter();
  const { logout, getAuthToken } = useAuth();

  const [unreadCount, setUnreadCount] = useState<number>(0);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getInitial = (username: string) => username.charAt(0).toUpperCase();

  const handleNotificationsClick = () => {
    router.push('/profile#activities');
  };

  // Fetch unread activities count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const token = await getAuthToken();
        const response = await axios.get(`/api/users/${user.id}/unread-activities-count`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUnreadCount(response.data.unreadCount);
      } catch (error) {
        console.error('Error fetching unread activities count:', error);
      }
    };
    fetchUnreadCount();

    // Optionally, set up polling to refresh the count periodically
    const interval = setInterval(fetchUnreadCount, 60000); // Refresh every 60 seconds
    return () => clearInterval(interval);
  }, [user.id, getAuthToken]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
          {user.profile_image_url ? (
            <div className="relative">
              <Image
                src={user.profile_image_url}
                alt={user.username}
                className="h-8 w-8 rounded-full"
                width={32}
                height={32}
              />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          ) : (
            <div className="relative">
              <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-sm bg-gradient-to-br from-purple-600 to-pink-500">
                {getInitial(user.username)}
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
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
        <DropdownMenuItem onClick={handleNotificationsClick}>
          <Bell className="mr-2 h-4 w-4" />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
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
