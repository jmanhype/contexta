class ContextaContentScript {
  constructor() {
    this.isActive = false;
    this.currentVideoId = null;
    this.subtitleParser = null;
    this.uiInjector = null;
    this.quizManager = null;
    this.video = null;
    this.timeUpdateHandler = null;
  }
  
  async initialize() {
    try {
      // Check if we're on a YouTube video page
      if (!this.isYouTubeVideoPage()) {
        return;
      }
      
      // Wait for video player to load
      await this.waitForVideoPlayer();
      
      // Initialize components
      this.subtitleParser = new SubtitleParser();
      this.uiInjector = new UIInjector();
      this.quizManager = new QuizManager();
      
      await this.uiInjector.initialize();
      
      // Set up video monitoring
      this.setupVideoMonitoring();
      
      // Listen for page navigation (YouTube SPA)
      this.setupNavigationListener();
      
      this.isActive = true;
      console.log('Contexta: Initialized successfully');
      
    } catch (error) {
      console.error('Contexta: Initialization failed', error);
    }
  }
  
  isYouTubeVideoPage() {
    return window.location.hostname === 'www.youtube.com' && 
           window.location.pathname === '/watch' &&
           new URLSearchParams(window.location.search).get('v');
  }
  
  async waitForVideoPlayer() {
    return new Promise((resolve) => {
      const checkVideo = () => {
        const video = document.querySelector(CONTEXTA_CONFIG.SELECTORS.VIDEO);
        if (video) {
          this.video = video;
          resolve();
        } else {
          setTimeout(checkVideo, 1000);
        }
      };
      checkVideo();
    });
  }
  
  setupVideoMonitoring() {
    if (!this.video) {
      return;
    }
    
    // Monitor video time updates for subtitle synchronization
    this.timeUpdateHandler = () => {
      this.updateSubtitles();
    };
    
    this.video.addEventListener('timeupdate', this.timeUpdateHandler);
    
    // Monitor video load events for new videos
    this.video.addEventListener('loadeddata', () => {
      this.handleVideoChange();
    });
    
    // Initial load
    this.handleVideoChange();
  }
  
  async handleVideoChange() {
    const newVideoId = this.extractVideoId();
    
    if (newVideoId && newVideoId !== this.currentVideoId) {
      this.currentVideoId = newVideoId;
      console.log('Contexta: New video detected:', newVideoId);
      
      // Clear previous subtitles
      this.uiInjector.clearSubtitles();
      
      // Extract subtitles for new video
      try {
        const subtitles = await this.subtitleParser.extractSubtitles(newVideoId);
        
        if (subtitles.length > 0) {
          console.log('Contexta: Extracted', subtitles.length, 'subtitles');
          
          // Initialize quiz manager with new subtitles
          await this.quizManager.initialize(this.uiInjector, this.subtitleParser);
          
          // Store reference for UI injector
          window.currentSubtitleParser = this.subtitleParser;
          
        } else {
          console.log('Contexta: No subtitles found for this video');
        }
        
      } catch (error) {
        console.error('Contexta: Error extracting subtitles:', error);
      }
    }
  }
  
  updateSubtitles() {
    if (!this.video || !this.subtitleParser) {
      return;
    }
    
    const currentTime = this.video.currentTime;
    const currentSubtitle = this.subtitleParser.getCurrentSubtitle(currentTime);
    const currentTranslated = this.subtitleParser.getCurrentTranslatedSubtitle(currentTime);
    
    if (currentSubtitle) {
      this.uiInjector.displayDualSubtitles(currentSubtitle, currentTranslated);
    } else {
      this.uiInjector.clearSubtitles();
    }
  }
  
  extractVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v');
  }
  
  setupNavigationListener() {
    // Listen for YouTube's navigation events (SPA routing)
    let lastUrl = window.location.href;
    
    const observer = new MutationObserver(() => {
      if (window.location.href !== lastUrl) {
        lastUrl = window.location.href;
        
        if (this.isYouTubeVideoPage()) {
          // New video page loaded
          setTimeout(() => {
            this.initialize();
          }, 1000);
        } else {
          // Not on video page, deactivate
          this.deactivate();
        }
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    // Also listen for popstate events
    window.addEventListener('popstate', () => {
      setTimeout(() => {
        if (this.isYouTubeVideoPage()) {
          this.initialize();
        } else {
          this.deactivate();
        }
      }, 1000);
    });
  }
  
  deactivate() {
    if (!this.isActive) {
      return;
    }
    
    console.log('Contexta: Deactivating');
    
    // Remove event listeners
    if (this.video && this.timeUpdateHandler) {
      this.video.removeEventListener('timeupdate', this.timeUpdateHandler);
    }
    
    // Clean up components
    if (this.uiInjector) {
      this.uiInjector.destroy();
    }
    
    if (this.quizManager) {
      this.quizManager.destroy();
    }
    
    // Reset state
    this.isActive = false;
    this.currentVideoId = null;
    this.video = null;
    this.timeUpdateHandler = null;
  }
  
  // Message handling for communication with popup/background
  setupMessageListener() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'getStatus':
          sendResponse({
            isActive: this.isActive,
            videoId: this.currentVideoId,
            subtitleCount: this.subtitleParser ? this.subtitleParser.subtitles.length : 0
          });
          break;
          
        case 'toggleSubtitles':
          this.toggleSubtitleDisplay();
          sendResponse({ success: true });
          break;
          
        case 'triggerQuiz':
          if (this.quizManager) {
            this.quizManager.triggerQuiz();
            sendResponse({ success: true });
          } else {
            sendResponse({ success: false, error: 'Quiz manager not initialized' });
          }
          break;
          
        case 'exportVocabulary':
          this.exportVocabulary().then(data => {
            sendResponse({ success: true, data });
          });
          return true; // Keep message channel open for async response
          
        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    });
  }
  
  async toggleSubtitleDisplay() {
    const prefs = await window.ContextaStorage.getPreferences();
    prefs.showDualSubtitles = !prefs.showDualSubtitles;
    await window.ContextaStorage.setPreferences(prefs);
    
    if (!prefs.showDualSubtitles) {
      this.uiInjector.clearSubtitles();
    }
  }
  
  async exportVocabulary() {
    const vocabulary = await window.ContextaStorage.getVocabulary();
    const quizHistory = await window.ContextaStorage.getQuizHistory();
    
    return {
      vocabulary: vocabulary,
      quizHistory: quizHistory,
      exportDate: new Date().toISOString()
    };
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const contexta = new ContextaContentScript();
    contexta.setupMessageListener();
    contexta.initialize();
  });
} else {
  const contexta = new ContextaContentScript();
  contexta.setupMessageListener();
  contexta.initialize();
}