import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BIBLE_BOOKS, BOLLS_LIFE_API_BIBLE_TRANSLATIONS } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { BookOpen, Music, GripVertical } from 'lucide-react';
import axios from 'axios';
import { Skeleton } from '@/components/ui/skeleton';
import DOMPurify from 'isomorphic-dompurify';

interface LyricsBibleComparisonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  song: any;
}

interface VerseGroup {
  reference: string;
  verses: any[];
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

const LyricsBibleComparisonDialog: React.FC<LyricsBibleComparisonDialogProps> = ({ isOpen, onClose, song }) => {
  const [viewOption, setViewOption] = useState<'both' | 'lyrics' | 'verses'>('both');
  const [verseGroups, setVerseGroups] = useState<VerseGroup[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  const [translation, setTranslation] = useState(() => {
    const validTranslations = BOLLS_LIFE_API_BIBLE_TRANSLATIONS.map(t => t.shortName);
    return validTranslations.includes(song?.bible_translation_used)
      ? song.bible_translation_used
      : 'NASB';
  });
  
  const [leftPanelWidth, setLeftPanelWidth] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
      
      if (newWidth >= 25 && newWidth <= 75) {
        setLeftPanelWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);
  const [translationSearch, setTranslationSearch] = useState('');
  const [openTranslation, setOpenTranslation] = useState(false);

  const hasLyrics = song?.lyrics && song.lyrics.trim().length > 0;
  const hasVerses = song?.bible_verses && song.bible_verses.length > 0;

  useEffect(() => {
    if (isOpen && song?.bible_verses && song.bible_verses.length > 0) {
      fetchVerses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, translation]);

  const groupConsecutiveVerses = (bibleVerses: any[]) => {
    if (!bibleVerses || bibleVerses.length === 0) return [];
    
    const groups: { book: string; chapter: number; verses: number[] }[] = [];
    let currentGroup: { book: string; chapter: number; verses: number[] } | null = null;
    
    for (const verse of bibleVerses) {
      if (
        currentGroup &&
        currentGroup.book === verse.book &&
        currentGroup.chapter === verse.chapter &&
        currentGroup.verses[currentGroup.verses.length - 1] + 1 === verse.verse
      ) {
        currentGroup.verses.push(verse.verse);
      } else {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        currentGroup = {
          book: verse.book,
          chapter: verse.chapter,
          verses: [verse.verse],
        };
      }
    }
    
    if (currentGroup) {
      groups.push(currentGroup);
    }
    
    return groups;
  };

  const formatGroupReference = (group: { book: string; chapter: number; verses: number[] }) => {
    if (group.verses.length === 1) {
      return `${group.book} ${group.chapter}:${group.verses[0]}`;
    }
    return `${group.book} ${group.chapter}:${group.verses[0]}-${group.verses[group.verses.length - 1]}`;
  };

  const fetchVerses = async () => {
    if (!song?.bible_verses) return;
    setIsLoadingVerses(true);
    try {
      const groupedVerseData = groupConsecutiveVerses(song.bible_verses);
      const allGroups: VerseGroup[] = [];
      
      for (const group of groupedVerseData) {
        const bookIndex = BIBLE_BOOKS.indexOf(group.book);
        if (bookIndex === -1) continue;
        
        const response = await axios.post('/api/fetch-verses', [{
          translation,
          book: bookIndex + 1,
          chapter: group.chapter,
          verses: group.verses,
        }]);
        
        const fetchedVerses = response.data.flat()
          .filter((verse: any) => verse && verse.text)
          .map((verse: any) => ({
            book: BIBLE_BOOKS[verse.book - 1],
            chapter: verse.chapter,
            verse: verse.verse,
            text: verse.text,
          }));
        
        if (fetchedVerses.length > 0) {
          allGroups.push({
            reference: formatGroupReference(group),
            verses: fetchedVerses,
          });
        }
      }
      
      setVerseGroups(allGroups);
    } catch (error) {
      console.error('Error fetching verses:', error);
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

    if (verseGroups.length === 0) {
      return <p className="text-muted-foreground/60 italic">No scripture verses available.</p>;
    }

    return (
      <div className="space-y-8">
        {verseGroups.map((group, groupIndex) => (
          <div key={groupIndex} className={groupIndex > 0 ? 'pt-6 border-t border-border/30' : ''}>
            {verseGroups.length > 1 && (
              <h3 className="text-sm font-medium text-foreground/90 mb-4">{group.reference}</h3>
            )}
            <div className="space-y-4">
              {group.verses.map((verse, verseIndex) => (
                <div key={verseIndex}>
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
          </div>
        ))}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl w-[95vw] max-h-[85vh] p-0 overflow-hidden bg-background border-border flex flex-col">
        <DialogHeader className="px-6 md:px-10 py-6 border-b border-border flex-shrink-0">
          <DialogTitle className="text-2xl md:text-3xl font-normal">
            {song?.title}
          </DialogTitle>
          <p className="text-muted-foreground text-sm mt-1">
            {song?.artist}
          </p>
        </DialogHeader>

        <div className="flex items-center justify-center gap-1 py-4 border-b border-border/50 flex-shrink-0">
          {hasLyrics && (
            <button
              onClick={() => setViewOption('lyrics')}
              className={`px-5 py-2 text-xs tracking-[0.15em] uppercase transition-all duration-300 ${
                viewOption === 'lyrics' 
                  ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Music className="w-3 h-3 inline-block mr-2" />
              Lyrics
            </button>
          )}
          {hasVerses && (
            <button
              onClick={() => setViewOption('verses')}
              className={`px-5 py-2 text-xs tracking-[0.15em] uppercase transition-all duration-300 ${
                viewOption === 'verses' 
                  ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BookOpen className="w-3 h-3 inline-block mr-2" />
              Scripture
            </button>
          )}
          {hasLyrics && hasVerses && (
            <button
              onClick={() => setViewOption('both')}
              className={`px-5 py-2 text-xs tracking-[0.15em] uppercase transition-all duration-300 ${
                viewOption === 'both' 
                  ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Side by Side
            </button>
          )}
        </div>

        {hasVerses && viewOption !== 'lyrics' && (
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
        )}

        <div style={{ height: '400px' }}>
          {viewOption === 'both' && hasLyrics && hasVerses ? (
            <div ref={containerRef} className="flex h-full [&_::-webkit-scrollbar]:w-2 [&_::-webkit-scrollbar-track]:bg-transparent [&_::-webkit-scrollbar-thumb]:bg-border [&_::-webkit-scrollbar-thumb]:rounded-full">
              <div 
                className="overflow-y-auto"
                style={{ width: `${leftPanelWidth}%` }}
              >
                <div className="p-6 md:p-10">
                  <h3 className="text-xs tracking-[0.2em] text-amber-600 dark:text-amber-400 uppercase mb-6 flex items-center gap-2">
                    <Music className="w-3 h-3" />
                    Lyrics
                  </h3>
                  <p className="text-foreground/90 whitespace-pre-wrap leading-8 font-light text-sm md:text-base">
                    {song.lyrics}
                  </p>
                </div>
              </div>
              <div 
                className="w-2 bg-border hover:bg-amber-600/50 dark:hover:bg-amber-400/50 cursor-col-resize flex items-center justify-center transition-colors flex-shrink-0"
                onMouseDown={handleMouseDown}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <div 
                className="overflow-y-auto"
                style={{ width: `${100 - leftPanelWidth}%` }}
              >
                <div className="p-6 md:p-10">
                  <h3 className="text-xs tracking-[0.2em] text-amber-600 dark:text-amber-400 uppercase mb-6 flex items-center gap-2">
                    <BookOpen className="w-3 h-3" />
                    Scripture
                  </h3>
                  {renderVerseContent()}
                </div>
              </div>
            </div>
          ) : viewOption === 'lyrics' ? (
            <ScrollArea className="h-[400px]">
              <div className="p-6 md:p-10">
                <h3 className="text-xs tracking-[0.2em] text-amber-600 dark:text-amber-400 uppercase mb-6 flex items-center gap-2">
                  <Music className="w-3 h-3" />
                  Lyrics
                </h3>
                <p className="text-foreground/90 whitespace-pre-wrap leading-8 font-light text-sm md:text-base max-w-2xl">
                  {song?.lyrics || 'No lyrics available.'}
                </p>
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="p-6 md:p-10">
                <h3 className="text-xs tracking-[0.2em] text-amber-600 dark:text-amber-400 uppercase mb-6 flex items-center gap-2">
                  <BookOpen className="w-3 h-3" />
                  Scripture
                </h3>
                {renderVerseContent()}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LyricsBibleComparisonDialog;
