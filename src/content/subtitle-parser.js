class SubtitleParser {
  constructor() {
    this.subtitles = [];
    this.translatedSubtitles = [];
    this.currentVideoId = null;
    this.storage = window.ContextaStorage;
    this.translationService = window.TranslationService;
  }

  async extractSubtitles(videoId) {
    try {
      this.currentVideoId = videoId;

      console.log('Contexta: Attempting to extract subtitles using native YouTube captions...');

      // NEW APPROACH: Observe YouTube's native caption rendering
      const subtitles = await this.extractFromNativeCaptions();

      if (subtitles.length > 0) {
        console.log('Contexta: Successfully extracted', subtitles.length, 'subtitles from native captions');
        this.subtitles = subtitles;
        await this.translateSubtitles();
        return this.subtitles;
      }

      console.log('No captions available for this video');
      return [];
    } catch (error) {
      console.error('Error extracting subtitles:', error);
      return [];
    }
  }

  async getCaptionTracks() {
    try {
      // Method 1: Try to extract from player response
      const playerResponse = await this.getPlayerResponse();
      if (playerResponse) {
        return this.parsePlayerResponseCaptions(playerResponse);
      }

      // Method 2: Try to extract from page HTML
      return this.extractCaptionsFromPage();
    } catch (error) {
      console.error('Error getting caption tracks:', error);
      return [];
    }
  }

  async getPlayerResponse() {
    try {
      // Try to find ytInitialPlayerResponse in the page
      const scripts = document.querySelectorAll('script');
      console.log('Contexta: Searching through', scripts.length, 'script tags');

      for (const script of scripts) {
        const content = script.textContent;
        if (content.includes('ytInitialPlayerResponse')) {
          console.log('Contexta: Found ytInitialPlayerResponse');

          // Try more robust regex patterns
          const patterns = [
            /ytInitialPlayerResponse\s*=\s*(\{.+?\});var/s,
            /ytInitialPlayerResponse\s*=\s*(\{.+?\});\s*var/s,
            /ytInitialPlayerResponse\s*=\s*(\{(?:[^{}]|\{[^{}]*\})*\});/,
          ];

          for (const pattern of patterns) {
            const match = content.match(pattern);
            if (match) {
              console.log('Contexta: Pattern matched, parsing JSON...');
              try {
                const parsed = JSON.parse(match[1]);
                console.log('Contexta: Successfully parsed player response');
                return parsed;
              } catch (e) {
                console.log('Contexta: JSON parse failed for pattern, trying next...');
                continue;
              }
            }
          }
        }
      }

      console.log('Contexta: ytInitialPlayerResponse not found or could not be parsed');
      return null;
    } catch (error) {
      console.error('Error parsing player response:', error);
      return null;
    }
  }

  parsePlayerResponseCaptions(playerResponse) {
    try {
      const captions =
        playerResponse?.captions?.playerCaptionsTracklistRenderer
          ?.captionTracks;

      console.log('Contexta: Caption tracks found:', captions?.length || 0);

      if (!captions) {
        console.log('Contexta: No captions in player response. Available keys:',
                    Object.keys(playerResponse?.captions || {}));
        return [];
      }

      const tracks = captions.map((track) => ({
        url: track.baseUrl,
        language: track.languageCode,
        name: track.name?.simpleText || track.languageCode,
        kind: track.kind || 'captions',
      }));

      console.log('Contexta: Parsed tracks:', tracks.map(t => `${t.name} (${t.language})`));
      return tracks;
    } catch (error) {
      console.error('Error parsing caption tracks:', error);
      return [];
    }
  }

  extractCaptionsFromPage() {
    // Fallback method: try to find caption data in the page
    // This is more fragile but can work as backup
    const captionButton = document.querySelector('.ytp-subtitles-button');

    if (!captionButton) {
      return [];
    }

    // This is a simplified version - in practice, we'd need to reverse engineer
    // YouTube's caption loading mechanism more thoroughly
    return [];
  }

  selectBestTrack(tracks) {
    console.log('Contexta: Selecting best track from:', tracks.map(t => t.language));

    // Prefer Spanish tracks
    const spanishTrack = tracks.find((track) =>
      CONTEXTA_CONFIG.LANGUAGES.SPANISH.variants.includes(track.language)
    );

    if (spanishTrack) {
      console.log('Contexta: Selected Spanish track:', spanishTrack.language);
      return spanishTrack;
    }

    // Fallback to first available track
    const selected = tracks[0] || null;
    console.log('Contexta: No Spanish track, using:', selected?.language || 'none');
    return selected;
  }

  async fetchAndParseSubtitles(url) {
    try {
      // Try adding format parameter to force a specific format
      const urlWithFormat = url.includes('&fmt=') ? url : `${url}&fmt=srv3`;
      console.log('Contexta: Fetching subtitles from:', urlWithFormat);

      // Use background service worker to fetch (avoids CORS issues)
      console.log('Contexta: Sending message to service worker...');
      const response = await chrome.runtime.sendMessage({
        action: 'fetchSubtitleText',
        url: urlWithFormat
      });

      console.log('Contexta: Received response from service worker:', response);

      if (!response || !response.success) {
        console.error('Contexta: Fetch failed:', response?.error || 'No response');
        return [];
      }

      const text = response.data;
      console.log('Contexta: Fetched subtitle text, length:', text.length);
      console.log('Contexta: First 200 chars:', text.substring(0, 200));

      // Determine format and parse accordingly
      if (text.includes('WEBVTT')) {
        console.log('Contexta: Parsing as WebVTT format');
        const subs = this.parseWebVTT(text);
        console.log('Contexta: Parsed', subs.length, 'WebVTT subtitles');
        return subs;
      } else if (text.includes('<text')) {
        console.log('Contexta: Parsing as XML format');
        const subs = this.parseXML(text);
        console.log('Contexta: Parsed', subs.length, 'XML subtitles');
        return subs;
      }

      console.log('Contexta: Unknown subtitle format, cannot parse');
      return [];
    } catch (error) {
      console.error('Contexta: Error fetching subtitles:', error);
      return [];
    }
  }

  parseWebVTT(vttText) {
    const subtitles = [];
    const lines = vttText.split('\n');
    let currentSubtitle = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip WEBVTT header and empty lines
      if (line === 'WEBVTT' || line === '') {
        continue;
      }

      // Time line (contains -->)
      if (line.includes('-->')) {
        const [start, end] = line
          .split('-->')
          .map((t) => this.timeToSeconds(t.trim()));
        currentSubtitle = { start, end, text: '' };
        continue;
      }

      // Text line
      if (currentSubtitle && line !== '') {
        // Remove HTML tags and clean text
        const cleanText = line.replace(/<[^>]*>/g, '').trim();
        if (cleanText) {
          currentSubtitle.text += (currentSubtitle.text ? ' ' : '') + cleanText;
        }
      }

      // Empty line indicates end of subtitle
      if (line === '' && currentSubtitle) {
        if (currentSubtitle.text.trim()) {
          subtitles.push(currentSubtitle);
        }
        currentSubtitle = null;
      }
    }

    // Add last subtitle if exists
    if (currentSubtitle && currentSubtitle.text.trim()) {
      subtitles.push(currentSubtitle);
    }

    return subtitles;
  }

  parseXML(xmlText) {
    const subtitles = [];

    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const textElements = xmlDoc.querySelectorAll('text');

      textElements.forEach((element) => {
        const start = parseFloat(element.getAttribute('start')) || 0;
        const dur = parseFloat(element.getAttribute('dur')) || 0;
        const text = element.textContent?.trim();

        if (text) {
          subtitles.push({
            start,
            end: start + dur,
            text: this.cleanSubtitleText(text),
          });
        }
      });
    } catch (error) {
      console.error('Error parsing XML subtitles:', error);
    }

    return subtitles;
  }

  timeToSeconds(timeString) {
    // Convert time format (00:00:00.000 or 00:00.000) to seconds
    const parts = timeString.split(':');
    let seconds = 0;

    if (parts.length === 3) {
      // Format: HH:MM:SS.sss
      seconds += parseInt(parts[0]) * 3600; // hours
      seconds += parseInt(parts[1]) * 60; // minutes
      seconds += parseFloat(parts[2]); // seconds
    } else if (parts.length === 2) {
      // Format: MM:SS.sss
      seconds += parseInt(parts[0]) * 60; // minutes
      seconds += parseFloat(parts[1]); // seconds
    } else {
      // Just seconds
      seconds = parseFloat(timeString);
    }

    return seconds;
  }

  cleanSubtitleText(text) {
    return text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  async translateSubtitles() {
    if (this.subtitles.length === 0) {
      return;
    }

    const prefs = await this.storage.getPreferences();

    if (!prefs.autoTranslate) {
      return;
    }

    try {
      this.translatedSubtitles = [];

      for (const subtitle of this.subtitles) {
        const translation = await this.translationService.translateText(
          subtitle.text,
          prefs.targetLanguage,
          prefs.nativeLanguage
        );

        this.translatedSubtitles.push({
          ...subtitle,
          translation,
        });
      }
    } catch (error) {
      console.error('Error translating subtitles:', error);
    }
  }

  getCurrentSubtitle(currentTime) {
    return this.subtitles.find(
      (sub) => currentTime >= sub.start && currentTime <= sub.end
    );
  }

  getCurrentTranslatedSubtitle(currentTime) {
    return this.translatedSubtitles.find(
      (sub) => currentTime >= sub.start && currentTime <= sub.end
    );
  }

  getSubtitlesInRange(startTime, endTime) {
    return this.subtitles.filter(
      (sub) => sub.start >= startTime && sub.end <= endTime
    );
  }

  async extractFromNativeCaptions() {
    return new Promise((resolve) => {
      console.log('Contexta: Setting up native caption observer...');

      const captionMap = new Map(); // Track by time to avoid duplicates

      // Enable YouTube captions if not already enabled
      this.enableYouTubeCaptions();

      // Wait a moment for captions to enable
      setTimeout(() => {
        // Find the caption window element
        const captionContainer = document.querySelector('.ytp-caption-window-container');

        if (!captionContainer) {
          console.log('Contexta: No caption container found');
          resolve([]);
          return;
        }

        console.log('Contexta: Caption container found, observing...');

        const video = document.querySelector('video');

        if (!video) {
          console.log('Contexta: No video element found');
          resolve([]);
          return;
        }

        console.log('Contexta: Video element found. Playing:', !video.paused, 'Time:', video.currentTime);

      // Collect captions as they appear
      const observer = new MutationObserver((mutations) => {
        // Try multiple selectors for caption text
        const selectors = [
          '.ytp-caption-segment',
          '.caption-visual-line',
          '.ytp-caption-window-container span',
          '[class*="caption"]'
        ];

        let captionElements = [];
        for (const selector of selectors) {
          captionElements = captionContainer.querySelectorAll(selector);
          if (captionElements.length > 0) {
            console.log('Contexta: Found', captionElements.length, 'elements with selector:', selector);
            break;
          }
        }

        captionElements.forEach(el => {
          const text = el.textContent?.trim();
          const currentTime = video.currentTime;

          if (text && currentTime) {
            const key = `${Math.floor(currentTime)}-${text}`;
            if (!captionMap.has(key)) {
              captionMap.set(key, {
                start: currentTime,
                end: currentTime + 3, // Estimate duration
                text: text
              });
              console.log('Contexta: Captured caption:', text, 'at', currentTime);
            }
          }
        });
      });

      observer.observe(captionContainer, {
        childList: true,
        subtree: true,
        characterData: true
      });

      // Also check periodically (don't rely only on mutations)
      const checkInterval = setInterval(() => {
        console.log('Contexta: Periodic check at', video.currentTime);

        // DEBUG: Search ENTIRE document for caption elements
        const allCaptionSegments = document.querySelectorAll('.ytp-caption-segment');
        const allCaptionLines = document.querySelectorAll('.caption-visual-line');
        const allYtpSpans = document.querySelectorAll('.ytp-caption-window-container span');

        console.log('Contexta: DOCUMENT-WIDE SEARCH:');
        console.log('  .ytp-caption-segment:', allCaptionSegments.length, allCaptionSegments.length > 0 ? allCaptionSegments[0]?.textContent : '');
        console.log('  .caption-visual-line:', allCaptionLines.length, allCaptionLines.length > 0 ? allCaptionLines[0]?.textContent : '');
        console.log('  .ytp-caption-window-container span:', allYtpSpans.length);

        // Check caption button state
        const captionButton = document.querySelector('.ytp-subtitles-button');
        const isEnabled = captionButton?.getAttribute('aria-pressed') === 'true';
        console.log('  Caption button enabled:', isEnabled);

        // DEBUG: Log container state
        console.log('Contexta: Container innerHTML:', captionContainer.innerHTML || '(empty)');
        console.log('Contexta: Container text:', captionContainer.textContent || '(empty)');
        console.log('Contexta: All children:', captionContainer.querySelectorAll('*').length);

        // Try all selectors IN THE ENTIRE DOCUMENT (not just container)
        const selectors = [
          '.ytp-caption-segment',
          '.caption-visual-line',
          '.ytp-caption-window-container span',
          '[class*="caption"]'
        ];

        for (const selector of selectors) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            console.log('Contexta: Found', elements.length, 'elements with selector:', selector);
            elements.forEach(el => {
              const text = el.textContent?.trim();
              if (text && video.currentTime && text.length > 0) {
                const key = `${Math.floor(video.currentTime)}-${text}`;
                if (!captionMap.has(key)) {
                  captionMap.set(key, {
                    start: video.currentTime,
                    end: video.currentTime + 3,
                    text: text
                  });
                  console.log('Contexta: Captured caption:', text);
                }
              }
            });
            break;
          }
        }
      }, 1000);

      // After 10 seconds, stop observing and return what we have
      setTimeout(() => {
        clearInterval(checkInterval);
        observer.disconnect();
        const collected = Array.from(captionMap.values());
        console.log('Contexta: Stopped observing. Collected', collected.length, 'captions');
        resolve(collected);
      }, 10000);
      }, 500); // Wait 500ms after enabling captions
    });
  }

  enableYouTubeCaptions() {
    try {
      const captionButton = document.querySelector('.ytp-subtitles-button');

      if (!captionButton) {
        console.log('Contexta: Caption button not found!');
        return;
      }

      const isEnabled = captionButton.getAttribute('aria-pressed') === 'true';
      console.log('Contexta: Caption button found. Currently enabled:', isEnabled);

      if (!isEnabled) {
        console.log('Contexta: Clicking caption button to enable...');
        captionButton.click();

        // Check if it worked
        setTimeout(() => {
          const nowEnabled = captionButton.getAttribute('aria-pressed') === 'true';
          console.log('Contexta: After click, captions enabled:', nowEnabled);
        }, 500);
      } else {
        console.log('Contexta: Captions already enabled');
      }
    } catch (error) {
      console.error('Contexta: Error enabling captions:', error);
    }
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.SubtitleParser = SubtitleParser;
}
