// デモ用データ投入スクリプト
// 実行: node scripts/seed-demo.js

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const GOOGLE_BOOKS_KEY  = 'AIzaSyDKvES0vv80M8PYVPmDzKiACdvI5SjxaZk';
const SUPABASE_URL      = 'https://frwiuopbwjnsqpolhafk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyd2l1b3Bid2puc3Fwb2xoYWZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5ODg0OTQsImV4cCI6MjA5MjU2NDQ5NH0.wZA_XIBQypN1ZWPK-gEP3gXJDXAqX8IhxHrTPM6btYA';
const SERVICE_ROLE_KEY  = '***REDACTED-SERVICE-ROLE-KEY***';

const TEST_EMAIL    = 'demo@digitalshiori.app';
const TEST_PASSWORD = 'Demo1234!';

// admin クライアント（メール確認をスキップしてユーザー作成するため）
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// データ操作は anon クライアント + ユーザーセッションで行う
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Google Books カバー取得 ───────────────────────────────
function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch (e) { reject(e); } });
    }).on('error', reject);
  });
}

async function fetchCoverUrl(title, author) {
  const q = encodeURIComponent(`intitle:${title} inauthor:${author}`);
  const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&key=${GOOGLE_BOOKS_KEY}&maxResults=5&langRestrict=ja`;
  try {
    const json = await fetchJson(url);
    // タイトルの先頭4文字が一致する最初の結果を使う
    const item = (json.items || []).find(i => {
      const t = i.volumeInfo?.title ?? '';
      return t.includes(title.slice(0, 4)) && i.volumeInfo?.imageLinks?.thumbnail;
    }) ?? json.items?.[0];
    const thumb = item?.volumeInfo?.imageLinks?.thumbnail;
    if (!thumb) return null;
    return thumb.replace('http://', 'https://').replace('zoom=1', 'zoom=2');
  } catch {
    return null;
  }
}

// ── 日付ヘルパー ──────────────────────────────────────────
function daysAgo(n, hour = 21, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

// ── 本データ ──────────────────────────────────────────────
const BOOKS = [
  {
    title: 'ノルウェイの森（上）',
    author: '村上春樹',
    total_pages: 296,
    current_page: 296,
    status: 'finished',
    rating: 5.0,
    review: '何度読んでも心に刺さる。直子とワタナベの関係が切なくて、読んでいる間ずっと胸が痛かった。村上春樹の文章の密度が好き。',
    read_count: 2,
    started_at: daysAgo(90),
    finished_at: daysAgo(72),
    created_at: daysAgo(92),
  },
  {
    title: '1Q84 BOOK 1',
    author: '村上春樹',
    total_pages: 544,
    current_page: 341,
    status: 'reading',
    rating: null,
    review: null,
    read_count: 0,
    started_at: daysAgo(18),
    finished_at: null,
    created_at: daysAgo(20),
  },
  {
    title: '人間失格',
    author: '太宰治',
    total_pages: 256,
    current_page: 256,
    status: 'finished',
    rating: 4.5,
    review: '主人公の自己嫌悪と世の中への諦観が痛いほど伝わってきた。読むたびに新しい発見がある。',
    read_count: 3,
    started_at: daysAgo(120),
    finished_at: daysAgo(108),
    created_at: daysAgo(125),
  },
  {
    title: 'コンビニ人間',
    author: '村田沙耶香',
    total_pages: 160,
    current_page: 160,
    status: 'finished',
    rating: 4.5,
    review: '一気読みした。社会の「普通」を問い直す作品で、読後もずっと考えてしまう。',
    read_count: 1,
    started_at: daysAgo(55),
    finished_at: daysAgo(48),
    created_at: daysAgo(57),
  },
  {
    title: '流浪の月',
    author: '凪良ゆう',
    total_pages: 356,
    current_page: 356,
    status: 'finished',
    rating: 4.5,
    review: '「見える」ことと「わかる」ことは違う、というテーマが終始一貫していて重かった。',
    read_count: 1,
    started_at: daysAgo(40),
    finished_at: daysAgo(28),
    created_at: daysAgo(42),
  },
  {
    title: 'こころ',
    author: '夏目漱石',
    total_pages: 332,
    current_page: 332,
    status: 'finished',
    rating: 4.0,
    review: '「先生」の孤独が静かに積み上がっていく構造が見事。明治の空気感が伝わってくる。',
    read_count: 1,
    started_at: daysAgo(145),
    finished_at: daysAgo(130),
    created_at: daysAgo(150),
  },
  {
    title: '砂の女',
    author: '安部公房',
    total_pages: 310,
    current_page: 127,
    status: 'reading',
    rating: null,
    review: null,
    read_count: 0,
    started_at: daysAgo(8),
    finished_at: null,
    created_at: daysAgo(9),
  },
  {
    title: '舟を編む',
    author: '三浦しをん',
    total_pages: 304,
    current_page: 304,
    status: 'finished',
    rating: 4.0,
    review: '辞書作りという地味な仕事への情熱が伝わってきて、読んでいて温かい気持ちになった。',
    read_count: 1,
    started_at: daysAgo(80),
    finished_at: daysAgo(66),
    created_at: daysAgo(82),
  },
  {
    title: '夜は短し歩けよ乙女',
    author: '森見登美彦',
    total_pages: 296,
    current_page: 89,
    status: 'rereading',
    rating: 4.5,
    review: null,
    read_count: 1,
    started_at: daysAgo(5),
    finished_at: null,
    created_at: daysAgo(200),
  },
  {
    title: '博士の愛した数式',
    author: '小川洋子',
    total_pages: 256,
    current_page: 0,
    status: 'to_read',
    rating: null,
    review: null,
    read_count: 0,
    started_at: null,
    finished_at: null,
    created_at: daysAgo(10),
  },
  {
    title: '蜜蜂と遠雷',
    author: '恩田陸',
    total_pages: 784,
    current_page: 0,
    status: 'to_read',
    rating: null,
    review: null,
    read_count: 0,
    started_at: null,
    finished_at: null,
    created_at: daysAgo(3),
  },
  {
    title: '羅生門・鼻',
    author: '芥川龍之介',
    total_pages: 208,
    current_page: 208,
    status: 'finished',
    rating: 3.5,
    review: '短編集として完成度が高い。授業で読んだ時と印象がまったく違った。',
    read_count: 2,
    started_at: daysAgo(160),
    finished_at: daysAgo(155),
    created_at: daysAgo(165),
  },
];

// ── 読書セッション生成 ────────────────────────────────────
// 本のIDが確定した後に書き込むので、関数で生成
function buildSessions(bookId, userId, runs) {
  // runs: [{ daysAgoStart, startPage, endPage, durationMin }]
  return runs.map(r => {
    const start = new Date(daysAgo(r.daysAgoStart, r.hour ?? 21));
    const end = new Date(start.getTime() + r.durationMin * 60 * 1000);
    return {
      book_id: bookId,
      user_id: userId,
      started_at: start.toISOString(),
      ended_at: end.toISOString(),
      start_page: r.startPage,
      end_page: r.endPage,
      duration_seconds: r.durationMin * 60,
    };
  });
}

// ── タグ ─────────────────────────────────────────────────
const TAG_NAMES = ['純文学', '現代小説', '古典', 'お気に入り'];

// ── メモ ─────────────────────────────────────────────────
// book title → メモ一覧
const MEMOS_BY_TITLE = {
  'ノルウェイの森（上）': [
    { page_number: 38, content: '「死は生の対極としてではなく、その一部として存在している」——この一行でこの小説が完成している気がする。' },
    { page_number: 112, content: '直子の話し方が独特で、読んでいると自分まで静かになってくる。' },
  ],
  '人間失格': [
    { page_number: 15, content: '恥の多い生涯——冒頭からすでに引き込まれる。' },
    { page_number: 88, content: '堀木との関係が示す「普通」への諦め。' },
  ],
  '1Q84 BOOK 1': [
    { page_number: 67, content: '二つの月。世界がずれていく感覚が面白い。' },
    { page_number: 201, content: 'アオマメとテンゴ、交互に語られる構造が上手い。' },
  ],
};

// ── メイン ────────────────────────────────────────────────
async function main() {
  console.log('── テストアカウントを準備中...');

  // admin API でユーザーを作成（メール確認不要）
  let userId;
  const { data: createData, error: createError } = await adminClient.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  if (createData?.user) {
    userId = createData.user.id;
    console.log('✓ 新規アカウント作成:', TEST_EMAIL);
  } else if (createError?.message?.includes('already been registered')) {
    // 既存ユーザーの場合は admin で取得
    const { data: listData } = await adminClient.auth.admin.listUsers();
    const existing = listData?.users?.find(u => u.email === TEST_EMAIL);
    if (!existing) {
      console.error('❌ ユーザー取得失敗:', createError?.message);
      process.exit(1);
    }
    userId = existing.id;
    console.log('✓ 既存アカウントを使用:', TEST_EMAIL);

    // 既存データをリセット（admin クライアントで削除）
    console.log('   既存データをリセット中...');
    await adminClient.from('book_memos').delete().eq('user_id', userId);
    await adminClient.from('book_tags').delete().eq('user_id', userId);
    await adminClient.from('reading_sessions').delete().eq('user_id', userId);
    await adminClient.from('books').delete().eq('user_id', userId);
    await adminClient.from('tags').delete().eq('user_id', userId);
  } else {
    console.error('❌ アカウント作成失敗:', createError?.message);
    process.exit(1);
  }

  // 以降の insert は adminClient を使う（RLS をスキップ）

  // ── 本を登録 ────────────────────────────────────────────
  console.log('\n── 本を登録中...');
  const bookIdMap = {}; // title → id

  for (const book of BOOKS) {
    const coverUrl = await fetchCoverUrl(book.title, book.author);
    const { data, error } = await adminClient.from('books').insert({
      user_id: userId,
      title: book.title,
      author: book.author,
      cover_url: coverUrl,
      total_pages: book.total_pages,
      current_page: book.current_page,
      status: book.status,
      rating: book.rating,
      review: book.review,
      read_count: book.read_count,
      started_at: book.started_at,
      finished_at: book.finished_at,
      created_at: book.created_at,
    }).select('id').single();

    if (error) { console.error('❌ 本の登録失敗:', book.title, error.message); continue; }
    bookIdMap[book.title] = data.id;
    console.log(`  ✓ ${book.title}${coverUrl ? ' [表紙あり]' : ' [表紙なし]'}`);
  }

  // ── 読書セッションを登録 ──────────────────────────────────
  console.log('\n── 読書セッションを登録中...');

  const SESSION_DATA = {
    'ノルウェイの森（上）': [
      { daysAgoStart: 89, hour: 22, startPage: 0,   endPage: 28,  durationMin: 42 },
      { daysAgoStart: 87, hour: 20, startPage: 28,  endPage: 61,  durationMin: 55 },
      { daysAgoStart: 85, hour: 21, startPage: 61,  endPage: 94,  durationMin: 48 },
      { daysAgoStart: 83, hour: 23, startPage: 94,  endPage: 118, durationMin: 36 },
      { daysAgoStart: 80, hour: 21, startPage: 118, endPage: 156, durationMin: 62 },
      { daysAgoStart: 78, hour: 22, startPage: 156, endPage: 192, durationMin: 58 },
      { daysAgoStart: 76, hour: 20, startPage: 192, endPage: 228, durationMin: 54 },
      { daysAgoStart: 74, hour: 21, startPage: 228, endPage: 262, durationMin: 50 },
      { daysAgoStart: 72, hour: 22, startPage: 262, endPage: 296, durationMin: 52 },
    ],
    '1Q84 BOOK 1': [
      { daysAgoStart: 17, hour: 21, startPage: 0,   endPage: 38,  durationMin: 58 },
      { daysAgoStart: 15, hour: 22, startPage: 38,  endPage: 84,  durationMin: 70 },
      { daysAgoStart: 13, hour: 20, startPage: 84,  endPage: 127, durationMin: 65 },
      { daysAgoStart: 11, hour: 21, startPage: 127, endPage: 168, durationMin: 60 },
      { daysAgoStart: 9,  hour: 22, startPage: 168, endPage: 215, durationMin: 72 },
      { daysAgoStart: 7,  hour: 21, startPage: 215, endPage: 258, durationMin: 66 },
      { daysAgoStart: 5,  hour: 22, startPage: 258, endPage: 298, durationMin: 60 },
      { daysAgoStart: 3,  hour: 20, startPage: 298, endPage: 341, durationMin: 65 },
    ],
    '人間失格': [
      { daysAgoStart: 119, hour: 22, startPage: 0,   endPage: 42,  durationMin: 50 },
      { daysAgoStart: 117, hour: 21, startPage: 42,  endPage: 89,  durationMin: 58 },
      { daysAgoStart: 115, hour: 22, startPage: 89,  endPage: 142, durationMin: 64 },
      { daysAgoStart: 113, hour: 20, startPage: 142, endPage: 198, durationMin: 68 },
      { daysAgoStart: 110, hour: 21, startPage: 198, endPage: 256, durationMin: 70 },
    ],
    'コンビニ人間': [
      { daysAgoStart: 54, hour: 21, startPage: 0,   endPage: 52,  durationMin: 60 },
      { daysAgoStart: 52, hour: 22, startPage: 52,  endPage: 108, durationMin: 65 },
      { daysAgoStart: 48, hour: 20, startPage: 108, endPage: 160, durationMin: 62 },
    ],
    '流浪の月': [
      { daysAgoStart: 39, hour: 21, startPage: 0,   endPage: 45,  durationMin: 55 },
      { daysAgoStart: 37, hour: 22, startPage: 45,  endPage: 98,  durationMin: 64 },
      { daysAgoStart: 35, hour: 21, startPage: 98,  endPage: 152, durationMin: 66 },
      { daysAgoStart: 33, hour: 20, startPage: 152, endPage: 210, durationMin: 70 },
      { daysAgoStart: 31, hour: 22, startPage: 210, endPage: 272, durationMin: 75 },
      { daysAgoStart: 28, hour: 21, startPage: 272, endPage: 356, durationMin: 80 },
    ],
    'こころ': [
      { daysAgoStart: 144, hour: 21, startPage: 0,   endPage: 55,  durationMin: 65 },
      { daysAgoStart: 141, hour: 22, startPage: 55,  endPage: 118, durationMin: 75 },
      { daysAgoStart: 138, hour: 20, startPage: 118, endPage: 190, durationMin: 85 },
      { daysAgoStart: 135, hour: 21, startPage: 190, endPage: 262, durationMin: 86 },
      { daysAgoStart: 130, hour: 22, startPage: 262, endPage: 332, durationMin: 83 },
    ],
    '砂の女': [
      { daysAgoStart: 7,  hour: 21, startPage: 0,   endPage: 42,  durationMin: 55 },
      { daysAgoStart: 5,  hour: 22, startPage: 42,  endPage: 88,  durationMin: 60 },
      { daysAgoStart: 2,  hour: 21, startPage: 88,  endPage: 127, durationMin: 52 },
    ],
    '舟を編む': [
      { daysAgoStart: 79, hour: 21, startPage: 0,   endPage: 50,  durationMin: 58 },
      { daysAgoStart: 77, hour: 22, startPage: 50,  endPage: 106, durationMin: 67 },
      { daysAgoStart: 74, hour: 20, startPage: 106, endPage: 165, durationMin: 70 },
      { daysAgoStart: 71, hour: 21, startPage: 165, endPage: 228, durationMin: 75 },
      { daysAgoStart: 66, hour: 22, startPage: 228, endPage: 304, durationMin: 91 },
    ],
    '夜は短し歩けよ乙女': [
      { daysAgoStart: 4,  hour: 21, startPage: 0,  endPage: 46, durationMin: 52 },
      { daysAgoStart: 2,  hour: 22, startPage: 46, endPage: 89, durationMin: 50 },
    ],
    '羅生門・鼻': [
      { daysAgoStart: 159, hour: 21, startPage: 0,   endPage: 68,  durationMin: 48 },
      { daysAgoStart: 157, hour: 22, startPage: 68,  endPage: 138, durationMin: 50 },
      { daysAgoStart: 155, hour: 20, startPage: 138, endPage: 208, durationMin: 52 },
    ],
  };

  for (const [title, runs] of Object.entries(SESSION_DATA)) {
    const bookId = bookIdMap[title];
    if (!bookId) continue;
    const sessions = buildSessions(bookId, userId, runs);
    const { error } = await adminClient.from('reading_sessions').insert(sessions);
    if (error) { console.error(`❌ セッション登録失敗 (${title}):`, error.message); continue; }
    console.log(`  ✓ ${title}: ${sessions.length}セッション`);
  }

  // ── タグを登録 ────────────────────────────────────────────
  console.log('\n── タグを登録中...');
  const tagIdMap = {};
  for (const name of TAG_NAMES) {
    const { data, error } = await adminClient.from('tags')
      .insert({ user_id: userId, name }).select('id').single();
    if (error) { console.error('❌ タグ登録失敗:', name, error.message); continue; }
    tagIdMap[name] = data.id;
    console.log(`  ✓ ${name}`);
  }

  // ── 本にタグを付ける ──────────────────────────────────────
  const BOOK_TAGS = {
    'ノルウェイの森（上）': ['純文学', 'お気に入り'],
    '1Q84 BOOK 1':         ['現代小説'],
    '人間失格':            ['純文学', '古典', 'お気に入り'],
    'コンビニ人間':        ['現代小説', 'お気に入り'],
    '流浪の月':            ['現代小説'],
    'こころ':              ['純文学', '古典'],
    '砂の女':              ['純文学'],
    '舟を編む':            ['現代小説'],
    '夜は短し歩けよ乙女':  ['現代小説', 'お気に入り'],
    '羅生門・鼻':          ['古典'],
  };

  for (const [title, tags] of Object.entries(BOOK_TAGS)) {
    const bookId = bookIdMap[title];
    if (!bookId) continue;
    for (const tag of tags) {
      const tagId = tagIdMap[tag];
      if (!tagId) continue;
      await adminClient.from('book_tags').insert({ book_id: bookId, tag_id: tagId, user_id: userId });
    }
  }
  console.log('  ✓ タグ紐づけ完了');

  // ── メモを登録 ────────────────────────────────────────────
  console.log('\n── メモを登録中...');
  for (const [title, memos] of Object.entries(MEMOS_BY_TITLE)) {
    const bookId = bookIdMap[title];
    if (!bookId) continue;
    for (const memo of memos) {
      await adminClient.from('book_memos').insert({
        book_id: bookId,
        user_id: userId,
        page_number: memo.page_number,
        content: memo.content,
      });
    }
    console.log(`  ✓ ${title}: ${memos.length}件`);
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 完了！

テストアカウント:
  メール:     ${TEST_EMAIL}
  パスワード: ${TEST_PASSWORD}

登録内容:
  本: ${BOOKS.length}冊（読書完了6・読書中2・再読中1・未読2）
  タグ: ${TAG_NAMES.length}個
  メモ: ${Object.values(MEMOS_BY_TITLE).flat().length}件
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main().catch(console.error);
