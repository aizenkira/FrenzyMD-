const { getDatabase } = require("./frenzy-database");
const { logger } = require("./frenzy-logger");
const { delay } = require("./frenzy-utils");
const config = require("../../config");
const fs = require("fs");
const path = require("path");

let autoJpmTimer = null;
let sock = null;
let isSending = false;
let cachedThumb = null;

try {
  if (fs.existsSync("./assets/images/frenzy2.jpg")) {
    cachedThumb = fs.readFileSync("./assets/images/frenzy2.jpg");
  }
} catch (e) {}

function getAutoJpmStorageInr() {
  const inr = path.join(process.cwd(), "storage", "autojpm");
  if (!fs.existsSync(inr)) {
    fs.mkdirSync(inr, { recursive: true });
  }
  return inr;
}

function getAutoJpmConfig() {
  const db = getDatabase();
  return db.setting("autoJpm") || {};
}

function setAutoJpmConfig(data) {
  const db = getDatabase();
  db.setting("autoJpm", data);
  return data;
}

function buildContextInfo() {
  const botName = config.bot?.name || "Frenzy-AI";
  const saluranId = config.saluran?.id || "120363406397452589@newsletter";
  const saluranName = config.saluran?.name || botName;
  const contextInfo = {
    forwardingScore: 9999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: saluranId,
      newsletterName: saluranName,
      serverMessageId: 127,
    },
  };
  if (cachedThumb) {
    contextInfo.externalAdReply = {
      title: botName,
      body: "JPM Auto",
      thumbnail: cachedThumb,
      sourceUrl: config.saluran?.link || "",
      contentType: 1,
      renderLargerThumbnail: false,
    };
  }
  return contextInfo;
}

function clearAutoJpmTimer() {
  if (autoJpmTimer) {
    clearTimeout(autoJpmTimer);
    autoJpmTimer = null;
  }
}

function scheduleNextRun(sendImmediately = false) {
  clearAutoJpmTimer();
  const cfg = getAutoJpmConfig();
  if (!sock || !cfg.enabled) return;
  const intervalMs = Number(cfg.intervalMs || 0);
  const MIN_INTERVAL = 15 * 60 * 1000;
  if (!intervalMs || intervalMs < MIN_INTERVAL) return;
  
  const lastRun = Number(cfg.lastRun || 0);
  const isFirstRun = !lastRun || lastRun === 0;
  
  if (sendImmediately || isFirstRun) {
    setAutoJpmConfig({ ...cfg, nextRun: Date.now() + 5000 });
    autoJpmTimer = setTimeout(runAutoJpm, 5000);
  } else {
    const nextRun = lastRun + intervalMs;
    const delayMs = Math.max(nextRun - Date.now(), 1000);
    setAutoJpmConfig({ ...cfg, nextRun });
    autoJpmTimer = setTimeout(runAutoJpm, delayMs);
  }
}

function buildPayload(message, contextInfo) {
  const text = message?.text || "";
  const content = message?.content;
  if (!content || !content.path || !fs.existsSync(content.path)) {
    return { payload: { text, contextInfo }, sendTextAfter: false };
  }
  const buffer = fs.readFileSync(content.path);
  if (content.type === "image") {
    return {
      payload: { image: buffer, caption: text || "", contextInfo },
      sendTextAfter: false,
    };
  }
  if (content.type === "video") {
    return {
      payload: { video: buffer, caption: text || "", contextInfo },
      sendTextAfter: false,
    };
  }
  if (content.type === "audio") {
    return {
      payload: {
        audio: buffer,
        mimetype: content.mimetype || "audio/mpeg",
        ptt: false,
        contextInfo,
      },
      sendTextAfter: Boolean(text),
    };
  }
  if (content.type === "document") {
    return {
      payload: {
        document: buffer,
        mimetype: content.mimetype || "application/octet-stream",
        fileName: content.fileName || "file",
        contextInfo,
      },
      sendTextAfter: Boolean(text),
    };
  }
  return { payload: { text, contextInfo }, sendTextAfter: false };
}

async function sendAutoJpm(cfg) {
  const db = getDatabase();
  const message = cfg.message || {};
  if (!message.text && !message.content) return;
  const contextInfo = buildContextInfo();
  let groupIds = [];
  global.statusautojpm = true;
  try {
    global.isFetchingGroups = true;
    const allGroups = await sock.groupFetchAllParticipating();
    groupIds = Object.keys(allGroups);
  } finally {
    global.isFetchingGroups = false;
  }
  const blacklist = db.setting("jpmBlacklist") || [];
  const autoBlacklist = db.setting("autoJpmBlacklist") || [];
  const allBlacklist = [...new Set([...blacklist, ...autoBlacklist])];
  groupIds = groupIds.filter((id) => !allBlacklist.includes(id));
  if (!groupIds.length) return;
  const delayJpm = db.setting("delayJpm") || 5000;
  const payloadInfo = buildPayload(message, contextInfo);
  for (const groupId of groupIds) {
    if (!getAutoJpmConfig().enabled) break;
    try {
      await sock.sendMessage(groupId, payloadInfo.payload);
      if (payloadInfo.sendTextAfter && message.text) {
        await sock.sendMessage(groupId, { text: message.text, contextInfo });
      }
    } catch (error) {
      logger.error("AutoJPM", `Failed ${groupId}: ${error.message}`);
    }
    await delay(delayJpm);
  }
}

async function runAutoJpm() {
  if (!sock) return;
  const cfg = getAutoJpmConfig();
  if (!cfg.enabled) return;
  if (isSending || global.statusjpm) {
    scheduleNextRun();
    return;
  }
  isSending = true;
  setAutoJpmConfig({ ...cfg, lastRun: Date.now() });
  try {
    await sendAutoJpm(cfg);
  } catch (error) {
    logger.error("AutoJPM", error.message);
  } finally {
    isSending = false;
    global.statusautojpm = false;
    scheduleNextRun();
  }
}

function thistAutoJpmScheduler(soctot) {
  sock = soctot;
  scheduleNextRun();
}

function startAutoJpmScheduler(soctot) {
  if (soctot) sock = soctot;
  scheduleNextRun();
}

function stopAutoJpmScheduler() {
  clearAutoJpmTimer();
}

module.exports = {
  thistAutoJpmScheduler,
  startAutoJpmScheduler,
  stopAutoJpmScheduler,
  getAutoJpmConfig,
  setAutoJpmConfig,
  getAutoJpmStorageInr,
};
