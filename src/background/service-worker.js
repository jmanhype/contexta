chrome.runtime.onInstalled.addListener((details) => {
  console.log("Contexta extension installed:", details.reason);

  if (details.reason === "install") {
    chrome.tabs.create({
      url: "https://www.youtube.com/results?search_query=spanish+learning",
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case "translateText":
      handleTranslation(request.data)
        .then((response) => sendResponse({ success: true, data: response }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message }),
        );
      return true;

    case "fetchSubtitles":
      fetchYouTubeSubtitles(request.videoId)
        .then((subtitles) => sendResponse({ success: true, data: subtitles }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message }),
        );
      return true;

    case "getStorageStats":
      getStorageStats()
        .then((stats) => sendResponse({ success: true, data: stats }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message }),
        );
      return true;

    case "clearStorage":
      clearUserData()
        .then(() => sendResponse({ success: true }))
        .catch((error) =>
          sendResponse({ success: false, error: error.message }),
        );
      return true;

    default:
      sendResponse({ success: false, error: "Unknown action" });
  }
});

async function handleTranslation({ text, fromLang, toLang }) {
  try {
    const cachedTranslation = await getCachedTranslation(
      text,
      fromLang,
      toLang,
    );
    if (cachedTranslation) {
      return cachedTranslation;
    }

    const translation = await translateWithFreeAPI(text, fromLang, toLang);

    if (translation) {
      await cacheTranslation(text, translation, fromLang, toLang);
      return translation;
    }

    return text;
  } catch (error) {
    console.error("Translation error in service worker:", error);
    return text;
  }
}

async function translateWithFreeAPI(text, fromLang, toLang) {
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${fromLang}|${toLang}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.responseStatus === 200 && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }

    return null;
  } catch (error) {
    console.error("Free API translation error:", error);
    return null;
  }
}

async function getCachedTranslation(text, fromLang, toLang) {
  try {
    const result = await chrome.storage.local.get("contexta_translations");
    const cache = result.contexta_translations || {};
    const key = `${fromLang}-${toLang}-${text.toLowerCase()}`;
    const cached = cache[key];

    if (cached && Date.now() - cached.timestamp < 7 * 24 * 60 * 60 * 1000) {
      return cached.translation;
    }

    return null;
  } catch (error) {
    console.error("Error getting cached translation:", error);
    return null;
  }
}

async function cacheTranslation(text, translation, fromLang, toLang) {
  try {
    const result = await chrome.storage.local.get("contexta_translations");
    const cache = result.contexta_translations || {};
    const key = `${fromLang}-${toLang}-${text.toLowerCase()}`;

    cache[key] = {
      translation,
      timestamp: Date.now(),
    };

    const keys = Object.keys(cache);
    if (keys.length > 5000) {
      const oldestKeys = keys
        .sort((a, b) => cache[a].timestamp - cache[b].timestamp)
        .slice(0, 1000);
      oldestKeys.forEach((k) => delete cache[k]);
    }

    await chrome.storage.local.set({ contexta_translations: cache });
  } catch (error) {
    console.error("Error caching translation:", error);
  }
}

async function fetchYouTubeSubtitles(videoId) {
  try {
    const playerUrl = `https://www.youtube.com/watch?v=${videoId}`;

    const response = await fetch(playerUrl);
    const html = await response.text();

    const playerResponseMatch = html.match(
      /ytInitialPlayerResponse\s*=\s*({.+?});/,
    );
    if (!playerResponseMatch) {
      throw new Error("Could not find player response");
    }

    const playerResponse = JSON.parse(playerResponseMatch[1]);
    const captions =
      playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captions || captions.length === 0) {
      throw new Error("No captions found");
    }

    const spanishTrack =
      captions.find(
        (track) =>
          track.languageCode === "es" || track.languageCode.startsWith("es-"),
      ) || captions[0];

    if (spanishTrack) {
      const subtitleResponse = await fetch(spanishTrack.baseUrl);
      const subtitleText = await subtitleResponse.text();
      return parseSubtitles(subtitleText);
    }

    return [];
  } catch (error) {
    console.error("Error fetching YouTube subtitles:", error);
    throw error;
  }
}

function parseSubtitles(xmlText) {
  try {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");
    const textElements = xmlDoc.querySelectorAll("text");

    const subtitles = [];
    textElements.forEach((element) => {
      const start = parseFloat(element.getAttribute("start")) || 0;
      const dur = parseFloat(element.getAttribute("dur")) || 0;
      const text = element.textContent?.trim();

      if (text) {
        subtitles.push({
          start,
          end: start + dur,
          text: cleanSubtitleText(text),
        });
      }
    });

    return subtitles;
  } catch (error) {
    console.error("Error parsing subtitles:", error);
    return [];
  }
}

function cleanSubtitleText(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]*>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function getStorageStats() {
  try {
    const result = await chrome.storage.local.get(null);
    const vocabulary = result.contexta_vocabulary || [];
    const quizHistory = result.contexta_quiz_history || [];
    const translations = result.contexta_translations || {};

    return {
      vocabularyCount: vocabulary.length,
      quizzesTaken: quizHistory.length,
      cachedTranslations: Object.keys(translations).length,
      storageUsed: JSON.stringify(result).length,
    };
  } catch (error) {
    console.error("Error getting storage stats:", error);
    throw error;
  }
}

async function clearUserData() {
  try {
    await chrome.storage.local.clear();
  } catch (error) {
    console.error("Error clearing user data:", error);
    throw error;
  }
}

chrome.commands.onCommand.addListener((command) => {
  switch (command) {
    case "toggle-subtitles":
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "toggleSubtitles" });
        }
      });
      break;

    case "trigger-quiz":
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: "triggerQuiz" });
        }
      });
      break;
  }
});
