'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BIBLE_BOOKS, BOLLS_LIFE_API_BIBLE_TRANSLATIONS } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { BookOpen } from 'lucide-react';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import DOMPurify from 'isomorphic-dompurify';

interface ScriptureVerseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  scriptureReference: string;
}

interface ParsedReference {
  book: string;
  chapter: number;
  startVerse?: number;
  endVerse?: number;
}

const BibleVersesSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="space-y-3">
        <Skeleton className="h-4 w-24 bg-white/10" />
        <Skeleton className="h-4 w-full bg-white/5" />
        <Skeleton className="h-4 w-3/4 bg-white/5" />
      </div>
    ))}
  </div>
);

function parseScriptureReference(reference: string): ParsedReference | null {
  if (!reference || reference.trim().length === 0) return null;
  
  const trimmed = reference.trim();
  
  const bookPattern = /^(\d?\s*[A-Za-z]+(?:\s+of\s+[A-Za-z]+)?)\s*(\d+)?(?::(\d+)(?:-(\d+))?)?$/i;
  const match = trimmed.match(bookPattern);
  
  if (!match) return null;
  
  let bookName = match[1].trim();
  
  const bookNormalizations: { [key: string]: string } = {
    'psalm': 'Psalms',
    'psalms': 'Psalms',
    'song of solomon': 'Song of Solomon',
    'song of songs': 'Song of Solomon',
    'songs': 'Song of Solomon',
    '1 samuel': '1 Samuel',
    '2 samuel': '2 Samuel',
    '1 kings': '1 Kings',
    '2 kings': '2 Kings',
    '1 chronicles': '1 Chronicles',
    '2 chronicles': '2 Chronicles',
    '1 corinthians': '1 Corinthians',
    '2 corinthians': '2 Corinthians',
    '1 thessalonians': '1 Thessalonians',
    '2 thessalonians': '2 Thessalonians',
    '1 timothy': '1 Timothy',
    '2 timothy': '2 Timothy',
    '1 peter': '1 Peter',
    '2 peter': '2 Peter',
    '1 john': '1 John',
    '2 john': '2 John',
    '3 john': '3 John',
  };
  
  const lowerBookName = bookName.toLowerCase();
  if (bookNormalizations[lowerBookName]) {
    bookName = bookNormalizations[lowerBookName];
  } else {
    const foundBook = BIBLE_BOOKS.find(b => 
      b.toLowerCase() === lowerBookName || 
      b.toLowerCase().startsWith(lowerBookName)
    );
    if (foundBook) {
      bookName = foundBook;
    }
  }
  
  const chapter = match[2] ? parseInt(match[2], 10) : 1;
  const startVerse = match[3] ? parseInt(match[3], 10) : undefined;
  const endVerse = match[4] ? parseInt(match[4], 10) : startVerse;
  
  return {
    book: bookName,
    chapter,
    startVerse,
    endVerse,
  };
}

export const ScriptureVerseDialog: React.FC<ScriptureVerseDialogProps> = ({ 
  isOpen, 
  onClose, 
  scriptureReference 
}) => {
  const [verses, setVerses] = useState<any[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  const [translation, setTranslation] = useState('NASB');
  const [translationSearch, setTranslationSearch] = useState('');
  const [openTranslation, setOpenTranslation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && scriptureReference) {
      fetchVerses();
    }
  }, [isOpen, translation, scriptureReference]);

  const fetchVerses = async () => {
    const parsed = parseScriptureReference(scriptureReference);
    if (!parsed) {
      setError('Could not parse scripture reference');
      return;
    }

    const bookIndex = BIBLE_BOOKS.indexOf(parsed.book);
    if (bookIndex === -1) {
      setError(`Book not found: ${parsed.book}`);
      return;
    }

    setIsLoadingVerses(true);
    setError(null);
    
    try {
      let versesToFetch: number[] = [];
      
      if (parsed.startVerse && parsed.endVerse) {
        for (let v = parsed.startVerse; v <= parsed.endVerse; v++) {
          versesToFetch.push(v);
        }
      } else if (parsed.startVerse) {
        versesToFetch = [parsed.startVerse];
      } else {
        for (let v = 1; v <= 200; v++) {
          versesToFetch.push(v);
        }
      }

      const response = await axios.post('/api/fetch-verses', [{
        translation,
        book: bookIndex + 1,
        chapter: parsed.chapter,
        verses: versesToFetch,
      }]);

      const fetchedVerses = response.data.flat()
        .filter((verse: any) => verse && verse.text)
        .map((verse: any) => ({
          book: BIBLE_BOOKS[verse.book - 1],
          chapter: verse.chapter,
          verse: verse.verse,
          text: verse.text,
        }));
      
      setVerses(fetchedVerses);
    } catch (err) {
      console.error('Error fetching verses:', err);
      setError('Failed to fetch verses');
    } finally {
      setIsLoadingVerses(false);
    }
  };

  const filteredTranslations = BOLLS_LIFE_API_BIBLE_TRANSLATIONS.filter(translationOption =>
    translationOption.shortName.toLowerCase().includes(translationSearch.toLowerCase()) ||
    translationOption.fullName.toLowerCase().includes(translationSearch.toLowerCase())
  );

  const renderVerseContent = () => {
    if (isLoadingVerses) {
      return <BibleVersesSkeleton />;
    }

    if (error) {
      return <p className="text-red-500/80 italic">{error}</p>;
    }

    if (verses.length === 0) {
      return <p className="text-muted-foreground/60 italic">No verses found for this reference.</p>;
    }

    return (
      <div className="space-y-6">
        {verses.map((verse, index) => (
          <div key={index}>
            <p className="text-amber-600 dark:text-amber-400 text-xs tracking-wider mb-2 font-medium uppercase">
              {verse.book} {verse.chapter}:{verse.verse}
            </p>
            <div 
              className="text-foreground/80 leading-7 font-light text-sm md:text-base italic"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(verse.text) }}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl w-[95vw] max-h-[85vh] p-0 overflow-hidden bg-background border-border flex flex-col">
        <DialogHeader className="px-6 md:px-10 py-6 border-b border-border flex-shrink-0">
          <DialogTitle className="text-xl md:text-2xl font-normal flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            {scriptureReference}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-center gap-3 py-3 border-b border-border/50 flex-shrink-0">
          <span className="text-xs text-muted-foreground/60 tracking-wide">Translation:</span>
          <Select
            value={translation}
            onValueChange={setTranslation}
            open={openTranslation}
            onOpenChange={setOpenTranslation}
          >
            <SelectTrigger className="w-32 h-8 text-xs bg-background border-border">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border max-h-60">
              <div className="p-2">
                <Input
                  placeholder="Search..."
                  value={translationSearch}
                  onChange={(e) => setTranslationSearch(e.target.value)}
                  className="mb-2 h-8 text-xs"
                />
                {filteredTranslations.map((option) => (
                  <SelectItem 
                    key={option.shortName} 
                    value={option.shortName}
                    className="text-xs"
                  >
                    {option.shortName} - {option.fullName}
                  </SelectItem>
                ))}
              </div>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 md:p-10">
            {renderVerseContent()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScriptureVerseDialog;
