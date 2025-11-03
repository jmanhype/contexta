# Technical Strategy: Contexta

## Chrome Extension Architecture

### Manifest V3 Implementation

Contexta uses Chrome Extension Manifest V3 for modern, secure extension development.

**Key Components:**
- **Service Worker** (`background/service-worker.js`): Handles API calls, translation services, and heavy processing
- **Content Scripts** (`content/content-script.js`): Injects UI into YouTube pages, controls video playback
- **Popup UI** (`popup/popup.html`): Extension settings and quick controls
- **Chrome APIs**: Storage (local data), TTS (pronunciation), Scripting (DOM manipulation)

### YouTube Integration

#### Caption Retrieval
YouTube provides captions via the `timedtext` API endpoint:
```
https://www.youtube.com/api/timedtext?lang=es&v=VIDEO_ID
```

**Implementation approach:**
1. Extract caption track URLs from YouTube player page
2. Fetch caption data (XML/VTT format)
3. Parse using DOMParser or vtt.js library
4. Cache captions in chrome.storage for offline use

**Caption formats:**
- XML: `<text start="..." dur="...">...</text>`
- WebVTT: Standard subtitle format with timing

#### Video Player Control
- Access HTML5 `<video>` element directly
- Use YouTube IFrame Player API for advanced controls
- Pause/resume for interactive quizzes
- Seek to specific timestamps for review

#### DOM Injection
- Create overlay containers for quizzes and UI elements
- Use high z-index to appear above video player
- Handle YouTube's SPA navigation with history listeners
- Observe DOM changes to maintain injected elements

## Translation & Language Processing

### Translation Options

#### Cloud APIs (Initial MVP)
- **Google Translate API**: $20/million characters, good quality
- **DeepL API**: Higher quality, similar pricing
- **Advantage**: Immediate availability, high accuracy
- **Use case**: Premium tier or API key input by user

#### Offline Translation (Future)
- **Argos Translate**: Open-source, ~50MB model download
- **MarianMT/OpenNMT**: Potential WASM compilation
- **Advantage**: Privacy, no per-use cost
- **Challenge**: Initial model download, performance

### Dictionary & Definitions

**Embedded Dictionary:**
- Bundle JSON with 10k+ common Spanish-English word pairs
- Open datasets: FreeDict, Wiktionary exports
- Fast local lookups for hover definitions

**Online Enrichment:**
- WordReference API, SpanishDict for detailed entries
- Fallback to Google Translate for unknown words
- Cache results in chrome.storage

### Pronunciation

**Chrome TTS API:**
```javascript
chrome.tts.speak("palabra", {
  lang: 'es-ES',
  rate: 0.8,
  pitch: 1.0
});
```

**Benefits:**
- Built-in, no external service needed
- Works offline
- Multiple Spanish voice options (es-ES, es-MX, etc.)

### Language Detection

**Libraries:**
- `franc`: Lightweight (few hundred KB), decent accuracy
- `languagedetect`: Alternative option
- **Use case**: Auto-detect video language if user doesn't specify

**MVP approach:** User-configured language pair (English ↔ Spanish)

## Interactive Learning System

### Quiz Types

#### 1. Vocabulary Quiz
- Multiple choice: Spanish word → English meaning
- Generate distractors from other video words or common confusions
- Store in local vocabulary list with context

#### 2. Fill-in-the-Blank
- Remove word from subtitle sentence
- User types or selects answer
- Check against original caption

#### 3. Translation Challenge
- Show subtitle in one language
- User translates to other language
- Compare with machine translation (not exact match required)

#### 4. Pronunciation Practice
- Use Web Speech API for speech recognition (future)
- MVP: Just play audio for user to shadow

### Quiz Triggers

**Time-based:**
```javascript
video.addEventListener('timeupdate', () => {
  if (Math.floor(video.currentTime) % 300 === 0) { // Every 5 minutes
    showQuiz();
  }
});
```

**Content-based:**
- Detect interesting vocabulary (low-frequency words)
- User-configured intervals
- Manual trigger via UI button

### User Progress Tracking

**Local Storage Schema:**
```json
{
  "vocabulary": [
    {
      "word": "palabra",
      "translation": "word",
      "context": "subtitle sentence",
      "videoId": "abc123",
      "timestamp": 1234567890,
      "reviewCount": 0,
      "lastReviewed": null
    }
  ],
  "quizHistory": [
    {
      "type": "vocabulary",
      "correct": true,
      "timestamp": 1234567890
    }
  ],
  "preferences": {
    "targetLanguage": "es",
    "nativeLanguage": "en",
    "quizFrequency": 300
  }
}
```

## AI/LLM Integration

### Local AI (Experimental)

**WebLLM (via WebGPU):**
- Run 1-2B parameter models in browser
- Possible use: Difficulty classification, simple Q&A
- Challenge: 4GB+ download, GPU requirements
- Status: Future enhancement, not MVP

**TensorFlow.js / ONNX.js:**
- Smaller models for specific tasks
- Sentence difficulty scoring
- Word importance ranking

### Cloud LLM (Premium Feature)

**OpenAI GPT-3.5/4 Integration:**
```javascript
async function getAIExplanation(phrase, context) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a Spanish language tutor. Explain phrases to English speakers learning Spanish.'
        },
        {
          role: 'user',
          content: `Explain the Spanish phrase "${phrase}" in this context: "${context}"`
        }
      ]
    })
  });
  return await response.json();
}
```

**Use Cases:**
- Idiom explanations
- Grammar clarifications
- Conversational practice (AI chat)
- Adaptive quiz generation
- Grammar correction for user input

**Privacy & Cost:**
- Only send relevant snippets, not full video
- Premium feature with usage limits
- Clear user consent before sending data

## Performance Optimization

### Caption Caching
- Cache parsed captions per video in chrome.storage
- Invalidate on caption update or language change
- Reduce API calls and parsing overhead

### Translation Batching
- Translate entire caption track on load (not line-by-line)
- Store translations alongside original captions
- Enable instant dual subtitle display

### Lazy Loading
- Load quiz questions as needed
- Defer AI calls until user requests explanation
- Progressive enhancement for slow connections

### Resource Management
- Debounce hover events for dictionary lookups
- Use requestIdleCallback for non-critical processing
- Minimize DOM mutations for better performance

## Security & Privacy

### Data Handling
- **No server backend for MVP**: All data in browser
- **Local-first**: Captions, vocabulary, preferences in chrome.storage.local
- **Cloud sync (optional)**: Encrypted user data, opt-in only
- **API calls**: Only for translation/AI, with user consent

### Permissions
- `storage`: Save user data locally
- `tts`: Text-to-speech
- `https://www.youtube.com/*`: Only YouTube, no broad web access
- No `tabs` or `webRequest` unless absolutely needed

### Content Security
- Sanitize user input to prevent XSS
- Validate API responses before rendering
- Use Content Security Policy in manifest

## Technical Risks & Mitigation

### YouTube DOM Changes
**Risk:** YouTube updates could break our selectors/injection
**Mitigation:**
- Use stable selectors (IDs, data attributes)
- Implement fallback detection logic
- Monitor YouTube for updates
- Community reporting of issues

### Caption Availability
**Risk:** Not all videos have captions
**Mitigation:**
- Detect caption availability before activation
- Graceful fallback message to user
- Future: Integrate Whisper API for auto-transcription (premium)

### Translation Quality
**Risk:** Machine translation errors
**Mitigation:**
- Use high-quality APIs (DeepL, GPT)
- Allow user to see original alongside translation
- Community corrections (future)

### Browser Compatibility
**Risk:** Chrome-only features limit audience
**Mitigation:**
- Use standard web APIs where possible
- Consider Firefox port (WebExtensions compatible)
- Test on Chromium-based browsers (Edge, Brave)

### API Costs
**Risk:** Cloud services expensive at scale
**Mitigation:**
- Freemium model: Basic features use free/cheap resources
- Premium users cover AI costs
- Implement rate limiting and caching
- Explore sponsorships for free tier

## Development Tools & Libraries

### Recommended Stack
- **Build Tool**: Webpack or Vite for bundling
- **Framework**: Vanilla JS or lightweight (Preact) for popup
- **Testing**: Jest for unit tests, Puppeteer for E2E
- **Linting**: ESLint, Prettier for code quality

### Key Libraries
- **Caption Parsing**: `vtt.js` (Mozilla) or custom parser
- **Translation**: API clients for Google/DeepL
- **Language Detection**: `franc`
- **Storage**: Chrome Storage API (no library needed)
- **UI Components**: CSS framework (Tailwind?) for popup

### Development Workflow
1. Load unpacked extension in `chrome://extensions`
2. Hot reload with extension reloader tool
3. Debug with Chrome DevTools (background, content script, popup)
4. Test on various YouTube videos (different languages, caption availability)

## Future Technical Enhancements

- **Multi-language support**: Beyond Spanish (French, German, etc.)
- **Netflix/streaming platform integration**: Expand beyond YouTube
- **Mobile support**: Chrome on Android (limited extension support)
- **Spaced repetition**: Anki-like review system integrated
- **Social features**: Share vocabulary lists, compete with friends
- **Advanced AI**: Conversation practice with voice input/output

---

This technical strategy provides a roadmap for building Contexta with modern web technologies, prioritizing user privacy and scalable architecture.
