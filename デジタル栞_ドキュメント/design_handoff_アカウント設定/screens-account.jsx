// ─── Account Settings Screen + sub-flows ──────────────────────────────────────

const DARK_BG = '#0F0D0A';
const DARK_CARD = '#1A1815';
const DARK_LINE = 'rgba(255,255,255,0.08)';
const W_92 = 'rgba(255,255,255,0.92)';
const W_70 = 'rgba(255,255,255,0.70)';
const W_55 = 'rgba(255,255,255,0.55)';
const W_35 = 'rgba(255,255,255,0.35)';
const W_25 = 'rgba(255,255,255,0.25)';
const W_10 = 'rgba(255,255,255,0.10)';
const DANGER = '#C77B6F';

// Avatar color palette — pulled from book spine palette (same DNA as covers).
const AVATAR_COLORS = [
  '#2B3A2E', '#7C2B28', '#1B2A3A', '#3D2B1A',
  '#2A2A2A', '#4A3728', '#5C2E2E', '#8B7355',
];

// ── icons ────────────────────────────────────────────────────────────────────
function Chevron({ color = W_35 }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 3l4 4-4 4" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function LogoutIcon({ color = DANGER }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M9 2H3.5A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14H9" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M11 5l3 3-3 3M6 8h8" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function TrashIcon({ color = DANGER }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 4.5h10M6 4.5V3A1 1 0 0 1 7 2h2a1 1 0 0 1 1 1v1.5M4.5 4.5l.6 8.5A1 1 0 0 0 6 14h4a1 1 0 0 0 1-1l.6-8.5"
        stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}
function CameraIcon({ color = W_92, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h1.7l1-1.4a1 1 0 0 1 .8-.4h2a1 1 0 0 1 .8.4l1 1.4h1.7A1.5 1.5 0 0 1 14 5.5v6.5A1.5 1.5 0 0 1 12.5 13.5h-9A1.5 1.5 0 0 1 2 12V5.5z"
        stroke={color} strokeWidth="1.2" strokeLinejoin="round"/>
      <circle cx="8" cy="8.5" r="2.4" stroke={color} strokeWidth="1.2"/>
    </svg>
  );
}
function PaintIcon({ color = W_92, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M11 2l3 3-8 8H3v-3l8-8z" stroke={color} strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M9 4l3 3" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}
function ResetIcon({ color = W_92, size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8a5 5 0 1 0 1.5-3.5L3 6" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3 3v3h3" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// ── Avatar primitive ────────────────────────────────────────────────────────
function Avatar({ size = 96, color = AVATAR_COLORS[2], letter = 'H', editable = false }) {
  return (
    <div style={{ position:'relative', width:size, height:size }}>
      <div style={{
        width:size, height:size, borderRadius:'50%',
        background: color,
        display:'flex', alignItems:'center', justifyContent:'center',
        boxShadow:'0 4px 16px rgba(0,0,0,0.3)',
      }}>
        <span style={{
          fontFamily:'Cormorant Garamond, Georgia, serif',
          fontSize: size * 0.5, fontWeight:300,
          color: 'rgba(255,255,255,0.92)',
          letterSpacing:'0.02em', lineHeight:1,
        }}>{letter}</span>
      </div>
      {editable && (
        <div style={{
          position:'absolute', bottom:-2, right:-2,
          width: 30, height: 30, borderRadius:'50%',
          background: DS.paper,
          display:'flex', alignItems:'center', justifyContent:'center',
          boxShadow:'0 2px 8px rgba(0,0,0,0.4)',
          border: `2px solid ${DARK_BG}`,
        }}>
          <CameraIcon color={DS.ink} size={14}/>
        </div>
      )}
    </div>
  );
}

// ── Setting row primitives ──────────────────────────────────────────────────
function SectionLabel({ children, style = {} }) {
  return (
    <div style={{
      padding:'0 28px 12px', ...style,
      fontFamily:'Zen Kaku Gothic New, sans-serif',
      fontSize:10, letterSpacing:'0.22em', fontWeight:500,
      color: W_35, textTransform:'uppercase',
    }}>{children}</div>
  );
}

function Row({ label, value, sub, danger = false, chevron = true, action }) {
  const labelColor = danger ? DANGER : W_92;
  const valueColor = danger ? DANGER : W_55;
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'18px 28px',
      borderTop:`1px solid ${DARK_LINE}`,
      cursor:'pointer',
      gap:16,
    }}>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontFamily:'Zen Kaku Gothic New, sans-serif',
          fontSize:14, color: labelColor,
          letterSpacing:'0.02em',
        }}>{label}</div>
        {sub && (
          <div style={{
            fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:11, color: W_35, marginTop:4,
            letterSpacing:'0.02em',
          }}>{sub}</div>
        )}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        {value && (
          <div style={{
            fontFamily: /^[\x00-\x7F@.\-_+]+$/.test(value)
              ? 'Cormorant Garamond, Georgia, serif'
              : 'Shippori Mincho, serif',
            fontSize: 14, color: valueColor,
            maxWidth: 180, overflow:'hidden',
            textOverflow:'ellipsis', whiteSpace:'nowrap',
          }}>{value}</div>
        )}
        {action ?? (chevron && <Chevron color={danger ? DANGER : W_25}/>)}
      </div>
    </div>
  );
}

// ── Main Account Screen ─────────────────────────────────────────────────────
function AccountScreen() {
  return (
    <MobileShell dark>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {/* Top bar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'12px 24px' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M14 4L6 11l8 7" stroke={W_55} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif', fontSize:10,
            letterSpacing:'0.28em', color:W_55 }}>ACCOUNT</span>
          <div style={{ width:22 }}/>
        </div>

        <div style={{ flex:1, overflowY:'auto', paddingTop:8 }}>
          {/* Hero — avatar + name + email */}
          <div style={{ display:'flex', flexDirection:'column',
            alignItems:'center', gap:14, padding:'24px 28px 36px' }}>
            <Avatar size={96} color={AVATAR_COLORS[2]} letter="ハ" editable/>
            <div style={{ textAlign:'center' }}>
              <div style={{
                fontFamily:'Shippori Mincho, serif',
                fontSize:22, fontWeight:600, color: W_92, lineHeight:1.3,
                marginBottom:6, letterSpacing:'0.02em',
              }}>住野ハル</div>
              <div style={{
                fontFamily:'Cormorant Garamond, Georgia, serif',
                fontSize:13, color: W_55,
                letterSpacing:'0.02em',
              }}>haru@example.com</div>
            </div>
          </div>

          {/* Profile section */}
          <SectionLabel>Profile</SectionLabel>
          <div>
            <Row label="アイコン" value="" action={
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <Avatar size={28} color={AVATAR_COLORS[2]} letter="ハ"/>
                <Chevron/>
              </div>
            }/>
            <Row label="表示名" sub="本棚やレビューに表示されます" value="住野ハル"/>
          </div>

          {/* Security section */}
          <div style={{ paddingTop:32 }}/>
          <SectionLabel>Security</SectionLabel>
          <div>
            <Row label="メールアドレス" value="haru@example.com" chevron={false}/>
            <Row label="パスワードを変更" sub="最終更新 2026年 3月"/>
          </div>

          {/* Danger zone */}
          <div style={{ paddingTop:36 }}/>
          <div>
            <Row label="ログアウト" danger chevron={false} action={<LogoutIcon/>}/>
            <Row label="アカウントを削除" sub="本棚や読書履歴も含めて完全に消えます" danger chevron={false} action={<TrashIcon/>}/>
          </div>

          {/* Footer */}
          <div style={{ borderTop:`1px solid ${DARK_LINE}`, marginTop:0,
            padding:'24px 28px 32px', textAlign:'center' }}>
            <div style={{
              fontFamily:'Cormorant Garamond, Georgia, serif',
              fontSize:11, color: W_25, letterSpacing:'0.2em',
            }}>DIGITAL BOOKMARK · v 1.0.2</div>
          </div>
        </div>

        <BottomNav active="library" dark/>
      </div>
    </MobileShell>
  );
}

// ── Sub-flow A: Avatar / Icon picker ────────────────────────────────────────
function IconPickerScreen() {
  return (
    <MobileShell dark>
      <div style={{ flex:1, display:'flex', flexDirection:'column',
        overflow:'hidden', position:'relative' }}>
        {/* Dimmed parent visible at top */}
        <div style={{ position:'absolute', inset:0, opacity:0.18, pointerEvents:'none' }}>
          <div style={{ padding:'80px 28px' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14 }}>
              <Avatar size={96} color={AVATAR_COLORS[2]} letter="ハ"/>
              <div style={{ fontFamily:'Shippori Mincho, serif', fontSize:22, color:W_92 }}>住野ハル</div>
            </div>
          </div>
        </div>
        <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.55)' }}/>

        {/* Bottom sheet */}
        <div style={{
          position:'absolute', left:0, right:0, bottom:0,
          background: '#16140F',
          borderRadius:'16px 16px 0 0',
          padding:'12px 0 32px',
          boxShadow:'0 -16px 40px rgba(0,0,0,0.6)',
        }}>
          {/* Drag handle */}
          <div style={{ width:40, height:3, background:W_25,
            borderRadius:2, margin:'0 auto 22px' }}/>

          {/* Heading */}
          <div style={{ padding:'0 28px 16px' }}>
            <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
              fontSize:10, letterSpacing:'0.22em', color:W_35 }}>CHANGE AVATAR</span>
            <h2 style={{ margin:'6px 0 0', fontFamily:'Shippori Mincho, serif',
              fontSize:20, fontWeight:500, color:W_92, letterSpacing:'0.02em' }}>アイコンを変更</h2>
          </div>

          {/* Preview */}
          <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 32px' }}>
            <Avatar size={104} color={AVATAR_COLORS[2]} letter="ハ"/>
          </div>

          {/* Photo upload row */}
          <div style={{ borderTop:`1px solid ${DARK_LINE}`,
            borderBottom:`1px solid ${DARK_LINE}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:14,
              padding:'18px 28px', cursor:'pointer' }}>
              <CameraIcon color={W_70}/>
              <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                fontSize:14, color:W_92 }}>写真から選ぶ</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ padding:'24px 28px 0' }}>
            <button style={{
              width:'100%', height:50, border:`1px solid ${DARK_LINE}`, borderRadius:2,
              background:'transparent', color:W_92,
              fontFamily:'Zen Kaku Gothic New, sans-serif',
              fontSize:13, letterSpacing:'0.15em', cursor:'pointer',
            }}>キャンセル</button>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}

// ── Sub-flow B: Display name editor ─────────────────────────────────────────
function DisplayNameScreen() {
  return (
    <MobileShell dark>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'12px 24px' }}>
          <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:13, color:W_55, cursor:'pointer' }}>キャンセル</span>
          <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:10, letterSpacing:'0.28em', color:W_55 }}>DISPLAY NAME</span>
          <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:13, color:W_92, cursor:'pointer', fontWeight:500 }}>保存</span>
        </div>

        <div style={{ padding:'40px 28px 0' }}>
          <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:10, letterSpacing:'0.22em', color:W_35 }}>NAME</span>
          <div style={{ marginTop:14, paddingBottom:14,
            borderBottom: `1.5px solid ${W_92}` }}>
            <span style={{
              fontFamily:'Shippori Mincho, serif',
              fontSize:28, fontWeight:500, color:W_92,
              letterSpacing:'0.04em',
            }}>住野ハル</span>
            <span style={{
              display:'inline-block', width:1.5, height:30,
              background:W_92, marginLeft:2, verticalAlign:'-6px',
              animation: 'blink 1s steps(2) infinite',
            }}/>
          </div>
          <style>{`@keyframes blink { 50% { opacity: 0; } }`}</style>
          <div style={{ display:'flex', justifyContent:'space-between',
            marginTop:14, fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:11, color:W_35 }}>
            <span>本棚やレビューに表示されます</span>
            <span style={{ fontFamily:'Cormorant Garamond, serif' }}>4 / 20</span>
          </div>
        </div>
      </div>
    </MobileShell>
  );
}

// ── Sub-flow C: Delete account confirmation ─────────────────────────────────
function DeleteAccountScreen() {
  return (
    <MobileShell dark>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'12px 24px' }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M14 4L6 11l8 7" stroke={W_55} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif', fontSize:10,
            letterSpacing:'0.28em', color:W_55 }}>DELETE ACCOUNT</span>
          <div style={{ width:22 }}/>
        </div>

        <div style={{ flex:1, padding:'28px 28px 0', overflowY:'auto' }}>
          <h2 style={{ margin:'0 0 18px',
            fontFamily:'Shippori Mincho, serif',
            fontSize:24, fontWeight:500, color: W_92,
            lineHeight:1.55, letterSpacing:'0.02em' }}>
            このアカウントを<br/>削除しますか？
          </h2>
          <p style={{ margin:'0 0 28px',
            fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:13, color: W_55, lineHeight:1.9 }}>
            すべての本棚・読書履歴・読書時間の記録が、復元できない形で消えます。
          </p>

          {/* Stats list — what will be lost */}
          <div style={{ background:DARK_CARD, borderRadius:2,
            padding:'20px 22px', marginBottom:28 }}>
            <div style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
              fontSize:10, letterSpacing:'0.22em', color:W_35,
              marginBottom:14 }}>WILL BE LOST</div>
            {[
              { l:'登録した本', v:'24', u:'冊' },
              { l:'読書セッション', v:'87', u:'件' },
              { l:'累計読書時間', v:'127 h 42 m', u:'' },
            ].map((r, i) => (
              <div key={i} style={{
                display:'flex', justifyContent:'space-between', alignItems:'baseline',
                padding:'10px 0',
                borderTop: i === 0 ? 'none' : `1px solid ${DARK_LINE}`,
              }}>
                <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                  fontSize:13, color:W_70 }}>{r.l}</span>
                <span>
                  <span style={{ fontFamily:'Cormorant Garamond, serif',
                    fontSize:18, color:W_92, fontWeight:300 }}>{r.v}</span>
                  {r.u && <span style={{ fontFamily:'Zen Kaku Gothic New, sans-serif',
                    fontSize:11, color:W_55, marginLeft:4 }}>{r.u}</span>}
                </span>
              </div>
            ))}
          </div>

          {/* Final caution line */}
          <div style={{ marginBottom:36, padding:'0 4px',
            fontFamily:'Shippori Mincho, serif',
            fontSize:14, color:W_70, lineHeight:1.9 }}>
            この操作は取り消せません。
          </div>
        </div>

        {/* Sticky action area */}
        <div style={{ padding:'0 28px 32px', borderTop:`1px solid ${DARK_LINE}`, paddingTop:20 }}>
          <button style={{
            width:'100%', height:52, border:'none', borderRadius:2,
            background: DANGER, color: DARK_BG,
            fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:13, letterSpacing:'0.18em', fontWeight:500,
            cursor:'pointer', marginBottom:10,
          }}>アカウントを削除する</button>
          <button style={{
            width:'100%', height:52, border:`1px solid ${DARK_LINE}`, borderRadius:2,
            background:'transparent', color:W_92,
            fontFamily:'Zen Kaku Gothic New, sans-serif',
            fontSize:13, letterSpacing:'0.18em',
            cursor:'pointer',
          }}>キャンセル</button>
        </div>
      </div>
    </MobileShell>
  );
}

Object.assign(window, { AccountScreen, IconPickerScreen, DisplayNameScreen, DeleteAccountScreen });
