const fs = require('fs-extra');
const path = require('path');

async function generateIcons() {
  const iconsDir = path.join(__dirname, '..', 'icons');
  const distIconsDir = path.join(__dirname, '..', 'dist', 'icons');

  await fs.ensureDir(distIconsDir);

  // Create a simple base64 encoded icon for different sizes
  const createBase64Icon = (size) => {
    return `data:image/svg+xml;base64,${Buffer.from(
      `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#06B6D4;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
        <circle cx="${size * 0.5}" cy="${size * 0.31}" r="${size * 0.15}" fill="white" opacity="0.9"/>
        <rect x="${size * 0.25}" y="${size * 0.55}" width="${size * 0.5}" height="${size * 0.06}" fill="white" opacity="0.7" rx="${size * 0.03}"/>
        <rect x="${size * 0.25}" y="${size * 0.66}" width="${size * 0.375}" height="${size * 0.047}" fill="white" opacity="0.5" rx="${size * 0.023}"/>
        <text x="${size * 0.5}" y="${size * 0.9}" font-family="Arial, sans-serif" font-size="${size * 0.094}" font-weight="bold" fill="white" text-anchor="middle">ES→EN</text>
      </svg>
    `
    ).toString('base64')}`;
  };

  // Generate SVG icons
  const sizes = [16, 48, 128];

  for (const size of sizes) {
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06B6D4;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#grad)" rx="${size * 0.15}"/>
  <circle cx="${size * 0.5}" cy="${size * 0.31}" r="${size * 0.15}" fill="white" opacity="0.9"/>
  <rect x="${size * 0.25}" y="${size * 0.55}" width="${size * 0.5}" height="${size * 0.06}" fill="white" opacity="0.7" rx="${size * 0.03}"/>
  <rect x="${size * 0.25}" y="${size * 0.66}" width="${size * 0.375}" height="${size * 0.047}" fill="white" opacity="0.5" rx="${size * 0.023}"/>
  <text x="${size * 0.5}" y="${size * 0.9}" font-family="Arial, sans-serif" font-size="${size * 0.094}" font-weight="bold" fill="white" text-anchor="middle">ES→EN</text>
</svg>`;

    await fs.writeFile(path.join(iconsDir, `icon${size}.svg`), svgContent);
    await fs.writeFile(path.join(distIconsDir, `icon${size}.svg`), svgContent);
  }

  // Copy main icon
  await fs.copy(
    path.join(iconsDir, 'icon.svg'),
    path.join(distIconsDir, 'icon.svg')
  );

  console.log('✅ Icons generated successfully!');
}

if (require.main === module) {
  generateIcons();
}

module.exports = { generateIcons };
