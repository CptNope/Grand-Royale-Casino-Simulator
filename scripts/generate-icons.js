import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Full-bleed icon SVG for standard icon & favicon
const standardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14532d" />
      <stop offset="70%" stop-color="#052e16" />
      <stop offset="100%" stop-color="#021c0e" />
    </radialGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="40%" stop-color="#eab308" />
      <stop offset="70%" stop-color="#ca8a04" />
      <stop offset="100%" stop-color="#a16207" />
    </linearGradient>
    <linearGradient id="rubyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f87171" />
      <stop offset="60%" stop-color="#dc2626" />
      <stop offset="100%" stop-color="#991b1b" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background felt disc -->
  <rect width="512" height="512" rx="100" fill="url(#bgGrad)" />

  <!-- Outer casino wheel dashed ring -->
  <circle cx="256" cy="256" r="224" fill="none" stroke="url(#goldGrad)" stroke-width="8" stroke-dasharray="16 12" opacity="0.6" />
  <circle cx="256" cy="256" r="206" fill="none" stroke="url(#goldGrad)" stroke-width="3" opacity="0.8" />

  <!-- Outer chip segments -->
  <g fill="url(#rubyGrad)">
    <rect x="242" y="32" width="28" height="32" rx="4" />
    <rect x="242" y="448" width="28" height="32" rx="4" />
    <rect x="32" y="242" width="32" height="28" rx="4" />
    <rect x="448" y="242" width="32" height="28" rx="4" />
    <rect x="94" y="94" width="26" height="26" rx="4" transform="rotate(45 107 107)" />
    <rect x="385" y="94" width="26" height="26" rx="4" transform="rotate(45 398 107)" />
    <rect x="94" y="385" width="26" height="26" rx="4" transform="rotate(45 107 398)" />
    <rect x="385" y="385" width="26" height="26" rx="4" transform="rotate(45 398 398)" />
  </g>

  <!-- Inner luxury medallion -->
  <circle cx="256" cy="256" r="160" fill="#090d0b" stroke="url(#goldGrad)" stroke-width="7" />
  <circle cx="256" cy="256" r="146" fill="none" stroke="#ca8a04" stroke-width="1.5" stroke-dasharray="6 4" />

  <!-- Golden Crown Icon -->
  <path d="M176 304 L160 216 L216 252 L256 184 L296 252 L352 216 L336 304 Z" fill="url(#goldGrad)" filter="url(#glow)" />
  <!-- Crown Jewels -->
  <circle cx="160" cy="208" r="8" fill="#fef08a" />
  <circle cx="256" cy="176" r="10" fill="#fef08a" />
  <circle cx="352" cy="208" r="8" fill="#fef08a" />
  <!-- Crown Base Bar with Emerald & Diamond insets -->
  <rect x="176" y="308" width="160" height="22" rx="6" fill="url(#goldGrad)" />
  <circle cx="216" cy="319" r="4.5" fill="#10b981" />
  <circle cx="256" cy="319" r="5" fill="#ef4444" />
  <circle cx="296" cy="319" r="4.5" fill="#10b981" />

  <!-- 4 Suits below crown -->
  <text x="256" y="366" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#fef08a" text-anchor="middle" letter-spacing="6">♠ ♥ ♦ ♣</text>
</svg>`;

// Maskable icon with 15% safe-zone margin (scale down inner contents inside a full-bleed square canvas)
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <radialGradient id="bgGradMask" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#14532d" />
      <stop offset="70%" stop-color="#052e16" />
      <stop offset="100%" stop-color="#021c0e" />
    </radialGradient>
    <linearGradient id="goldGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="40%" stop-color="#eab308" />
      <stop offset="70%" stop-color="#ca8a04" />
      <stop offset="100%" stop-color="#a16207" />
    </linearGradient>
    <linearGradient id="rubyGradMask" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f87171" />
      <stop offset="60%" stop-color="#dc2626" />
      <stop offset="100%" stop-color="#991b1b" />
    </linearGradient>
    <filter id="glowMask" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Full-bleed background color for maskable safe-zone -->
  <rect width="512" height="512" fill="#021c0e" />
  <circle cx="256" cy="256" r="256" fill="url(#bgGradMask)" />

  <!-- Scaled content to fit central 75% safe zone -->
  <g transform="translate(256 256) scale(0.76) translate(-256 -256)">
    <!-- Outer casino wheel dashed ring -->
    <circle cx="256" cy="256" r="224" fill="none" stroke="url(#goldGradMask)" stroke-width="8" stroke-dasharray="16 12" opacity="0.6" />
    <circle cx="256" cy="256" r="206" fill="none" stroke="url(#goldGradMask)" stroke-width="3" opacity="0.8" />

    <!-- Outer chip segments -->
    <g fill="url(#rubyGradMask)">
      <rect x="242" y="32" width="28" height="32" rx="4" />
      <rect x="242" y="448" width="28" height="32" rx="4" />
      <rect x="32" y="242" width="32" height="28" rx="4" />
      <rect x="448" y="242" width="32" height="28" rx="4" />
      <rect x="94" y="94" width="26" height="26" rx="4" transform="rotate(45 107 107)" />
      <rect x="385" y="94" width="26" height="26" rx="4" transform="rotate(45 398 107)" />
      <rect x="94" y="385" width="26" height="26" rx="4" transform="rotate(45 107 398)" />
      <rect x="385" y="385" width="26" height="26" rx="4" transform="rotate(45 398 398)" />
    </g>

    <!-- Inner luxury medallion -->
    <circle cx="256" cy="256" r="160" fill="#090d0b" stroke="url(#goldGradMask)" stroke-width="7" />
    <circle cx="256" cy="256" r="146" fill="none" stroke="#ca8a04" stroke-width="1.5" stroke-dasharray="6 4" />

    <!-- Golden Crown Icon -->
    <path d="M176 304 L160 216 L216 252 L256 184 L296 252 L352 216 L336 304 Z" fill="url(#goldGradMask)" filter="url(#glowMask)" />
    <circle cx="160" cy="208" r="8" fill="#fef08a" />
    <circle cx="256" cy="176" r="10" fill="#fef08a" />
    <circle cx="352" cy="208" r="8" fill="#fef08a" />
    <rect x="176" y="308" width="160" height="22" rx="6" fill="url(#goldGradMask)" />
    <circle cx="216" cy="319" r="4.5" fill="#10b981" />
    <circle cx="256" cy="319" r="5" fill="#ef4444" />
    <circle cx="296" cy="319" r="4.5" fill="#10b981" />

    <text x="256" y="366" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#fef08a" text-anchor="middle" letter-spacing="6">♠ ♥ ♦ ♣</text>
  </g>
</svg>`;

async function generate() {
  console.log('Writing public/icon.svg...');
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), standardSvg);

  console.log('Generating pwa-192x192.png...');
  await sharp(Buffer.from(standardSvg))
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'pwa-192x192.png'));

  console.log('Generating pwa-512x512.png...');
  await sharp(Buffer.from(standardSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-512x512.png'));

  console.log('Generating pwa-maskable-512x512.png...');
  await sharp(Buffer.from(maskableSvg))
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  console.log('Generating apple-touch-icon.png (180x180)...');
  await sharp(Buffer.from(standardSvg))
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));

  console.log('Generating favicon.png (64x64)...');
  await sharp(Buffer.from(standardSvg))
    .resize(64, 64)
    .png()
    .toFile(path.join(publicDir, 'favicon.png'));

  console.log('All PWA icons generated successfully!');
}

generate().catch(err => {
  console.error('Failed to generate icons:', err);
  process.exit(1);
});
