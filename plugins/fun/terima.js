const { getDatabase } = require("../../src/lib/frenzy-database");
const timeHelper = require("../../src/lib/frenzy-time");
const config = require("../../config");
const path = require("path");
const fs = require("fs");

const pluginConfig = {
  name: "receive",
  alias: ["accept", "yes"],
  category: "fun",
  description: "Accept a confession from someone",
  usage: ".receive @tag",
  example: ".receive @628xxx",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 5,
  energy: 0,
  isEnabled: true,
};

let thumbFun = null;
try {
  const thumbPath = path.join(
    process.cwd(),
    "assets",
    "images",
    "frenzy-games.jpg",
  );
  if (fs.existsSync(thumbPath)) thumbFun = fs.readFileSync(thumbPath);
} catch (e) {}

const celebrationQuotes = [
  "Hopefully lasting to the altar! 💍",
  "From friends to lovers, how beautiful! 💕",
  "Love is in the water! 💖",
  "Couple goals detected! 💑",
  "Don't forget unandg pas nikah ya! 💒",
  "Good menempuh hidup berduaan! 🥰",
  "Chemistry-nya strong very! 🔥",
  "Match made in heaven! ✨",
];

function getContextInfo(title = "💕 *ᴛᴇʀɪᴍᴀ*", body = "Love accepted!") {
  const saluranId = config.saluran?.id || "120363406397452589@newsletter";
  const saluranName = config.saluran?.name || config.bot?.name || "Frenzy-AI";

  const contextInfo = {
    forwardingScore: 9999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: saluranId,
      newsletterName: saluranName,
      serverMessageId: 127,
    },
  };

  if (thumbFun) {
    contextInfo.externalAdReply = {
      title: title,
      body: body,
      thumbnail: thumbFun,
      contentType: 1,
      renderLargerThumbnail: true,
      sourceUrl: config.saluran?.link || "",
    };
  }

  return contextInfo;
}

async function handler(m, { sock }) {
  const db = getDatabase();

  let shooterJid = null;

  if (m.quoted) {
    shooterJid = m.quoted.sender;
  } else if (m.mentionedJid?.[0]) {
    shooterJid = m.mentionedJid[0];
  }

  if (!shooterJid) {
    const sessions = global.tembakSessions || {};
    const mySession = Object.entries(sessions).find(
      ([toy, val]) => val.target === m.sender && val.chat === m.chat,
    );

    if (mySession) {
      shooterJid = mySession[1].shooter;
    }
  }

  if (!shooterJid) {
    return m.reply(
      `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
        `> Reply message confession + \`${m.prefix}receive\`\n` +
        `> Or \`${m.prefix}receive @tag\``,
    );
  }

  if (shooterJid === m.sender) {
    return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Cannot receive self yourself!`);
  }

  if (shooterJid === m.botNumber) {
    return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Bot cannot pawayn!`);
  }

  let shooterData = db.getUser(shooterJid) || {};
  let myData = db.getUser(m.sender) || {};

  if (!shooterData.fun) shooterData.fun = {};
  if (!myData.fun) myData.fun = {};

  if (shooterData.fun.pasangan !== m.sender && shooterData.fun.tembakTarget !== m.sender) {
    return m.reply(
      `❌ *ᴛɪᴅᴀᴋ ᴍᴇɴᴇᴍʙᴀᴋ*\n\n` +
        `> @${shooterJid.split("@")[0]} no currently menembakmu`,
      { mentions: [shooterJid] },
    );
  }

  shooterData.fun.pasangan = m.sender;
  shooterData.fun.becomePacar = Date.now();
  delete shooterData.fun.tembakTarget;
  myData.fun.pasangan = shooterJid;
  myData.fun.becomePacar = Date.now();

  if (!shooterData.fun.receiveCount) shooterData.fun.receiveCount = 0;
  shooterData.fun.receiveCount++;

  db.setUser(shooterJid, shooterData);
  db.setUser(m.sender, myData);

  const sessionToy = `${m.chat}_${m.sender}`;
  if (global.tembakSessions?.[sessionToy]) {
    delete global.tembakSessions[sessionToy];
  }

  const quote =
    celebrationQuotes[Math.floor(Math.random() * celebrationQuotes.length)];
  const dateStr = timeHelper.formatFull("dddd, DD MMMM YYYY");

  await m.react("💕");
  const ctx = getContextInfo("💕 *ᴊᴀᴅɪᴀɴ*", "Good!");
  ctx.mentionedJid = [m.sender, shooterJid];

  await m.reply(`💕 *WIDIHHHH, CIE CIE DITERIMA* @${shooterJid.split('@')[0]}\n\n` +
                `@${m.sender.split('@')[0]} and @${shooterJid.split('@')[0]} resmi pawayn\n\n` +
                `Hopefully lasting and bahagia 💍`, { mentions: [m.sender, shooterJid] })
}

module.exports = {
  config: pluginConfig,
  handler,
};
