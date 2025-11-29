import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ForumCategory } from '@/types';
import dynamic from 'next/dynamic';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useTheme } from 'next-themes';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface NewTopicDialogProps {
  onTopicCreated: (topic: any) => void;
  children?: React.ReactNode;
}

export const NewTopicDialog: React.FC<NewTopicDialogProps> = ({ onTopicCreated, children }) => {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [isOpen, setIsOpen] = useState(false);

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
    separator: isDark ? 'rgba(212, 175, 55, 0.15)' : 'rgba(191, 161, 48, 0.2)',
    accentGlow: isDark ? 'rgba(212, 175, 55, 0.12)' : 'rgba(191, 161, 48, 0.1)',
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get<ForumCategory[]>('/api/forum/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      }
    };

    fetchCategories();
  }, []);

  const handleCreateTopic = async () => {
    try {
      const response = await axios.post('/api/forum/topics', {
        title,
        content,
        user_id: user?.id,
        category_id: parseInt(categoryId),
      });

      onTopicCreated(response.data);
      setIsOpen(false);
      setTitle('');
      setContent('');
      setCategoryId('');
      toast.success('Topic created successfully');
    } catch (error) {
      console.error('Error creating topic:', error);
      toast.error('Failed to create topic');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || <Button>Create New Topic</Button>}
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[500px] rounded-2xl"
        style={{ 
          backgroundColor: theme.bgCard,
          border: `1px solid ${theme.border}`
        }}
      >
        <DialogHeader>
          <DialogTitle 
            className="text-2xl"
            style={{ color: theme.text, fontFamily: "'Italiana', serif" }}
          >
            Create a New Topic
          </DialogTitle>
          <DialogDescription 
            style={{ color: theme.textSecondary, fontFamily: "'Manrope', sans-serif" }}
          >
            Fill in the details for your new forum topic.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 mt-4">
          <div>
            <label 
              htmlFor="title" 
              className="block text-sm font-medium mb-2"
              style={{ color: theme.text, fontFamily: "'Manrope', sans-serif" }}
            >
              Title
            </label>
            <Input
              id="title"
              placeholder="Topic Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 rounded-lg transition-all duration-300"
              style={{ 
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                borderColor: theme.border,
                color: theme.text,
                fontFamily: "'Manrope', sans-serif"
              }}
            />
          </div>
          <div>
            <label 
              htmlFor="content" 
              className="block text-sm font-medium mb-2"
              style={{ color: theme.text, fontFamily: "'Manrope', sans-serif" }}
            >
              Description
            </label>
            <div 
              className="rounded-lg overflow-hidden"
              style={{ border: `1px solid ${theme.border}` }}
            >
              <style jsx global>{`
                .ql-toolbar.ql-snow {
                  border: none !important;
                  border-bottom: 1px solid ${theme.border} !important;
                  background: ${isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'};
                }
                .ql-container.ql-snow {
                  border: none !important;
                  background: ${isDark ? 'rgba(255, 255, 255, 0.02)' : 'transparent'};
                }
                .ql-editor {
                  color: ${theme.text} !important;
                  font-family: 'Manrope', sans-serif !important;
                  min-height: 120px;
                }
                .ql-editor.ql-blank::before {
                  color: ${theme.textSecondary} !important;
                  font-style: normal !important;
                }
                .ql-snow .ql-stroke {
                  stroke: ${theme.textSecondary} !important;
                }
                .ql-snow .ql-fill {
                  fill: ${theme.textSecondary} !important;
                }
                .ql-snow .ql-picker {
                  color: ${theme.textSecondary} !important;
                }
                .ql-snow .ql-picker-options {
                  background: ${theme.bgCard} !important;
                  border-color: ${theme.border} !important;
                }
                .ql-toolbar.ql-snow .ql-picker.ql-expanded .ql-picker-label {
                  border-color: ${theme.accent} !important;
                }
                .ql-snow.ql-toolbar button:hover,
                .ql-snow .ql-toolbar button:hover {
                  color: ${theme.accent} !important;
                }
                .ql-snow.ql-toolbar button:hover .ql-stroke,
                .ql-snow .ql-toolbar button:hover .ql-stroke {
                  stroke: ${theme.accent} !important;
                }
                .ql-snow.ql-toolbar button:hover .ql-fill,
                .ql-snow .ql-toolbar button:hover .ql-fill {
                  fill: ${theme.accent} !important;
                }
                .ql-snow.ql-toolbar button.ql-active,
                .ql-snow .ql-toolbar button.ql-active {
                  color: ${theme.accent} !important;
                }
                .ql-snow.ql-toolbar button.ql-active .ql-stroke,
                .ql-snow .ql-toolbar button.ql-active .ql-stroke {
                  stroke: ${theme.accent} !important;
                }
                .ql-snow.ql-toolbar button.ql-active .ql-fill,
                .ql-snow .ql-toolbar button.ql-active .ql-fill {
                  fill: ${theme.accent} !important;
                }
              `}</style>
              <ReactQuill
                id="content"
                value={content}
                onChange={setContent}
                placeholder="Write your topic description..."
              />
            </div>
          </div>
          <div>
            <label 
              htmlFor="category" 
              className="block text-sm font-medium mb-2"
              style={{ color: theme.text, fontFamily: "'Manrope', sans-serif" }}
            >
              Category
            </label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger 
                id="category"
                className="h-11 rounded-lg transition-all duration-300"
                style={{ 
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                  borderColor: theme.border,
                  color: theme.text,
                  fontFamily: "'Manrope', sans-serif"
                }}
              >
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem 
                    key={category.id} 
                    value={category.id.toString()}
                    disabled={category.name === 'Announcements' && user?.id !== 1}
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleCreateTopic} 
            disabled={!title || !content || !categoryId}
            className="w-full h-11 rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
            style={{ 
              backgroundColor: theme.accent,
              color: '#ffffff',
              fontFamily: "'Manrope', sans-serif"
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = theme.accentHover;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.accent;
            }}
          >
            Create Topic
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
