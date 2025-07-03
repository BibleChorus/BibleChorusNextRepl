export interface Verse {
  book: number; // 1-66 (index of Bible book)
  chapter: number;
  verse: number;
  text: string;
}

export type FetchVersesResponse = Verse[][];

export interface FetchVersesRequestItem {
  translation: string;
  book: number;
  chapter: number;
  verses: number[];
}

export type FetchVersesRequest = FetchVersesRequestItem[];