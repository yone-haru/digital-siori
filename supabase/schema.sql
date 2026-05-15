-- ============================================================
-- デジタル栞 — Supabase スキーマ定義
-- Supabase の SQL Editor にこのファイルの内容をまるごと貼り付けて実行してください
-- ============================================================

-- ----------------------------------------------------------------
-- 1. books テーブル
-- ----------------------------------------------------------------
create table if not exists public.books (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  title        text not null,
  author       text not null,
  cover_url    text,
  total_pages  integer not null default 0,
  current_page integer not null default 0,
  status       text not null default 'to_read'
                 check (status in ('reading', 'finished', 'to_read')),
  isbn         text,
  description  text,
  started_at   timestamptz,
  finished_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- updated_at を自動更新するトリガー関数
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger books_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------
-- 2. reading_sessions テーブル
-- ----------------------------------------------------------------
create table if not exists public.reading_sessions (
  id               uuid primary key default gen_random_uuid(),
  book_id          uuid not null references public.books(id) on delete cascade,
  user_id          uuid not null references auth.users(id) on delete cascade,
  started_at       timestamptz not null,
  ended_at         timestamptz not null,
  start_page       integer not null default 0,
  end_page         integer not null default 0,
  duration_seconds integer not null default 0,
  created_at       timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- 3. Row Level Security (RLS)
-- ----------------------------------------------------------------

-- books: RLS 有効化
alter table public.books enable row level security;

create policy "books: 自分のレコードのみ参照可能"
  on public.books for select
  using (auth.uid() = user_id);

create policy "books: 自分のレコードのみ挿入可能"
  on public.books for insert
  with check (auth.uid() = user_id);

create policy "books: 自分のレコードのみ更新可能"
  on public.books for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "books: 自分のレコードのみ削除可能"
  on public.books for delete
  using (auth.uid() = user_id);

-- reading_sessions: RLS 有効化
alter table public.reading_sessions enable row level security;

create policy "sessions: 自分のレコードのみ参照可能"
  on public.reading_sessions for select
  using (auth.uid() = user_id);

create policy "sessions: 自分のレコードのみ挿入可能"
  on public.reading_sessions for insert
  with check (auth.uid() = user_id);

create policy "sessions: 自分のレコードのみ更新可能"
  on public.reading_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sessions: 自分のレコードのみ削除可能"
  on public.reading_sessions for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- 3b. tags / book_tags テーブル（タグ機能）
-- ----------------------------------------------------------------
create table if not exists public.tags (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null check (char_length(name) <= 20),
  created_at timestamptz not null default now()
);

create table if not exists public.book_tags (
  book_id    uuid not null references public.books(id) on delete cascade,
  tag_id     uuid not null references public.tags(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (book_id, tag_id)
);

alter table public.tags enable row level security;
alter table public.book_tags enable row level security;

create policy "tags: 自分のレコードのみ操作可能"
  on public.tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "book_tags: 自分のレコードのみ操作可能"
  on public.book_tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists tags_user_id_idx      on public.tags(user_id);
create index if not exists book_tags_book_id_idx on public.book_tags(book_id);
create index if not exists book_tags_tag_id_idx  on public.book_tags(tag_id);

-- ----------------------------------------------------------------
-- 4. インデックス（パフォーマンス最適化）
-- ----------------------------------------------------------------
create index if not exists books_user_id_idx       on public.books(user_id);
create index if not exists books_status_idx        on public.books(status);
create index if not exists books_updated_at_idx    on public.books(updated_at desc);
create index if not exists sessions_book_id_idx    on public.reading_sessions(book_id);
create index if not exists sessions_user_id_idx    on public.reading_sessions(user_id);
