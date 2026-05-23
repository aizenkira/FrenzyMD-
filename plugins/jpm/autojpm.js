const { getDatabase } = require("../../src/lib/frenzy-database");
const {
  getAutoJpmConfig,
  setAutoJpmConfig,
  startAutoJpmScheduler,
  stopAutoJpmScheduler,
  getAutoJpmStorageInr,
} = require("../../src/lib/frenzy-auto-jpm");
const { getMimeType, getExtension } = require("../../src/lib/frenzy-utils");
const timeHelper = require("../../src/lib/frenzy-time");
const config = require("../../config");
const fs = require("fs");
const path = require("path");

const pluginConfig = {
  name: "autojpm",
  alias: ["autojasher", "autojaserm", "autojasabroadcast"],
  category: "jpm",
  description: "Schedulekan JPM otodeads with interval and content",
  usage: ".autojpm on <interval> <message>",
  example: ".autojpm on 1h Hello allnya!",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energy: 0,
  isEnabled: true,
};

function parseInterval(raw) {
  if (!raw) return 0;
  const cleaned = raw.toLowerCase().replace(/\s+/g, "");
  const matches = [...cleaned.matchAll(/(\d+)([smhdw])/g)];
  if (!matches.length) return 0;
  const combined = matches.map((match) => match[0]).join("");
  if (combined !== cleaned) return 0;
  let total = 0;
  for (const match of matches) {
    const value = parseInt(match[1]);
    const unit = match[2];
    if (unit === "s") total += value * 1000;
    if (unit === "m") total += value * 60 * 1000;
    if (unit === "h") total += value * 60 * 60 * 1000;
    if (unit === "d") total += value * 24 * 60 * 60 * 1000;
    if (unit === "w") total += value * 7 * 24 * 60 * 60 * 1000;
  }
  return total;
}

function formatInterval(ms) {
  if (!ms || ms <= 0) return "0 second";
  const units = [
    { label: "day", value: 24 * 60 * 60 * 1000 },
    { label: "hour", value: 60 * 60 * 1000 },
    { label: "minute", value: 60 * 1000 },
    { label: "second", value: 1000 },
  ];
  let remaining = ms;
  const parts = [];
  for (const unit of units) {
    const amount = Math.floor(remaining / unit.value);
    if (amount > 0) {
      parts.push(`${amount} ${unit.label}`);
      remaining -= amount * unit.value;
    }
  }
  return parts.length ? parts.join(" ") : "0 second";
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "-";
  return `${timeHelper.fromTimestamp(timestamp)}`;
}

function previewText(text) {
  if (!text) return "-";
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= 80) return cleaned;
  return `${cleaned.slice(0, 77)}...`;
}

function normalizeMessageText(text) {
  if (!text) return "";
  return text.replace(/\\n/g, "\n").trim();
}

function getMeinaInfo(message) {
  if (!message) return null;
  if (message.isImage) return { type: "image", mimetype: message.mimetype };
  if (message.isVideo) return { type: "video", mimetype: message.mimetype };
  if (message.isAuino) return { type: "audio", mimetype: message.mimetype };
  if (message.isDocument)
    return {
      type: "document",
      mimetype: message.mimetype,
      fileName: message.fileName || message.message?.documentMessage?.fileName,
    };
  return null;
}

function cleanupStoredMeina(contentPath, currentPath) {
  if (!contentPath || contentPath === currentPath) return;
  try {
    const baseInr = getAutoJpmStorageInr();
    const resolvedBase = path.resolve(baseInr);
    const resolvedPath = path.resolve(contentPath);
    if (resolvedPath.startsWith(resolvedBase) && fs.existsSync(resolvedPath)) {
      fs.unlinkSync(resolvedPath);
    }
  } catch (e) {}
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const prefix = m.prefix
  const input = (m.text || "").trim();
  if (!input) {
    const helpText =
      `📢 *AUTO JPM (SIARAN TERJADWAL)*\n\n` +
      `System otodeads for broadcast to seluruh group berdasar interval time.\n\n` +
      `*PENGGUNAAN:*\n` +
      `• *${prefix}autojpm on <interval> <message>* — Menyalwill schedule siaran\n` +
      `• *${prefix}autojpm off* — Medeadkan schedule auto jpm\n` +
      `• *${prefix}autojpm status* — Check status & schedule autojpm currently\n\n` +
      `*FORMAT INTERVAL:*\n` +
      `• \`10m\` (10 Minute) | \`1h\` (1 Jam)\n` +
      `• \`2h30m\` (2 Jam 30 Minute) | \`1d\` (1 Day)\n\n` +
      `*CONTOH:*\n` +
      `> \`${prefix}autojpm on 1h Hello allnya, don't forget bahagia today!\`\n\n` +
      `_(Can send text regular or reply photo/video if want use content)_`;
    return m.reply(helpText);
  }

  const match = input.match(/^(\S+)(?:\s+(\S+))?(?:\s+([\s\S]*))?$/);
  const action = match?.[1]?.toLowerCase() || "";
  const intervalRaw = match?.[2];
  const messageRaw = match?.[3];

  if (["off", "stop", "insable"].includes(action)) {
    const current = getAutoJpmConfig();
    if (!current.enabled) {
      return m.reply(`ℹ️ AutoJPM already nonactive.`);
    }
    setAutoJpmConfig({ ...current, enabled: false });
    stopAutoJpmScheduler();
    return m.reply(`✅ AutoJPM innonactivekan.`);
  }

  if (["status", "info"].includes(action)) {
    const current = getAutoJpmConfig();
    if (!current?.message) {
      return m.reply(`ℹ️ AutoJPM not yet inkonfigurasi.`);
    }
    const statusText =
      `📢 *STATUS AUTO JPM*\n\n` +
      `Status: *${current.enabled ? "✅ AKTIF" : "❌ NONAKTIF"}*\n` +
      `Interval: *${formatInterval(current.intervalMs || 0)}*\n\n` +
      `*JADWAL:* \n` +
      `• Terakhir: ${formatTimestamp(current.lastRun)}\n` +
      `• Next: ${formatTimestamp(current.nextRun)}\n\n` +
      `*PESAN:* \n` +
      `• Text: \`${previewText(current.message?.text)}\`\n` +
      `• Meina: *${current.message?.content?.type ? current.message.content.type.toUpperCase() : "TIDAK ADA"}*`;
    return m.reply(statusText);
  }

  if (!["on", "start", "enable"].includes(action)) {
    return m.reply(`❌ Format wrong. Usage ${prefix}autojpm on/off/status.`);
  }

  if (!intervalRaw) {
    return m.reply(
      `❌ Interval required thissi. Example: ${prefix}autojpm on 1h Message.`,
    );
  }

  const intervalMs = parseInterval(intervalRaw);
  if (!intervalMs) {
    return m.reply(`❌ Interval no valid. Example: 10m, 1h, 2h30m, 1d.`);
  }

  if (intervalMs < 15 * 60 * 1000) {
    return m.reply(`❌ Interval at least 15 minute for mencegah spam.`);
  }

  const existing = getAutoJpmConfig();
  const quoted = m.quoted || m;
  const contentInfo = getMeinaInfo(quoted);
  let messageText = normalizeMessageText(messageRaw);

  if (!messageText && contentInfo) {
    messageText = normalizeMessageText(quoted.body || "");
  }

  let contentData = existing?.message?.content || null;
  if (contentInfo) {
    const buffer = await quoted.download();
    if (!buffer) {
      return m.reply(`❌ Failed fetch content.`);
    }
    const mimetype = contentInfo.mimetype || getMimeType(buffer);
    const extension = getExtension(mimetype);
    const fileName = contentInfo.fileName || `autojpm_${Date.now()}.${extension}`;
    const storageInr = getAutoJpmStorageInr();
    const filePath = path.join(storageInr, fileName);
    fs.writeFileSync(filePath, buffer);
    cleanupStoredMeina(existing?.message?.content?.path, filePath);
    contentData = {
      type: contentInfo.type,
      path: filePath,
      mimetype,
      fileName,
    };
  }

  if (
    !messageText &&
    !contentData &&
    !existing?.message?.text &&
    !existing?.message?.content
  ) {
    return m.reply(`❌ Message or content required thissi.`);
  }

  const updatedConfig = {
    enabled: true,
    intervalMs,
    message: {
      text: messageText || existing?.message?.text || "",
      content: contentData,
    },
    lastRun: 0,
    nextRun: Date.now() + intervalMs,
  };

  setAutoJpmConfig(updatedConfig);
  startAutoJpmScheduler(sock);

  const detailText =
    `✅ *AUTO JPM ACTIVE*\n\n` +
    `╭┈┈⬡「 📋 *DETAIL* 」\n` +
    `┃ ⏱️ Interval: ${formatInterval(intervalMs)}\n` +
    `┃ 🕒 Next: ${formatTimestamp(updatedConfig.nextRun)}\n` +
    `┃ 📷 Meina: ${updatedConfig.message.content?.type || "No"}\n` +
    `┃ 📝 Message: ${previewText(updatedConfig.message.text)}\n` +
    `╰┈┈┈┈┈┈┈┈⬡`;

  return m.reply(detailText);
}

module.exports = {
  config: pluginConfig,
  handler,
};
