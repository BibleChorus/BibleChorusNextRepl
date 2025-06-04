import React, { useState } from 'react';
import { PdfNote } from '@/types';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';

interface NotesSectionProps {
  initialNotes: PdfNote[];
  pdfId: number;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ initialNotes, pdfId }) => {
  const { user } = useAuth();
  const [notes, setNotes] = useState<PdfNote[]>(initialNotes);
  const [note, setNote] = useState('');
  const [page, setPage] = useState<number | ''>('');

  const addNote = async () => {
    if (!user || !note) return;
    try {
      const response = await axios.post(`/api/pdfs/${pdfId}/notes`, {
        note,
        page_number: page || null,
      });
      setNotes([response.data, ...notes]);
      setNote('');
      setPage('');
    } catch (err) {
      console.error('Error adding note:', err);
    }
  };

  const deleteNote = async (id: number) => {
    try {
      await axios.delete(`/api/pdfs/${pdfId}/notes/${id}`);
      setNotes(notes.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting note:', err);
    }
  };

  return (
    <div className="space-y-4">
      {user ? (
        <div className="space-y-2">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" />
          <Input
            value={page}
            onChange={(e) => setPage(e.target.value ? Number(e.target.value) : '')}
            placeholder="Page # (optional)"
            className="w-32"
          />
          <Button onClick={addNote} disabled={!note}>Save Note</Button>
        </div>
      ) : (
        <p>Log in to view and create personal notes.</p>
      )}
      <div className="space-y-2">
        {notes.map((n) => (
          <div key={n.id} className="border p-2 rounded-md">
            <p className="text-sm text-muted-foreground">
              {n.page_number ? `Page ${n.page_number}: ` : ''}
              {new Date(n.created_at).toLocaleString()}
            </p>
            <p className="mb-2 whitespace-pre-wrap">{n.note}</p>
            {user && (
              <Button size="sm" variant="outline" onClick={() => deleteNote(n.id)}>
                Delete
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
