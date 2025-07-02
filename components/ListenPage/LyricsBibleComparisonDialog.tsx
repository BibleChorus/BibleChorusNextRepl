import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Resizable } from 're-resizable';
import { BIBLE_BOOKS, BOLLS_LIFE_API_BIBLE_TRANSLATIONS } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';
import { BookOpen } from 'lucide-react';
import axios from 'axios';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import DOMPurify from 'isomorphic-dompurify';

interface LyricsBibleComparisonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  song: any; // Replace with appropriate Song type
}

const BibleVersesSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="space-y-2">
        {/* Reference skeleton */}
        <Skeleton className="h-4 w-24" />
        {/* Verse text skeleton - two lines */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    ))}
  </div>
);

const LyricsBibleComparisonDialog: React.FC<LyricsBibleComparisonDialogProps> = ({ isOpen, onClose, song }) => {
  const [viewOption, setViewOption] = useState<'both' | 'lyrics' | 'verses'>('both');
  const [verses, setVerses] = useState<any[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  const [translation, setTranslation] = useState(() => {
    const validTranslations = BOLLS_LIFE_API_BIBLE_TRANSLATIONS.map(t => t.shortName);
    return validTranslations.includes(song.bible_translation_used)
      ? song.bible_translation_used
      : 'NASB';
  });
  const [translationSearch, setTranslationSearch] = useState('');
  const [openTranslation, setOpenTranslation] = useState(false);

  useEffect(() => {
    if (isOpen && song.bible_verses && song.bible_verses.length > 0) {
      fetchVerses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, translation]);

  const fetchVerses = async () => {
    setIsLoadingVerses(true);
    try {
      const versesToFetch = song.bible_verses.map((verse: any) => ({
        translation,
        book: BIBLE_BOOKS.indexOf(verse.book) + 1,
        chapter: verse.chapter,
        verses: [verse.verse],
      }));
      const response = await axios.post('/api/fetch-verses', versesToFetch);
      const fetchedVerses = response.data.flat().map((verse: any) => ({
        book: BIBLE_BOOKS[verse.book - 1],
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
      }));
      setVerses(fetchedVerses);
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

    return verses.map((verse, index) => (
      <div key={index} className="mb-4">
        <p className="font-semibold">{`${verse.book} ${verse.chapter}:${verse.verse}`}</p>
        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(verse.text) }} />
      </div>
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl w-[95vw] min-w-[280px]">
        <DialogHeader>
          <DialogTitle>{song.title}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-wrap gap-2 my-4">
          <ToggleGroup
            type="single"
            value={viewOption}
            onValueChange={(value) => setViewOption(value as 'both' | 'lyrics' | 'verses')}
            className="flex flex-wrap gap-1"
          >
            <ToggleGroupItem value="lyrics" className="text-sm">Lyrics</ToggleGroupItem>
            <ToggleGroupItem value="verses" className="text-sm">Bible Verses</ToggleGroupItem>
            <ToggleGroupItem value="both" className="text-sm">Both</ToggleGroupItem>
          </ToggleGroup>
          {viewOption !== 'lyrics' && (
            <div className="w-full sm:w-48 sm:ml-auto">
              <Select
                value={translation}
                onValueChange={setTranslation}
                open={openTranslation}
                onOpenChange={setOpenTranslation}
              >
                <SelectTrigger className="w-full bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm border border-white/30 dark:border-slate-600/30 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-300 rounded-xl h-12">
                  <SelectValue placeholder="Select Translation" />
                </SelectTrigger>
                <SelectContent className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border border-white/30 dark:border-slate-700/30 rounded-xl">
                  <div className="p-2">
                    <Input
                      placeholder="Search translations..."
                      value={translationSearch}
                      onChange={(e) => setTranslationSearch(e.target.value)}
                      className="mb-2"
                    />
                    {filteredTranslations.map((option) => (
                      <SelectItem 
                        key={option.shortName} 
                        value={option.shortName}
                        className="hover:bg-emerald-500/10 dark:hover:bg-emerald-500/20 transition-all duration-200 rounded-lg"
                      >
                        {option.shortName} - {option.fullName}
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {viewOption === 'both' ? (
          <div className="flex">
            <Resizable
              defaultSize={{ width: '50%', height: 'auto' }}
              minWidth="30%"
              maxWidth="70%"
              enable={{ right: true }}
              className="border"
            >
              <ScrollArea className="h-[400px] p-4">
                <h3 className="text-lg font-bold mb-2">Lyrics</h3>
                <p className="whitespace-pre-wrap">{song.lyrics}</p>
              </ScrollArea>
            </Resizable>
            <div className="flex-1 border">
              <ScrollArea className="h-[400px] p-4">
                <h3 className="text-lg font-bold mb-2">Bible Verses</h3>
                {renderVerseContent()}
              </ScrollArea>
            </div>
          </div>
        ) : viewOption === 'lyrics' ? (
          <ScrollArea className="h-[400px] p-4 border">
            <h3 className="text-lg font-bold mb-2">Lyrics</h3>
            <p className="whitespace-pre-wrap">{song.lyrics}</p>
          </ScrollArea>
        ) : (
          <ScrollArea className="h-[400px] p-4 border">
            <h3 className="text-lg font-bold mb-2">Bible Verses</h3>
            {renderVerseContent()}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LyricsBibleComparisonDialog; 