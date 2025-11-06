# Contexta Installation Guide

## Quick Installation

### 1. Build the Extension

```bash
npm install
npm run build
```

### 2. Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in the top-right corner)
3. Click **Load unpacked**
4. Select the `dist/` folder from this project
5. The Contexta extension should now appear in your extensions list

### 3. Test the Extension

1. Go to YouTube: `https://www.youtube.com/watch?v=VIDEO_ID`
2. Find a Spanish video with captions (try searching: "spanish learning video")
3. The extension should automatically activate on YouTube video pages
4. Click the Contexta extension icon in the toolbar to access settings

## Recommended Test Videos

Here are some good Spanish YouTube videos to test with:

- **SpanishPod101**: https://www.youtube.com/watch?v=sTaWNQJyJ8k
- **Butterfly Spanish**: https://www.youtube.com/watch?v=0QnrImNMGYc
- **News in Slow Spanish**: https://www.youtube.com/watch?v=example

## Features to Test

### ✅ Basic Features

- [ ] Dual subtitles appear on Spanish videos
- [ ] Click Spanish words for translation popup
- [ ] Pronunciation button works (requires speakers/headphones)
- [ ] Words can be saved to vocabulary list

### ✅ Quiz System

- [ ] Quizzes appear automatically after 5 minutes (configurable)
- [ ] Manual quiz trigger with `Ctrl+Shift+Q`
- [ ] Different quiz types: vocabulary, fill-in-blank, translation

### ✅ Settings & Data

- [ ] Extension popup opens and shows settings
- [ ] Toggle subtitles on/off
- [ ] Change quiz frequency
- [ ] Export vocabulary data
- [ ] Clear all data

## Troubleshooting

### Extension doesn't appear

- Make sure you built the project (`npm run build`)
- Check that Developer mode is enabled
- Verify the `dist/` folder contains all files

### No subtitles on YouTube

- Ensure the video has Spanish captions available
- Try refreshing the YouTube page
- Check browser console for errors (F12 → Console)

### Translations not working

- Check internet connection (uses external translation API)
- Look for error messages in the extension popup
- Try a different YouTube video

### Debug Mode

Enable debug logging in the browser console:

```javascript
localStorage.setItem('contexta-debug', 'true');
```

## Development Mode

For development with live reloading:

```bash
npm run dev
```

This watches for file changes and automatically rebuilds the extension.

## Next Steps

After installation, try:

1. Watch a Spanish YouTube video for 5+ minutes
2. Click on Spanish words in the subtitles
3. Take a quiz when prompted
4. Check your vocabulary in the extension popup
5. Export your learned words

Happy learning! 🎉
