// ─── デジタル栞 Shared Components ───────────────────────────────────────────

export const DS = {
  paper:  '#F7F5EF',
  bg:     '#F0ECE2',
  ink:    '#0A0A0A',
  ink2:   '#2A2A2A',
  muted:  '#6E6B65',
  muted2: '#9A968F',
  line:   '#E3DFD6',
  line2:  '#EFEBE2',
};

// ── Status Bar ──────────────────────────────────────────────────────────────
export function StatusBar({ dark = false }) {
  const c = dark ? 'rgba(255,255,255,0.7)' : DS.muted;
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
      padding:'14px 28px 0', height: 44 }}>
      <span style={{ fontFamily:'Cormorant Garamond, Georgia, serif', fontSize:15,
        fontWeight:600, color: dark ? '#fff' : DS.ink, letterSpacing:'0.02em' }}>9:41</span>
      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
        {/* Signal */}
        <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
          <rect x="0"  y="7" width="3" height="5" rx="0.5" fill={c}/>
          <rect x="4.5" y="4.5" width="3" height="7.5" rx="0.5" fill={c}/>
          <rect x="9" y="2" width="3" height="10" rx="0.5" fill={c}/>
          <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill={c}/>
        </svg>
        {/* WiFi */}
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
          <path d="M8 9.5a1.2 1.2 0 1 1 0 2.4A1.2 1.2 0 0 1 8 9.5z" fill={c}/>
          <path d="M4.2 7.1a5.4 5.4 0 0 1 7.6 0" stroke={c} strokeWidth="1.4" strokeLinecap="round" fill="none"/>
          <path d="M1.5 4.4a9.2 9.2 0 0 1 13 0" stroke={c} strokeWidth="1.4" strokeLinecap="round" fill="none"/>
        </svg>
        {/* Battery */}
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect x="0.5" y="0.5" width="21" height="11" rx="2.5" stroke={c} strokeWidth="1"/>
          <rect x="2" y="2" width="16" height="8" rx="1.5" fill={c}/>
          <path d="M22.5 4.5v3a1.5 1.5 0 0 0 0-3z" fill={c}/>
        </svg>
      </div>
    </div>
  );
}

// ── Mobile Shell ─────────────────────────────────────────────────────────────
export function MobileShell({ children, dark = false, style = {} }) {
  return (
    <div style={{
      width: 390, height: 844,
      background: dark ? '#0F0D0A' : DS.paper,
      borderRadius: 48,
      overflow: 'hidden',
      boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.10)',
      position: 'relative',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0,
      ...style,
    }}>
      <StatusBar dark={dark} />
      <div style={{ flex: 1, overflow: 'hidden', display:'flex', flexDirection:'column' }}>
        {children}
      </div>
    </div>
  );
}

// ── Bottom Nav ────────────────────────────────────────────────────────────────
export function BottomNav({ active = 'library', dark = false }) {
  const ink = dark ? '#fff' : DS.ink;
  const mut = dark ? 'rgba(255,255,255,0.35)' : DS.muted2;
  const items = [
    { id: 'library', label: 'LIBRARY', icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="2" width="7" height="18" rx="1" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="12" y="5" width="7" height="15" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    )},
    { id: 'add', label: 'ADD', icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="8.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M11 7v8M7 11h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    )},
    { id: 'stats', label: 'STATS', icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 17l4.5-5.5 4 3.5 4.5-7 4 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )},
  ];
  return (
    <div style={{
      borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : DS.line}`,
      background: dark ? '#0F0D0A' : DS.paper,
      display: 'flex', padding: '8px 0 24px',
    }}>
      {items.map(item => {
        const isActive = item.id === active;
        return (
          <div key={item.id} style={{
            flex: 1, display:'flex', flexDirection:'column', alignItems:'center', gap: 4,
            color: isActive ? ink : mut,
            cursor: 'pointer',
          }}>
            {item.icon}
            <span style={{
              fontFamily: 'Zen Kaku Gothic New, sans-serif',
              fontSize: 9, letterSpacing: '0.18em', fontWeight: 500,
            }}>{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Label (英字スモールキャップ風) ────────────────────────────────────────────
export function Label({ children, style = {}, dark = false }) {
  return (
    <span style={{
      fontFamily: 'Zen Kaku Gothic New, sans-serif',
      fontSize: 10, letterSpacing: '0.22em', fontWeight: 500,
      color: dark ? 'rgba(255,255,255,0.4)' : DS.muted2,
      textTransform: 'uppercase',
      ...style,
    }}>{children}</span>
  );
}

// ── Book Cover (colored block) ────────────────────────────────────────────────
export function BookCover({ title, author, publisher, color = '#2B3A2E', width = 88, height = 130, fontSize = 12 }) {
  return (
    <div style={{
      width, height,
      background: color,
      borderRadius: 2,
      padding: 8,
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      boxShadow: '2px 2px 8px rgba(0,0,0,0.22)',
      flexShrink: 0,
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div>
        <div style={{
          fontFamily: 'Shippori Mincho, serif',
          fontSize, color: 'rgba(255,255,255,0.92)',
          lineHeight: 1.4, fontWeight: 500,
          wordBreak: 'break-all',
        }}>{title}</div>
        <div style={{
          fontFamily: 'Zen Kaku Gothic New, sans-serif',
          fontSize: Math.max(8, fontSize - 4),
          color: 'rgba(255,255,255,0.55)',
          marginTop: 4, letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>{author}</div>
      </div>
      <div style={{
        fontFamily: 'Zen Kaku Gothic New, sans-serif',
        fontSize: Math.max(7, fontSize - 5),
        color: 'rgba(255,255,255,0.45)',
        letterSpacing: '0.05em',
      }}>{publisher}</div>
    </div>
  );
}

