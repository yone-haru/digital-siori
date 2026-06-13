import { DS, MobileShell, BottomNav, Label } from './shared-components';

// ─── Screens 04–06 ────────────────────────────────────────────────────────────

// ── Screen 04: Reading Timer ──────────────────────────────────────────────────
export function Screen04Timer() {
  const darkInk = '#0F0D0A';
  const dimWhite = 'rgba(255,255,255,0.55)';
  const brightWhite = 'rgba(255,255,255,0.92)';
  return (
    <MobileShell dark>
      <div style={{ flex:1, display:'flex', flexDirection:'column' }}>
        {/* Top bar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'12px 28px' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M6 6l10 10M16 6L6 16" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <Label dark style={{ letterSpacing:'0.22em' }}>Now Reading</Label>
          <div style={{ width:22 }}/>
        </div>

        {/* Book info */}
        <div style={{ textAlign:'center', padding:'24px 28px 0' }}>
          <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:11, letterSpacing:'0.22em', color:'rgba(255,255,255,0.35)',
            marginBottom:6, textTransform:'uppercase' }}>Dostoevsky</div>
          <div style={{ fontFamily:'Shippori Mincho, serif',
            fontSize:22, fontWeight:500, color:brightWhite,
            letterSpacing:'0.05em' }}>罪と罰</div>
        </div>

        {/* Timer hero */}
        <div style={{ flex:1, display:'flex', flexDirection:'column',
          justifyContent:'center', alignItems:'center', gap:0 }}>
          <Label dark style={{ marginBottom:20 }}>Elapsed</Label>
          <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
            <span style={{
              fontFamily:'Cormorant Garamond, Georgia, serif',
              fontSize:96, fontWeight:300,
              color:brightWhite, lineHeight:1,
              letterSpacing:'-0.03em',
            }}>42</span>
            <span style={{
              fontFamily:'Cormorant Garamond, Georgia, serif',
              fontSize:36, fontWeight:300,
              color:'rgba(255,255,255,0.45)', lineHeight:1,
              letterSpacing:'-0.02em',
            }}>:18</span>
          </div>
          <div style={{
            fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:10, letterSpacing:'0.28em',
            color:'rgba(255,255,255,0.3)',
            marginTop:10,
          }}>MINUTES · SECONDS</div>

          {/* Pulse indicator */}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:28 }}>
            <div style={{ width:7, height:7, borderRadius:'50%',
              background:'rgba(255,255,255,0.7)',
              boxShadow:'0 0 12px rgba(255,255,255,0.5)' }}/>
            <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
              fontSize:10, letterSpacing:'0.22em',
              color:'rgba(255,255,255,0.4)', textTransform:'uppercase' }}>Reading</span>
          </div>
        </div>

        {/* Bottom info */}
        <div style={{ padding:'0 28px 0' }}>
          <div style={{ borderTop:'1px solid rgba(255,255,255,0.08)',
            paddingTop:20, paddingBottom:20,
            display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
            <div>
              <Label dark style={{ display:'block', marginBottom:8 }}>Started At</Label>
              <span style={{ fontFamily:'Cormorant Garamond, Georgia, serif',
                fontSize:22, color:dimWhite, fontWeight:300 }}>p. 284</span>
            </div>
            <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
              <path d="M1 6h18M13 1l6 5-6 5" stroke="rgba(255,255,255,0.25)"
                strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <div style={{ textAlign:'right' }}>
              <Label dark style={{ display:'block', marginBottom:8 }}>Current</Label>
              <div style={{ display:'flex', alignItems:'baseline', gap:1 }}>
                <span style={{ fontFamily:'Cormorant Garamond, Georgia, serif',
                  fontSize:16, color:'rgba(255,255,255,0.35)', fontWeight:300 }}>p.</span>
                <span style={{ fontFamily:'Cormorant Garamond, Georgia, serif',
                  fontSize:28, color:brightWhite, fontWeight:300,
                  borderBottom:'1px solid rgba(255,255,255,0.3)',
                  paddingBottom:1, letterSpacing:'-0.02em' }}>312</span>
              </div>
            </div>
          </div>

          {/* End button */}
          <div style={{
            background:DS.paper, borderRadius:2,
            height:52, display:'flex', alignItems:'center', justifyContent:'center',
            marginBottom:32, cursor:'pointer',
          }}>
            <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
              fontSize:13, letterSpacing:'0.15em', color:DS.ink, fontWeight:500 }}>読書をおわる</span>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}

// ── Screen 05: Add Book ────────────────────────────────────────────────────────
export function Screen05AddBook() {
  const results = [
    { title:'海辺のカフカ 上', author:'村上春樹・新潮文庫', year:'2005', pages:'448p', color:'#2A2A2A' },
    { title:'海辺のカフカ 下', author:'村上春樹・新潮文庫', year:'2005', pages:'496p', color:'#2A2A2A' },
    { title:'Kafka on the Shore', author:'H. Murakami · Vintage', year:'2005', pages:'505p', color:'#7A6A54' },
    { title:'少年カフカ', author:'村上春樹・新潮社', year:'2003', pages:'600p', color:'#C0A87A' },
  ];
  return (
    <MobileShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Top bar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'12px 28px' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{color:DS.muted}}>
            <path d="M6 6l10 10M16 6L6 16" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <Label>Add a Book</Label>
          <div style={{ width:22 }}/>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'8px 28px 0' }}>
          {/* Heading */}
          <h1 style={{ margin:'0 0 4px', fontFamily:'Shippori Mincho, serif',
            fontSize:28, fontWeight:500, color:DS.ink }}>本を棚に加える</h1>
          <p style={{ margin:'0 0 24px', fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:12, color:DS.muted }}>タイトルや著者で検索してください</p>

          {/* Search box */}
          <div style={{
            display:'flex', alignItems:'center', gap:10,
            borderBottom:`1.5px solid ${DS.ink}`,
            paddingBottom:10, marginBottom:28,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{color:DS.muted2, flexShrink:0}}>
              <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
              fontSize:16, color:DS.ink, flex:1 }}>海辺のカフカ</span>
          </div>

          {/* Results header */}
          <div style={{ display:'flex', justifyContent:'space-between',
            alignItems:'center', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Label>Results</Label>
              <span style={{ fontFamily:'Cormorant Garamond, serif',
                fontSize:13, color:DS.muted2 }}>· 4</span>
            </div>
            <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
              fontSize:10, color:DS.muted2, letterSpacing:'0.05em' }}>Google Books</span>
          </div>

          {/* Result list */}
          <div>
            {results.map((r, i) => (
              <div key={i} style={{
                borderTop: `1px solid ${DS.line}`,
                padding:'14px 0',
                display:'flex', alignItems:'center', gap:14,
              }}>
                {/* Fixed-size thumbnail */}
                <div style={{
                  width:48, height:68,
                  background:r.color, borderRadius:1,
                  flexShrink:0,
                  boxShadow:'1px 1px 4px rgba(0,0,0,0.2)',
                  display:'flex', alignItems:'flex-end', padding:4,
                }}>
                  <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                    fontSize:7, color:'rgba(255,255,255,0.45)',
                    lineHeight:1.3, wordBreak:'break-all' }}>
                    {r.title.length > 6 ? r.title.slice(0,6) : r.title}
                  </span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'Shippori Mincho, serif',
                    fontSize:15, color:DS.ink, marginBottom:3,
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.title}</div>
                  <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                    fontSize:12, color:DS.muted, marginBottom:2 }}>{r.author}</div>
                  <div style={{ fontFamily:'Cormorant Garamond, serif',
                    fontSize:12, color:DS.muted2 }}>{r.year} · {r.pages}</div>
                </div>
                {/* Add button — larger touch target */}
                <div style={{
                  width:36, height:36, borderRadius:'50%',
                  border:`1.2px solid ${DS.line}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', flexShrink:0,
                  color:DS.muted,
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
            ))}
            <div style={{ borderTop:`1px solid ${DS.line}` }}/>
          </div>

          {/* Manual add */}
          <div style={{ textAlign:'center', padding:'24px 0 32px' }}>
            <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
              fontSize:12, color:DS.muted }}>見つからない場合は</span>
            <br/>
            <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
              fontSize:12, color:DS.ink,
              borderBottom:`1px solid ${DS.ink}`, cursor:'pointer',
              letterSpacing:'0.03em' }}>手動で本を追加する</span>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}

// ── Screen 06: Stats ──────────────────────────────────────────────────────────
export function Screen06Stats() {
  // Weekly bar data: M T W T F S S, minutes per day
  const weekData = [
    { day:'M', mins:32 }, { day:'T', mins:0 }, { day:'W', mins:55 },
    { day:'T', mins:42, today:true }, { day:'F', mins:0 }, { day:'S', mins:88 }, { day:'S', mins:22 },
  ];
  const maxMins = Math.max(...weekData.map(d => d.mins), 1);
  const BAR_MAX_H = 52;

  return (
    <MobileShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ padding:'16px 28px 0' }}>
          <Label>Reading Record</Label>
          <h1 style={{ margin:'4px 0 0', fontFamily:'Shippori Mincho, serif',
            fontSize:32, fontWeight:500, color:DS.ink }}>読書手帖</h1>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'24px 28px 0' }}>
          {/* Hero time */}
          <div style={{ marginBottom:28 }}>
            <Label style={{ display:'block', marginBottom:10 }}>Total Reading Time</Label>
            <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
              <span style={{ fontFamily:'Cormorant Garamond, Georgia, serif',
                fontSize:80, fontWeight:300, color:DS.ink, lineHeight:1,
                letterSpacing:'-0.03em' }}>127</span>
              <span style={{ fontFamily:'Cormorant Garamond, Georgia, serif',
                fontSize:28, fontWeight:300, color:DS.muted }}>h</span>
              <span style={{ fontFamily:'Cormorant Garamond, Georgia, serif',
                fontSize:48, fontWeight:300, color:DS.ink2,
                letterSpacing:'-0.02em' }}>42</span>
              <span style={{ fontFamily:'Cormorant Garamond, Georgia, serif',
                fontSize:28, fontWeight:300, color:DS.muted }}>m</span>
            </div>
            <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
              fontSize:11, color:DS.muted2, marginTop:6 }}>2026年 累計 · 1日平均 21分</div>
          </div>

          {/* 4-grid stats */}
          <div style={{
            display:'grid', gridTemplateColumns:'1fr 1fr',
            gap:1, background:DS.line, border:`1px solid ${DS.line}`,
            borderRadius:2, overflow:'hidden', marginBottom:28,
          }}>
            {[
              ['Finished', '12', 'books', '読了した本'],
              ['Reading',  '3',  'books', '読書中の本'],
              ['Pages',    '4,812', '', '読んだページ'],
              ['Streak',   '18', 'days', '連続読書日数'],
            ].map(([label, num, unit, sub]) => (
              <div key={label} style={{ background:DS.paper, padding:'16px 18px' }}>
                <Label style={{ display:'block', marginBottom:8 }}>{label}</Label>
                <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                  <span style={{ fontFamily:'Cormorant Garamond, Georgia, serif',
                    fontSize:34, fontWeight:300, color:DS.ink, letterSpacing:'-0.02em',
                    lineHeight:1 }}>{num}</span>
                  {unit && <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                    fontSize:12, color:DS.muted }}>{unit}</span>}
                </div>
                <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                  fontSize:11, color:DS.muted2, marginTop:4 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* This Week */}
          <div style={{ marginBottom:32 }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'baseline', marginBottom:16 }}>
              <Label>This Week</Label>
              <span style={{ fontFamily:'Cormorant Garamond, serif',
                fontSize:13, color:DS.muted }}>合計 4h 23m</span>
            </div>

            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'flex-end', height: BAR_MAX_H + 32 }}>
              {weekData.map((d, i) => {
                const barH = d.mins > 0 ? Math.max(4, Math.round((d.mins / maxMins) * BAR_MAX_H)) : 0;
                return (
                  <div key={i} style={{ display:'flex', flexDirection:'column',
                    alignItems:'center', gap:6, width:32 }}>
                    <div style={{ width:32, height:BAR_MAX_H,
                      display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
                      {d.mins > 0 && (
                        <div style={{
                          width:'100%', height:barH,
                          background: d.today ? DS.ink : DS.muted2,
                          borderRadius:'1px 1px 0 0',
                          opacity: d.today ? 1 : 0.55,
                        }}/>
                      )}
                    </div>
                    <span style={{
                      fontFamily: d.today ? 'Cormorant Garamond, serif' : 'Zen Kaku Gothic New, sans-serif',
                      fontSize: d.today ? 13 : 10,
                      color: d.today ? DS.ink : DS.muted2,
                      fontWeight: d.today ? 600 : 400,
                      letterSpacing: d.today ? '0.02em' : '0.08em',
                      borderBottom: d.today ? `1px solid ${DS.ink}` : 'none',
                      paddingBottom: d.today ? 1 : 0,
                    }}>{d.day}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <BottomNav active="stats" />
      </div>
    </MobileShell>
  );
}

