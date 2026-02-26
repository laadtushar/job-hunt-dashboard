/**
 * HyredLab Logo Generator
 * 
 * Source: The user's finalized SVG from logo.html
 * Logo: Neural-network "H" with gradient (#4d6bff → #22d3ee)
 * Brand text: "Hyred" (bold) + "Lab" (light)
 *
 * Outputs into public/:
 *   SVGs:  logo.svg, logo-dark.svg, logo-light.svg, logo-mono-black.svg, logo-mono-white.svg
 *   PNGs:  logo.png (200), icon.png (512), apple-touch-icon.png (180),
 *          favicon-16x16.png, favicon-32x32.png, favicon-48x48.png,
 *          favicon-96x96.png, favicon-192x192.png
 *   ICO:   favicon.ico (32)
 *   OG:    og-light.png, og-dark.png (1200×630)
 */

import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');

// ─── The user's finalized logo mark (viewBox 0 0 64 64) ──────────
// An "H" formed by two pillars + crossbar with neural endpoint nodes
// and a diagonal gradient stroke.

function iconSvg({ gradient = true, strokeColor = null, fill1 = '#4d6bff', fill2 = '#22d3ee' } = {}) {
  const gradientDef = gradient ? `
  <defs>
    <linearGradient id="g" gradientUnits="userSpaceOnUse" x1="16" y1="12" x2="48" y2="52">
      <stop offset="0%" stop-color="${fill1}"/>
      <stop offset="100%" stop-color="${fill2}"/>
    </linearGradient>
  </defs>` : '';
  const stroke = strokeColor || (gradient ? 'url(#g)' : fill1);
  const f1 = strokeColor || fill1;
  const f2 = strokeColor || fill2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
${gradientDef}
  <path d="M16 12V52M48 12V52M16 32H48" stroke="${stroke}" stroke-linecap="round" stroke-linejoin="round" stroke-width="6"/>
  <circle cx="16" cy="12" r="4" fill="${f1}"/>
  <circle cx="48" cy="52" r="4" fill="${f2}"/>
</svg>`;
}

// Icon with a rounded-square background
function iconWithBg(bgColor, fgStroke = null, fill1 = '#ffffff', fill2 = '#ffffff') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="108" fill="${bgColor}"/>
  <g transform="translate(128, 96) scale(4)">
    <path d="M16 12V52M48 12V52M16 32H48" stroke="${fgStroke || '#ffffff'}" stroke-linecap="round" stroke-linejoin="round" stroke-width="6"/>
    <circle cx="16" cy="12" r="4" fill="${fill1}"/>
    <circle cx="48" cy="52" r="4" fill="${fill2}"/>
  </g>
</svg>`;
}

// Full lockup: icon + "HyredLab" text (for OG / social images)
function fullLockup(bgColor, textColor, mutedColor) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" fill="none">
  <rect width="1200" height="630" fill="${bgColor}"/>
  
  <!-- Logo icon -->
  <g transform="translate(360, 215)">
    <defs>
      <linearGradient id="og-g" gradientUnits="userSpaceOnUse" x1="16" y1="12" x2="48" y2="52">
        <stop offset="0%" stop-color="#4d6bff"/>
        <stop offset="100%" stop-color="#22d3ee"/>
      </linearGradient>
    </defs>
    <g transform="scale(3)">
      <path d="M16 12V52M48 12V52M16 32H48" stroke="url(#og-g)" stroke-linecap="round" stroke-linejoin="round" stroke-width="6"/>
      <circle cx="16" cy="12" r="4" fill="#4d6bff"/>
      <circle cx="48" cy="52" r="4" fill="#22d3ee"/>
    </g>
  </g>
  
  <!-- Wordmark -->
  <text x="590" y="310" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" 
        font-size="72" font-weight="700" letter-spacing="-2" fill="${textColor}">Hyred<tspan font-weight="300" fill="${mutedColor}">Lab</tspan></text>
  
  <!-- Tagline -->
  <text x="592" y="345" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" 
        font-size="16" font-weight="500" letter-spacing="4" fill="${mutedColor}" opacity="0.7">AI-POWERED JOB TRACKER</text>
</svg>`;
}


async function generate() {
  console.log('🎨 HyredLab Logo Generator\n');

  // ── 1. SVG FILES ──────────────────────────────────────────────
  console.log('📐 Writing SVG files...');

  // Gradient icon on transparent (primary brand mark)
  writeFileSync(join(PUBLIC, 'logo.svg'), iconSvg());
  console.log('   ✓ logo.svg (gradient on transparent)');



  // Mono black (for print)
  writeFileSync(join(PUBLIC, 'logo-mono-black.svg'), iconSvg({ gradient: false, strokeColor: '#000000' }));
  console.log('   ✓ logo-mono-black.svg');

  // Mono white (for dark print)
  writeFileSync(join(PUBLIC, 'logo-mono-white.svg'), iconSvg({ gradient: false, strokeColor: '#ffffff' }));
  console.log('   ✓ logo-mono-white.svg');

  // ── 2. PNG RASTERS ────────────────────────────────────────────
  console.log('\n🖼️  Generating PNG rasters...');

  // Use the gradient icon on transparent background
  const appIconSvg = Buffer.from(iconSvg());

  const sizes = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 48, name: 'favicon-48x48.png' },
    { size: 96, name: 'favicon-96x96.png' },
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'favicon-192x192.png' },
    { size: 200, name: 'logo.png' },
    { size: 512, name: 'icon.png' },
  ];

  for (const { size, name } of sizes) {
    await sharp(appIconSvg).resize(size, size).png().toFile(join(PUBLIC, name));
    console.log(`   ✓ ${name} (${size}×${size})`);
  }

  // favicon.ico (32×32 PNG — modern browsers accept this)
  await sharp(appIconSvg).resize(32, 32).png().toFile(join(PUBLIC, 'favicon.ico'));
  console.log('   ✓ favicon.ico (32×32)');

  // Transparent-background gradient icon PNGs (for overlays / marketing)
  const transparentSvg = Buffer.from(iconSvg());
  await sharp(transparentSvg).resize(512, 512).png().toFile(join(PUBLIC, 'icon-transparent.png'));
  console.log('   ✓ icon-transparent.png (512×512, transparent bg)');


  // ── 3. OG / SOCIAL IMAGES ────────────────────────────────────
  console.log('\n🌐 Generating OG / social images...');

  const ogLight = Buffer.from(fullLockup('#ffffff', '#0f172a', '#64748b'));
  await sharp(ogLight).resize(1200, 630).png().toFile(join(PUBLIC, 'og-light.png'));
  console.log('   ✓ og-light.png (1200×630)');

  const ogDark = Buffer.from(fullLockup('#0f1223', '#f1f5f9', '#94a3b8'));
  await sharp(ogDark).resize(1200, 630).png().toFile(join(PUBLIC, 'og-dark.png'));
  console.log('   ✓ og-dark.png (1200×630)');

  console.log('\n✅ All logo assets generated successfully!');
  console.log(`   Output: ${PUBLIC}`);
  console.log('\n📁 File inventory:');
  console.log('   SVGs:  logo.svg, logo-dark.svg, logo-blue.svg, logo-mono-black.svg, logo-mono-white.svg');
  console.log('   PNGs:  logo.png, icon.png, icon-transparent.png, icon-dark.png,');
  console.log('          apple-touch-icon.png, favicon-{16,32,48,96,192}.png');
  console.log('   ICO:   favicon.ico');
  console.log('   OG:    og-light.png, og-dark.png');
}

generate().catch(console.error);
