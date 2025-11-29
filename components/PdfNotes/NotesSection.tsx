import React, { useState } from 'react';
import { PdfNote } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, StickyNote, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface ThemeColors {
  bg: string;
  bgAlt: string;
  bgCard: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  border: string;
  borderLight: string;
  borderHover: string;
  hoverBg: string;
  cardBorder: string;
}

interface NotesSectionProps {
  initialNotes: PdfNote[];
  pdfId: number;
  theme: ThemeColors;
  isDark: boolean;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ 
  initialNotes, 
  pdfId,
  theme,
  isDark
}) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<PdfNote[]>(initialNotes);
  const [note, setNote] = useState('');
  const [page, setPage] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const addNote = async () => {
    if (!user || !note.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await axios.post(`/api/pdfs/${pdfId}/notes`, {
        note,
        page_number: page || null,
      });
      setNotes([response.data, ...notes]);
      setNote('');
      setPage('');
      toast.success('Note saved');
    } catch (err) {
      console.error('Error adding note:', err);
      toast.error('Failed to save note');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteNote = async (id: number) => {
    setDeletingId(id);
    try {
      await axios.delete(`/api/pdfs/${pdfId}/notes/${id}`);
      setNotes(notes.filter(n => n.id !== id));
      toast.success('Note deleted');
    } catch (err) {
      console.error('Error deleting note:', err);
      toast.error('Failed to delete note');
    } finally {
      setDeletingId(null);
    }
  };

  if (!user) {
    return (
      <div 
        className="text-center py-12"
        style={{ border: `1px solid ${theme.borderLight}` }}
      >
        <Lock 
          className="w-8 h-8 mx-auto mb-4" 
          style={{ color: theme.textMuted }} 
        />
        <p 
          className="text-sm font-light mb-4"
          style={{ color: theme.textMuted }}
        >
          Sign in to create and view your personal notes.
        </p>
        <a 
          href="/login"
          className="inline-block px-6 py-2 text-xs tracking-[0.15em] uppercase font-medium transition-all duration-300"
          style={{ 
            border: `1px solid ${theme.border}`,
            color: theme.accent,
          }}
        >
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div 
        className="p-5"
        style={{ 
          border: `1px solid ${theme.borderLight}`,
          backgroundColor: theme.hoverBg
        }}
      >
        <Textarea 
          value={note} 
          onChange={(e) => setNote(e.target.value)} 
          placeholder="Add a personal note about this resource..."
          className="min-h-[120px] rounded-none bg-transparent resize-none mb-4"
          style={{
            borderColor: theme.border,
            color: theme.text,
            fontFamily: "'Manrope', sans-serif",
          }}
        />
        
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">
            <label 
              className="block text-[10px] tracking-[0.15em] uppercase mb-1.5"
              style={{ color: theme.textMuted }}
            >
              Page Reference
            </label>
            <Input
              type="number"
              value={page}
              onChange={(e) => setPage(e.target.value ? Number(e.target.value) : '')}
              placeholder="#"
              className="w-20 h-10 rounded-none bg-transparent text-center"
              style={{
                borderColor: theme.border,
                color: theme.text,
              }}
            />
          </div>
          
          <div className="flex-1 flex justify-end items-end">
            <Button 
              onClick={addNote} 
              disabled={!note.trim() || isSubmitting}
              className="h-10 px-6 rounded-none text-xs tracking-[0.15em] uppercase font-medium transition-all duration-300 disabled:opacity-50"
              style={{
                backgroundColor: theme.accent,
                color: isDark ? '#050505' : '#ffffff',
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-2" />
              Save Note
            </Button>
          </div>
        </div>
      </div>

      {notes.length === 0 ? (
        <div 
          className="text-center py-12"
          style={{ border: `1px solid ${theme.borderLight}` }}
        >
          <StickyNote 
            className="w-8 h-8 mx-auto mb-4" 
            style={{ color: theme.textMuted }} 
          />
          <p 
            className="text-sm font-light"
            style={{ color: theme.textMuted }}
          >
            No notes yet. Start adding your personal insights.
          </p>
        </div>
      ) : (
        <div className="space-y-px">
          <AnimatePresence mode="popLayout">
            {notes.map((n, index) => (
              <motion.div 
                key={n.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="group p-5 transition-colors duration-300"
                style={{ 
                  border: `1px solid ${theme.borderLight}`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = theme.hoverBg;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {n.page_number && (
                        <span 
                          className="px-2 py-1 text-[10px] tracking-[0.1em] uppercase"
                          style={{ 
                            border: `1px solid ${theme.border}`,
                            color: theme.accent,
                          }}
                        >
                          Page {n.page_number}
                        </span>
                      )}
                      <span 
                        className="text-xs"
                        style={{ color: theme.textMuted }}
                      >
                        {new Date(n.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p 
                      className="text-sm leading-relaxed font-light whitespace-pre-wrap"
                      style={{ color: theme.textSecondary }}
                    >
                      {n.note}
                    </p>
                  </div>
                  
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => deleteNote(n.id)}
                    disabled={deletingId === n.id}
                    className="h-8 w-8 p-0 rounded-none opacity-0 group-hover:opacity-100 transition-all duration-300"
                    style={{ border: `1px solid ${theme.border}` }}
                  >
                    <Trash2 
                      className="w-3.5 h-3.5" 
                      style={{ color: theme.textMuted }}
                    />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
