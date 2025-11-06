const CONTEXTA_CONFIG = {
  // Extension metadata
  NAME: 'Contexta',
  VERSION: '0.1.0',
  PREFIX: 'contexta',
  
  // YouTube selectors
  SELECTORS: {
    VIDEO: 'video',
    VIDEO_CONTAINER: '#movie_player',
    CAPTION_BUTTON: '.ytp-subtitles-button',
    CAPTION_CONTAINER: '.caption-window',
    PLAYER_CONTROLS: '.ytp-chrome-bottom',
    TITLE: '#title h1',
    DESCRIPTION: '#description'
  },
  
  // Languages
  LANGUAGES: {
    SPANISH: {
      code: 'es',
      name: 'Spanish',
      variants: ['es', 'es-ES', 'es-MX', 'es-AR']
    },
    ENGLISH: {
      code: 'en',
      name: 'English',
      variants: ['en', 'en-US', 'en-GB']
    }
  },
  
  // Translation services
  TRANSLATION: {
    FREE_API: 'https://api.mymemory.translated.net/get',
    GOOGLE_API: 'https://translate.googleapis.com/translate_a/single'
  },
  
  // Storage keys
  STORAGE_KEYS: {
    VOCABULARY: 'contexta_vocabulary',
    PREFERENCES: 'contexta_preferences',
    QUIZ_HISTORY: 'contexta_quiz_history',
    CACHED_TRANSLATIONS: 'contexta_translations'
  },
  
  // Quiz settings
  QUIZ: {
    FREQUENCY: 300, // 5 minutes in seconds
    TYPES: ['vocabulary', 'fill_blank', 'translation', 'pronunciation'],
    MIN_WORD_LENGTH: 4,
    MAX_OPTIONS: 4
  },
  
  // UI settings
  UI: {
    SUBTITLE_POSITION: 'bottom',
    OVERLAY_Z_INDEX: 10000,
    ANIMATION_DURATION: 300
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.CONTEXTA_CONFIG = CONTEXTA_CONFIG;
}