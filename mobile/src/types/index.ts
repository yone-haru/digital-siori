import type { Database } from './database';

export type BookStatus = 'reading' | 'rereading' | 'to_read' | 'finished';

// DB の Row 型から導出し、定義の二重管理を避ける
export type Book = Database['public']['Tables']['books']['Row'];
export type ReadingSession = Database['public']['Tables']['reading_sessions']['Row'];

export type BookMemo = {
  id: string;
  page_number: number;
  content: string;
  created_at: string;
};

export type Tag = {
  id: string;
  name: string;
};

export type GoogleBook = {
  googleId: string;
  title: string;
  author: string;
  publishedYear: string;
  pageCount: number;
  thumbnail: string | null;
  isbn: string | null;
  description: string | null;
};
