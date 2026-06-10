// デモ用データ投入スクリプト（開発専用）
// 実行前に .env.local に SUPABASE_SERVICE_ROLE_KEY を設定すること
//
// 使い方:
//   1. .env.local を作成し以下を設定:
//      SUPABASE_SERVICE_ROLE_KEY=<Supabaseダッシュボード > Settings > API > service_role key>
//   2. node scripts/seed-demo.js
//
// ⚠️  SERVICE_ROLE_KEY は RLS をバイパスするため、絶対に git にコミットしないこと

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');
const path = require('path');

// .env と .env.local を読み込む（dotenv 不要）
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const lines = fs.readFileSync(filePath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !process.env[key]) process.env[key] = val;
  }
}
loadEnvFile(path.join(__dirname, '../.env'));
loadEnvFile(path.join(__dirname, '../.env.local'));

const GOOGLE_BOOKS_KEY  = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY ?? '';
const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error('❌ 環境変数が不足しています。.env と .env.local を確認してください。');
  console.error('   必要な変数: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const TEST_EMAIL    = process.env.SEED_TEST_EMAIL    ?? 'demo@digitalshiori.app';
const TEST_PASSWORD = process.env.SEED_TEST_PASSWORD ?? 'Demo1234!';

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
    title: '成瀬は天下を取りにいく',
    author: '宮島未奈',
    total_pages: 240,
    current_page: 240,
    status: 'finished',
    rating: 5.0,
    review: '成瀬あかりのキャラクターが強烈すぎて、読んでいる間中ずっと笑っていた。滋賀愛が溢れていて、読後に地元への愛着を再発見した気分になる。本屋大賞納得の一冊。',
    read_count: 1,
    started_at: daysAgo(60),
    finished_at: daysAgo(52),
    created_at: daysAgo(62),
  },
  {
    title: 'そして、バトンは渡された',
    author: '瀬尾まいこ',
    total_pages: 344,
    current_page: 344,
    status: 'finished',
    rating: 4.5,
    review: '親が何人も変わるのに優子がどんどん前向きになっていく不思議さ。読み終わった後、家族ってなんだろうとずっと考えた。本屋大賞納得。',
    read_count: 1,
    started_at: daysAgo(110),
    finished_at: daysAgo(95),
    created_at: daysAgo(115),
  },
  {
    title: 'しろがねの葉',
    author: '千早茜',
    total_pages: 320,
    current_page: 320,
    status: 'finished',
    rating: 4.0,
    review: '石見銀山を舞台にした戦国時代の物語。ウメの視点から描かれる過酷な生の重さが、静かな文体でじわじわと伝わってくる。直木賞納得。',
    read_count: 1,
    started_at: daysAgo(145),
    finished_at: daysAgo(130),
    created_at: daysAgo(148),
  },
  {
    title: '推し、燃ゆ',
    author: '宇佐見りん',
    total_pages: 160,
    current_page: 160,
    status: 'finished',
    rating: 4.0,
    review: '推しへの執着を「背骨」と表現した一文が忘れられない。短いのにこれだけ密度があるのはすごい。芥川賞納得。',
    read_count: 1,
    started_at: daysAgo(80),
    finished_at: daysAgo(75),
    created_at: daysAgo(82),
  },
  {
    title: '六人の嘘つきな大学生',
    author: '浅倉秋成',
    total_pages: 312,
    current_page: 312,
    status: 'finished',
    rating: 4.5,
    review: '就活という身近な舞台でここまでのミステリーを書けるとは思わなかった。最後の真相は完全に予想外だった。一気読み必至。',
    read_count: 1,
    started_at: daysAgo(40),
    finished_at: daysAgo(32),
    created_at: daysAgo(42),
  },
  {
    title: 'かがみの孤城',
    author: '辻村深月',
    total_pages: 552,
    current_page: 552,
    status: 'finished',
    rating: 5.0,
    review: '伏線の回収が完璧すぎて読後に震えた。学校に行けない子たちへのメッセージが温かく、何度でも読み返したい一冊。',
    read_count: 2,
    started_at: daysAgo(200),
    finished_at: daysAgo(175),
    created_at: daysAgo(205),
  },
  {
    title: '君の膵臓をたべたい',
    author: '住野よる',
    total_pages: 296,
    current_page: 296,
    status: 'finished',
    rating: 4.5,
    review: 'タイトルから受けるイメージと全然違う、純粋な青春小説だった。ラストの展開には声が出た。しばらく立ち直れなかった。',
    read_count: 1,
    started_at: daysAgo(170),
    finished_at: daysAgo(158),
    created_at: daysAgo(172),
  },
  {
    title: '同志少女よ、敵を撃て',
    author: '逢坂冬馬',
    total_pages: 464,
    current_page: 298,
    status: 'reading',
    rating: null,
    review: null,
    read_count: 0,
    started_at: daysAgo(18),
    finished_at: null,
    created_at: daysAgo(20),
  },
  {
    title: '変な家',
    author: '雨穴',
    total_pages: 216,
    current_page: 118,
    status: 'reading',
    rating: null,
    review: null,
    read_count: 0,
    started_at: daysAgo(10),
    finished_at: null,
    created_at: daysAgo(11),
  },
  {
    title: '夜が明ける',
    author: '西加奈子',
    total_pages: 430,
    current_page: 152,
    status: 'rereading',
    rating: 4.5,
    review: null,
    read_count: 1,
    started_at: daysAgo(6),
    finished_at: null,
    created_at: daysAgo(160),
  },
  {
    title: '成瀬は信じた道をいく',
    author: '宮島未奈',
    total_pages: 224,
    current_page: 0,
    status: 'to_read',
    rating: null,
    review: null,
    read_count: 0,
    started_at: null,
    finished_at: null,
    created_at: daysAgo(5),
  },
  {
    title: 'ナミヤ雑貨店の奇蹟',
    author: '東野圭吾',
    total_pages: 349,
    current_page: 0,
    status: 'to_read',
    rating: null,
    review: null,
    read_count: 0,
    started_at: null,
    finished_at: null,
    created_at: daysAgo(3),
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
const TAG_NAMES = ['本屋大賞', 'ミステリー', '泣ける', 'お気に入り'];

// ── メモ ─────────────────────────────────────────────────
// book title → メモ一覧
const MEMOS_BY_TITLE = {
  'かがみの孤城': [
    { page_number: 124, content: '「ここは現実じゃない」と思いながら読んでたのに、いつの間にか城の中が一番リアルに感じられてきた。' },
    { page_number: 448, content: 'アキの正体を悟った瞬間、最初から読み返したくなった。伏線が完璧すぎる。' },
  ],
  'そして、バトンは渡された': [
    { page_number: 62, content: '優子が「お父さん」と呼ぶ場面で泣いてしまった。血のつながりがないことを誰も気にしていない。' },
    { page_number: 198, content: '森宮さんのキャラクターが独特すぎて好き。こんな親がいたらどんなに楽だろうと思う。' },
  ],
  '同志少女よ、敵を撃て': [
    { page_number: 89, content: 'セラフィマの復讐心が純粋すぎて怖い。戦争の残酷さをこれだけリアルに書けるのか。' },
    { page_number: 224, content: 'イリーナ教官との関係が変化してきた。敵か味方かじゃなくて、もっと複雑な何かになってる。' },
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
    '成瀬は天下を取りにいく': [
      { daysAgoStart: 59, hour: 21, startPage: 0,   endPage: 68,  durationMin: 80 },
      { daysAgoStart: 57, hour: 22, startPage: 68,  endPage: 140, durationMin: 85 },
      { daysAgoStart: 55, hour: 21, startPage: 140, endPage: 196, durationMin: 68 },
      { daysAgoStart: 52, hour: 20, startPage: 196, endPage: 240, durationMin: 52 },
    ],
    'そして、バトンは渡された': [
      { daysAgoStart: 109, hour: 22, startPage: 0,   endPage: 48,  durationMin: 58 },
      { daysAgoStart: 107, hour: 21, startPage: 48,  endPage: 104, durationMin: 68 },
      { daysAgoStart: 104, hour: 22, startPage: 104, endPage: 166, durationMin: 75 },
      { daysAgoStart: 101, hour: 20, startPage: 166, endPage: 228, durationMin: 75 },
      { daysAgoStart: 99,  hour: 21, startPage: 228, endPage: 290, durationMin: 75 },
      { daysAgoStart: 97,  hour: 22, startPage: 290, endPage: 344, durationMin: 65 },
    ],
    'しろがねの葉': [
      { daysAgoStart: 144, hour: 21, startPage: 0,   endPage: 55,  durationMin: 68 },
      { daysAgoStart: 142, hour: 22, startPage: 55,  endPage: 118, durationMin: 77 },
      { daysAgoStart: 140, hour: 21, startPage: 118, endPage: 188, durationMin: 85 },
      { daysAgoStart: 136, hour: 20, startPage: 188, endPage: 256, durationMin: 82 },
      { daysAgoStart: 130, hour: 22, startPage: 256, endPage: 320, durationMin: 78 },
    ],
    '推し、燃ゆ': [
      { daysAgoStart: 79, hour: 22, startPage: 0,   endPage: 58,  durationMin: 72 },
      { daysAgoStart: 77, hour: 21, startPage: 58,  endPage: 114, durationMin: 68 },
      { daysAgoStart: 75, hour: 22, startPage: 114, endPage: 160, durationMin: 58 },
    ],
    '六人の嘘つきな大学生': [
      { daysAgoStart: 39, hour: 21, startPage: 0,   endPage: 52,  durationMin: 60 },
      { daysAgoStart: 38, hour: 22, startPage: 52,  endPage: 114, durationMin: 74 },
      { daysAgoStart: 36, hour: 21, startPage: 114, endPage: 180, durationMin: 80 },
      { daysAgoStart: 34, hour: 20, startPage: 180, endPage: 248, durationMin: 82 },
      { daysAgoStart: 32, hour: 22, startPage: 248, endPage: 312, durationMin: 78 },
    ],
    'かがみの孤城': [
      { daysAgoStart: 199, hour: 22, startPage: 0,   endPage: 52,  durationMin: 65 },
      { daysAgoStart: 197, hour: 21, startPage: 52,  endPage: 114, durationMin: 78 },
      { daysAgoStart: 195, hour: 22, startPage: 114, endPage: 184, durationMin: 88 },
      { daysAgoStart: 192, hour: 20, startPage: 184, endPage: 260, durationMin: 95 },
      { daysAgoStart: 189, hour: 21, startPage: 260, endPage: 340, durationMin: 100 },
      { daysAgoStart: 186, hour: 22, startPage: 340, endPage: 416, durationMin: 95 },
      { daysAgoStart: 183, hour: 21, startPage: 416, endPage: 488, durationMin: 90 },
      { daysAgoStart: 180, hour: 22, startPage: 488, endPage: 532, durationMin: 55 },
      { daysAgoStart: 175, hour: 21, startPage: 532, endPage: 552, durationMin: 25 },
    ],
    '君の膵臓をたべたい': [
      { daysAgoStart: 169, hour: 22, startPage: 0,   endPage: 52,  durationMin: 62 },
      { daysAgoStart: 167, hour: 21, startPage: 52,  endPage: 112, durationMin: 73 },
      { daysAgoStart: 165, hour: 22, startPage: 112, endPage: 180, durationMin: 82 },
      { daysAgoStart: 162, hour: 21, startPage: 180, endPage: 240, durationMin: 73 },
      { daysAgoStart: 158, hour: 22, startPage: 240, endPage: 296, durationMin: 68 },
    ],
    '同志少女よ、敵を撃て': [
      { daysAgoStart: 17, hour: 22, startPage: 0,   endPage: 38,  durationMin: 48 },
      { daysAgoStart: 15, hour: 21, startPage: 38,  endPage: 84,  durationMin: 58 },
      { daysAgoStart: 13, hour: 22, startPage: 84,  endPage: 130, durationMin: 58 },
      { daysAgoStart: 11, hour: 21, startPage: 130, endPage: 180, durationMin: 62 },
      { daysAgoStart: 9,  hour: 22, startPage: 180, endPage: 228, durationMin: 60 },
      { daysAgoStart: 7,  hour: 21, startPage: 228, endPage: 264, durationMin: 46 },
      { daysAgoStart: 4,  hour: 22, startPage: 264, endPage: 298, durationMin: 42 },
    ],
    '変な家': [
      { daysAgoStart: 9,  hour: 22, startPage: 0,   endPage: 38,  durationMin: 45 },
      { daysAgoStart: 7,  hour: 21, startPage: 38,  endPage: 78,  durationMin: 48 },
      { daysAgoStart: 5,  hour: 22, startPage: 78,  endPage: 118, durationMin: 50 },
    ],
    '夜が明ける': [
      { daysAgoStart: 5,  hour: 21, startPage: 0,   endPage: 52,  durationMin: 65 },
      { daysAgoStart: 3,  hour: 22, startPage: 52,  endPage: 108, durationMin: 70 },
      { daysAgoStart: 1,  hour: 21, startPage: 108, endPage: 152, durationMin: 55 },
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
    '成瀬は天下を取りにいく':  ['本屋大賞', 'お気に入り'],
    'そして、バトンは渡された': ['本屋大賞', '泣ける', 'お気に入り'],
    'しろがねの葉':            ['お気に入り'],
    '推し、燃ゆ':              ['お気に入り'],
    '六人の嘘つきな大学生':    ['ミステリー', 'お気に入り'],
    'かがみの孤城':            ['本屋大賞', '泣ける', 'お気に入り'],
    '君の膵臓をたべたい':      ['泣ける'],
    '同志少女よ、敵を撃て':    ['本屋大賞', 'ミステリー'],
    '変な家':                  ['ミステリー'],
    'ナミヤ雑貨店の奇蹟':      ['泣ける'],
    '成瀬は信じた道をいく':    ['本屋大賞', 'お気に入り'],
    '夜が明ける':              ['お気に入り'],
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
  本: ${BOOKS.length}冊（読書完了7・読書中2・再読中1・未読2）
  タグ: ${TAG_NAMES.length}個
  メモ: ${Object.values(MEMOS_BY_TITLE).flat().length}件
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main().catch(console.error);
