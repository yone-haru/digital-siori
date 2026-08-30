// ─── Interaction Proposals & Typography Polish ────────────────────────────────

// ── (a-1) Typography Polish: Login ────────────────────────────────────────────
// Shows tighter vertical rhythm, larger input, bolder label/value contrast
function ScreenTypoLogin() {
  return (
    <MobileShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
        <div style={{ flex:1, display:'flex', flexDirection:'column',
          padding:'0 28px 32px', justifyContent:'space-between' }}>

          {/* Logo — top */}
          <div style={{ display:'flex', alignItems:'center', gap:12, paddingTop:28 }}>
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <rect width="30" height="30" rx="2" fill={DS.ink}/>
              <polygon points="7,25 7,5 23,5 23,21 15,25" fill={DS.paper}/>
            </svg>
            <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:14,
              letterSpacing:'0.1em', color:DS.ink, lineHeight:1.3 }}>
              Digital<br/>Bookmark
            </div>
          </div>

          {/* Center block */}
          <div>
            {/* Annotation tag */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:6,
              background:DS.line2, borderRadius:2, padding:'4px 10px', marginBottom:20 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#7C9A3A' }}/>
              <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                fontSize:9, color:'#7C9A3A', letterSpacing:'0.15em' }}>IMPROVED</span>
            </div>

            <Label style={{ display:'block', marginBottom:10,
              letterSpacing:'0.28em' /* ← 0.22→0.28 */ }}>Welcome</Label>

            {/* Headline — tighter leading, single line break */}
            <h1 style={{
              fontFamily:'Shippori Mincho, serif',
              fontSize:30, fontWeight:500, color:DS.ink,
              lineHeight:1.65, margin:'0 0 44px',
              letterSpacing:'0.01em',
            }}>あなたの読書を、<br/>次のページへ。</h1>

            {/* Email — value is visibly larger vs label */}
            <div style={{ marginBottom:24 }}>
              <Label style={{ display:'block', marginBottom:7 }}>Email</Label>
              <div style={{ borderBottom:`1px solid ${DS.ink}` /* ← active: ink not line */ ,
                paddingBottom:10, display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontFamily:'Cormorant Garamond, serif',
                  fontSize:20, color:DS.ink, letterSpacing:'0.02em' }}>haru@example.com</span>
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom:40 }}>
              <Label style={{ display:'block', marginBottom:7 }}>Password</Label>
              <div style={{ borderBottom:`1px solid ${DS.line}`, paddingBottom:10 }}>
                <span style={{ fontFamily:'Cormorant Garamond, serif',
                  fontSize:20, color:DS.ink, letterSpacing:'0.2em' }}>••••••••••</span>
              </div>
            </div>

            <button style={{
              width:'100%', height:52, background:DS.ink, color:DS.paper,
              border:'none', borderRadius:2,
              fontFamily:'Zen Kaku Gothic New, sans-serif',
              fontSize:12, letterSpacing:'0.3em', /* ← more tracking */
              cursor:'pointer', marginBottom:22,
            }}>LOG IN</button>

            <p style={{ textAlign:'center', margin:0,
              fontFamily:'Zen Kaku Gothic New, sans-serif',
              fontSize:12, color:DS.muted }}>
              はじめての方は{' '}
              <span style={{ borderBottom:`1px solid ${DS.muted}`, cursor:'pointer' }}>新規登録</span>
            </p>
          </div>

          <div/> {/* spacer */}
        </div>
      </div>
    </MobileShell>
  );
}

// ── (a-2) Typography Polish: Book Detail ─────────────────────────────────────
function ScreenTypoDetail() {
  return (
    <MobileShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
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
          <div style={{ display:'flex', gap:20, marginBottom:28 }}>
            <BookCover title="罪と罰" author="DOSTOEVSKY" publisher="新潮文庫"
              color="#2B3A2E" width={80} height={116} fontSize={12}/>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                fontSize:10, letterSpacing:'0.18em', color:DS.muted2, marginBottom:5 }}>FYODOR DOSTOEVSKY</div>
              <div style={{ fontFamily:'Shippori Mincho, serif',
                fontSize:26, fontWeight:600, color:DS.ink, lineHeight:1.2, marginBottom:10 }}>罪と罰</div>
              <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                fontSize:11, color:DS.muted, lineHeight:1.9 }}>新潮文庫・上巻<br/>1866 · 456p</div>
              <div style={{ display:'flex', gap:8, marginTop:14 }}>
                {['読書中','読了にする'].map((t,i)=>(
                  <div key={t} style={{ padding:'6px 14px', borderRadius:2,
                    background:i===0?DS.ink:'transparent', border:`1px solid ${DS.ink}`,
                    fontFamily:'Zen Kaku Gothic New, sans-serif', fontSize:11,
                    letterSpacing:'0.08em', color:i===0?DS.paper:DS.ink, cursor:'pointer' }}>{t}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress — refined: number takes full width on its own line */}
          <div style={{ background:DS.line2, borderRadius:2, padding:'20px 20px 16px', marginBottom:16 }}>
            {/* Annotation */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:6,
              background:'rgba(124,154,58,0.1)', borderRadius:2, padding:'3px 8px', marginBottom:12 }}>
              <div style={{ width:5, height:5, borderRadius:'50%', background:'#7C9A3A' }}/>
              <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                fontSize:9, color:'#7C9A3A', letterSpacing:'0.15em' }}>IMPROVED — 数字がより主役に</span>
            </div>
            <Label style={{ display:'block', marginBottom:4 }}>Progress</Label>
            {/* Number full-width, no competing element */}
            <div style={{ display:'flex', alignItems:'flex-end', marginBottom:14 }}>
              <span style={{ fontFamily:'Cormorant Garamond, Georgia, serif',
                fontSize:88, fontWeight:300, color:DS.ink, lineHeight:0.9,
                letterSpacing:'-0.04em' }}>62</span>
              <span style={{ fontFamily:'Cormorant Garamond, serif',
                fontSize:28, color:DS.muted, fontWeight:300, marginBottom:6 }}>%</span>
              <div style={{ flex:1, textAlign:'right', paddingBottom:8 }}>
                <div style={{ fontFamily:'Shippori Mincho, serif',
                  fontSize:14, color:DS.ink2 }}>あと 172 ページ</div>
                <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                  fontSize:11, color:DS.muted, marginTop:2 }}>約 3時間 42分</div>
              </div>
            </div>
            <div style={{ height:2, background:DS.line, borderRadius:1, marginBottom:8 }}>
              <div style={{ width:'62%', height:'100%', background:DS.ink, borderRadius:1 }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:12, color:DS.muted2 }}>p.1</span>
              <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:12, color:DS.ink2 }}>現在 p.284</span>
              <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:12, color:DS.muted2 }}>p.456</span>
            </div>
          </div>

          <div style={{ display:'flex', gap:12, marginBottom:20 }}>
            {[['Total Time','4 h 12 m'],['Pace','1.3 min/p']].map(([l,v])=>(
              <div key={l} style={{ flex:1, background:DS.bg, borderRadius:2, padding:'12px 16px' }}>
                <Label style={{ display:'block', marginBottom:6 }}>{l}</Label>
                <span style={{ fontFamily:'Cormorant Garamond, serif',
                  fontSize:22, color:DS.ink, fontWeight:400 }}>{v}</span>
              </div>
            ))}
          </div>
          <button style={{ width:'100%', height:52, background:DS.ink, color:DS.paper,
            border:'none', borderRadius:2, fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:13, letterSpacing:'0.15em', cursor:'pointer', marginBottom:20,
            display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}>
            読書をはじめる
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <polygon points="2,1 11,6 2,11" fill={DS.paper}/>
            </svg>
          </button>
          <div style={{height:20}}/>
        </div>
      </div>
    </MobileShell>
  );
}

// ── (c-1) Skeleton Loading ────────────────────────────────────────────────────
function Skel({ w = '100%', h = 16, radius = 1, style = {} }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: `linear-gradient(90deg, ${DS.line2} 25%, ${DS.line} 50%, ${DS.line2} 75%)`,
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.6s infinite',
      flexShrink: 0,
      ...style,
    }}/>
  );
}

function ScreenSkeleton() {
  return (
    <MobileShell>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
      `}</style>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Header skel */}
        <div style={{ padding:'16px 28px 0' }}>
          <Skel w={48} h={10} style={{marginBottom:10}}/>
          <Skel w={80} h={28}/>
        </div>

        {/* Tabs skel */}
        <div style={{ display:'flex', gap:8, padding:'16px 28px 0' }}>
          {[64,52,52,52].map((w,i)=><Skel key={i} w={w} h={28} radius={14}/>)}
        </div>

        <div style={{ flex:1, padding:'24px 28px 0' }}>
          {/* Section header */}
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
            <Skel w={80} h={10}/>
            <Skel w={60} h={10}/>
          </div>
          {/* Book covers row */}
          <div style={{ display:'flex', gap:12, marginBottom:32 }}>
            {[0,1,2].map(i=>(
              <div key={i} style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <Skel w={104} h={152} radius={2}/>
                <Skel w={104} h={2} radius={1}/>
                <div style={{display:'flex',justifyContent:'space-between'}}>
                  <Skel w={32} h={10}/>
                  <Skel w={40} h={10}/>
                </div>
              </div>
            ))}
          </div>
          {/* Section header 2 */}
          <Skel w={80} h={10} style={{marginBottom:16}}/>
          <div style={{ display:'flex', gap:12 }}>
            {[0,1,2].map(i=><Skel key={i} w={104} h={152} radius={2}/>)}
          </div>
        </div>

        <BottomNav active="library"/>
      </div>
    </MobileShell>
  );
}

// ── (c-2) Tap / Press States ──────────────────────────────────────────────────
function ScreenTapStates() {
  return (
    <MobileShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column',
        padding:'28px 28px', gap:0, overflowY:'auto' }}>
        <Label style={{ display:'block', marginBottom:24 }}>Interaction States</Label>

        {/* Primary button states */}
        <div style={{ marginBottom:40 }}>
          <div style={{ fontFamily:'Shippori Mincho, serif', fontSize:16,
            color:DS.ink2, marginBottom:20 }}>プライマリボタン</div>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {/* Default */}
            <div>
              <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                fontSize:9, color:DS.muted2, letterSpacing:'0.18em',
                marginBottom:6 }}>DEFAULT</div>
              <div style={{ height:52, background:DS.ink, borderRadius:2,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'Zen Kaku Gothic New, sans-serif', fontSize:12,
                letterSpacing:'0.25em', color:DS.paper }}>LOG IN</div>
            </div>
            {/* Pressed */}
            <div>
              <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                fontSize:9, color:DS.muted2, letterSpacing:'0.18em',
                marginBottom:6 }}>PRESSED  ↓  scale(0.98) + opacity 0.82</div>
              <div style={{ height:52, background:DS.ink, borderRadius:2,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'Zen Kaku Gothic New, sans-serif', fontSize:12,
                letterSpacing:'0.25em', color:DS.paper,
                transform:'scale(0.98)', opacity:0.82 }}>LOG IN</div>
            </div>
            {/* Loading */}
            <div>
              <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                fontSize:9, color:DS.muted2, letterSpacing:'0.18em',
                marginBottom:6 }}>LOADING</div>
              <div style={{ height:52, background:DS.ink2, borderRadius:2,
                display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{ width:5, height:5, borderRadius:'50%',
                    background:`rgba(247,245,239,${0.3+i*0.25})` }}/>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Book card tap */}
        <div style={{ marginBottom:40 }}>
          <div style={{ fontFamily:'Shippori Mincho, serif', fontSize:16,
            color:DS.ink2, marginBottom:20 }}>書影カードのタップ</div>
          <div style={{ display:'flex', gap:16, alignItems:'flex-end' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'center' }}>
              <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                fontSize:9, color:DS.muted2, letterSpacing:'0.12em' }}>DEFAULT</div>
              <BookCover title="罪と罰" author="DOSTOEVSKY" publisher="新潮文庫"
                color="#2B3A2E" width={88} height={128} fontSize={12}/>
            </div>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M1 6h14M9 1l6 5-6 5" stroke={DS.muted2} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ display:'flex', flexDirection:'column', gap:6, alignItems:'center' }}>
              <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                fontSize:9, color:DS.muted2, letterSpacing:'0.12em' }}>PRESSED</div>
              <div style={{ transform:'scale(0.95)', opacity:0.85,
                boxShadow:'0 2px 12px rgba(0,0,0,0.25)', borderRadius:2 }}>
                <BookCover title="罪と罰" author="DOSTOEVSKY" publisher="新潮文庫"
                  color="#2B3A2E" width={88} height={128} fontSize={12}/>
              </div>
            </div>
          </div>
        </div>

        {/* Tab filter */}
        <div>
          <div style={{ fontFamily:'Shippori Mincho, serif', fontSize:16,
            color:DS.ink2, marginBottom:20 }}>フィルタータブ切替</div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {/* Before */}
            <div style={{ display:'flex', gap:8 }}>
              {['すべて 24','読書中 3','積読 18'].map((t,i)=>(
                <div key={t} style={{ padding:'6px 12px', borderRadius:20,
                  background: i===0?DS.ink:'transparent',
                  border:`1px solid ${i===0?DS.ink:DS.line}`,
                  fontFamily:'Zen Kaku Gothic New, sans-serif', fontSize:11,
                  color:i===0?DS.paper:DS.muted }}>{t}</div>
              ))}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                fontSize:9, color:DS.muted2, letterSpacing:'0.12em' }}>TAP "読書中"</div>
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                <path d="M1 1l5 6 5-6" stroke={DS.muted2} strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {['すべて 24','読書中 3','積読 18'].map((t,i)=>(
                <div key={t} style={{ padding:'6px 12px', borderRadius:20,
                  background: i===1?DS.ink:'transparent',
                  border:`1px solid ${i===1?DS.ink:DS.line}`,
                  fontFamily:'Zen Kaku Gothic New, sans-serif', fontSize:11,
                  color:i===1?DS.paper:DS.muted,
                  transition:'all 0.2s ease' }}>{t}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}

// ── (c-3) Screen Transition Concept ──────────────────────────────────────────
function TransitionArrow() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
      justifyContent:'center', gap:8, width:56, flexShrink:0 }}>
      <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
        fontSize:9, color:DS.muted2, letterSpacing:'0.12em', textAlign:'center',
        lineHeight:1.6 }}>tap →<br/>slide</div>
      <svg width="32" height="12" viewBox="0 0 32 12" fill="none">
        <path d="M1 6h30M24 1l7 5-7 5" stroke={DS.line} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  );
}

function MiniShell({ children, dark = false, w = 110, h = 190 }) {
  return (
    <div style={{ width:w, height:h, background:dark?'#0F0D0A':DS.paper,
      borderRadius:14, overflow:'hidden', border:`1px solid ${DS.line}`,
      flexShrink:0, display:'flex', flexDirection:'column' }}>
      {/* tiny status bar */}
      <div style={{ height:12, background:'transparent',
        display:'flex', justifyContent:'space-between', padding:'3px 8px',
        alignItems:'center' }}>
        <div style={{ fontFamily:'Cormorant Garamond, serif',
          fontSize:7, color:dark?'rgba(255,255,255,0.4)':DS.muted2 }}>9:41</div>
        <div style={{ width:16, height:4, display:'flex', gap:1, alignItems:'flex-end' }}>
          {[1,0.7,0.5,0.3].map((o,i)=>(
            <div key={i} style={{ width:2.5, height:4*o,
              background:dark?`rgba(255,255,255,${o*0.4})`:`rgba(10,10,10,${o*0.3})`,
              borderRadius:0.5 }}/>
          ))}
        </div>
      </div>
      <div style={{ flex:1 }}>{children}</div>
    </div>
  );
}

function ScreenTransitions() {
  return (
    <MobileShell style={{ height: 1020 }}>
      <div style={{ flex:1, overflowY:'auto', padding:'16px 24px' }}>
        <Label style={{ display:'block', marginBottom:16 }}>Transition Concepts</Label>

        {/* 1. List → Detail: horizontal slide */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:'Shippori Mincho, serif', fontSize:15, color:DS.ink2, marginBottom:14 }}>
            本棚 → 書籍詳細
          </div>
          <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:10, color:DS.muted, marginBottom:12, lineHeight:1.7 }}>
            書影タップで右へスライドイン。<br/>戻る時は左スワイプ or ← ボタン。
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:0 }}>
            <MiniShell>
              <div style={{ padding:'6px 8px' }}>
                <div style={{ fontFamily:'Shippori Mincho, serif', fontSize:9,
                  color:DS.ink, marginBottom:6 }}>本棚</div>
                <div style={{ display:'flex', gap:4 }}>
                  {['#2B3A2E','#C8BFA8','#7C2B28'].map((c,i)=>(
                    <div key={i} style={{ width:28, height:40, background:c, borderRadius:1 }}/>
                  ))}
                </div>
              </div>
            </MiniShell>
            <TransitionArrow/>
            <MiniShell>
              <div style={{ padding:'6px 8px' }}>
                <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:7,
                  color:DS.muted2, marginBottom:3, letterSpacing:'0.1em' }}>DETAIL</div>
                <div style={{ display:'flex', gap:4, marginBottom:6 }}>
                  <div style={{ width:22, height:32, background:'#2B3A2E', borderRadius:1 }}/>
                  <div>
                    <div style={{ fontFamily:'Shippori Mincho, serif', fontSize:8, color:DS.ink }}>罪と罰</div>
                    <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                      fontSize:6, color:DS.muted2, marginTop:2 }}>DOSTOEVSKY</div>
                  </div>
                </div>
                <div style={{ height:20, background:DS.line2, borderRadius:1,
                  display:'flex', alignItems:'center', paddingLeft:5 }}>
                  <span style={{ fontFamily:'Cormorant Garamond, serif',
                    fontSize:14, fontWeight:300, color:DS.ink }}>62</span>
                  <span style={{ fontFamily:'Cormorant Garamond, serif',
                    fontSize:7, color:DS.muted }}>%</span>
                </div>
              </div>
            </MiniShell>
          </div>
        </div>

        {/* 2. Detail → Timer: fade to dark */}
        <div style={{ marginBottom:28 }}>
          <div style={{ fontFamily:'Shippori Mincho, serif', fontSize:15, color:DS.ink2, marginBottom:14 }}>
            書籍詳細 → 読書タイマー
          </div>
          <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:10, color:DS.muted, marginBottom:12, lineHeight:1.7 }}>
            「読書をはじめる」でフェードイン。<br/>黒→紙色で没入感から日常へ戻る演出。
          </div>
          <div style={{ display:'flex', alignItems:'center' }}>
            <MiniShell>
              <div style={{ padding:'6px 8px' }}>
                <div style={{ height:20, background:DS.line2, borderRadius:1, marginBottom:6,
                  display:'flex', alignItems:'center', paddingLeft:5 }}>
                  <span style={{ fontFamily:'Cormorant Garamond, serif',
                    fontSize:14, fontWeight:300, color:DS.ink }}>62</span>
                  <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:7, color:DS.muted }}>%</span>
                </div>
                <div style={{ height:26, background:DS.ink, borderRadius:1,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                    fontSize:7, color:DS.paper, letterSpacing:'0.08em' }}>読書をはじめる ▶</span>
                </div>
              </div>
            </MiniShell>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              width:56, flexShrink:0 }}>
              <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                fontSize:9, color:DS.muted2, letterSpacing:'0.1em', textAlign:'center',
                lineHeight:1.6 }}>fade<br/>dark</div>
              <svg width="32" height="12" viewBox="0 0 32 12" fill="none">
                <path d="M1 6h30M24 1l7 5-7 5" stroke={DS.line} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <MiniShell dark>
              <div style={{ padding:'6px 8px', display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', height:'100%', gap:4 }}>
                <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                  fontSize:7, color:'rgba(255,255,255,0.3)', letterSpacing:'0.15em' }}>ELAPSED</div>
                <div style={{ display:'flex', alignItems:'baseline', gap:1 }}>
                  <span style={{ fontFamily:'Cormorant Garamond, serif',
                    fontSize:28, color:'rgba(255,255,255,0.85)', fontWeight:300, lineHeight:1 }}>0</span>
                  <span style={{ fontFamily:'Cormorant Garamond, serif',
                    fontSize:12, color:'rgba(255,255,255,0.3)', fontWeight:300 }}>:00</span>
                </div>
              </div>
            </MiniShell>
          </div>
        </div>

        {/* 3. Timer → finish */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily:'Shippori Mincho, serif', fontSize:15, color:DS.ink2, marginBottom:14 }}>
            読書終了 → 記録完了
          </div>
          <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:10, color:DS.muted, marginBottom:12, lineHeight:1.7 }}>
            「読書をおわる」後、<br/>結果サマリーをモーダルで表示して書籍詳細に戻る。
          </div>
          <div style={{ display:'flex', alignItems:'center' }}>
            <MiniShell dark>
              <div style={{ padding:'6px 8px', display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', height:'100%', gap:4 }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:1 }}>
                  <span style={{ fontFamily:'Cormorant Garamond, serif',
                    fontSize:24, color:'rgba(255,255,255,0.85)', fontWeight:300 }}>42</span>
                  <span style={{ fontFamily:'Cormorant Garamond, serif',
                    fontSize:11, color:'rgba(255,255,255,0.3)', fontWeight:300 }}>:18</span>
                </div>
                <div style={{ height:16, width:'80%', background:'rgba(247,245,239,0.9)',
                  borderRadius:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                    fontSize:6, color:DS.ink, letterSpacing:'0.08em' }}>読書をおわる</span>
                </div>
              </div>
            </MiniShell>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              width:56, flexShrink:0 }}>
              <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                fontSize:9, color:DS.muted2, letterSpacing:'0.1em', textAlign:'center',
                lineHeight:1.6 }}>modal<br/>+ fade</div>
              <svg width="32" height="12" viewBox="0 0 32 12" fill="none">
                <path d="M1 6h30M24 1l7 5-7 5" stroke={DS.line} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {/* Result modal preview */}
            <MiniShell>
              <div style={{ padding:'8px', display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', height:'100%', gap:4 }}>
                <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                  fontSize:7, color:DS.muted2, letterSpacing:'0.12em' }}>SESSION SAVED</div>
                <div style={{ width:'100%', height:1, background:DS.line }}/>
                <div style={{ display:'flex', justifyContent:'space-between', width:'100%' }}>
                  <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                    fontSize:6, color:DS.muted2 }}>時間</div>
                  <div style={{ fontFamily:'Cormorant Garamond, serif',
                    fontSize:9, color:DS.ink }}>42 min</div>
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', width:'100%' }}>
                  <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                    fontSize:6, color:DS.muted2 }}>ページ</div>
                  <div style={{ fontFamily:'Cormorant Garamond, serif',
                    fontSize:9, color:DS.ink }}>+28p</div>
                </div>
                <div style={{ width:'100%', height:1, background:DS.line }}/>
                <div style={{ height:14, width:'90%', background:DS.ink, borderRadius:1,
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                    fontSize:6, color:DS.paper, letterSpacing:'0.1em' }}>完了</span>
                </div>
              </div>
            </MiniShell>
          </div>
        </div>

        <div style={{height:32}}/>
      </div>
    </MobileShell>
  );
}

Object.assign(window, {
  ScreenTypoLogin, ScreenTypoDetail,
  ScreenSkeleton, ScreenTapStates, ScreenTransitions
});
