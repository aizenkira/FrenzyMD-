const config = require("../../config");
const path = require("path");
const fs = require("fs");
const timeHelper = require("../../src/lib/frenzy-time");
const { createCanvas, GlobalFonts } = require("@napi-rs/canvas");
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
  name: "nulis",
  alias: ["tulis", "write"],
  category: "tools",
  description: "Generate tulisan tangan in tortas",
  usage: ".nulis <text>",
  example: ".nulis I cinta you forever",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energy: 1,
  isEnabled: true,
};

let thumbTools = null;
try {
  const thumbPath = path.join(
    process.cwd(),
    "assets",
    "images",
    "frenzy-games.jpg",
  );
  if (fs.existsSync(thumbPath)) thumbTools = fs.readFileSync(thumbPath);
} catch (e) {}

const fontPath = path.join(process.cwd(), "assets", "fonts", "Zahraaa.ttf");
if (fs.existsSync(fontPath)) {
  try {
    GlobalFonts.registerFromPath(fontPath, "Zahraaa");
  } catch (e) {}
}

function getContextInfo(title = "📝 *ɴᴜʟɪs*", body = "Tulisan tangan") {
  const saluranId = config.saluran?.id || "120363406397452589@newsletter";
  const saluranName = config.saluran?.name || config.bot?.name || "frenzy-AI";

  const contextInfo = {
    forwardingScore: 9999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: saluranId,
      newsletterName: saluranName,
      serverMessageId: 127,
    },
  };

  if (thumbTools) {
    contextInfo.externalAdReply = {
      title: title,
      body: body,
      thumbnail: thumbTools,
      contentType: 1,
      renderLargerThumbnail: true,
      sourceUrl: config.saluran?.link || "",
    };
  }

  return contextInfo;
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine + (currentLine ? " " : "") + word;
    const metrics = ctx.measureText(testLine);

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

async function handler(m, { sock }) {
  const text = m.args?.join(" ");

  if (!text) {
    return m.reply(
      `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
        `> \`${m.prefix}nulis <text>\`\n\n` +
        `> Example:\n` +
        `> \`${m.prefix}nulis I cinta you forever\``,
    );
  }

  if (text.length > 500) {
    return m.reply(`❌ *ᴛᴇᴋs ᴛᴇʀʟᴀʟᴜ ᴘᴀɴᴊᴀɴɢ*\n\n> Mactionmal 500 karakter`);
  }

  const inputPath = path.join(
    process.cwd(),
    "assets",
    "tortas",
    "magernulis1.jpg",
  );

  if (!fs.existsSync(inputPath)) {
    return m.reply(
      `❌ *ᴛᴇᴍᴘʟᴀᴛᴇ ᴛɪᴅᴀᴋ ᴀᴅᴀ*\n\n> File \`assets/tortas/magernulis1.jpg\` not found`,
    );
  }

  await m.react("🕕");
  await m.reply(`🕕 *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n> Create tulisan tangan...`);

  try {
    const { loadImage } = require("@napi-rs/canvas");
    const bgImage = await loadImage(inputPath);

    const canvas = createCanvas(bgImage.width, bgImage.height);
    const ctx = canvas.getContext("2d");

    ctx.drawImage(bgImage, 0, 0);

    const tgl = timeHelper.formatDate("DD/MM/YYYY");
    const day = timeHelper.formatFull("dddd");

    ctx.font = "20px Zahraaa, Arial";
    ctx.fillStyle = "#1a1a2e";

    ctx.fillText(day, 806, 78);

    ctx.font = "18px Zahraaa, Arial";
    ctx.fillText(tgl, 806, 102);

    ctx.font = "20px Zahraaa, Arial";
    const maxWidth = 600;
    const lineHeight = 28;
    const startX = 344;
    const startY = 142;

    const lines = wrapText(ctx, text, maxWidth);

    lines.forEach((line, i) => {
      ctx.fillText(line, startX, startY + i * lineHeight);
    });

    const buffer = canvas.toBuffer("image/jpeg");

    await m.react("✅");
    await sock.sendMessage(
      m.chat,
      {
        image: buffer,
        caption: `✅ *ᴛᴜʟɪsᴀɴ ᴛᴀɴɢᴀɴ*\n\n> Hatiheart totahuan! 📖`,
        contextInfo: getContextInfo(),
      },
      { quoted: m },
    );
  } catch (error) {
    await m.react('☢');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
