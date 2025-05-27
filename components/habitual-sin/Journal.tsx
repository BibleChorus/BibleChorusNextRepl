import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusCircle,
  Search,
  Filter,
  Calendar,
  Tag,
  BookOpen,
  Edit3,
  Trash2,
  Save,
  X,
  Heart,
  MessageSquare,
  Clock,
  SortAsc,
  SortDesc,
  FileText
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import { useProgress } from '@/hooks/useProgress';
import { useUser } from '@/hooks/useUser';

// Types for journal entries
interface JournalEntry {
  id: string;
  chapterSlug: string;
  title: string;
  content: string;
  tags: string[];
  mood?: 'grateful' | 'reflective' | 'convicted' | 'hopeful' | 'struggling';
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
  wordCount: number;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

interface JournalProps {
  chapterSlug?: string;
  allChapters?: any[];
  onClose?: () => void;
}

export default function Journal({ chapterSlug, allChapters, onClose }: JournalProps) {
  const { user } = useUser();
  const { getUserNotes, saveNote, deleteNote } = useProgress();
  
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'chapter'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  
  // New entry state
  const [isCreating, setIsCreating] = useState(false);
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    tags: [] as string[],
    mood: undefined as JournalEntry['mood'],
    isPrivate: true,
  });

  // Available tags
  const availableTags = [
    'reflection', 'prayer', 'conviction', 'gratitude', 'struggle', 
    'breakthrough', 'accountability', 'scripture', 'application', 'growth'
  ];

  // Mood options
  const moodOptions = [
    { value: 'grateful', label: 'Grateful', emoji: '🙏' },
    { value: 'reflective', label: 'Reflective', emoji: '🤔' },
    { value: 'convicted', label: 'Convicted', emoji: '💔' },
    { value: 'hopeful', label: 'Hopeful', emoji: '🌟' },
    { value: 'struggling', label: 'Struggling', emoji: '😔' },
  ];

  // Load journal entries
  useEffect(() => {
    const loadEntries = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const notes = await getUserNotes(chapterSlug);
        setEntries(notes || []);
      } catch (error) {
        console.error('Error loading journal entries:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEntries();
  }, [user, chapterSlug]);

  // Filter and sort entries
  const filteredEntries = React.useMemo(() => {
    let filtered = entries.filter(entry => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.content.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Tags filter
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.some(tag => entry.tags.includes(tag));
      
      // Mood filter
      const matchesMood = selectedMood === 'all' || entry.mood === selectedMood;
      
      return matchesSearch && matchesTags && matchesMood;
    });

    // Sort entries
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'chapter':
          comparison = a.chapterSlug.localeCompare(b.chapterSlug);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [entries, searchTerm, selectedTags, selectedMood, sortBy, sortOrder]);

  // Handle creating new entry
  const handleCreateEntry = () => {
    setIsCreating(true);
    setNewEntry({
      title: chapterSlug ? `Reflection on ${chapterSlug}` : 'New Reflection',
      content: '',
      tags: [],
      mood: undefined,
      isPrivate: true,
    });
  };

  // Handle saving entry
  const handleSaveEntry = async () => {
    if (!user || !newEntry.title.trim() || !newEntry.content.trim()) return;

    try {
      const entry: Omit<JournalEntry, 'id'> = {
        chapterSlug: chapterSlug || 'general',
        title: newEntry.title.trim(),
        content: newEntry.content.trim(),
        tags: newEntry.tags,
        mood: newEntry.mood,
        isPrivate: newEntry.isPrivate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        wordCount: newEntry.content.trim().split(/\s+/).length,
      };

      await saveNote(entry.chapterSlug, entry);
      
      // Refresh entries
      const notes = await getUserNotes(chapterSlug);
      setEntries(notes || []);
      
      // Reset form
      setIsCreating(false);
      setEditingEntry(null);
      setNewEntry({
        title: '',
        content: '',
        tags: [],
        mood: undefined,
        isPrivate: true,
      });
    } catch (error) {
      console.error('Error saving journal entry:', error);
    }
  };

  // Handle editing entry
  const handleEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry.id);
    setNewEntry({
      title: entry.title,
      content: entry.content,
      tags: entry.tags,
      mood: entry.mood,
      isPrivate: entry.isPrivate,
    });
    setIsCreating(true);
  };

  // Handle deleting entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!user) return;

    try {
      await deleteNote(entryId);
      setEntries(prev => prev.filter(entry => entry.id !== entryId));
    } catch (error) {
      console.error('Error deleting journal entry:', error);
    }
  };

  // Handle tag toggle
  const handleTagToggle = (tag: string) => {
    setNewEntry(prev => ({
      ...prev,
      tags: prev.tags.includes(tag) 
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  };

  // Handle filter tag toggle
  const handleFilterTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get mood emoji
  const getMoodEmoji = (mood?: JournalEntry['mood']): string => {
    const moodOption = moodOptions.find(option => option.value === mood);
    return moodOption?.emoji || '';
  };

  if (!user) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sign In Required</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Please sign in to access your reflection journal.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reflection Journal
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {chapterSlug ? `Chapter: ${chapterSlug}` : 'All Reflections'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={handleCreateEntry}>
            <PlusCircle className="h-4 w-4 mr-2" />
            New Entry
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Sort */}
              <div className="flex items-center gap-2">
                <Label className="text-sm">Sort by:</Label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="chapter">Chapter</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>

              {/* Mood Filter */}
              <div className="flex items-center gap-2">
                <Label className="text-sm">Mood:</Label>
                <Select value={selectedMood} onValueChange={setSelectedMood}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {moodOptions.map(mood => (
                      <SelectItem key={mood.value} value={mood.value}>
                        {mood.emoji} {mood.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tag Filters */}
            <div className="space-y-2">
              <Label className="text-sm">Filter by tags:</Label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleFilterTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Entry Modal */}
      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              {editingEntry ? 'Edit Entry' : 'New Journal Entry'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={newEntry.title}
                onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter a title for your reflection..."
              />
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content">Reflection</Label>
              <Textarea
                id="content"
                value={newEntry.content}
                onChange={(e) => setNewEntry(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your reflection here..."
                rows={8}
              />
              <p className="text-xs text-gray-500 mt-1">
                {newEntry.content.trim().split(/\s+/).filter(word => word.length > 0).length} words
              </p>
            </div>

            {/* Mood */}
            <div>
              <Label>Mood</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {moodOptions.map(mood => (
                  <Badge
                    key={mood.value}
                    variant={newEntry.mood === mood.value ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setNewEntry(prev => ({ 
                      ...prev, 
                      mood: prev.mood === mood.value ? undefined : mood.value as JournalEntry['mood']
                    }))}
                  >
                    {mood.emoji} {mood.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {availableTags.map(tag => (
                  <Badge
                    key={tag}
                    variant={newEntry.tags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveEntry}
                disabled={!newEntry.title.trim() || !newEntry.content.trim()}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Entry
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Entries List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading entries...</p>
            </div>
          </div>
        ) : filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Entries Found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchTerm || selectedTags.length > 0 || selectedMood !== 'all'
                    ? 'No entries match your current filters.'
                    : 'Start your spiritual journey by writing your first reflection.'
                  }
                </p>
                <Button onClick={handleCreateEntry}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create Your First Entry
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredEntries.map(entry => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {getMoodEmoji(entry.mood)} {entry.title}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(entry.createdAt)}
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {entry.wordCount} words
                          </div>
                          {!chapterSlug && (
                            <div className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {entry.chapterSlug}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditEntry(entry)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-3">
                      {entry.content}
                    </p>
                    
                    {entry.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {entry.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 