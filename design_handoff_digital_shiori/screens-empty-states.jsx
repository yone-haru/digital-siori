import { DS, MobileShell, BottomNav, Label } from './shared-components';

// ─── Empty States ─────────────────────────────────────────────────────────────

// ── Empty Bookshelf ───────────────────────────────────────────────────────────
export function ScreenEmptyBookshelf() {
  const tabs = [
    { label:'すべて', count:0, active:true },
    { label:'読書中', count:0 },
    { label:'積読', count:0 },
    { label:'読了', count:0 },
  ];
  return (
    <MobileShell>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Header */}
        <div style={{ padding:'16px 28px 0', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
          <div>
            <Label>Library</Label>
            <h1 style={{ margin:'4px 0 0', fontFamily:'Shippori Mincho, serif',
              fontSize:32, fontWeight:500, color:DS.ink }}>本棚</h1>
          </div>
          <div style={{ display:'flex', gap:16, paddingBottom:4 }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{color:DS.muted2}}>
              <circle cx="9.5" cy="9.5" r="6.5" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M14.5 14.5L19 19" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            <div style={{ width:32, height:32, borderRadius:'50%', background:DS.line2,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontFamily:'Cormorant Garamond, serif', fontSize:14, color:DS.muted2, fontWeight:600 }}>H</div>
          </div>
        </div>

        {/* Filter tabs — all grey */}
        <div style={{ display:'flex', gap:8, padding:'16px 28px 0' }}>
          {tabs.map(t => (
            <div key={t.label} style={{
              padding:'6px 12px', borderRadius:20,
              background: t.active ? DS.ink : 'transparent',
              border: `1px solid ${t.active ? DS.ink : DS.line}`,
              display:'flex', gap:5, alignItems:'center',
              opacity: t.active ? 1 : 0.45,
            }}>
              <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                fontSize:12, color: t.active ? DS.paper : DS.muted }}>{t.label}</span>
              <span style={{ fontFamily:'Cormorant Garamond, serif',
                fontSize:12, color: t.active ? 'rgba(247,245,239,0.5)' : DS.muted2 }}>{t.count}</span>
            </div>
          ))}
        </div>

        {/* Empty center */}
        <div style={{ flex:1, display:'flex', flexDirection:'column',
          alignItems:'center', justifyContent:'center', padding:'0 48px', gap:0 }}>

          {/* Bookmark icon — a single vertical mark */}
          <div style={{
            width:2, height:64,
            background: DS.line,
            marginBottom:32,
            position:'relative',
          }}>
            <div style={{
              position:'absolute', bottom:0, left:-7,
              width:16, height:16,
              borderLeft:`2px solid ${DS.line}`,
              borderRight:`2px solid ${DS.line}`,
              borderBottom:`9px solid ${DS.paper}`,
              clipPath:'polygon(0 0, 100% 0, 100% 100%, 50% 75%, 0 100%)',
              background: DS.line,
            }}/>
          </div>

          <p style={{
            fontFamily:'Shippori Mincho, serif',
            fontSize:18, fontWeight:500,
            color:DS.ink2, textAlign:'center',
            lineHeight:1.7, marginBottom:16,
          }}>本棚はまだ空です。</p>
          <p style={{
            fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:12, color:DS.muted,
            textAlign:'center', lineHeight:1.9,
            letterSpacing:'0.03em',
          }}>最初の一冊を見つけましょう。<br/>下の ＋ から本を検索できます。</p>

          {/* Subtle arrow pointing down toward nav */}
          <div style={{ marginTop:40, display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
            <div style={{ width:1, height:32, background:DS.line }}/>
            <svg width="12" height="7" viewBox="0 0 12 7" fill="none">
              <path d="M1 1l5 5 5-5" stroke={DS.line} strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        <BottomNav active="library" />
      </div>
    </MobileShell>
  );
}

// ── Empty Stats ───────────────────────────────────────────────────────────────
export function ScreenEmptyStats() {
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
          {/* Hero — zero state */}
          <div style={{ marginBottom:32 }}>
            <Label style={{ display:'block', marginBottom:12 }}>Total Reading Time</Label>
            <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
              <span style={{ fontFamily:'Cormorant Garamond, Georgia, serif',
                fontSize:80, fontWeight:300, color:DS.line,
                lineHeight:1, letterSpacing:'-0.03em',
                userSelect:'none' }}>—</span>
            </div>
            <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
              fontSize:11, color:DS.muted2, marginTop:8 }}>記録がまだありません</div>
          </div>

          {/* 4-grid — all zero */}
          <div style={{
            display:'grid', gridTemplateColumns:'1fr 1fr',
            gap:1, background:DS.line, border:`1px solid ${DS.line}`,
            borderRadius:2, overflow:'hidden', marginBottom:40,
          }}>
            {[
              ['Finished','—','読了した本'],
              ['Reading','—','読書中の本'],
              ['Pages','—','読んだページ'],
              ['Streak','—','連続読書日数'],
            ].map(([label, num, sub]) => (
              <div key={label} style={{ background:DS.paper, padding:'16px 18px' }}>
                <Label style={{ display:'block', marginBottom:8 }}>{label}</Label>
                <div style={{ fontFamily:'Cormorant Garamond, Georgia, serif',
                  fontSize:34, fontWeight:300, color:DS.line, lineHeight:1 }}>{num}</div>
                <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                  fontSize:11, color:DS.muted2, marginTop:4 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Empty state message */}
          <div style={{
            borderTop:`1px solid ${DS.line}`,
            paddingTop:32, textAlign:'center',
          }}>
            <p style={{
              fontFamily:'Shippori Mincho, serif',
              fontSize:15, color:DS.ink2,
              lineHeight:2, marginBottom:12,
            }}>
              読書を記録すると、<br/>ここに手帖が育ちます。
            </p>
            <p style={{
              fontFamily:'Zen Kaku Gothic New, sans-serif',
              fontSize:11, color:DS.muted2,
              lineHeight:1.9, letterSpacing:'0.03em',
            }}>
              本棚から「読書をはじめる」を<br/>タップして最初のセッションを記録しましょう。
            </p>
          </div>
        </div>

        <BottomNav active="stats" />
      </div>
    </MobileShell>
  );
}

