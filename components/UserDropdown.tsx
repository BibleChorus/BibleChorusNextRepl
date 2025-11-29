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
import { useTheme } from 'next-themes';
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
  const { resolvedTheme } = useTheme();

  const [unreadCount, setUnreadCount] = useState<number>(0);

  const isDark = resolvedTheme === 'dark';

  const theme = {
    bg: isDark ? '#050505' : '#f8f5f0',
    bgCard: isDark ? '#0a0a0a' : '#ffffff',
    text: isDark ? '#e5e5e5' : '#161616',
    textSecondary: isDark ? '#a0a0a0' : '#4a4a4a',
    accent: isDark ? '#d4af37' : '#bfa130',
    accentHover: isDark ? '#e5c349' : '#d4af37',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    borderHover: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(191, 161, 48, 0.3)',
    hoverBg: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getInitial = (username: string) => username.charAt(0).toUpperCase();

  const handleNotificationsClick = () => {
    router.push('/profile#activities');
  };

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

    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [user.id, getAuthToken]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative h-8 w-8 rounded-full p-0 transition-all duration-300 hover:scale-105"
          style={{
            border: `1px solid ${theme.border}`,
          }}
        >
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
                <span 
                  className="absolute -top-1 -right-1 text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold"
                  style={{
                    backgroundColor: theme.accent,
                    color: isDark ? '#050505' : '#ffffff',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          ) : (
            <div className="relative">
              <div 
                className="h-8 w-8 rounded-full flex items-center justify-center font-semibold text-sm"
                style={{
                  background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentHover})`,
                  color: isDark ? '#050505' : '#ffffff',
                }}
              >
                {getInitial(user.username)}
              </div>
              {unreadCount > 0 && (
                <span 
                  className="absolute -top-1 -right-1 text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold"
                  style={{
                    backgroundColor: theme.accent,
                    color: isDark ? '#050505' : '#ffffff',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        className="w-56" 
        align="end" 
        forceMount
        style={{
          backgroundColor: theme.bgCard,
          borderColor: theme.border,
        }}
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p 
              className="text-sm font-medium leading-none"
              style={{ color: theme.text }}
            >
              {user.username}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator style={{ backgroundColor: theme.border }} />
        <DropdownMenuItem 
          onClick={() => router.push('/profile')}
          className="cursor-pointer transition-colors duration-200"
          style={{ color: theme.text }}
        >
          <User className="mr-2 h-4 w-4" style={{ color: theme.accent }} />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleNotificationsClick}
          className="cursor-pointer transition-colors duration-200"
          style={{ color: theme.text }}
        >
          <Bell className="mr-2 h-4 w-4" style={{ color: theme.accent }} />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span 
              className="ml-auto text-xs rounded-full px-2 py-1 font-semibold"
              style={{
                backgroundColor: theme.accent,
                color: isDark ? '#050505' : '#ffffff',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator style={{ backgroundColor: theme.border }} />
        <DropdownMenuItem 
          onClick={handleLogout}
          className="cursor-pointer transition-colors duration-200"
          style={{ color: theme.text }}
        >
          <LogOut className="mr-2 h-4 w-4" style={{ color: theme.accent }} />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
