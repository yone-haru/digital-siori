const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, '..', 'assets');

// ── デザイン定数 ──────────────────────────────────────────
const INK   = '#1A1814';  // アプリのダーク色
const CREAM = '#F7F5EF';  // アプリのペーパー色
const LINE  = 'rgba(26,24,20,0.18)';

// ── ブックマーク形状（中心512,512 / 幅276 / 高さ524）──────
// 上辺の角丸あり、下部にV字ノッチ
const MARK = `
  M 386 238
  Q 386 228 396 228
  L 628 228
  Q 638 228 638 238
  L 638 764
  L 512 668
  L 386 764
  Z
`;

// ── SVG 生成ヘルパー ──────────────────────────────────────
function iconSvg(size) {
  const scale = size / 1024;
  return `<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="${INK}"/>
  <!-- ブックマーク本体 -->
  <path d="${MARK}" fill="${CREAM}"/>
  <!-- 装飾ライン（本のページ罫線のイメージ） -->
  <line x1="410" y1="304" x2="614" y2="304" stroke="${INK}" stroke-width="1.5" opacity="0.22"/>
  <line x1="410" y1="326" x2="560" y2="326" stroke="${INK}" stroke-width="1.5" opacity="0.13"/>
</svg>`;
}

// スプラッシュ用：クリーム背景にダークブックマーク（小さめ）
function splashSvg(size) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="${CREAM}"/>
  <!-- ブックマーク本体（ダーク） -->
  <path d="${MARK}" fill="${INK}"/>
  <!-- 装飾ライン -->
  <line x1="410" y1="304" x2="614" y2="304" stroke="${CREAM}" stroke-width="1.5" opacity="0.35"/>
  <line x1="410" y1="326" x2="560" y2="326" stroke="${CREAM}" stroke-width="1.5" opacity="0.2"/>
</svg>`;
}

// ── PNG 書き出し ──────────────────────────────────────────
function writePng(svgStr, outPath, label) {
  const resvg = new Resvg(svgStr);
  const rendered = resvg.render();
  const buf = rendered.asPng();
  fs.writeFileSync(outPath, buf);
  console.log(`✓ ${label} (${rendered.width}x${rendered.height})`);
}

writePng(iconSvg(1024),   path.join(assetsDir, 'icon.png'),          'icon.png');
writePng(iconSvg(1024),   path.join(assetsDir, 'adaptive-icon.png'), 'adaptive-icon.png');
writePng(splashSvg(1024), path.join(assetsDir, 'splash-icon.png'),   'splash-icon.png');
writePng(iconSvg(32),     path.join(assetsDir, 'favicon.png'),       'favicon.png');

console.log('\nすべての画像を生成しました。');
