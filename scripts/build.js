const fs = require("fs-extra");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..", "src");
const DIST_DIR = path.join(__dirname, "..", "dist");
const ROOT_DIR = path.join(__dirname, "..");

async function build() {
  try {
    console.log("🔨 Building Contexta Chrome Extension...");

    await fs.ensureDir(DIST_DIR);
    await fs.emptyDir(DIST_DIR);

    await fs.copy(SRC_DIR, DIST_DIR);

    const manifestPath = path.join(ROOT_DIR, "manifest.json");
    await fs.copy(manifestPath, path.join(DIST_DIR, "manifest.json"));

    const iconsDir = path.join(ROOT_DIR, "icons");
    if (await fs.pathExists(iconsDir)) {
      await fs.copy(iconsDir, path.join(DIST_DIR, "icons"));
    } else {
      console.log("⚠️ No icons directory found, creating placeholder icons...");
      await createPlaceholderIcons();
    }

    const dataDir = path.join(ROOT_DIR, "data");
    if (await fs.pathExists(dataDir)) {
      await fs.copy(dataDir, path.join(DIST_DIR, "data"));
    } else {
      console.log("📚 Creating mock vocabulary data...");
      await createMockData();
    }

    console.log("✅ Build completed successfully!");
    console.log("📁 Extension ready in ./dist directory");
    console.log("🚀 Load ./dist as an unpacked extension in Chrome");
  } catch (error) {
    console.error("❌ Build failed:", error);
    process.exit(1);
  }
}

async function createPlaceholderIcons() {
  const iconsDir = path.join(DIST_DIR, "icons");
  await fs.ensureDir(iconsDir);

  const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
    <rect width="128" height="128" fill="#4F46E5" rx="16"/>
    <text x="64" y="75" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white" text-anchor="middle">C</text>
  </svg>`;

  await fs.writeFile(path.join(iconsDir, "icon.svg"), svgIcon);

  console.log("  Created placeholder icons");
}

async function createMockData() {
  const dataDir = path.join(DIST_DIR, "data");
  await fs.ensureDir(dataDir);

  const mockVocabulary = {
    commonWords: [
      { spanish: "hola", english: "hello" },
      { spanish: "gracias", english: "thank you" },
      { spanish: "adiós", english: "goodbye" },
      { spanish: "por favor", english: "please" },
      { spanish: "disculpe", english: "excuse me" },
      { spanish: "buenos días", english: "good morning" },
      { spanish: "buenas noches", english: "good night" },
      { spanish: "¿cómo está?", english: "how are you?" },
      { spanish: "muy bien", english: "very well" },
      { spanish: "lo siento", english: "I'm sorry" },
      { spanish: "habla", english: "speak" },
      { spanish: "escucha", english: "listen" },
      { spanish: "mira", english: "look" },
      { spanish: "come", english: "eat" },
      { spanish: "bebe", english: "drink" },
      { spanish: "casa", english: "house" },
      { spanish: "trabajo", english: "work" },
      { spanish: "escuela", english: "school" },
      { spanish: "familia", english: "family" },
      { spanish: "amigo", english: "friend" },
    ],
    phrasePatterns: [
      { pattern: "Me gusta ___", english: "I like ___" },
      { pattern: "¿Dónde está ___?", english: "Where is ___?" },
      { pattern: "No entiendo", english: "I don't understand" },
      { pattern: "¿Puede ayudarme?", english: "Can you help me?" },
      { pattern: "¿Cuánto cuesta?", english: "How much does it cost?" },
    ],
  };

  await fs.writeFile(
    path.join(dataDir, "vocabulary.json"),
    JSON.stringify(mockVocabulary, null, 2),
  );

  console.log("  Created mock vocabulary data");
}

if (require.main === module) {
  build();
}

module.exports = { build };
