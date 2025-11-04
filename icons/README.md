# Contexta Icons

This directory contains the extension icons in various sizes required by Chrome.

## Required Icons

- **icon16.png** - 16x16px - Used in the extension management page
- **icon48.png** - 48x48px - Used in the extension management page
- **icon128.png** - 128x128px - Used in the Chrome Web Store and installation

## Icon Design Guidelines

The Contexta icon should:
- Represent language learning (e.g., speech bubble, book, globe)
- Use the brand colors (blue #4285f4)
- Be simple and recognizable at small sizes
- Work well on light and dark backgrounds

## Creating Icons

You can use tools like:
- **Figma** or **Sketch** for design
- **GIMP** or **Photoshop** for editing
- **ImageMagick** for resizing:
  ```bash
  convert source.png -resize 16x16 icon16.png
  convert source.png -resize 48x48 icon48.png
  convert source.png -resize 128x128 icon128.png
  ```

## Placeholder Icons

Currently, placeholder SVG-based icons are used. Replace these with proper PNG icons before publishing to the Chrome Web Store.

To generate actual PNG files from an SVG:
```bash
npm run generate-icons
```

This will create properly sized PNG files from `icons/source.svg`.
