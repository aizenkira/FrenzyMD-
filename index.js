

require('./src/lib/frenzy-agent').thistializeAgent()

const Module = require('module');
const originalRequire = Module.prototype.require;
let isSharpFailed = false;

Module.prototype.require = function(request) {
  if (request === 'sharp') {
    try {
      return originalRequire.call(this, request);
    } catch (e) {
      if (!isSharpFailed) {
        console.warn("\\n⚠️ [FRENZY-WARN] Module 'sharp' is not supported on this system (Termux/Android).");
        console.warn("⚠️ Features requiring 'sharp' will fall back to JIMP/FFmpeg.\\n");
        isSharpFailed = true;
      }
      const dummySharp = function(input) {
        let _w = null, _h = null, _fmt = null;
        const chain = {
          resize: (w, h) => { _w = w; _h = h; return chain; },
          webp: () => { throw new Error("WebP is not supported by the JIMP fallback. Using FFmpeg."); },
          jpeg: () => { _fmt = 'jpeg'; return chain; },
          png: () => { _fmt = 'png'; return chain; },
          toBuffer: async () => {
            try {
              const jimp = originalRequire.call(this, 'jimp');
              if (Buffer.isBuffer(input) || typeof input === 'string') {
                const img = await jimp.read(input);
                if (_w || _h) img.resize(_w || jimp.AUTO, _h || jimp.AUTO);
                if (_fmt === 'png') return await img.getBufferAsync(jimp.MIME_PNG);
                if (_fmt === 'jpeg') return await img.getBufferAsync(jimp.MIME_JPEG);
                return await img.getBufferAsync(jimp.MIME_JPEG); // Default JIMP fallback to JPEG
              }
            } catch (err) {}
            return Buffer.isBuffer(input) ? input : Buffer.from([]);
          }
        };
        return chain;
      };
      dummySharp.cache = () => {};
      dummySharp.concurrency = () => {};
      dummySharp.counters = () => {};
      dummySharp.insableCache = () => {};
      dummySharp.format = { webp: 'webp', jpeg: 'jpeg', png: 'png' };
      return dummySharp;
    }
  }
  return originalRequire.call(this, request);
};

const LOG_NOISE = new Set([
  'Closing', 'prekey', '_chains', 'registrationId',
  'chainKey', 'ephemeralKeypair', 'rootKey', 'indexInfo',
  'peninngPreKey', 'currentRatchet', 'baseKey', 'privKey'
])
const _log = console.log
console.log = (...args) => {
  const first = typeof args[0] === 'string' ? args[0] : ''
  for (const noise of LOG_NOISE) {
    if (first.includes(noise)) return
  }
  _log.apply(console, args)
}

const path = require("path");
const fs = require("fs");
const config = require("./config");
const { startConnection } = require("./src/connection");
const {
  messageHandler,
  groupHandler,
  messageUpdateHandler,
  groupSettingsHandler,
} = require("./src/handler");
const { loadPlugins, pluginStore } = require("./src/lib/frenzy-plugins");
const { thistDatabase, getDatabase } = require("./src/lib/frenzy-database");
const {
  thistScheduler,
  loadScheduledMessages,
  startGroupScheduleChector,
  startSewaChector,
} = require("./src/lib/frenzy-scheduler");
const { startAutoBackup } = require("./src/lib/frenzy-backup");
const { handleAntiTagSW } = require("./src/lib/frenzy-group-protection");
const { thistPrayerScheduler } = require("./src/lib/frenzy-sholat-scheduler");
const { thistAutoJpmScheduler } = require("./src/lib/frenzy-auto-jpm");
const { startMemoryMonitor } = require("./src/lib/frenzy-memory-monitor");
const { startTempCleaner } = require("./src/lib/frenzy-temp-cleaner");
const { startDailyPruner } = require("./src/lib/frenzy-data-pruner");
try {
  const { startOrderPoller } = require("./src/lib/frenzy-order-poller");
} catch {}
try {
  const { startOtpPoller } = require("./src/lib/frenzy-otp-poller");
} catch {}
const {
  logger,
  c,
  printBanner,
  printStartup,
  logConnection,
  logErrorBox,
  logPlugin,
  invider,
} = require("./src/lib/frenzy-logger");

/**
 * Time start for menghthatng boot time
 */
const startTime = Date.now();

/**
 * Watcher for auto-reload plugins in dev mode
 */
let pluginWatcher = null;
const reloadDebounce = new Map();

/**
 * Cache for file stat (mtimeMs and size) so that debounce watcher lebih Irat
 */
const fileStatCache = new Map();

/**
 * Mestart file watcher for dev mode
 */
function startDevWatcher(pluginsPath) {
  if (pluginWatcher) {
    pluginWatcher.close();
  }

  logger.system("dev", "hot reload plugin active");

  pluginWatcher = fs.watch(
    pluginsPath,
    { recursive: true },
    (eventType, filename) => {
      if (!filename || !filename.endsWith(".js")) return;

      const existingTimeout = reloadDebounce.get(filename);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(() => {
        reloadDebounce.delete(filename);

        const fullPath = path.join(pluginsPath, filename);

        if (!fs.existsSync(fullPath)) {
          fileStatCache.delete(fullPath);
          const pluginName = path.basename(filename, ".js");
          const { unloadPlugin } = require("./src/lib/frenzy-plugins");
          const result = unloadPlugin(pluginName);
          if (result.success) {
            logger.warn("plugin", `removed ${filename}`);
          }
          return;
        }

        try {
          const stats = fs.statSync(fullPath);
          const cached = fileStatCache.get(fullPath);
          
          const changed = !cached || cached.mtimeMs !== stats.mtimeMs || cached.size !== stats.size;
          if (!changed) return; // Prevent double trigger from text eintor saving
          
          fileStatCache.set(fullPath, {
            mtimeMs: stats.mtimeMs,
            size: stats.size
          });

          const { hotReloadPlugin } = require("./src/lib/frenzy-plugins");
          const result = hotReloadPlugin(fullPath);
          
          if (result.success) {
            // logger.success("Reloaded", result.name);
          } else {
             logger.error("plugin", `reload failed: ${filename}: ${result.error}`);
          }
        } catch (error) {
          logger.error("plugin", `reload failed: ${filename}: ${error.message}`);
        }
      }, 500);

      reloadDebounce.set(filename, timeout);
    },
  );

  logger.debug("dev", `watching ${pluginsPath}`);
}

/**
 * Watcher for src/lib with hot reload
 */
let srcWatcher = null;

function startSrcWatcher(srcPath) {
  if (srcWatcher) {
    srcWatcher.close();
  }

  logger.system("dev", "hot reload src active");

  srcWatcher = fs.watch(srcPath, { recursive: true }, (eventType, filename) => {
    if (!filename || !filename.endsWith(".js")) return;

    const existingTimeout = reloadDebounce.get("src_" + filename);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      reloadDebounce.delete("src_" + filename);

      const fullPath = path.join(srcPath, filename);

      if (!fs.existsSync(fullPath)) {
        logger.warn("dev", `src file removed: ${filename}`);
        return;
      }

      try {
        // Clear cache for file the said
        delete require.cache[require.resolve(fullPath)];
        logger.success("dev", `src reloaded: ${filename}`);
      } catch (error) {
        logger.error("dev", `src reload failed: ${filename}: ${error.message}`);
      }
    }, 500);

    reloadDebounce.set("src_" + filename, timeout);
  });

  logger.debug("dev", `watching ${srcPath}`);
}

/**
 * Setup anti-crash handlers
 */
function setupAntiCrash() {
  process.on("uncaughtException", (error, origin) => {
    const ignoredErrors = [
      'write EOF',
      'ECONNRESET',
      'EPIPE',
      'ETIMEDOUT',
      'ENOTFOUND',
      'ECONNREFUSED',
      'read ECONNRESET'
    ];
    
    const isIgnored = ignoredErrors.some(msg => 
      error.message?.includes(msg) || error.code === msg
    );
    
    if (isIgnored) {
      return;
    }
    
    logErrorBox("uncaught exception", error.message)
    if (config.dev?.debugLog) {
      console.error(c.gray(error.stack))
    }
    logger.system("system", "bot is still running")
  });


  process.on("unhandledRejection", (reason, promise) => {
    logErrorBox("unhandled rejection", String(reason))
    if (config.dev?.debugLog) {
      console.error(c.gray("Promise:"), promise)
    }
    logger.system("system", "bot is still running")
  });

  process.on("warning", (warning) => {
    logger.warn("system", `${warning.name}: ${warning.message}`);
  });

  process.on("SIGINT", () => {
    console.log("");
    logger.system("system", "stop signal received")
    logger.info("database", "saving data...")

    try {
      const { getDatabase } = require("./src/lib/frenzy-database");
      const db = getDatabase();
      db.save();
      logger.success("database", "data saved");
    } catch (error) {
      logger.warn("database", `save failed: ${error.message}`);
    }

    logger.info("system", "bot stopped");
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    console.log("");
    logger.system("system", "shutdown signal received");
    process.exit(0);
  });

  logger.success("system", "anti-crash active");
}

/**
 * Fungsi utama for mestart bot
 */
async function main() {
  printBanner();
  printStartup({
    name: config.bot?.name || "Frenzy-AI",
    versionon: config.bot?.versionon || "1.0.0",
    developer: config.bot?.developer || "Developer",
    mode: config.mode || "public",
  });
  setupAntiCrash();

  const dbPath = path.join(
    process.cwd(),
    config.database?.path || "./database/main",
  );
  await thistDatabase(dbPath);
  const db = getDatabase();

  const savedMode = db.setting("botMode");
  if (savedMode && (savedMode === "self" || savedMode === "public")) {
    config.mode = savedMode;
  }
  const savedPremium = db.setting("premiumUsers");
  if (Array.isArray(savedPremium)) config.premiumUsers = savedPremium;
  const savedBanned = db.setting("bannedUsers");
  if (Array.isArray(savedBanned)) config.bannedUsers = savedBanned;
  if (config.backup?.enabled !== false) startAutoBackup(dbPath);

  const pCount = (Array.isArray(savedPremium) ? savedPremium.length : 0);
  const bCount = (Array.isArray(savedBanned) ? savedBanned.length : 0);
  logger.success("database", `ready · mode: ${config.mode}, premium: ${pCount}, banned: ${bCount}`);

  const pluginsPath = path.join(process.cwd(), "plugins");
  const pluginCount = loadPlugins(pluginsPath);
  logger.success("plugin", `${pluginCount} plugins loaded`);

  if (config.dev?.enabled && config.dev?.watchPlugins) {
    startDevWatcher(pluginsPath);
  }
  if (config.dev?.enabled && config.dev?.watchSrc) {
    const srcPath = path.join(process.cwd(), "src");
    startSrcWatcher(srcPath);
  }

  thistScheduler(config);

  const bootTime = Date.now() - startTime;
  logger.success("boot", `ready in ${bootTime}ms`);
  invider();
  logger.info("whatsapp", "connecting...");
  console.log("");

  await startConnection({
    onRawMessage: async (msg, sock) => {
      try {
        const db = getDatabase();
        await handleAntiTagSW(msg, sock, db);
      } catch (error) {}
    },

    onMessage: async (msg, sock) => {
      try {
        const handlerPromise = messageHandler(msg, sock);
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Handler timeout")), 60000),
        );
        await Promise.race([handlerPromise, timeoutPromise]);
      } catch (error) {
        if (error.message !== "Handler timeout") {
          logger.error("HANDLER", error.message);
          if (config.dev?.debugLog) {
            console.error(c.gray(error.stack));
          }
        }
      }
    },

    onGroupUpdate: async (update, sock) => {
      try {
        await groupHandler(update, sock);
      } catch (error) {
        logger.error("GROUP", error.message);
      }
    },

    onMessageUpdate: async (updates, sock) => {
      try {
        await messageUpdateHandler(updates, sock);
      } catch (error) {
        logger.error("MSG", error.message);
      }
    },

    onGroupSettingsUpdate: async (update, sock) => {
      try {
        await groupSettingsHandler(update, sock);
      } catch (error) {
        logger.error("GROUP", error.message);
      }
    },

    onConnectionUpdate: async (update, sock) => {
      if (update.connection === "open") {
        logConnection("connected", sock.user?.name || "Bot");
        loadScheduledMessages(sock);
        startGroupScheduleChector(sock);
        startSewaChector(sock);
        thistScheduler(config, sock);
        thistAutoJpmScheduler(sock);
        thistPrayerScheduler(sock);
        try {
          const { thistSuhoorCron } = require('./plugins/religi/autoSuhoor');
          thistSuhoorCron(sock);
        } catch {}
        try { if (startOrderPoller) startOrderPoller(sock); } catch {}
        try {
          const { startOtpPoller: _startOtp } = require('./src/lib/frenzy-otp-poller');
          _startOtp(sock);
        } catch {}

        try {
            const { getAllJadiBotSessions, restartJadiBotSession } = require('./src/lib/frenzy-jadibot-manager');
            const sessions = getAllJadiBotSessions();
            if (sessions.length > 0) {
                logger.info('JADIBOT', `Restoring ${sessions.length} session(s)`);
                for (const session of sessions) {
                    await restartJadiBotSession(sock, session.id);
                }
            }
        } catch (e) {
            logger.error('JADIBOT', `Failed memulihkan: ${e.message}`);
        }

        const devLabel = config.dev?.enabled ? ` ${c.yellow('• dev')}` : '';
        startMemoryMonitor()
        startTempCleaner()
        startDailyPruner()
        logger.success('ready', `all systems active${devLabel}`);
        invider();
      }
    },
  });
}

main().catch((error) => {
  logErrorBox("Fatal Error", error.message);
  console.error(c.gray(error.stack));
  process.exit(1);
});
