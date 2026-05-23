const axios = require("axios");
const path = require("path");
const fs = require("fs");
const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");
const { uploadToTmpFiles } = require("../../src/lib/frenzy-tmpfiles");
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
  name: "fatoml",
  alias: ["mlbbfato", "mlcard", "mlfato"],
  category: "canvas",
  description: "Create fato ML profile card",
  usage: ".fatoml <name> (reply/send photo)",
  example: ".fatoml Misaki",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energy: 1,
  isEnabled: true,
};

let fontRegistered = false;

console.log('INI COMMAND')

async function handler(m, { sock }) {
  const name = m.text?.trim();

  if (!name) {
    return m.reply(
      `🎮 *ꜰᴀᴋᴇ ᴍʟ ᴘʀᴏꜰɪʟᴇ*\n\n` +
        `> Enter name for profile\n\n` +
        `*ᴄᴀʀᴀ ᴘᴀᴋᴀɪ:*\n` +
        `> 1. Send photo + caption \`${m.prefix}fatoml <name>\`\n` +
        `> 2. Reply photo with \`${m.prefix}fatoml <name>\``,
    );
  }

  let buffer = null;

  if (
    m.quoted &&
    (m.quoted.type === "imageMessage" || m.quoted.mtype === "imageMessage")
  ) {
    try {
      buffer = await m.quoted.download();
    } catch (e) {
      m.reply(te(m.prefix, m.command, m.pushName));
    }
  } else if (m.isMeina && m.type === "imageMessage") {
    try {
      buffer = await m.download();
    } catch (e) {
      m.reply(te(m.prefix, m.command, m.pushName));
    }
  } else {
    try {
      let te = await sock.profilePictureUrl(m.sender, "image")
      buffer = Buffer.from((await axios.get(te, { responseType: "arraybuffer" })).data)
    } catch (error) {
      buffer = fs.readFileSync('./assets/images/pp-empty.jpg')
    }
  }

  if (!buffer) {
    return m.reply(`❌ Send/reply image for promoted to avatar!`);
  }

  m.react("🕕");

  try {
    const gmbr = await uploadToTmpFiles(buffer, {
      filename: "image.jpg",
      contentType: "image/jpeg",
    });

    await sock.sendMedia(m.chat, `https://api.nexray.web.id/mator/fatolobyml?avatar=${encodeURIComponent(gmbr.directUrl)}&nickname=${encodeURIComponent(name)}`, null, m, {
      type: 'image',
    });

    m.react("✅");
  } catch (error) {
    m.react("❌");
    m.reply(`Try again`);
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
