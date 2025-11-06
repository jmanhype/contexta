const chokidar = require("chokidar");
const { build } = require("./build");
const path = require("path");

const SRC_DIR = path.join(__dirname, "..", "src");
const ROOT_FILES = [
  path.join(__dirname, "..", "manifest.json"),
  path.join(__dirname, "..", "package.json"),
];

console.log("👀 Watching for changes...");
console.log("🔄 Initial build...");

build()
  .then(() => {
    console.log("✅ Initial build complete");
    console.log("🎯 Watching for file changes...\n");

    const watcher = chokidar.watch([SRC_DIR, ...ROOT_FILES], {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true,
    });

    let buildTimeout;

    watcher.on("all", (event, path) => {
      console.log(`📝 ${event}: ${path}`);

      clearTimeout(buildTimeout);
      buildTimeout = setTimeout(async () => {
        try {
          console.log("🔨 Rebuilding...");
          await build();
          console.log("✅ Rebuild complete\n");
        } catch (error) {
          console.error("❌ Rebuild failed:", error);
        }
      }, 500);
    });

    watcher.on("error", (error) => {
      console.error("❌ Watch error:", error);
    });

    process.on("SIGINT", () => {
      console.log("\n👋 Stopping watch mode...");
      watcher.close();
      process.exit(0);
    });
  })
  .catch((error) => {
    console.error("❌ Initial build failed:", error);
    process.exit(1);
  });
