import { DS, MobileShell, BottomNav, Label, BookCover } from './shared-components';

// ─── Screens 01–03 ────────────────────────────────────────────────────────────

// ── Screen 01: Login ──────────────────────────────────────────────────────────
export function Screen01Login() {
  return (
    <MobileShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column', padding:'0 28px', paddingBottom: 32 }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginTop: 36 }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="2" fill={DS.ink}/>
            <polygon points="8,26 8,6 24,6 24,22 16,26" fill={DS.paper}/>
            <rect x="8" y="6" width="16" height="2" fill={DS.ink}/>
          </svg>
          <div style={{ lineHeight:1.2 }}>
            <div style={{ fontFamily:'Cormorant Garamond, Georgia, serif', fontSize:15,
              fontWeight:400, letterSpacing:'0.08em', color: DS.ink }}>Digital</div>
            <div style={{ fontFamily:'Cormorant Garamond, Georgia, serif', fontSize:15,
              fontWeight:400, letterSpacing:'0.08em', color: DS.ink }}>Bookmark</div>
          </div>
        </div>

        {/* Hero copy — push to vertical center */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', paddingBottom: 32 }}>
          <Label style={{ marginBottom: 14 }}>Welcome</Label>
          <h1 style={{
            fontFamily:'Shippori Mincho, serif',
            fontSize: 32, fontWeight:500,
            color: DS.ink2, lineHeight:1.55,
            margin: 0, marginBottom: 52,
          }}>あなたの読書を、<br/>次のページへ。</h1>

          {/* Email */}
          <div style={{ marginBottom: 28 }}>
            <Label style={{ display:'block', marginBottom: 8 }}>Email</Label>
            <div style={{ position:'relative' }}>
              <input readOnly value="haru@example.com" style={{
                width:'100%', background:'transparent', border:'none',
                borderBottom: `1px solid ${DS.line}`,
                padding:'0 0 10px', outline:'none',
                fontFamily:'Cormorant Garamond, Georgia, serif',
                fontSize: 19, color: DS.ink,
                letterSpacing:'0.03em',
                boxSizing:'border-box',
              }}/>
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 44 }}>
            <Label style={{ display:'block', marginBottom: 8 }}>Password</Label>
            <input readOnly value="••••••••••" style={{
              width:'100%', background:'transparent', border:'none',
              borderBottom: `1px solid ${DS.line}`,
              padding:'0 0 10px', outline:'none',
              fontFamily:'Cormorant Garamond, Georgia, serif',
              fontSize: 19, color: DS.ink,
              letterSpacing:'0.12em',
              boxSizing:'border-box',
            }}/>
          </div>

          {/* CTA */}
          <button style={{
            width:'100%', height:52,
            background: DS.ink, color: DS.paper,
            border:'none', borderRadius: 2,
            fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:13, letterSpacing:'0.25em', fontWeight:500,
            cursor:'pointer', marginBottom: 24,
          }}>LOG IN</button>

          <p style={{
            textAlign:'center', margin:0,
            fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:12, color: DS.muted,
            letterSpacing:'0.03em',
          }}>
            はじめての方は{' '}
            <span style={{ textDecoration:'underline', cursor:'pointer' }}>新規登録</span>
          </p>
        </div>
      </div>
    </MobileShell>
  );
}

// ── Screen 02: Bookshelf ──────────────────────────────────────────────────────
const books = [
  { title:'罪と罰', author:'DOSTOEVSKY', pub:'新潮文庫', color:'#2B3A2E', pct:62, page:284 },
  { title:'ノルウェイの森', author:'H. MURAKAMI', pub:'講談社', color:'#C8BFA8', pct:28, page:102 },
  { title:'人間失格', author:'DAZAI', pub:'角川文庫', color:'#7C2B28', pct:85, page:142 },
];
const toread = [
  { title:'星の王子さま', author:'SAINT-EXUPÉRY', pub:'岩波', color:'#1B2A3A' },
  { title:'方丈記', author:'KAMO NO CHOMEI', pub:'新潮', color:'#D6CFC0' },
  { title:'海辺のカフカ', author:'H. MURAKAMI', pub:'新潮', color:'#2A2A2A' },
];

export function BookCard({ book, showProgress = false }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap: 8 }}>
      <BookCover title={book.title} author={book.author} publisher={book.pub}
        color={book.color} width={104} height={152} fontSize={13} />
      {showProgress && (
        <div>
          {/* Progress bar */}
          <div style={{ height:2, background: DS.line2, borderRadius:1, marginBottom:7 }}>
            <div style={{ width:`${book.pct}%`, height:'100%', background: DS.ink, borderRadius:1 }}/>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
            <span style={{ fontFamily:'Cormorant Garamond, Georgia, serif',
              fontSize:15, color: DS.ink2 }}>{book.pct}<span style={{fontSize:10,color:DS.muted2}}>%</span></span>
            <span style={{ fontFamily:'Cormorant Garamond, Georgia, serif',
              fontSize:13, color: DS.muted, letterSpacing:'0.02em' }}>p.{book.page}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function Screen02Bookshelf() {
  const tabs = [
    { label:'すべて', count:24, active:true },
    { label:'読書中', count:3 },
    { label:'積読', count:18 },
    { label:'読了', count:3 },
  ];
  return (
    <MobileShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ padding:'16px 28px 0', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <Label>Library</Label>
            <h1 style={{ margin:'4px 0 0', fontFamily:'Shippori Mincho, serif',
              fontSize:32, fontWeight:500, color:DS.ink, letterSpacing:'-0.01em' }}>本棚</h1>
          </div>
          <div style={{ display:'flex', gap:16, paddingBottom:4 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{color:DS.ink}}>
              <circle cx="9.5" cy="9.5" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M14.5 14.5L19 19" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <div style={{ width:32, height:32, borderRadius:'50%', background:DS.ink,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'Cormorant Garamond, Georgia, serif', fontSize:14, color:DS.paper, fontWeight:600 }}>H</div>
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display:'flex', gap:8, padding:'16px 28px 0' }}>
          {tabs.map(t => (
            <div key={t.label} style={{
              padding:'6px 12px', borderRadius:20,
              background: t.active ? DS.ink : 'transparent',
              border: `1px solid ${t.active ? DS.ink : DS.line}`,
              display:'flex', gap:5, alignItems:'center', cursor:'pointer',
            }}>
              <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                fontSize:12, color: t.active ? DS.paper : DS.muted,
                fontWeight: t.active ? 500 : 400 }}>{t.label}</span>
              <span style={{ fontFamily:'Cormorant Garamond, Georgia, serif',
                fontSize:12, color: t.active ? 'rgba(247,245,239,0.6)' : DS.muted2 }}>{t.count}</span>
            </div>
          ))}
        </div>

        {/* Scrollable content */}
        <div style={{ flex:1, overflowY:'auto', padding:'24px 28px 0' }}>
          {/* Reading section */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <Label>Reading</Label>
              <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:13,
                color: DS.muted2 }}>— 3</span>
            </div>
            <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
              fontSize:11, color:DS.muted2, letterSpacing:'0.05em' }}>最終更新順</span>
          </div>
          <div style={{ display:'flex', gap:12, marginBottom:32 }}>
            {books.map((b,i) => <BookCard key={i} book={b} showProgress />)}
          </div>

          {/* To Read section */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <Label>To Read</Label>
            <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:13, color:DS.muted2 }}>— 18</span>
          </div>
          <div style={{ display:'flex', gap:12, marginBottom:24 }}>
            {toread.map((b,i) => <BookCard key={i} book={b} />)}
          </div>
        </div>

        <BottomNav active="library" />
      </div>
    </MobileShell>
  );
}

// ── Screen 03: Book Detail ────────────────────────────────────────────────────
export function Screen03Detail() {
  const sessions = [
    { date:'11月14日（木）', detail:'p.248 → p.284 · 36ページ', dur:'42 min' },
    { date:'11月12日（火）', detail:'p.210 → p.248 · 38ページ', dur:'55 min' },
    { date:'11月10日（日）', detail:'p.158 → p.210 · 52ページ', dur:'1h 08m' },
  ];
  return (
    <MobileShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Top bar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'12px 28px' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{color:DS.ink}}>
            <path d="M14 4L6 11l8 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <Label>Detail</Label>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{color:DS.ink}}>
            <circle cx="11" cy="5" r="1.2" fill="currentColor"/>
            <circle cx="11" cy="11" r="1.2" fill="currentColor"/>
            <circle cx="11" cy="17" r="1.2" fill="currentColor"/>
          </svg>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'0 28px' }}>
          {/* Book info */}
          <div style={{ display:'flex', gap:20, marginBottom:28 }}>
            <BookCover title="罪と罰" author="DOSTOEVSKY" publisher="新潮文庫"
              color="#2B3A2E" width={80} height={116} fontSize={12} />
            <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                  fontSize:11, letterSpacing:'0.15em', color:DS.muted2,
                  marginBottom:4 }}>FYODOR DOSTOEVSKY</div>
                <div style={{ fontFamily:'Shippori Mincho, serif',
                  fontSize:26, fontWeight:600, color:DS.ink,
                  lineHeight:1.2, marginBottom:8 }}>罪と罰</div>
                <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                  fontSize:12, color:DS.muted, lineHeight:1.8 }}>
                  新潮文庫・上巻<br/>1866 · 456p
                </div>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:12 }}>
                {['読書中','読了にする'].map((t,i) => (
                  <div key={t} style={{
                    padding:'6px 14px', borderRadius:2,
                    background: i===0 ? DS.ink : 'transparent',
                    border:`1px solid ${DS.ink}`,
                    fontFamily:'Zen Kaku Gothic New, sans-serif',
                    fontSize:11, letterSpacing:'0.08em',
                    color: i===0 ? DS.paper : DS.ink,
                    cursor:'pointer',
                  }}>{t}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress hero */}
          <div style={{ background:DS.line2, borderRadius:2, padding:'20px 20px 16px', marginBottom:16 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
              <div>
                <Label style={{ display:'block', marginBottom:4 }}>Progress</Label>
                <div style={{ display:'flex', alignItems:'baseline', gap:2 }}>
                  <span style={{ fontFamily:'Cormorant Garamond, Georgia, serif',
                    fontSize:72, fontWeight:300, color:DS.ink, lineHeight:1 }}>62</span>
                  <span style={{ fontFamily:'Cormorant Garamond, Georgia, serif',
                    fontSize:24, color:DS.muted, fontWeight:300 }}>%</span>
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <Label style={{ display:'block', marginBottom:6 }}>Remaining</Label>
                <div style={{ fontFamily:'Shippori Mincho, serif',
                  fontSize:15, color:DS.ink2, lineHeight:1.6 }}>
                  あと 172 ページ
                </div>
                <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                  fontSize:12, color:DS.muted }}>約 3時間 42分</div>
              </div>
            </div>
            {/* Progress bar */}
            <div style={{ height:2, background:DS.line, borderRadius:1, margin:'0 0 8px' }}>
              <div style={{ width:'62%', height:'100%', background:DS.ink, borderRadius:1 }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:12, color:DS.muted2 }}>p.1</span>
              <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:12, color:DS.ink2 }}>現在 p.284</span>
              <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:12, color:DS.muted2 }}>p.456</span>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display:'flex', gap:12, marginBottom:20 }}>
            {[['Total Time','4 h 12 m'],['Pace','1.3 min/p']].map(([lbl, val]) => (
              <div key={lbl} style={{ flex:1, background:DS.bg, borderRadius:2, padding:'12px 16px' }}>
                <Label style={{ display:'block', marginBottom:6 }}>{lbl}</Label>
                <span style={{ fontFamily:'Cormorant Garamond, Georgia, serif',
                  fontSize:22, color:DS.ink, fontWeight:400, letterSpacing:'-0.01em' }}>{val}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button style={{
            width:'100%', height:52,
            background:DS.ink, color:DS.paper,
            border:'none', borderRadius:2,
            fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:13, letterSpacing:'0.15em',
            cursor:'pointer', marginBottom:28,
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
          }}>
            読書をはじめる
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <polygon points="3,2 12,7 3,12" fill={DS.paper}/>
            </svg>
          </button>

          {/* Reading history */}
          <Label style={{ display:'block', marginBottom:16 }}>Reading History</Label>
          <div style={{ display:'flex', flexDirection:'column' }}>
            {sessions.map((s,i) => (
              <div key={i} style={{
                borderTop: `1px solid ${DS.line}`,
                padding:'14px 0',
                display:'flex', justifyContent:'space-between', alignItems:'center',
              }}>
                <div>
                  <div style={{ fontFamily:'Shippori Mincho, serif',
                    fontSize:14, color:DS.ink2, marginBottom:3 }}>{s.date}</div>
                  <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                    fontSize:11, color:DS.muted2 }}>{s.detail}</div>
                </div>
                <span style={{ fontFamily:'Cormorant Garamond, Georgia, serif',
                  fontSize:16, color:DS.muted, letterSpacing:'0.02em' }}>{s.dur}</span>
              </div>
            ))}
          </div>
          <div style={{height:32}}/>
        </div>
      </div>
    </MobileShell>
  );
}

