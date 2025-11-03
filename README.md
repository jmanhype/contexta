# Contexta

Chrome extension for contextual language learning through YouTube videos with dual subtitles, interactive quizzes, and AI-powered features.

## Overview

Contexta transforms YouTube into an immersive language learning platform for Spanish learners. Watch authentic Spanish content while getting real-time translations, contextual definitions, pronunciation help, and interactive quizzes - all within your browser.

## Key Features (Planned)

### Core Features
- **Dual Subtitles**: Display both Spanish and English subtitles simultaneously
- **Inline Dictionary**: Hover over any word for instant translations and definitions
- **Pronunciation Assistant**: Text-to-speech for Spanish words and phrases using Chrome's built-in TTS
- **Video Caption Integration**: Automatic retrieval and parsing of YouTube captions

### Interactive Learning
- **Contextual Quizzes**: On-the-fly vocabulary and comprehension questions
- **Fill-in-the-Blank Exercises**: Practice with sentences from the video you're watching
- **Pronunciation Prompts**: Practice speaking what you hear
- **Translation Challenges**: Test your understanding with translation exercises

### AI-Powered Features
- **Smart Translations**: High-quality machine translation for captions
- **Contextual Explanations**: AI-generated explanations for idioms and complex grammar
- **Adaptive Quiz Generation**: LLM-generated comprehension questions tailored to video content
- **Grammar Correction**: AI feedback on your Spanish responses

### Privacy & Personalization
- **Local-First Approach**: Core features work offline with no data collection
- **Personal Vocabulary List**: Save and review words with context
- **Progress Tracking**: Monitor your learning journey
- **Cloud Sync** (Premium): Sync your vocabulary and progress across devices

## Technical Architecture

### Chrome Extension Components
- **Content Scripts**: Inject UI and controls into YouTube pages
- **Background Service Worker**: Handle translation APIs and heavy processing
- **Chrome Storage**: Save user preferences and vocabulary locally
- **Chrome TTS API**: Provide pronunciation assistance

### APIs & Libraries
- **YouTube Caption API**: Retrieve and parse video subtitles
- **Translation Services**: Google Translate API, DeepL API, or local translation models
- **LLM Integration**: Cloud-based AI for advanced features (premium)
- **WebGPU/WASM** (Future): Local AI model execution

## Monetization Model

### Free Tier
- Dual subtitles with basic translations
- Inline dictionary lookups
- Text-to-speech pronunciation
- Limited word saves (20 words)
- Basic quiz mode

### Premium Tier ($5-10/month)
- Unlimited translations with improved quality
- Unlimited vocabulary saves with cloud sync
- Advanced interactive exercises
- AI Tutor chat mode
- Export to Anki/CSV
- Multi-device sync
- Priority support

## Development Roadmap

### Phase 1: MVP (Core Features)
- [ ] Chrome extension manifest and basic structure
- [ ] YouTube caption retrieval and parsing
- [ ] Dual subtitle display
- [ ] Basic translation integration
- [ ] Inline dictionary
- [ ] TTS pronunciation
- [ ] Local storage for vocabulary

### Phase 2: Interactive Learning
- [ ] Quiz system framework
- [ ] Multiple quiz types (vocab, fill-in-blank, translation)
- [ ] Quiz trigger logic (time-based, context-based)
- [ ] User progress tracking

### Phase 3: AI Integration
- [ ] Cloud LLM API integration
- [ ] AI-generated explanations
- [ ] Adaptive quiz generation
- [ ] Grammar correction feedback

### Phase 4: Premium Features & Scaling
- [ ] User authentication system
- [ ] Cloud sync for vocabulary
- [ ] Payment integration
- [ ] Anki export functionality
- [ ] Multi-language support expansion

## Installation (Development)

*Instructions will be added once implementation begins*

## Contributing

This project is currently in the planning phase. Contributions will be welcome once development starts.

## Privacy Policy

Contexta is designed with privacy in mind:
- No account required for basic features
- Video data never leaves your browser (local processing)
- Optional cloud features require explicit consent
- Transparent about what data is sent to translation/AI APIs

## License

*License to be determined*

## Target Audience

- **Primary**: English speakers learning Spanish (A2-B1+ level)
- **Secondary**: Language learning enthusiasts, educators, students
- **Ideal Users**: Those who consume Spanish YouTube content and want immersive learning with support

## Inspiration & Prior Art

Inspired by tools like:
- Language Reactor (dual subtitles)
- InterSub (live translation)
- Linguist (offline translation)

Contexta differentiates itself through:
- Active learning with contextual quizzes
- AI-powered personalization
- Privacy-focused local-first architecture

## Contact

*Contact information to be added*

---

**Status**: Planning & Design Phase
**Repository**: https://github.com/jmanhype/contexta
