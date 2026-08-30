// ─── Detail Screen with Trash / Delete UI Variations ──────────────────────────

const DARK_BG = '#0F0D0A';
const DARK_CARD = '#1A1815';
const DARK_LINE = 'rgba(255,255,255,0.08)';
const W_92 = 'rgba(255,255,255,0.92)';
const W_55 = 'rgba(255,255,255,0.55)';
const W_35 = 'rgba(255,255,255,0.35)';
const W_25 = 'rgba(255,255,255,0.25)';
const DANGER = '#C77B6F'; // muted terracotta — quietly destructive

function TrashIcon({ size = 18, color = W_55 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M3 5h12M7 5V3.5A1.5 1.5 0 0 1 8.5 2h1A1.5 1.5 0 0 1 11 3.5V5M5 5l.7 9.2A1.5 1.5 0 0 0 7.2 15.5h3.6a1.5 1.5 0 0 0 1.5-1.3L13 5"
        stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function KebabIcon({ color = W_55 }) {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <circle cx="11" cy="5"  r="1.4" fill={color}/>
      <circle cx="11" cy="11" r="1.4" fill={color}/>
      <circle cx="11" cy="17" r="1.4" fill={color}/>
    </svg>
  );
}

// Recreate the user's book detail screen, dark mode
function DetailBaseDark({ topRight, children, dim = false }) {
  return (
    <MobileShell dark>
      <div style={{
        flex: 1, display:'flex', flexDirection:'column', overflow:'hidden',
        position:'relative', filter: dim ? 'brightness(0.4)' : 'none',
      }}>
        {/* Top bar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'12px 24px' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M14 4L6 11l8 7" stroke={W_55} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif', fontSize:10,
            letterSpacing:'0.28em', color:W_55 }}>DETAIL</span>
          {topRight ?? <div style={{width:22}}/>}
        </div>

        <div style={{ flex:1, overflowY:'auto', padding:'0 24px' }}>
          {/* Book info */}
          <div style={{ display:'flex', gap:18, marginBottom:24 }}>
            <BookCover title="また、同じ夢を見ていた" author="住野よる" publisher="双葉社"
              color="#1B2A3A" width={84} height={120} fontSize={11}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                fontSize:11, color:W_55, marginBottom:4 }}>住野よる</div>
              <div style={{ fontFamily:'Shippori Mincho, serif',
                fontSize:22, fontWeight:600, color:W_92, lineHeight:1.3,
                marginBottom:8 }}>また、同じ夢を見ていた</div>
              <div style={{ fontFamily:'Cormorant Garamond, serif',
                fontSize:13, color:W_35 }}>174p</div>
              <div style={{ display:'flex', gap:6, marginTop:10 }}>
                {[
                  {l:'読書中', active:true},
                  {l:'読了にする'},
                  {l:'積読にする'},
                ].map((b,i) => (
                  <div key={i} style={{
                    padding:'6px 10px', borderRadius:2, fontSize:10,
                    fontFamily:'Zen Kaku Gothic New, sans-serif',
                    background: b.active ? DS.paper : 'transparent',
                    color: b.active ? DS.ink : W_55,
                    border: b.active ? 'none' : `1px solid ${DARK_LINE}`,
                    letterSpacing:'0.04em',
                  }}>{b.l}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div style={{ background:DARK_CARD, borderRadius:2, padding:'16px 18px', marginBottom:14 }}>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <Label dark>Progress</Label>
              <Label dark>Remaining</Label>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginTop:6 }}>
              <div style={{ display:'flex', alignItems:'baseline' }}>
                <span style={{ fontFamily:'Cormorant Garamond, serif',
                  fontSize:64, fontWeight:300, color:W_92, lineHeight:1, letterSpacing:'-0.03em' }}>72</span>
                <span style={{ fontFamily:'Cormorant Garamond, serif',
                  fontSize:22, color:W_35 }}>%</span>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontFamily:'Shippori Mincho, serif', fontSize:14, color:W_92 }}>
                  あと <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:18 }}>48</span> ページ
                </div>
                <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:11, color:W_35, marginTop:2 }}>約 10m 05s</div>
              </div>
            </div>
            <div style={{ height:1, background:'rgba(255,255,255,0.1)', marginTop:14, marginBottom:6 }}>
              <div style={{ width:'72%', height:1, background:W_92 }}/>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:10, color:W_25 }}>p.1</span>
              <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:11, color:W_55 }}>現在 p.126</span>
              <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:10, color:W_25 }}>p.174</span>
            </div>
          </div>

          {/* Current/Total page */}
          <div style={{ display:'flex', gap:12, marginBottom:14 }}>
            {[['Current Page','p. 126'],['Total Pages','p. 174']].map(([l,v]) => (
              <div key={l} style={{ flex:1 }}>
                <Label dark style={{ display:'block', marginBottom:6 }}>{l}</Label>
                <span style={{ fontFamily:'Cormorant Garamond, serif',
                  fontSize:24, fontWeight:300, color:W_92, borderBottom:`1px solid ${W_25}`,
                  paddingBottom:4, display:'inline-block', minWidth:60 }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Stats grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:24 }}>
            {[
              ['Total Time','26m 27s'],
              ['Sessions','4'],
              ['Times Read','0'],
            ].map(([l,v]) => (
              <div key={l} style={{ background:DARK_CARD, borderRadius:2, padding:'12px 12px' }}>
                <Label dark style={{ display:'block', marginBottom:6 }}>{l}</Label>
                <span style={{ fontFamily:'Cormorant Garamond, serif',
                  fontSize:18, fontWeight:300, color:W_92 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Children = top-right overlays */}
        {children}
      </div>
    </MobileShell>
  );
}

// ── Variant A: Trash in top bar ──────────────────────────────────────────────
function VariantA() {
  return (
    <DetailBaseDark topRight={
      <div style={{ display:'flex', gap:14, alignItems:'center' }}>
        <TrashIcon/>
        <KebabIcon/>
      </div>
    }>
      <div style={{ position:'absolute', top:60, right:24,
        background:DARK_CARD, borderRadius:2,
        boxShadow:'0 12px 32px rgba(0,0,0,0.6)',
        padding:'4px 0', minWidth:60,
      }}>
        <div style={{ position:'absolute', top:-44, right:54,
          fontFamily:'Zen Kaku Gothic New, sans-serif', fontSize:9,
          color:'#7C9A3A', letterSpacing:'0.18em', whiteSpace:'nowrap' }}>↑ A · ICON</div>
      </div>
    </DetailBaseDark>
  );
}

// ── Variant B: Trash inside kebab menu ───────────────────────────────────────
function VariantB() {
  const items = [
    { label:'本の情報を編集', icon:(
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M2 12L3 9l6.5-6.5a1.4 1.4 0 0 1 2 2L5 11l-3 1z" stroke={W_55} strokeWidth="1.2" strokeLinejoin="round"/>
      </svg>
    )},
    { label:'読書履歴を見る', icon:(
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="7" cy="7" r="5.5" stroke={W_55} strokeWidth="1.2"/>
        <path d="M7 4v3.2L9 8.5" stroke={W_55} strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
    )},
    { label:'共有', icon:(
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="3" cy="7" r="1.5" stroke={W_55} strokeWidth="1.2"/>
        <circle cx="10.5" cy="3" r="1.5" stroke={W_55} strokeWidth="1.2"/>
        <circle cx="10.5" cy="11" r="1.5" stroke={W_55} strokeWidth="1.2"/>
        <path d="M4.4 6.3l4.7-2.6M4.4 7.7l4.7 2.6" stroke={W_55} strokeWidth="1.2"/>
      </svg>
    )},
  ];
  return (
    <DetailBaseDark topRight={<KebabIcon color={W_92}/>}>
      <div style={{ position:'absolute', top:50, right:18, zIndex:20,
        background:'#1F1C18', borderRadius:4,
        boxShadow:'0 16px 40px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.4)',
        padding:'6px 0', minWidth:200,
        border:`1px solid ${DARK_LINE}`,
      }}>
        {items.map((it, i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:12,
            padding:'12px 16px', cursor:'pointer' }}>
            {it.icon}
            <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
              fontSize:13, color:W_92 }}>{it.label}</span>
          </div>
        ))}
        <div style={{ height:1, background:DARK_LINE, margin:'4px 0' }}/>
        <div style={{ display:'flex', alignItems:'center', gap:12,
          padding:'12px 16px', cursor:'pointer' }}>
          <TrashIcon size={14} color={DANGER}/>
          <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:13, color:DANGER }}>本棚から削除</span>
        </div>
      </div>
    </DetailBaseDark>
  );
}

// ── Variant C: Confirmation bottom sheet ─────────────────────────────────────
function VariantC() {
  return (
    <MobileShell dark>
      <div style={{ flex:1, display:'flex', flexDirection:'column',
        overflow:'hidden', position:'relative' }}>
        {/* Dimmed background — re-render the detail screen at low opacity */}
        <div style={{ position:'absolute', inset:0, opacity:0.25, pointerEvents:'none' }}>
          <DetailBaseDark/>
        </div>
        {/* Backdrop */}
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.5)' }}/>

        {/* Bottom sheet */}
        <div style={{
          position:'absolute', left:0, right:0, bottom:0,
          background:'#16140F',
          borderRadius:'16px 16px 0 0',
          padding:'12px 28px 32px',
          boxShadow:'0 -16px 40px rgba(0,0,0,0.6)',
        }}>
          {/* Drag handle */}
          <div style={{ width:40, height:3, background:'rgba(255,255,255,0.18)',
            borderRadius:2, margin:'0 auto 22px' }}/>

          {/* Book preview */}
          <div style={{ display:'flex', gap:14, marginBottom:24,
            paddingBottom:20, borderBottom:`1px solid ${DARK_LINE}` }}>
            <BookCover title="また、同じ夢を見ていた" author="住野よる" publisher="双葉社"
              color="#1B2A3A" width={48} height={68} fontSize={9}/>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                fontSize:10, color:W_55, marginBottom:3 }}>住野よる</div>
              <div style={{ fontFamily:'Shippori Mincho, serif',
                fontSize:15, fontWeight:600, color:W_92, lineHeight:1.4,
                overflow:'hidden', textOverflow:'ellipsis',
                display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
                また、同じ夢を見ていた
              </div>
            </div>
          </div>

          {/* Headline */}
          <h2 style={{ margin:'0 0 12px',
            fontFamily:'Shippori Mincho, serif', fontSize:20,
            fontWeight:500, color:W_92, lineHeight:1.55 }}>
            この本を本棚から<br/>削除しますか？
          </h2>

          {/* Body */}
          <p style={{ margin:'0 0 6px',
            fontFamily:'Zen Kaku Gothic New, sans-serif', fontSize:12,
            color:W_55, lineHeight:1.9 }}>
            読書履歴 <span style={{ color:W_92, fontFamily:'Cormorant Garamond, serif', fontSize:14 }}>4</span> 件、
            累計時間 <span style={{ color:W_92, fontFamily:'Cormorant Garamond, serif', fontSize:14 }}>26m 27s</span> も
          </p>
          <p style={{ margin:'0 0 28px',
            fontFamily:'Zen Kaku Gothic New, sans-serif', fontSize:12,
            color:W_55, lineHeight:1.9 }}>
            すべて消えます。この操作は取り消せません。
          </p>

          {/* Actions — vertical stack, destructive at top */}
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <button style={{
              height:50, border:'none', borderRadius:2,
              background:DANGER, color:DARK_BG,
              fontFamily:'Zen Kaku Gothic New, sans-serif',
              fontSize:13, letterSpacing:'0.15em', fontWeight:500,
              cursor:'pointer',
            }}>削除する</button>
            <button style={{
              height:50, border:`1px solid ${DARK_LINE}`, borderRadius:2,
              background:'transparent', color:W_92,
              fontFamily:'Zen Kaku Gothic New, sans-serif',
              fontSize:13, letterSpacing:'0.15em',
              cursor:'pointer',
            }}>キャンセル</button>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}

// ── Variant D: Toast after delete (with undo) ────────────────────────────────
function VariantD() {
  return (
    <MobileShell>
      {/* Show empty bookshelf state with toast overlay */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', position:'relative' }}>
        <div style={{ padding:'16px 28px 0' }}>
          <Label>Library</Label>
          <h1 style={{ margin:'4px 0 0', fontFamily:'Shippori Mincho, serif',
            fontSize:32, fontWeight:500, color:DS.ink }}>本棚</h1>
        </div>
        <div style={{ display:'flex', gap:8, padding:'16px 28px 0' }}>
          {[{l:'すべて',c:23,a:true},{l:'読書中',c:2},{l:'積読',c:18},{l:'読了',c:3}].map((t,i)=>(
            <div key={i} style={{ padding:'6px 12px', borderRadius:20,
              background:t.a?DS.ink:'transparent', border:`1px solid ${t.a?DS.ink:DS.line}`,
              display:'flex', gap:5, alignItems:'center' }}>
              <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                fontSize:12, color:t.a?DS.paper:DS.muted }}>{t.l}</span>
              <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:12,
                color:t.a?'rgba(247,245,239,0.6)':DS.muted2 }}>{t.c}</span>
            </div>
          ))}
        </div>
        <div style={{ flex:1, padding:'24px 28px 0' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <Label>Reading</Label>
            <span style={{ fontFamily:'Cormorant Garamond, serif', fontSize:13, color:DS.muted2 }}>— 2</span>
          </div>
          <div style={{ display:'flex', gap:12 }}>
            <BookCover title="罪と罰" author="DOSTOEVSKY" publisher="新潮文庫"
              color="#2B3A2E" width={104} height={152} fontSize={13}/>
            <BookCover title="ノルウェイの森" author="H. MURAKAMI" publisher="講談社"
              color="#C8BFA8" width={104} height={152} fontSize={13}/>
          </div>
        </div>

        {/* Toast */}
        <div style={{
          position:'absolute', left:20, right:20, bottom:104,
          background:DS.ink, borderRadius:2,
          padding:'14px 18px',
          display:'flex', alignItems:'center', justifyContent:'space-between', gap:14,
          boxShadow:'0 12px 32px rgba(0,0,0,0.25)',
        }}>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:'Shippori Mincho, serif',
              fontSize:13, color:DS.paper, lineHeight:1.5,
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              「また、同じ夢を見ていた」を削除しました
            </div>
          </div>
          <span style={{
            fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:11, letterSpacing:'0.18em', color:DS.paper,
            borderBottom:`1px solid ${DS.paper}`, cursor:'pointer',
            paddingBottom:1,
          }}>元に戻す</span>
        </div>

        <BottomNav active="library"/>
      </div>
    </MobileShell>
  );
}

Object.assign(window, { VariantA, VariantB, VariantC, VariantD });
