class TranslationService {
  constructor() {
    this.storage = window.ContextaStorage;
  }
  
  async translateText(text, fromLang = 'es', toLang = 'en') {
    if (!text || text.trim().length === 0) {
      return text;
    }
    
    // Check cache first
    const cached = await this.storage.getCachedTranslation(text, fromLang, toLang);
    if (cached) {
      return cached;
    }
    
    try {
      // Try free API first
      const translation = await this.translateWithFreeAPI(text, fromLang, toLang);
      
      if (translation) {
        // Cache the result
        await this.storage.cacheTranslation(text, translation, fromLang, toLang);
        return translation;
      }
      
      // Fallback to Google Translate (requires API key)
      return await this.translateWithGoogle(text, fromLang, toLang);
      
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }
  }
  
  async translateWithFreeAPI(text, fromLang, toLang) {
    try {
      const url = `${CONTEXTA_CONFIG.TRANSLATION.FREE_API}?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.responseStatus === 200 && data.responseData.translatedText) {
        return data.responseData.translatedText;
      }
      
      return null;
    } catch (error) {
      console.error('Free API translation error:', error);
      return null;
    }
  }
  
  async translateWithGoogle(text, fromLang, toLang) {
    try {
      // This would require an API key - for MVP, we'll use the free service
      // In production, users would provide their own API key
      const prefs = await this.storage.getPreferences();
      if (!prefs.googleApiKey) {
        return null;
      }
      
      const url = `${CONTEXTA_CONFIG.TRANSLATION.GOOGLE_API}?client=gtx&sl=${fromLang}&tl=${toLang}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0][0][0];
      }
      
      return null;
    } catch (error) {
      console.error('Google Translate error:', error);
      return null;
    }
  }
  
  async getWordDefinition(word, lang = 'es') {
    // Check cache first
    const cached = await this.storage.getCachedTranslation(`def_${word}`, lang, 'en');
    if (cached) {
      return cached;
    }
    
    try {
      // Use translation API for simple definitions
      const definition = await this.translateText(word, lang, 'en');
      
      if (definition && definition !== word) {
        await this.storage.cacheTranslation(`def_${word}`, definition, lang, 'en');
        return definition;
      }
      
      return null;
    } catch (error) {
      console.error('Definition lookup error:', error);
      return null;
    }
  }
  
  detectLanguage(text) {
    // Simple language detection based on common Spanish words/patterns
    const spanishWords = [
      'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'al', 'una', 'son', 'me', 'todo', 'pero', 'más', 'hace', 'mi', 'sobre', 'tiene', 'hasta', 'ha', 'este', 'puede', 'como', 'del', 'muy', 'bien', 'aquí', 'porque', 'cuando', 'donde', 'está', 'eso', 'cada', 'también', 'otro', 'después', 'mismo', 'ahora', 'antes', 'muchos', 'solo', 'años', 'vez', 'sido', 'dos', 'sin', 'tan', 'entre', 'tanto', 'menos', 'hacer', 'gran', 'todos', 'tal', 'vez', 'vida', 'han', 'mundo', 'casa', 'lugar'
    ];
    
    const words = text.toLowerCase().split(/\s+/);
    const spanishCount = words.filter(word => spanishWords.includes(word)).length;
    const ratio = spanishCount / words.length;
    
    return ratio > 0.3 ? 'es' : 'en';
  }
  
  async pronounceText(text, lang = 'es') {
    try {
      if (typeof chrome !== 'undefined' && chrome.tts) {
        return new Promise((resolve) => {
          chrome.tts.speak(text, {
            lang: lang,
            rate: 0.8,
            pitch: 1.0,
            onEvent: (event) => {
              if (event.type === 'end' || event.type === 'interrupted' || event.type === 'cancelled') {
                resolve();
              }
            }
          });
        });
      }
    } catch (error) {
      console.error('TTS error:', error);
    }
  }
}

// Create global instance
const translationService = new TranslationService();

// Make available globally
if (typeof window !== 'undefined') {
  window.TranslationService = translationService;
}