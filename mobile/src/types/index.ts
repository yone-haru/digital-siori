export type BookStatus = 'reading' | 'rereading' | 'to_read' | 'finished';

export type Book = {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  current_page: number;
  total_pages: number;
  status: BookStatus;
  description: string | null;
  started_at: string | null;
  finished_at: string | null;
  read_count: number;
  rating: number | null;
  review: string | null;
  created_at: string;
  updated_at: string;
};

export type ReadingSession = {
  id: string;
  book_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  start_page: number;
  end_page: number;
};

export type SessionMemo = {
  id: string;
  session_id: string;
  page_number: number;
  content: string;
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
