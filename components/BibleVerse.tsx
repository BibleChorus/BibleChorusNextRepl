import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Loader2 } from 'lucide-react';
import axios from 'axios';
import { BIBLE_BOOKS, BOLLS_LIFE_API_BIBLE_TRANSLATIONS } from '@/lib/constants';

interface BibleVerseProps {
  reference: string;
  translation?: string;
}

interface VerseData {
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export default function BibleVerse({ reference, translation = 'NASB' }: BibleVerseProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [verses, setVerses] = useState<VerseData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState(translation);

  // Parse the reference string (e.g., "John 3:16" or "Romans 8:1-4")
  const parseReference = (ref: string) => {
    const match = ref.match(/^(\d?\s*\w+)\s+(\d+):(\d+)(?:-(\d+))?$/);
    if (!match) return null;

    const [, book, chapter, startVerse, endVerse] = match;
    const chapterNum = parseInt(chapter);
    const startVerseNum = parseInt(startVerse);
    const endVerseNum = endVerse ? parseInt(endVerse) : startVerseNum;

    // Create array of verse numbers
    const verseNumbers = [];
    for (let i = startVerseNum; i <= endVerseNum; i++) {
      verseNumbers.push(i);
    }

    return {
      book: book.trim(),
      chapter: chapterNum,
      verses: verseNumbers
    };
  };

  const fetchVerses = async () => {
    const parsed = parseReference(reference);
    if (!parsed) {
      setError('Invalid verse reference format');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const bookIndex = BIBLE_BOOKS.findIndex(book => 
        book.toLowerCase() === parsed.book.toLowerCase() ||
        book.toLowerCase().includes(parsed.book.toLowerCase()) ||
        parsed.book.toLowerCase().includes(book.toLowerCase())
      );

      if (bookIndex === -1) {
        throw new Error(`Book "${parsed.book}" not found`);
      }

      const versesToFetch = [{
        translation: selectedTranslation,
        book: bookIndex + 1,
        chapter: parsed.chapter,
        verses: parsed.verses
      }];

      const response = await axios.post('/api/fetch-verses', versesToFetch);
      
      const fetchedVerses = response.data.flat().map((verse: any) => ({
        book: BIBLE_BOOKS[verse.book - 1],
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text
      }));

      setVerses(fetchedVerses);
    } catch (error) {
      console.error('Error fetching verses:', error);
      setError('Failed to load verse. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVerses();
    }
  }, [isOpen, selectedTranslation]);

  const formatReference = () => {
    const parsed = parseReference(reference);
    if (!parsed) return reference;
    
    if (parsed.verses.length === 1) {
      return `${parsed.book} ${parsed.chapter}:${parsed.verses[0]}`;
    } else {
      return `${parsed.book} ${parsed.chapter}:${parsed.verses[0]}-${parsed.verses[parsed.verses.length - 1]}`;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="link" 
          className="p-0 h-auto font-normal text-primary hover:text-primary/80 underline"
        >
          {formatReference()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" side="top">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {formatReference()}
            </h4>
            <Select value={selectedTranslation} onValueChange={setSelectedTranslation}>
              <SelectTrigger className="w-20 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BOLLS_LIFE_API_BIBLE_TRANSLATIONS.map((trans) => (
                  <SelectItem key={trans.shortName} value={trans.shortName}>
                    {trans.shortName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <ScrollArea className="h-32">
            {isLoading ? (
              <div className="flex items-center justify-center h-24">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : error ? (
              <div className="text-sm text-red-500 p-2">
                {error}
              </div>
            ) : verses.length > 0 ? (
              <div className="space-y-2">
                {verses.map((verse, index) => (
                  <div key={index} className="text-sm">
                    <span className="font-medium text-muted-foreground">
                      {verse.verse}.
                    </span>{' '}
                    <span 
                      className="text-foreground"
                      dangerouslySetInnerHTML={{ __html: verse.text }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-2">
                No verses found
              </div>
            )}
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
} 