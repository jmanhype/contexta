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

      // Try to get captions from YouTube's timedtext API
      const captionTracks = await this.getCaptionTracks();

      if (captionTracks.length === 0) {
        console.log('No captions available for this video');
        return [];
      }

      // Prefer Spanish captions, fallback to auto-generated
      const spanishTrack = this.selectBestTrack(captionTracks);

      if (spanishTrack) {
        const subtitles = await this.fetchAndParseSubtitles(spanishTrack.url);
        this.subtitles = subtitles;

        // Translate subtitles
        await this.translateSubtitles();

        return this.subtitles;
      }

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
      for (const script of scripts) {
        const content = script.textContent;
        if (content.includes('ytInitialPlayerResponse')) {
          const match = content.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
          if (match) {
            return JSON.parse(match[1]);
          }
        }
      }

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

      if (!captions) {
        return [];
      }

      return captions.map((track) => ({
        url: track.baseUrl,
        language: track.languageCode,
        name: track.name?.simpleText || track.languageCode,
        kind: track.kind || 'captions',
      }));
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
    // Prefer Spanish tracks
    const spanishTrack = tracks.find((track) =>
      CONTEXTA_CONFIG.LANGUAGES.SPANISH.variants.includes(track.language)
    );

    if (spanishTrack) {
      return spanishTrack;
    }

    // Fallback to first available track
    return tracks[0] || null;
  }

  async fetchAndParseSubtitles(url) {
    try {
      const response = await fetch(url);
      const text = await response.text();

      // Determine format and parse accordingly
      if (text.includes('WEBVTT')) {
        return this.parseWebVTT(text);
      } else if (text.includes('<text')) {
        return this.parseXML(text);
      }

      return [];
    } catch (error) {
      console.error('Error fetching subtitles:', error);
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
}

// Make available globally
if (typeof window !== 'undefined') {
  window.SubtitleParser = SubtitleParser;
}
