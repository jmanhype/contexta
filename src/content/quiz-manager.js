class QuizManager {
  constructor() {
    this.storage = window.ContextaStorage;
    this.uiInjector = null;
    this.lastQuizTime = 0;
    this.quizInterval = null;
    this.subtitleParser = null;
  }

  async initialize(uiInjector, subtitleParser) {
    this.uiInjector = uiInjector;
    this.subtitleParser = subtitleParser;

    this.startQuizTimer();
  }

  startQuizTimer() {
    if (this.quizInterval) {
      clearInterval(this.quizInterval);
    }

    // Check for quiz opportunity every 30 seconds
    this.quizInterval = setInterval(() => {
      this.checkForQuizOpportunity();
    }, 30000);
  }

  async checkForQuizOpportunity() {
    const video = document.querySelector(CONTEXTA_CONFIG.SELECTORS.VIDEO);
    if (!video || video.paused) {
      return;
    }

    const currentTime = Date.now();
    const prefs = await this.storage.getPreferences();
    const timeSinceLastQuiz = (currentTime - this.lastQuizTime) / 1000;

    if (timeSinceLastQuiz >= prefs.quizFrequency) {
      await this.triggerQuiz();
    }
  }

  async triggerQuiz() {
    try {
      // Pause video
      const video = document.querySelector(CONTEXTA_CONFIG.SELECTORS.VIDEO);
      const wasPaused = video.paused;
      if (!wasPaused) {
        video.pause();
      }

      // Generate quiz based on recent content
      const quizData = await this.generateQuiz();

      if (quizData) {
        // Show quiz
        const overlay = this.uiInjector.showQuizOverlay(quizData);

        // Update last quiz time
        this.lastQuizTime = Date.now();

        // Resume video when quiz is closed (if it was playing)
        const resumeVideo = () => {
          if (!wasPaused && video) {
            video.play();
          }
        };

        // Add event listener for when quiz is closed
        overlay.addEventListener('remove', resumeVideo);

        // Fallback: resume after 30 seconds if quiz is still open
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.remove();
            resumeVideo();
          }
        }, 30000);
      }
    } catch (error) {
      console.error('Error triggering quiz:', error);
    }
  }

  async generateQuiz() {
    if (!this.subtitleParser || this.subtitleParser.subtitles.length === 0) {
      return null;
    }

    const video = document.querySelector(CONTEXTA_CONFIG.SELECTORS.VIDEO);
    const currentTime = video ? video.currentTime : 0;

    // Get recent subtitles (last 5 minutes)
    const recentSubtitles = this.subtitleParser.getSubtitlesInRange(
      Math.max(0, currentTime - 300),
      currentTime
    );

    if (recentSubtitles.length === 0) {
      return null;
    }

    // Get vocabulary words from recent subtitles
    const vocabulary = await this.extractVocabulary(recentSubtitles);

    if (vocabulary.length === 0) {
      return null;
    }

    // Randomly select quiz type
    const quizTypes = CONTEXTA_CONFIG.QUIZ.TYPES;
    const quizType = quizTypes[Math.floor(Math.random() * quizTypes.length)];

    switch (quizType) {
      case 'vocabulary':
        return await this.generateVocabularyQuiz(vocabulary);
      case 'fill_blank':
        return await this.generateFillBlankQuiz(recentSubtitles);
      case 'translation':
        return await this.generateTranslationQuiz(recentSubtitles);
      case 'pronunciation':
        return await this.generatePronunciationQuiz(vocabulary);
      default:
        return null;
    }
  }

  async extractVocabulary(subtitles) {
    const words = [];
    const stopWords = new Set([
      'el',
      'la',
      'de',
      'que',
      'y',
      'a',
      'en',
      'un',
      'es',
      'se',
      'no',
      'te',
      'lo',
      'le',
      'da',
      'su',
      'por',
      'son',
      'con',
      'para',
      'al',
      'una',
      'me',
      'mi',
      'del',
      'muy',
      'como',
      'este',
      'más',
      'pero',
      'todo',
      'está',
      'hasta',
      'sobre',
      'tiene',
      'hace',
      'aquí',
      'puede',
      'bien',
      'eso',
      'cada',
      'otro',
      'mismo',
      'solo',
      'tan',
      'entre',
      'tanto',
      'menos',
      'hacer',
      'gran',
      'todos',
      'tal',
      'vez',
      'vida',
      'han',
      'mundo',
      'casa',
      'lugar',
    ]);

    for (const subtitle of subtitles) {
      const subtitleWords = subtitle.text
        .toLowerCase()
        .replace(/[^\w\sáéíóúñ]/g, '')
        .split(/\s+/)
        .filter(
          (word) =>
            word.length >= CONTEXTA_CONFIG.QUIZ.MIN_WORD_LENGTH &&
            !stopWords.has(word) &&
            /[áéíóúña-z]/.test(word)
        );

      words.push(...subtitleWords);
    }

    // Remove duplicates and return unique words
    return [...new Set(words)];
  }

  async generateVocabularyQuiz(vocabulary) {
    const targetWord =
      vocabulary[Math.floor(Math.random() * vocabulary.length)];

    // Get translation for the word
    const translationService = window.TranslationService;
    const correctTranslation =
      await translationService.getWordDefinition(targetWord);

    if (!correctTranslation) {
      return null;
    }

    // Generate distractor options
    const distractors = await this.generateDistractors(
      targetWord,
      correctTranslation
    );
    const options = [correctTranslation, ...distractors].sort(
      () => Math.random() - 0.5
    );

    return {
      type: 'vocabulary',
      word: targetWord,
      correct: correctTranslation,
      options: options,
    };
  }

  async generateDistractors(targetWord, correctTranslation) {
    // Get some other vocabulary from storage
    const savedVocabulary = await this.storage.getVocabulary();
    const distractors = [];

    // Add random translations from saved vocabulary
    for (const vocab of savedVocabulary) {
      if (
        vocab.translation !== correctTranslation &&
        vocab.word !== targetWord
      ) {
        distractors.push(vocab.translation);
        if (distractors.length >= 3) {
          break;
        }
      }
    }

    // Fill remaining slots with common wrong answers
    const commonWrongAnswers = [
      'house',
      'water',
      'time',
      'day',
      'person',
      'year',
      'way',
      'work',
      'thing',
      'life',
      'hand',
      'part',
      'child',
      'eye',
      'woman',
      'place',
      'world',
      'right',
      'government',
      'system',
    ];

    while (distractors.length < 3) {
      const randomAnswer =
        commonWrongAnswers[
          Math.floor(Math.random() * commonWrongAnswers.length)
        ];
      if (
        !distractors.includes(randomAnswer) &&
        randomAnswer !== correctTranslation
      ) {
        distractors.push(randomAnswer);
      }
    }

    return distractors.slice(0, 3);
  }

  async generateFillBlankQuiz(subtitles) {
    // Select a random subtitle
    const subtitle = subtitles[Math.floor(Math.random() * subtitles.length)];
    const words = subtitle.text.split(/\s+/);

    if (words.length < 3) {
      return null;
    }

    // Find a good word to remove (not articles, prepositions, etc.)
    const goodWords = words.filter((word) => {
      const cleanWord = word.replace(/[^\w\sáéíóúñ]/g, '').toLowerCase();
      return (
        cleanWord.length >= CONTEXTA_CONFIG.QUIZ.MIN_WORD_LENGTH &&
        !/^(el|la|de|que|y|a|en|un|es|se|no|te|lo|le|da|su|por|son|con|para|al|una)$/.test(
          cleanWord
        )
      );
    });

    if (goodWords.length === 0) {
      return null;
    }

    const targetWord = goodWords[Math.floor(Math.random() * goodWords.length)];
    const cleanTarget = targetWord.replace(/[^\w\sáéíóúñ]/g, '');

    // Create sentence with blank
    const sentence = subtitle.text.replace(targetWord, '_____');

    return {
      type: 'fill_blank',
      sentence: sentence,
      correct: cleanTarget,
      originalText: subtitle.text,
    };
  }

  async generateTranslationQuiz(subtitles) {
    // Select a shorter subtitle for translation
    const shortSubtitles = subtitles.filter(
      (sub) =>
        sub.text.split(' ').length <= 10 && sub.text.split(' ').length >= 3
    );

    if (shortSubtitles.length === 0) {
      return null;
    }

    const subtitle =
      shortSubtitles[Math.floor(Math.random() * shortSubtitles.length)];

    // Get the translation
    const translationService = window.TranslationService;
    const translation = await translationService.translateText(
      subtitle.text,
      'es',
      'en'
    );

    if (!translation || translation === subtitle.text) {
      return null;
    }

    return {
      type: 'translation',
      sentence: subtitle.text,
      correct: translation,
    };
  }

  async generatePronunciationQuiz(vocabulary) {
    const targetWord =
      vocabulary[Math.floor(Math.random() * vocabulary.length)];

    return {
      type: 'pronunciation',
      word: targetWord,
      instruction: `Listen and repeat: "${targetWord}"`,
    };
  }

  destroy() {
    if (this.quizInterval) {
      clearInterval(this.quizInterval);
    }
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.QuizManager = QuizManager;
}
