export function BookmarkLogo() {
  return (
    <div className="flex items-center gap-3">
      {/* Bookmark SVG icon */}
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <rect width="32" height="32" rx="2" fill="#0A0A0A" />
        <polygon points="8,26 8,6 24,6 24,22 16,26" fill="#F7F5EF" />
        <rect x="8" y="6" width="16" height="2" fill="#0A0A0A" />
      </svg>

      <div className="leading-[1.2]">
        <div className="font-cormorant text-[15px] font-normal tracking-[0.08em] text-ink">
          Digital
        </div>
        <div className="font-cormorant text-[15px] font-normal tracking-[0.08em] text-ink">
          Bookmark
        </div>
      </div>
    </div>
  );
}
