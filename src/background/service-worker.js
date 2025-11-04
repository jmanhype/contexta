/**
 * Contexta - Background Service Worker
 * Handles API calls, translation services, and heavy processing
 */

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Contexta installed:', details.reason);

  if (details.reason === 'install') {
    // Initialize default settings
    chrome.storage.local.set({
      preferences: {
        targetLanguage: 'es',
        nativeLanguage: 'en',
        quizFrequency: 300, // seconds
        autoShowSubtitles: true,
        pronunciationSpeed: 0.8
      },
      vocabulary: [],
      quizHistory: []
    });
  }
});

// Message handler for content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request.type);

  switch (request.type) {
    case 'TRANSLATE_TEXT':
      handleTranslation(request.data)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true; // Will respond asynchronously

    case 'SAVE_VOCABULARY':
      handleSaveVocabulary(request.data)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;

    case 'GET_PREFERENCES':
      chrome.storage.local.get(['preferences'], (result) => {
        sendResponse(result.preferences || {});
      });
      return true;

    default:
      console.warn('Unknown message type:', request.type);
      sendResponse({ error: 'Unknown message type' });
  }
});

/**
 * Handle translation requests
 * TODO: Implement actual translation API integration
 */
async function handleTranslation(data) {
  const { text, sourceLang, targetLang } = data;

  // Placeholder - will integrate with Google Translate or DeepL API
  console.log(`Translation requested: "${text}" from ${sourceLang} to ${targetLang}`);

  return {
    success: true,
    translation: `[Translation: ${text}]`,
    message: 'Translation API not yet implemented'
  };
}

/**
 * Save vocabulary word to storage
 */
async function handleSaveVocabulary(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['vocabulary'], (result) => {
      const vocabulary = result.vocabulary || [];

      // Check if word already exists
      const existingIndex = vocabulary.findIndex(v => v.word === data.word);

      if (existingIndex >= 0) {
        // Update existing entry
        vocabulary[existingIndex] = {
          ...vocabulary[existingIndex],
          ...data,
          lastReviewed: Date.now()
        };
      } else {
        // Add new entry
        vocabulary.push({
          ...data,
          timestamp: Date.now(),
          reviewCount: 0,
          lastReviewed: null
        });
      }

      chrome.storage.local.set({ vocabulary }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve({ success: true, vocabularyCount: vocabulary.length });
        }
      });
    });
  });
}
