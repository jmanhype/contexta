/**
 * Contexta - Content Script
 * Injects UI and controls into YouTube pages
 */

console.log('Contexta content script loaded');

// Wait for YouTube page to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/**
 * Initialize the extension on YouTube page
 */
function init() {
  console.log('Initializing Contexta on YouTube page');

  // Check if we're on a video page
  if (isVideoPage()) {
    initializeVideoControls();
  }

  // Listen for YouTube's SPA navigation
  observeUrlChanges();
}

/**
 * Check if current page is a YouTube video page
 */
function isVideoPage() {
  return window.location.pathname === '/watch' && window.location.search.includes('v=');
}

/**
 * Get video ID from URL
 */
function getVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

/**
 * Initialize video controls and UI
 */
function initializeVideoControls() {
  const videoId = getVideoId();
  console.log('Initializing controls for video:', videoId);

  // Wait for video player to load
  waitForElement('video').then(video => {
    console.log('Video element found');
    injectContextaUI();
    setupEventListeners(video);
  });
}

/**
 * Inject Contexta UI elements
 */
function injectContextaUI() {
  // Check if already injected
  if (document.getElementById('contexta-container')) {
    console.log('Contexta UI already injected');
    return;
  }

  // Create main container
  const container = document.createElement('div');
  container.id = 'contexta-container';
  container.className = 'contexta-container';

  // Create subtitle overlay placeholder
  const subtitleOverlay = document.createElement('div');
  subtitleOverlay.id = 'contexta-subtitles';
  subtitleOverlay.className = 'contexta-subtitles';
  subtitleOverlay.innerHTML = `
    <div class="contexta-subtitle-line contexta-native">English subtitle will appear here</div>
    <div class="contexta-subtitle-line contexta-target">Spanish subtitle will appear here</div>
  `;

  container.appendChild(subtitleOverlay);
  document.body.appendChild(container);

  console.log('Contexta UI injected');
}

/**
 * Setup event listeners for video
 */
function setupEventListeners(video) {
  // Time update for quiz triggers
  video.addEventListener('timeupdate', handleTimeUpdate);

  // Play/pause events
  video.addEventListener('play', () => console.log('Video playing'));
  video.addEventListener('pause', () => console.log('Video paused'));
}

/**
 * Handle video time updates
 */
let lastQuizTime = 0;
function handleTimeUpdate(event) {
  const video = event.target;
  const currentTime = Math.floor(video.currentTime);

  // Get preferences for quiz frequency
  chrome.runtime.sendMessage(
    { type: 'GET_PREFERENCES' },
    (preferences) => {
      const quizFrequency = preferences?.quizFrequency || 300;

      // Trigger quiz every N seconds
      if (currentTime > 0 && currentTime % quizFrequency === 0 && currentTime !== lastQuizTime) {
        lastQuizTime = currentTime;
        console.log('Quiz trigger at', currentTime);
        // TODO: Show quiz UI
      }
    }
  );
}

/**
 * Observe URL changes for YouTube's SPA navigation
 */
function observeUrlChanges() {
  let lastUrl = location.href;

  new MutationObserver(() => {
    const currentUrl = location.href;
    if (currentUrl !== lastUrl) {
      lastUrl = currentUrl;
      console.log('URL changed:', currentUrl);

      if (isVideoPage()) {
        initializeVideoControls();
      }
    }
  }).observe(document.body, { subtree: true, childList: true });
}

/**
 * Utility: Wait for element to appear in DOM
 */
function waitForElement(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      return resolve(element);
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element ${selector} not found within ${timeout}ms`));
    }, timeout);
  });
}

/**
 * Show contextual definition for a word
 */
function showWordDefinition(word, element) {
  console.log('Showing definition for:', word);

  // Request translation
  chrome.runtime.sendMessage(
    {
      type: 'TRANSLATE_TEXT',
      data: { text: word, sourceLang: 'es', targetLang: 'en' }
    },
    (response) => {
      if (response.error) {
        console.error('Translation error:', response.error);
      } else {
        console.log('Translation:', response.translation);
        // TODO: Show tooltip with definition
      }
    }
  );
}
