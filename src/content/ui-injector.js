class UIInjector {
  constructor() {
    this.container = null;
    this.subtitleContainer = null;
    this.dictionaryTooltip = null;
    this.storage = window.ContextaStorage;
    this.translationService = window.TranslationService;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) {
      return;
    }

    this.createSubtitleContainer();
    this.createDictionaryTooltip();
    this.setupEventListeners();
    this.isInitialized = true;
  }

  createSubtitleContainer() {
    // Remove existing container if present
    const existing = document.getElementById('contexta-subtitle-container');
    if (existing) {
      existing.remove();
    }

    this.container = document.createElement('div');
    this.container.id = 'contexta-subtitle-container';
    this.container.className = 'contexta-ui-container';

    this.subtitleContainer = document.createElement('div');
    this.subtitleContainer.id = 'contexta-subtitles';
    this.subtitleContainer.className = 'contexta-subtitles';

    this.container.appendChild(this.subtitleContainer);

    // Find the best place to inject the container
    const videoPlayer = document.querySelector(
      CONTEXTA_CONFIG.SELECTORS.VIDEO_CONTAINER
    );
    if (videoPlayer) {
      videoPlayer.appendChild(this.container);
    } else {
      document.body.appendChild(this.container);
    }
  }

  createDictionaryTooltip() {
    this.dictionaryTooltip = document.createElement('div');
    this.dictionaryTooltip.id = 'contexta-dictionary-tooltip';
    this.dictionaryTooltip.className = 'contexta-dictionary-tooltip';
    this.dictionaryTooltip.style.display = 'none';

    document.body.appendChild(this.dictionaryTooltip);
  }

  setupEventListeners() {
    // Hide tooltip when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.dictionaryTooltip.contains(e.target)) {
        this.hideDictionaryTooltip();
      }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideDictionaryTooltip();
      }
    });
  }

  displayDualSubtitles(originalSubtitle, translatedSubtitle) {
    if (!this.subtitleContainer) {
      return;
    }

    const html = `
      <div class="contexta-subtitle-dual">
        <div class="contexta-subtitle-original" data-lang="es">
          ${this.makeTextClickable(originalSubtitle.text)}
        </div>
        <div class="contexta-subtitle-translation" data-lang="en">
          ${translatedSubtitle?.translation || ''}
        </div>
      </div>
    `;

    this.subtitleContainer.innerHTML = html;

    // Add click listeners to words
    this.addWordClickListeners();
  }

  makeTextClickable(text) {
    // Split text into words and make them clickable
    const words = text.split(/(\s+)/);

    return words
      .map((word) => {
        if (word.trim() && word.match(/[a-záéíóúñ]/i)) {
          const cleanWord = word.replace(/[^\w\sáéíóúñ]/gi, '');
          return `<span class="contexta-clickable-word" data-word="${cleanWord}">${word}</span>`;
        }
        return word;
      })
      .join('');
  }

  addWordClickListeners() {
    const clickableWords = this.subtitleContainer.querySelectorAll(
      '.contexta-clickable-word'
    );

    clickableWords.forEach((wordElement) => {
      wordElement.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const word = wordElement.getAttribute('data-word');
        const rect = wordElement.getBoundingClientRect();

        await this.showDictionaryTooltip(
          word,
          rect.left + rect.width / 2,
          rect.top
        );
      });

      // Add hover effects
      wordElement.addEventListener('mouseenter', () => {
        wordElement.classList.add('contexta-word-hover');
      });

      wordElement.addEventListener('mouseleave', () => {
        wordElement.classList.remove('contexta-word-hover');
      });
    });
  }

  async showDictionaryTooltip(word, x, y) {
    if (!word || word.length < 2) {
      return;
    }

    // Show loading state
    this.dictionaryTooltip.innerHTML = `
      <div class="contexta-tooltip-content">
        <div class="contexta-tooltip-header">
          <span class="contexta-word">${word}</span>
          <button class="contexta-close-btn">&times;</button>
        </div>
        <div class="contexta-tooltip-body">
          <div class="contexta-loading">Translating...</div>
        </div>
      </div>
    `;

    this.positionTooltip(x, y);
    this.dictionaryTooltip.style.display = 'block';

    // Add close button listener
    const closeBtn = this.dictionaryTooltip.querySelector(
      '.contexta-close-btn'
    );
    closeBtn.addEventListener('click', () => this.hideDictionaryTooltip());

    try {
      // Get translation
      const translation = await this.translationService.getWordDefinition(word);

      // Get current subtitle for context
      const video = document.querySelector(CONTEXTA_CONFIG.SELECTORS.VIDEO);
      const currentTime = video ? video.currentTime : 0;
      const subtitleParser = window.currentSubtitleParser;
      const currentSubtitle = subtitleParser
        ? subtitleParser.getCurrentSubtitle(currentTime)
        : null;

      // Update tooltip content
      this.dictionaryTooltip.innerHTML = `
        <div class="contexta-tooltip-content">
          <div class="contexta-tooltip-header">
            <span class="contexta-word">${word}</span>
            <button class="contexta-close-btn">&times;</button>
          </div>
          <div class="contexta-tooltip-body">
            <div class="contexta-translation">
              <strong>Translation:</strong> ${translation || 'Not found'}
            </div>
            ${
              currentSubtitle
                ? `
              <div class="contexta-context">
                <strong>Context:</strong> "${currentSubtitle.text}"
              </div>
            `
                : ''
            }
            <div class="contexta-actions">
              <button class="contexta-btn contexta-pronounce-btn" data-word="${word}">
                🔊 Pronounce
              </button>
              <button class="contexta-btn contexta-save-btn" data-word="${word}" data-translation="${translation}">
                💾 Save Word
              </button>
            </div>
          </div>
        </div>
      `;

      // Re-add event listeners
      this.addTooltipEventListeners(word, translation, currentSubtitle);
    } catch (error) {
      console.error('Error showing dictionary tooltip:', error);
      this.dictionaryTooltip.querySelector('.contexta-tooltip-body').innerHTML =
        `
        <div class="contexta-error">Error loading translation</div>
      `;
    }
  }

  addTooltipEventListeners(word, translation, context) {
    // Close button
    const closeBtn = this.dictionaryTooltip.querySelector(
      '.contexta-close-btn'
    );
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hideDictionaryTooltip());
    }

    // Pronounce button
    const pronounceBtn = this.dictionaryTooltip.querySelector(
      '.contexta-pronounce-btn'
    );
    if (pronounceBtn) {
      pronounceBtn.addEventListener('click', async () => {
        await this.translationService.pronounceText(word, 'es');
      });
    }

    // Save word button
    const saveBtn = this.dictionaryTooltip.querySelector('.contexta-save-btn');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const videoId = this.extractVideoId();
        await this.storage.addVocabulary(
          word,
          translation,
          context?.text || '',
          videoId
        );

        // Show feedback
        saveBtn.textContent = '✓ Saved!';
        saveBtn.disabled = true;

        setTimeout(() => {
          this.hideDictionaryTooltip();
        }, 1000);
      });
    }
  }

  positionTooltip(x, y) {
    const tooltip = this.dictionaryTooltip;
    const tooltipRect = tooltip.getBoundingClientRect();
    const windowWidth = window.innerWidth;

    // Calculate position
    let left = x - tooltipRect.width / 2;
    let top = y - tooltipRect.height - 10; // 10px above the word

    // Adjust if tooltip goes off screen
    if (left < 10) {
      left = 10;
    } else if (left + tooltipRect.width > windowWidth - 10) {
      left = windowWidth - tooltipRect.width - 10;
    }

    if (top < 10) {
      top = y + 25; // Show below instead
    }

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
  }

  hideDictionaryTooltip() {
    if (this.dictionaryTooltip) {
      this.dictionaryTooltip.style.display = 'none';
    }
  }

  clearSubtitles() {
    if (this.subtitleContainer) {
      this.subtitleContainer.innerHTML = '';
    }
  }

  extractVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('v') || null;
  }

  showQuizOverlay(quizData) {
    // Create quiz overlay
    const overlay = document.createElement('div');
    overlay.id = 'contexta-quiz-overlay';
    overlay.className = 'contexta-quiz-overlay';

    overlay.innerHTML = `
      <div class="contexta-quiz-modal">
        <div class="contexta-quiz-header">
          <h3>Quick Spanish Quiz</h3>
          <button class="contexta-close-btn">&times;</button>
        </div>
        <div class="contexta-quiz-content">
          ${this.renderQuizContent(quizData)}
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Add event listeners
    this.addQuizEventListeners(overlay, quizData);

    return overlay;
  }

  renderQuizContent(quizData) {
    switch (quizData.type) {
      case 'vocabulary':
        return this.renderVocabularyQuiz(quizData);
      case 'fill_blank':
        return this.renderFillBlankQuiz(quizData);
      case 'translation':
        return this.renderTranslationQuiz(quizData);
      default:
        return '<div>Unknown quiz type</div>';
    }
  }

  renderVocabularyQuiz(quizData) {
    return `
      <div class="contexta-quiz-question">
        <p><strong>What does "${quizData.word}" mean?</strong></p>
        <div class="contexta-quiz-options">
           ${quizData.options
             .map(
               (option) => `
            <button class="contexta-quiz-option" data-answer="${option}" data-correct="${option === quizData.correct}">
              ${option}
            </button>
          `
             )
             .join('')}
        </div>
      </div>
    `;
  }

  renderFillBlankQuiz(quizData) {
    return `
      <div class="contexta-quiz-question">
        <p><strong>Fill in the blank:</strong></p>
        <p class="contexta-quiz-sentence">${quizData.sentence}</p>
        <input type="text" class="contexta-quiz-input" placeholder="Type your answer...">
        <button class="contexta-quiz-submit">Submit</button>
      </div>
    `;
  }

  renderTranslationQuiz(quizData) {
    return `
      <div class="contexta-quiz-question">
        <p><strong>Translate this sentence:</strong></p>
        <p class="contexta-quiz-sentence">"${quizData.sentence}"</p>
        <textarea class="contexta-quiz-textarea" placeholder="Type your translation..."></textarea>
        <button class="contexta-quiz-submit">Submit</button>
      </div>
    `;
  }

  addQuizEventListeners(overlay, quizData) {
    // Close button
    const closeBtn = overlay.querySelector('.contexta-close-btn');
    closeBtn.addEventListener('click', () => {
      overlay.remove();
    });

    // Quiz options
    const options = overlay.querySelectorAll('.contexta-quiz-option');
    options.forEach((option) => {
      option.addEventListener('click', () => {
        const isCorrect = option.getAttribute('data-correct') === 'true';
        this.handleQuizAnswer(overlay, quizData, isCorrect);
      });
    });

    // Submit buttons
    const submitBtn = overlay.querySelector('.contexta-quiz-submit');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        const input = overlay.querySelector(
          '.contexta-quiz-input, .contexta-quiz-textarea'
        );
        const userAnswer = input.value.trim();
        const isCorrect = this.checkAnswer(quizData, userAnswer);
        this.handleQuizAnswer(overlay, quizData, isCorrect);
      });
    }
  }

  checkAnswer(quizData, userAnswer) {
    switch (quizData.type) {
      case 'fill_blank':
        return userAnswer.toLowerCase() === quizData.correct.toLowerCase();
      case 'translation':
        // For translation, we'll be more lenient
        return (
          userAnswer.toLowerCase().includes(quizData.correct.toLowerCase()) ||
          quizData.correct.toLowerCase().includes(userAnswer.toLowerCase())
        );
      default:
        return false;
    }
  }

  async handleQuizAnswer(overlay, quizData, isCorrect) {
    // Show feedback
    const content = overlay.querySelector('.contexta-quiz-content');
    content.innerHTML = `
      <div class="contexta-quiz-result">
        <div class="contexta-result-icon ${isCorrect ? 'correct' : 'incorrect'}">
          ${isCorrect ? '✓' : '✗'}
        </div>
        <p><strong>${isCorrect ? 'Correct!' : 'Not quite right'}</strong></p>
        ${!isCorrect ? `<p>The answer was: <strong>${quizData.correct}</strong></p>` : ''}
        <button class="contexta-continue-btn">Continue Watching</button>
      </div>
    `;

    // Save quiz result
    await this.storage.addQuizResult(quizData.type, isCorrect, quizData.word);

    // Continue button
    const continueBtn = overlay.querySelector('.contexta-continue-btn');
    continueBtn.addEventListener('click', () => {
      overlay.remove();
    });

    // Auto-close after 3 seconds
    setTimeout(() => {
      if (overlay.parentNode) {
        overlay.remove();
      }
    }, 3000);
  }

  destroy() {
    if (this.container) {
      this.container.remove();
    }
    if (this.dictionaryTooltip) {
      this.dictionaryTooltip.remove();
    }
    this.isInitialized = false;
  }
}

// Make available globally
if (typeof window !== 'undefined') {
  window.UIInjector = UIInjector;
}
