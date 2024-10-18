import { Music, MessageCircle, Newspaper, HelpCircle, BookOpen, Users, Zap } from 'lucide-react';

export const categoryIcons = {
  'Music Discussion': Music,
  'General Discussion': MessageCircle,
  'Announcements': Newspaper,
  'Help & Support': HelpCircle,
  'Bible Study': BookOpen,
  'Community': Users,
  'Uncategorized': Zap,
  // Add more categories and corresponding icons as needed
};

export type CategoryIconName = keyof typeof categoryIcons;
