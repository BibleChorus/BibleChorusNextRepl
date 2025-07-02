declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';

  /** Base props for any lucide icon component */
  export interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
  }

  /** Generic icon React component type */
  export type Icon = FC<LucideProps>;

  /* Helper to build custom icons */
  export function createLucideIcon(name: string, iconNode: any[]): Icon;

  // Export a comprehensive subset of icons used across the project --------------
  export const Play: Icon;
  export const Pause: Icon;
  export const Edit: Icon;
  export const Pencil: Icon;
  export const Share2: Icon;
  export const Sparkles: Icon;
  export const MessageSquare: Icon;
  export const TrendingUp: Icon;
  export const Clock: Icon;
  export const Filter: Icon;
  export const Plus: Icon;
  export const Users2: Icon;
  export const Music: Icon;
  export const Music2: Icon;
  export const BookOpen: Icon;
  export const Heart: Icon;
  export const Users: Icon;
  export const Library: Icon;
  export const MessageCircle: Icon;
  export const Upload: Icon;
  export const ArrowRight: Icon;
  export const ThumbsUp: Icon;
  export const ThumbsDown: Icon;
  export const Headphones: Icon;
  export const FileText: Icon;
  export const File: Icon;
  export const FileIcon: Icon;
  export const BookOpenText: Icon;
  export const BookCheck: Icon;
  export const Map: Icon;
  export const Check: Icon;
  export const ChevronsUpDown: Icon;
  export const X: Icon;
  export const ArrowLeft: Icon;
  export const Lock: Icon;
  export const Info: Icon;
  export const InfoIcon: Icon;
  export const LogOut: Icon;
  export const Bell: Icon;
  export const List: Icon;
  export const HelpCircle: Icon;
  export const PanelLeftClose: Icon;
  export const PanelLeftOpen: Icon;
  export const Calendar: Icon;
  export const Mic: Icon;
  export const Bot: Icon;
  export const Tag: Icon;
  export const AlignJustify: Icon;
  export const Bookmark: Icon;
  export const User: Icon;
  export const UserPlus: Icon;
  export const LogIn: Icon;
  export const Menu: Icon;
  export const Twitter: Icon;
  export const Type: Icon;
  export const GithubIcon: Icon;
  export const Loader2: Icon;
  export const ChevronUp: Icon;
  export const ChevronDown: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const ArrowUpDown: Icon;
  export const Shrink: Icon;
  export const Expand: Icon;
  export const GripVertical: Icon;
  export const Dot: Icon;
  export const Circle: Icon;
  export const MoreHorizontal: Icon;
  export const MoreVertical: Icon;
  export const SkipBack: Icon;
  export const SkipForward: Icon;
  export const Repeat: Icon;
  export const Repeat1: Icon;
  export const Shuffle: Icon;
  export const Minimize2: Icon;
  export const Maximize2: Icon;
  export const ListPlus: Icon;
  export const Vote: Icon;
  export const Star: Icon;
  export const Flag: Icon;
  export const Search: Icon;
  export const RefreshCw: Icon;
  export const Newspaper: Icon;
  export const Zap: Icon;
  export const Trash2: Icon;
  export const ListMusic: Icon;
  export const Save: Icon;
  export const Moon: Icon;
  export const Sun: Icon;
  export const SunMedium: Icon;
  export const Book: Icon;
  export const PenTool: Icon;
  export const Download: Icon;
  export const UploadCloud: Icon;
  export const CheckCircle: Icon;
  export const PlayCircle: Icon;

  // Fallback icon type – for dynamic icon rendering
  export const LucideIcon: Icon;

  const defaultExport: Icon;
  export default defaultExport;
}