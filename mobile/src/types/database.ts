// supabase/schema.sql から手書きした Database 型。
// スキーマを変更したら必ずここも更新すること。
// Supabase CLI にログインできる環境なら以下で自動生成版に差し替えられる:
//   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
import type { BookStatus } from './index';

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type BookRow = {
  id: string;
  user_id: string;
  title: string;
  author: string;
  cover_url: string | null;
  total_pages: number;
  current_page: number;
  status: BookStatus;
  isbn: string | null;
  description: string | null;
  rating: number | null;
  review: string | null;
  read_count: number;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
  updated_at: string;
};

type ReadingSessionRow = {
  id: string;
  book_id: string;
  user_id: string;
  started_at: string;
  ended_at: string;
  start_page: number;
  end_page: number;
  duration_seconds: number;
  created_at: string;
};

type TagRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

type BookTagRow = {
  book_id: string;
  tag_id: string;
  user_id: string;
  created_at: string;
};

type BookMemoRow = {
  id: string;
  book_id: string;
  user_id: string;
  page_number: number;
  content: string;
  created_at: string;
};

/** Row のうち DB 側にデフォルトがある列を省略可能にした Insert 型を作る */
type InsertOf<Row, Optional extends keyof Row> =
  Omit<Row, Optional> & Partial<Pick<Row, Optional>>;

export type Database = {
  public: {
    Tables: {
      books: {
        Row: BookRow;
        Insert: InsertOf<BookRow,
          'id' | 'cover_url' | 'total_pages' | 'current_page' | 'status' | 'isbn'
          | 'description' | 'rating' | 'review' | 'read_count' | 'started_at'
          | 'finished_at' | 'created_at' | 'updated_at'>;
        Update: Partial<BookRow>;
        Relationships: [];
      };
      reading_sessions: {
        Row: ReadingSessionRow;
        Insert: InsertOf<ReadingSessionRow,
          'id' | 'start_page' | 'end_page' | 'duration_seconds' | 'created_at'>;
        Update: Partial<ReadingSessionRow>;
        Relationships: [];
      };
      tags: {
        Row: TagRow;
        Insert: InsertOf<TagRow, 'id' | 'created_at'>;
        Update: Partial<TagRow>;
        Relationships: [];
      };
      book_tags: {
        Row: BookTagRow;
        Insert: InsertOf<BookTagRow, 'created_at'>;
        Update: Partial<BookTagRow>;
        Relationships: [];
      };
      book_memos: {
        Row: BookMemoRow;
        Insert: InsertOf<BookMemoRow, 'id' | 'page_number' | 'created_at'>;
        Update: Partial<BookMemoRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
