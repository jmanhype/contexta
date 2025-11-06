class ContextaStorage {
  constructor() {
    this.cache = new Map();
  }
  
  async get(key) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    try {
      const result = await chrome.storage.local.get(key);
      const value = result[key];
      if (value) {
        this.cache.set(key, value);
      }
      return value;
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  }
  
  async set(key, value) {
    try {
      await chrome.storage.local.set({ [key]: value });
      this.cache.set(key, value);
      return true;
    } catch (error) {
      console.error('Storage set error:', error);
      return false;
    }
  }
  
  async getPreferences() {
    const prefs = await this.get(CONTEXTA_CONFIG.STORAGE_KEYS.PREFERENCES);
    return {
      targetLanguage: 'es',
      nativeLanguage: 'en',
      quizFrequency: 300,
      showDualSubtitles: true,
      autoTranslate: true,
      pronunciationEnabled: true,
      ...prefs
    };
  }
  
  async setPreferences(preferences) {
    return await this.set(CONTEXTA_CONFIG.STORAGE_KEYS.PREFERENCES, preferences);
  }
  
  async addVocabulary(word, translation, context, videoId) {
    const vocabulary = await this.getVocabulary();
    const newWord = {
      word: word.toLowerCase(),
      translation,
      context,
      videoId,
      timestamp: Date.now(),
      reviewCount: 0,
      lastReviewed: null,
      id: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
    
    const existingIndex = vocabulary.findIndex(v => v.word === newWord.word);
    if (existingIndex >= 0) {
      vocabulary[existingIndex] = { ...vocabulary[existingIndex], ...newWord };
    } else {
      vocabulary.push(newWord);
    }
    
    return await this.set(CONTEXTA_CONFIG.STORAGE_KEYS.VOCABULARY, vocabulary);
  }
  
  async getVocabulary() {
    return (await this.get(CONTEXTA_CONFIG.STORAGE_KEYS.VOCABULARY)) || [];
  }
  
  async addQuizResult(type, correct, word = null) {
    const history = await this.getQuizHistory();
    const result = {
      type,
      correct,
      word,
      timestamp: Date.now(),
      id: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
    
    history.push(result);
    
    // Keep only last 1000 results
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
    
    return await this.set(CONTEXTA_CONFIG.STORAGE_KEYS.QUIZ_HISTORY, history);
  }
  
  async getQuizHistory() {
    return (await this.get(CONTEXTA_CONFIG.STORAGE_KEYS.QUIZ_HISTORY)) || [];
  }
  
  async cacheTranslation(text, translation, fromLang, toLang) {
    const cache = await this.getCachedTranslations();
    const key = `${fromLang}-${toLang}-${text.toLowerCase()}`;
    cache[key] = {
      translation,
      timestamp: Date.now()
    };
    
    // Limit cache size
    const keys = Object.keys(cache);
    if (keys.length > 5000) {
      const oldestKeys = keys
        .sort((a, b) => cache[a].timestamp - cache[b].timestamp)
        .slice(0, 1000);
      oldestKeys.forEach(k => delete cache[k]);
    }
    
    return await this.set(CONTEXTA_CONFIG.STORAGE_KEYS.CACHED_TRANSLATIONS, cache);
  }
  
  async getCachedTranslations() {
    return (await this.get(CONTEXTA_CONFIG.STORAGE_KEYS.CACHED_TRANSLATIONS)) || {};
  }
  
  async getCachedTranslation(text, fromLang, toLang) {
    const cache = await this.getCachedTranslations();
    const key = `${fromLang}-${toLang}-${text.toLowerCase()}`;
    const cached = cache[key];
    
    if (cached && Date.now() - cached.timestamp < 7 * 24 * 60 * 60 * 1000) { // 7 days
      return cached.translation;
    }
    
    return null;
  }
}

// Create global instance
const storage = new ContextaStorage();

// Make available globally
if (typeof window !== 'undefined') {
  window.ContextaStorage = storage;
}