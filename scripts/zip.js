const fs = require("fs-extra");
const path = require("path");
const archiver = require("archiver");
const { build } = require("./build");

async function createZip() {
  try {
    console.log("📦 Creating extension package...");

    await build();

    const DIST_DIR = path.join(__dirname, "..", "dist");
    const packageJson = require("../package.json");
    const zipPath = path.join(
      __dirname,
      "..",
      `contexta-v${packageJson.version}.zip`,
    );

    if (await fs.pathExists(zipPath)) {
      await fs.remove(zipPath);
    }

    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    return new Promise((resolve, reject) => {
      output.on("close", () => {
        console.log(`✅ Extension packaged: ${archive.pointer()} bytes`);
        console.log(`📁 Package saved: ${zipPath}`);
        resolve(zipPath);
      });

      archive.on("error", (err) => {
        console.error("❌ Archive error:", err);
        reject(err);
      });

      archive.pipe(output);
      archive.directory(DIST_DIR, false);
      archive.finalize();
    });
  } catch (error) {
    console.error("❌ Packaging failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  createZip();
}

module.exports = { createZip };
