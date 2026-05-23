const axios = require("axios");
const config = require("../../config");
const timeHelper = require("../../src/lib/frenzy-time");
const path = require("path");
const fs = require("fs");
const { f } = require("../../src/lib/frenzy-http");
const te = require('../../src/lib/frenzy-error')

const NEOXR_APIKEY = config.APItoy?.neoxr || "Milik-Bot-OurinMD";

const pluginConfig = {
  name: "pixeldraindl",
  alias: ["pddl", "pixeldrain", "pddownload"],
  category: "download",
  description: "Download file from Pixeldrain",
  usage: ".pixeldraindl <url>",
  example: ".pixeldraindl https://pixeldrain.com/u/xxxxx",
  cooldown: 15,
  energy: 2,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const args = m.args || [];
  const url = args[0]?.trim();

  if (!url || !url.includes("pixeldrain.com")) {
    return m.reply(
      `📥 *ᴘɪxᴇʟᴅʀᴀɪɴ ᴅᴏᴡɴʟᴏᴀᴅ*\n\n` +
        `> Download file from Pixeldrain\n\n` +
        `*Format:*\n` +
        `> \`${m.prefix}pixeldraindl <url>\`\n\n` +
        `*Example:*\n` +
        `> \`${m.prefix}pixeldraindl https://pixeldrain.com/u/xxxxx\``,
    );
  }

  m.react("🕕");

  try {
    const apiUrl = `https://api.neoxr.eu/api/pixeldrain?url=${encodeURIComponent(url)}&apikey=${NEOXR_APIKEY}`;
    const data = await f(apiUrl)

    if (!data?.status || !data?.data) {
      m.react("❌");
      return m.reply(
        "❌ *ɢᴀɢᴀʟ*\n\n> File not found or link no valid",
      );
    }

    const file = data.data;

    const sizeMatch = file.size?.match(/([\d.]+)\s*(MB|GB|KB)/i);
    let sizeInMB = 0;
    if (sizeMatch) {
      const value = parseFloat(sizeMatch[1]);
      const unit = sizeMatch[2].toUpperCase();
      if (unit === "GB") sizeInMB = value * 1024;
      else if (unit === "MB") sizeInMB = value;
      else if (unit === "KB") sizeInMB = value / 1024;
    }

    if (sizeInMB > 0 && sizeInMB <= 100) {

      await sock.sendMedia(m.chat, file.url, null, m, {
        type: 'document',
        fileName: file.filename,
        mimetype: 'application/octet-stream',
        contextInfo: {
          forwardingScore: 99,
          isForwarded: true
        }
      })
    } else if (sizeInMB > 100) {
      await m.reply(
        `⚠️ *FILE TOO LARGE*\n\n> File ${file.size} too large for sent\n> Usage link download above`,
      );
    }

    m.react("✅");
  } catch (error) {
    m.react('☢');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
