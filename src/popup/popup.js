/**
 * Contexta - Popup Script
 * Handles extension popup UI and settings
 */

document.addEventListener('DOMContentLoaded', loadSettings);

// Load settings from storage
function loadSettings() {
  chrome.storage.local.get(['preferences', 'vocabulary', 'quizHistory'], (result) => {
    const preferences = result.preferences || {};
    const vocabulary = result.vocabulary || [];
    const quizHistory = result.quizHistory || [];

    // Load language settings
    if (preferences.targetLanguage) {
      document.getElementById('target-language').value = preferences.targetLanguage;
    }
    if (preferences.nativeLanguage) {
      document.getElementById('native-language').value = preferences.nativeLanguage;
    }

    // Load display settings
    if (preferences.autoShowSubtitles !== undefined) {
      document.getElementById('auto-subtitles').checked = preferences.autoShowSubtitles;
    }
    if (preferences.pronunciationSpeed) {
      const speed = preferences.pronunciationSpeed;
      document.getElementById('pronunciation-speed').value = speed;
      document.getElementById('speed-value').textContent = speed.toFixed(1) + 'x';
    }

    // Load quiz settings
    if (preferences.quizFrequency) {
      document.getElementById('quiz-frequency').value = preferences.quizFrequency / 60; // Convert seconds to minutes
    }

    // Load stats
    document.getElementById('vocab-count').textContent = vocabulary.length;
    document.getElementById('quiz-count').textContent = quizHistory.length;
  });
}

// Save settings
document.getElementById('save-settings').addEventListener('click', () => {
  const preferences = {
    targetLanguage: document.getElementById('target-language').value,
    nativeLanguage: document.getElementById('native-language').value,
    autoShowSubtitles: document.getElementById('auto-subtitles').checked,
    pronunciationSpeed: parseFloat(document.getElementById('pronunciation-speed').value),
    quizFrequency: parseInt(document.getElementById('quiz-frequency').value) * 60 // Convert minutes to seconds
  };

  chrome.storage.local.set({ preferences }, () => {
    showMessage('Settings saved successfully!', 'success');
  });
});

// Pronunciation speed slider
document.getElementById('pronunciation-speed').addEventListener('input', (e) => {
  const value = parseFloat(e.target.value);
  document.getElementById('speed-value').textContent = value.toFixed(1) + 'x';
});

// View vocabulary
document.getElementById('view-vocabulary').addEventListener('click', () => {
  chrome.storage.local.get(['vocabulary'], (result) => {
    const vocabulary = result.vocabulary || [];
    if (vocabulary.length === 0) {
      showMessage('No vocabulary saved yet. Start watching videos!', 'error');
    } else {
      console.log('Vocabulary:', vocabulary);
      // TODO: Open vocabulary viewer page
      showMessage(`You have ${vocabulary.length} words saved!`, 'success');
    }
  });
});

// Show message helper
function showMessage(text, type) {
  // Create message element if it doesn't exist
  let messageEl = document.querySelector('.message');
  if (!messageEl) {
    messageEl = document.createElement('div');
    messageEl.className = 'message';
    document.querySelector('.popup-content').insertBefore(
      messageEl,
      document.querySelector('.settings-section')
    );
  }

  messageEl.textContent = text;
  messageEl.className = `message ${type} show`;

  // Auto-hide after 3 seconds
  setTimeout(() => {
    messageEl.classList.remove('show');
  }, 3000);
}
