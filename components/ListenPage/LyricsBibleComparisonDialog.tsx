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

interface LyricsBibleComparisonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  song: any; // Replace with appropriate Song type
}

const LyricsBibleComparisonDialog: React.FC<LyricsBibleComparisonDialogProps> = ({ isOpen, onClose, song }) => {
  const [viewOption, setViewOption] = useState<'both' | 'lyrics' | 'verses'>('both');
  const [verses, setVerses] = useState<any[]>([]);
  const [isLoadingVerses, setIsLoadingVerses] = useState(false);
  const [translation, setTranslation] = useState('KJV'); // Default translation
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl w-full">
        <DialogHeader>
          <DialogTitle>{song.title}</DialogTitle>
        </DialogHeader>
        <div className="flex items-center space-x-2 my-4">
          <ToggleGroup
            type="single"
            value={viewOption}
            onValueChange={(value) => setViewOption(value as 'both' | 'lyrics' | 'verses')}
            className="flex"
          >
            <ToggleGroupItem value="lyrics">Lyrics</ToggleGroupItem>
            <ToggleGroupItem value="verses">Bible Verses</ToggleGroupItem>
            <ToggleGroupItem value="both">Both</ToggleGroupItem>
          </ToggleGroup>
          {viewOption !== 'lyrics' && (
            <div className="ml-auto w-48">
              <Select
                value={translation}
                onValueChange={setTranslation}
                open={openTranslation}
                onOpenChange={setOpenTranslation}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select Translation" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <Input
                      placeholder="Search translations..."
                      value={translationSearch}
                      onChange={(e) => setTranslationSearch(e.target.value)}
                      className="mb-2"
                    />
                    {filteredTranslations.map((option) => (
                      <SelectItem key={option.shortName} value={option.shortName}>
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
                {isLoadingVerses ? (
                  <p>Loading verses...</p>
                ) : (
                  verses.map((verse, index) => (
                    <div key={index} className="mb-4">
                      <p className="font-semibold">{`${verse.book} ${verse.chapter}:${verse.verse}`}</p>
                      <div dangerouslySetInnerHTML={{ __html: verse.text }} />
                    </div>
                  ))
                )}
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
            {isLoadingVerses ? (
              <p>Loading verses...</p>
            ) : (
              verses.map((verse, index) => (
                <div key={index} className="mb-4">
                  <p className="font-semibold">{`${verse.book} ${verse.chapter}:${verse.verse}`}</p>
                  <div dangerouslySetInnerHTML={{ __html: verse.text }} />
                </div>
              ))
            )}
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LyricsBibleComparisonDialog; 