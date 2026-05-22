-- ================================================================
-- デジタル栞 — 完全スキーマ
-- Supabase の SQL Editor にまるごと貼り付けて実行してください
-- 既存環境でも IF NOT EXISTS / DROP IF EXISTS で安全に再実行できます
-- ================================================================

-- ① books
CREATE TABLE IF NOT EXISTS public.books (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title        text NOT NULL,
  author       text NOT NULL,
  cover_url    text,
  total_pages  integer NOT NULL DEFAULT 0,
  current_page integer NOT NULL DEFAULT 0,
  status       text NOT NULL DEFAULT 'to_read'
                 CHECK (status IN ('reading', 'rereading', 'finished', 'to_read')),
  isbn         text,
  description  text,
  rating       numeric(3,1) CHECK (rating >= 0.5 AND rating <= 5.0),
  review       text,
  read_count   integer NOT NULL DEFAULT 0,
  started_at   timestamptz,
  finished_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN new.updated_at = now(); RETURN new; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS books_updated_at ON public.books;
CREATE TRIGGER books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ② reading_sessions
CREATE TABLE IF NOT EXISTS public.reading_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id          uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at       timestamptz NOT NULL,
  ended_at         timestamptz NOT NULL,
  start_page       integer NOT NULL DEFAULT 0,
  end_page         integer NOT NULL DEFAULT 0,
  duration_seconds integer NOT NULL DEFAULT 0,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ③ tags / book_tags
CREATE TABLE IF NOT EXISTS public.tags (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL CHECK (char_length(name) <= 20),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.book_tags (
  book_id    uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  tag_id     uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (book_id, tag_id)
);

-- ④ session_memos (旧: 互換のため残す)
CREATE TABLE IF NOT EXISTS public.session_memos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES public.reading_sessions(id) ON DELETE CASCADE,
  book_id     uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_number integer NOT NULL DEFAULT 0,
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ⑤ book_memos (本ごとの共有メモ)
CREATE TABLE IF NOT EXISTS public.book_memos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id     uuid NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_number integer NOT NULL DEFAULT 0,
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ================================================================
-- RLS
-- ================================================================
ALTER TABLE public.books            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reading_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_tags        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_memos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_memos       ENABLE ROW LEVEL SECURITY;

-- 古いポリシーを全削除
DROP POLICY IF EXISTS "books: all"          ON public.books;
DROP POLICY IF EXISTS "sessions: all"       ON public.reading_sessions;
DROP POLICY IF EXISTS "tags: all"           ON public.tags;
DROP POLICY IF EXISTS "book_tags: all"      ON public.book_tags;
DROP POLICY IF EXISTS "session_memos: all"  ON public.session_memos;
DROP POLICY IF EXISTS "book_memos: all"     ON public.book_memos;

DROP POLICY IF EXISTS "books: 自分のレコードのみ参照可能"    ON public.books;
DROP POLICY IF EXISTS "books: 自分のレコードのみ挿入可能"    ON public.books;
DROP POLICY IF EXISTS "books: 自分のレコードのみ更新可能"    ON public.books;
DROP POLICY IF EXISTS "books: 自分のレコードのみ削除可能"    ON public.books;
DROP POLICY IF EXISTS "sessions: 自分のレコードのみ参照可能"  ON public.reading_sessions;
DROP POLICY IF EXISTS "sessions: 自分のレコードのみ挿入可能"  ON public.reading_sessions;
DROP POLICY IF EXISTS "sessions: 自分のレコードのみ更新可能"  ON public.reading_sessions;
DROP POLICY IF EXISTS "sessions: 自分のレコードのみ削除可能"  ON public.reading_sessions;
DROP POLICY IF EXISTS "tags: 自分のレコードのみ操作可能"      ON public.tags;
DROP POLICY IF EXISTS "book_tags: 自分のレコードのみ操作可能" ON public.book_tags;
DROP POLICY IF EXISTS "session_memos: 自分のレコードのみ操作可能" ON public.session_memos;
DROP POLICY IF EXISTS "Users can manage their own session memos"   ON public.session_memos;
DROP POLICY IF EXISTS "Users can manage their own memos"           ON public.session_memos;

-- ポリシーを再作成
CREATE POLICY "books: all" ON public.books FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "sessions: all" ON public.reading_sessions FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "tags: all" ON public.tags FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "book_tags: all" ON public.book_tags FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "session_memos: all" ON public.session_memos FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "book_memos: all" ON public.book_memos FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- インデックス
-- ================================================================
CREATE INDEX IF NOT EXISTS books_user_id_idx        ON public.books(user_id);
CREATE INDEX IF NOT EXISTS books_status_idx         ON public.books(status);
CREATE INDEX IF NOT EXISTS books_updated_at_idx     ON public.books(updated_at DESC);
CREATE INDEX IF NOT EXISTS sessions_book_id_idx     ON public.reading_sessions(book_id);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx     ON public.reading_sessions(user_id);
CREATE INDEX IF NOT EXISTS tags_user_id_idx         ON public.tags(user_id);
CREATE INDEX IF NOT EXISTS book_tags_book_id_idx    ON public.book_tags(book_id);
CREATE INDEX IF NOT EXISTS book_tags_tag_id_idx     ON public.book_tags(tag_id);
CREATE INDEX IF NOT EXISTS session_memos_session_id ON public.session_memos(session_id);
CREATE INDEX IF NOT EXISTS session_memos_book_id    ON public.session_memos(book_id);
CREATE INDEX IF NOT EXISTS session_memos_user_id    ON public.session_memos(user_id);
CREATE INDEX IF NOT EXISTS book_memos_book_id       ON public.book_memos(book_id);
CREATE INDEX IF NOT EXISTS book_memos_user_id       ON public.book_memos(user_id);

-- ================================================================
-- Storage バケット / ポリシー
-- ================================================================

-- covers バケット
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "covers: upload own"  ON storage.objects;
DROP POLICY IF EXISTS "covers: public read" ON storage.objects;

CREATE POLICY "covers: upload own"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'covers'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "covers: public read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'covers');

-- avatars バケット
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "avatars: manage own"  ON storage.objects;
DROP POLICY IF EXISTS "avatars: public read" ON storage.objects;

CREATE POLICY "avatars: manage own"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "avatars: public read"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'avatars');
