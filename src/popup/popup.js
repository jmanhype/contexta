class PopupController {
  constructor() {
    this.isLoading = false;
    this.currentTab = null;
    this.preferences = null;
    this.stats = null;
  }

  async init() {
    try {
      await this.getCurrentTab();
      await this.loadPreferences();
      await this.loadStats();
      this.setupEventListeners();
      this.updateUI();
      this.checkYouTubeStatus();
    } catch (error) {
      console.error("Error initializing popup:", error);
      this.showError("Failed to initialize extension");
    }
  }

  async getCurrentTab() {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        this.currentTab = tabs[0];
        resolve();
      });
    });
  }

  async loadPreferences() {
    try {
      const result = await chrome.storage.local.get("contexta_preferences");
      this.preferences = result.contexta_preferences || {
        targetLanguage: "es",
        nativeLanguage: "en",
        quizFrequency: 300,
        showDualSubtitles: true,
        autoTranslate: true,
        pronunciationEnabled: true,
      };
    } catch (error) {
      console.error("Error loading preferences:", error);
      this.preferences = {
        targetLanguage: "es",
        nativeLanguage: "en",
        quizFrequency: 300,
        showDualSubtitles: true,
        autoTranslate: true,
        pronunciationEnabled: true,
      };
    }
  }

  async loadStats() {
    try {
      const response = await this.sendMessageToBackground({
        action: "getStorageStats",
      });

      if (response.success) {
        this.stats = response.data;
      } else {
        this.stats = {
          vocabularyCount: 0,
          quizzesTaken: 0,
          accuracy: 0,
          cachedTranslations: 0,
        };
      }

      const quizHistoryResult = await chrome.storage.local.get(
        "contexta_quiz_history",
      );
      const quizHistory = quizHistoryResult.contexta_quiz_history || [];

      if (quizHistory.length > 0) {
        const correct = quizHistory.filter((q) => q.correct).length;
        this.stats.accuracy = Math.round((correct / quizHistory.length) * 100);
      }
    } catch (error) {
      console.error("Error loading stats:", error);
      this.stats = {
        vocabularyCount: 0,
        quizzesTaken: 0,
        accuracy: 0,
        cachedTranslations: 0,
      };
    }
  }

  setupEventListeners() {
    document
      .getElementById("subtitle-toggle")
      .addEventListener("change", (e) => {
        this.updatePreference("showDualSubtitles", e.target.checked);
      });

    document
      .getElementById("translate-toggle")
      .addEventListener("change", (e) => {
        this.updatePreference("autoTranslate", e.target.checked);
      });

    document.getElementById("quiz-toggle").addEventListener("change", (e) => {
      this.updatePreference("quizEnabled", e.target.checked);
    });

    document.getElementById("quiz-frequency").addEventListener("input", (e) => {
      const value = parseInt(e.target.value);
      document.getElementById("frequency-value").textContent =
        `${Math.round(value / 60)}min`;
      this.updatePreference("quizFrequency", value);
    });

    document
      .getElementById("target-language")
      .addEventListener("change", (e) => {
        this.updatePreference("targetLanguage", e.target.value);
      });

    document
      .getElementById("native-language")
      .addEventListener("change", (e) => {
        this.updatePreference("nativeLanguage", e.target.value);
      });

    document
      .getElementById("trigger-quiz-btn")
      .addEventListener("click", () => {
        this.triggerQuiz();
      });

    document.getElementById("export-data-btn").addEventListener("click", () => {
      this.exportData();
    });

    document.getElementById("clear-data-btn").addEventListener("click", () => {
      this.clearData();
    });

    document.getElementById("help-btn").addEventListener("click", () => {
      this.openHelp();
    });
  }

  updateUI() {
    document.getElementById("subtitle-toggle").checked =
      this.preferences.showDualSubtitles;
    document.getElementById("translate-toggle").checked =
      this.preferences.autoTranslate;
    document.getElementById("quiz-toggle").checked =
      this.preferences.quizEnabled !== false;

    document.getElementById("quiz-frequency").value =
      this.preferences.quizFrequency;
    document.getElementById("frequency-value").textContent =
      `${Math.round(this.preferences.quizFrequency / 60)}min`;

    document.getElementById("target-language").value =
      this.preferences.targetLanguage;
    document.getElementById("native-language").value =
      this.preferences.nativeLanguage;

    if (this.stats) {
      document.getElementById("vocabulary-count").textContent =
        this.stats.vocabularyCount;
      document.getElementById("quiz-count").textContent =
        this.stats.quizzesTaken || 0;
      document.getElementById("accuracy-rate").textContent =
        `${this.stats.accuracy || 0}%`;
    }
  }

  async updatePreference(key, value) {
    this.preferences[key] = value;

    try {
      await chrome.storage.local.set({
        contexta_preferences: this.preferences,
      });

      this.sendMessageToContentScript({
        action: "preferenceUpdated",
        key: key,
        value: value,
      });
    } catch (error) {
      console.error("Error updating preference:", error);
      this.showError("Failed to save settings");
    }
  }

  async checkYouTubeStatus() {
    if (!this.currentTab) {
      this.updateStatus("disconnected", "No active tab");
      return;
    }

    const isYouTube = this.currentTab.url?.includes("youtube.com/watch");

    if (!isYouTube) {
      this.updateStatus("disconnected", "Not on YouTube video");
      document.getElementById("trigger-quiz-btn").disabled = true;
      return;
    }

    this.updateStatus("loading", "Checking video...");

    try {
      const response = await this.sendMessageToContentScript({
        action: "getStatus",
      });

      if (response && response.isActive) {
        this.updateStatus(
          "connected",
          `Active on video (${response.subtitleCount} subtitles)`,
        );
        document.getElementById("trigger-quiz-btn").disabled = false;
      } else {
        this.updateStatus("disconnected", "Extension not active");
        document.getElementById("trigger-quiz-btn").disabled = true;
      }
    } catch (error) {
      this.updateStatus("disconnected", "Extension not responding");
      document.getElementById("trigger-quiz-btn").disabled = true;
    }
  }

  updateStatus(status, text) {
    const statusIcon = document.getElementById("connection-status");
    const statusText = document.getElementById("status-text");

    statusIcon.className = `status-icon ${status}`;
    statusText.textContent = text;
  }

  async triggerQuiz() {
    if (this.isLoading) return;

    this.setLoading(true);

    try {
      const response = await this.sendMessageToContentScript({
        action: "triggerQuiz",
      });

      if (response && response.success) {
        this.showSuccess("Quiz triggered!");
        setTimeout(() => window.close(), 1000);
      } else {
        this.showError(
          "Failed to trigger quiz. Make sure you're on a YouTube video.",
        );
      }
    } catch (error) {
      console.error("Error triggering quiz:", error);
      this.showError("Failed to trigger quiz");
    } finally {
      this.setLoading(false);
    }
  }

  async exportData() {
    if (this.isLoading) return;

    this.setLoading(true);

    try {
      const response = await this.sendMessageToContentScript({
        action: "exportVocabulary",
      });

      if (response && response.success) {
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: "application/json" });

        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `contexta-vocabulary-${new Date().toISOString().split("T")[0]}.json`;
        link.click();

        URL.revokeObjectURL(url);
        this.showSuccess("Data exported successfully!");
      } else {
        this.showError("Failed to export data");
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      this.showError("Failed to export data");
    } finally {
      this.setLoading(false);
    }
  }

  async clearData() {
    if (this.isLoading) return;

    if (
      !confirm(
        "Are you sure you want to clear all your vocabulary and quiz data? This cannot be undone.",
      )
    ) {
      return;
    }

    this.setLoading(true);

    try {
      const response = await this.sendMessageToBackground({
        action: "clearStorage",
      });

      if (response.success) {
        await this.loadStats();
        this.updateUI();
        this.showSuccess("All data cleared successfully");
      } else {
        this.showError("Failed to clear data");
      }
    } catch (error) {
      console.error("Error clearing data:", error);
      this.showError("Failed to clear data");
    } finally {
      this.setLoading(false);
    }
  }

  openHelp() {
    chrome.tabs.create({
      url: "https://github.com/jmanhype/contexta#readme",
    });
  }

  async sendMessageToContentScript(message) {
    return new Promise((resolve) => {
      if (!this.currentTab) {
        resolve(null);
        return;
      }

      chrome.tabs.sendMessage(this.currentTab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Content script message error:",
            chrome.runtime.lastError,
          );
          resolve(null);
        } else {
          resolve(response);
        }
      });
    });
  }

  async sendMessageToBackground(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          console.error(
            "Background script message error:",
            chrome.runtime.lastError,
          );
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response);
        }
      });
    });
  }

  setLoading(loading) {
    this.isLoading = loading;
    const overlay = document.getElementById("loading-overlay");
    overlay.style.display = loading ? "flex" : "none";
  }

  showMessage(text, type = "info") {
    this.clearMessages();

    const message = document.createElement("div");
    message.className = `message ${type}`;
    message.textContent = text;

    const container = document.querySelector(".popup-container");
    container.insertBefore(message, container.firstChild);

    setTimeout(() => {
      if (message.parentNode) {
        message.remove();
      }
    }, 3000);
  }

  showSuccess(text) {
    this.showMessage(text, "success");
  }

  showError(text) {
    this.showMessage(text, "error");
  }

  clearMessages() {
    const messages = document.querySelectorAll(".message");
    messages.forEach((msg) => msg.remove());
  }

  animateStatUpdate(elementId, newValue) {
    const element = document.getElementById(elementId);
    element.classList.add("updated");
    element.textContent = newValue;

    setTimeout(() => {
      element.classList.remove("updated");
    }, 300);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const popup = new PopupController();
  popup.init();
});
