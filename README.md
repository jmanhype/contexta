# Contexta - YouTube Spanish Learning Extension

A Chrome extension that transforms YouTube into an immersive Spanish learning platform with dual subtitles, interactive quizzes, and intelligent vocabulary tracking.

## ✨ Features

### 🎯 Core Learning Features

- **Dual Subtitles**: Display Spanish and English subtitles simultaneously
- **Interactive Dictionary**: Click any Spanish word for instant translation and pronunciation
- **Smart Quizzes**: Pop-up quizzes based on recently watched content
- **Vocabulary Tracking**: Automatically save and track learned words
- **Text-to-Speech**: Hear correct Spanish pronunciation

### 🎓 Learning Modes

- **Vocabulary Quizzes**: Test word meanings with multiple choice
- **Fill-in-the-Blank**: Complete sentences with missing words
- **Translation Practice**: Translate Spanish sentences to English
- **Pronunciation Practice**: Listen and repeat exercises

### 📊 Progress Tracking

- Words learned counter
- Quiz accuracy rates
- Study time tracking
- Export vocabulary for external study

## 🚀 Quick Start

### Installation

1. **Download and Build**

   ```bash
   git clone https://github.com/jmanhype/contexta.git
   cd contexta
   npm install
   npm run build
   ```

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top-right toggle)
   - Click "Load unpacked"
   - Select the `dist/` folder

3. **Start Learning**
   - Go to any Spanish YouTube video
   - The extension will automatically activate
   - Click the Contexta icon to access settings

### Development Mode

For development with auto-rebuild:

```bash
npm run dev
```

This watches for file changes and automatically rebuilds the extension.

## 🎮 How to Use

### Basic Usage

1. **Watch Spanish YouTube Videos**
   - Navigate to any YouTube video with Spanish captions
   - The extension automatically detects and loads subtitles

2. **Interactive Learning**
   - Click any Spanish word in subtitles for instant translation
   - Save words to your personal vocabulary list
   - Use the pronunciation button to hear correct pronunciation

3. **Take Quizzes**
   - Quizzes appear automatically every 5 minutes (configurable)
   - Or trigger manually with `Ctrl+Shift+Q`
   - Answer questions about recently seen content

### Keyboard Shortcuts

- `Ctrl+Shift+S` - Toggle dual subtitles on/off
- `Ctrl+Shift+Q` - Trigger quiz immediately
- `Esc` - Close any open overlay

### Settings

Access settings via the extension popup:

- **Language Preferences**: Set target and native languages
- **Quiz Frequency**: Adjust how often quizzes appear (1-10 minutes)
- **Display Options**: Toggle subtitles and auto-translation
- **Data Management**: Export vocabulary or clear all data

## 🛠️ Technical Architecture

### Components

```
src/
├── background/         # Service worker for API calls and background tasks
├── content/           # Content scripts injected into YouTube pages
│   ├── content-script.js    # Main content script coordinator
│   ├── subtitle-parser.js   # YouTube subtitle extraction and processing
│   ├── ui-injector.js       # DOM manipulation and UI components
│   └── quiz-manager.js      # Quiz generation and management
├── popup/             # Extension popup interface
├── styles/            # CSS for content script injections
└── utils/             # Shared utilities and configurations
```

### Key Features Implementation

- **YouTube Integration**: Uses YouTube's timedtext API for caption retrieval
- **Local Storage**: Chrome Storage API for offline vocabulary and preferences
- **Translation**: MyMemory API for free translations (with caching)
- **TTS**: Chrome's built-in Text-to-Speech API
- **Real-time Sync**: Content script monitors video playback for subtitle timing

## 📁 Project Structure

```
contexta/
├── src/                 # Source code
├── dist/               # Built extension (created by npm run build)
├── scripts/            # Build and development scripts
├── data/               # Mock vocabulary and language data
├── icons/              # Extension icons
├── manifest.json       # Chrome extension manifest
├── package.json        # Node.js dependencies and scripts
└── README.md          # This file
```

## 🔧 Development

### Prerequisites

- Node.js 16+ and npm
- Chrome browser with Developer mode enabled

### Build Commands

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Development mode with file watching
npm run dev

# Create distributable ZIP
npm run zip

# Code formatting
npm run format

# Linting
npm run lint
```

### Adding Features

1. **New Content Features**: Add to `src/content/` directory
2. **UI Components**: Extend `ui-injector.js` or add to `src/popup/`
3. **Background Tasks**: Modify `src/background/service-worker.js`
4. **Styling**: Update `src/styles/content.css`

## 🌐 Browser Support

- Chrome 90+ (Manifest V3 support)
- Chromium-based browsers (Edge, Brave, etc.)
- Opera with Chrome Web Store access

## 🔒 Privacy & Permissions

### Required Permissions

- **Storage**: Save vocabulary and preferences locally
- **TTS**: Text-to-speech pronunciation
- **ActiveTab**: Access current YouTube tab
- **Host Permissions**: YouTube.com for subtitle extraction
- **External APIs**: Translation services (MyMemory API)

### Data Handling

- All vocabulary data stored locally in browser
- No personal data sent to external servers
- Translation requests are anonymous and cached
- No tracking or analytics

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit changes (`git commit -am 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Create a Pull Request

### Areas for Contribution

- Additional language support
- Advanced quiz types
- UI/UX improvements
- Performance optimizations
- Mobile/tablet support

## 🐛 Troubleshooting

### Common Issues

**Extension doesn't load:**

- Ensure you built the project (`npm run build`)
- Check that Developer mode is enabled in Chrome
- Verify manifest.json is valid

**No subtitles appearing:**

- Make sure the YouTube video has Spanish captions available
- Try refreshing the page
- Check that the extension is enabled for the current tab

**Translations not working:**

- Check internet connection (requires API access)
- Verify host permissions in Chrome extensions page
- Clear cached translations in popup settings

**Quizzes not appearing:**

- Ensure quiz mode is enabled in popup settings
- Check that video has been playing for the configured interval
- Try manually triggering with Ctrl+Shift+Q

### Debug Mode

Enable debug logging by opening browser console on YouTube pages:

```javascript
localStorage.setItem("contexta-debug", "true");
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🔮 Future Features

- AI-powered conversation practice
- Spaced repetition for vocabulary review
- Progress synchronization across devices
- Support for additional languages (French, German, etc.)
- Integration with external language learning platforms
- Offline mode for downloaded videos
- Advanced analytics and learning insights

## 📧 Support

For support, bug reports, or feature requests:

- GitHub Issues: [Report Issue](https://github.com/jmanhype/contexta/issues)
- Documentation: [Wiki](https://github.com/jmanhype/contexta/wiki)

---

**Happy Learning! 🎉**

Transform your YouTube watching into an immersive Spanish learning experience with Contexta.
