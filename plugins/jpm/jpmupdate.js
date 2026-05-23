const { getDatabase } = require("../../src/lib/frenzy-database");
const timeHelper = require("../../src/lib/frenzy-time");
const { fetchGroupsSafe } = require("../../src/lib/frenzy-jpm-helper");
const config = require("../../config");
const fs = require("fs");
const te = require('../../src/lib/frenzy-error')

let cachedThumb = null;
try {
  if (fs.existsSync("./assets/images/frenzy.jpg")) {
    cachedThumb = fs.readFileSync("./assets/images/frenzy.jpg");
  }
} catch (e) {}

const pluginConfig = {
  name: "jpmupdate",
  alias: ["updatejpm", "broadcastupdate", "shareupdate"],
  category: "jpm",
  description: "Send update/changelog to all group",
  usage: ".jpmupdate <version> | <changelog>",
  example: ".jpmupdate v2.0 | Feature new:\\n- Quiz Battle\\n- Confession",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 60,
  energy: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const db = getDatabase();

  if (global.statusjpm) {
    return m.reply(
      `❌ *ɢᴀɢᴀʟ*\n\n> JPM currently running. Type \`${m.prefix}stopjpm\` for menghentikan.`,
    );
  }

  let input = m.text?.trim();

  if (!input) {
    return m.reply(
      `📢 *JPM UPDATE (PENGUMUMAN)*\n\n` +
        `Send information update / changelog to seluruh group!\n\n` +
        `*FORMAT PENGGUNAAN:*\n` +
        `• \`.jpmupdate <version> | <isi changelog>\`\n\n` +
        `*CONTOH:*\n` +
        `> \`.jpmupdate v3.0 | ✨ Feature New:\\n- JPM Hidetag\\n- System AFK New\\n- Pergoodan bug system\`\n\n` +
        `_(Note: Usage \\n for create a new line/enter)_`
    );
  }

  let versionon = config.bot?.versionon || "v1.0";
  let changelog = input;

  if (input.includes("|")) {
    const parts = input.split("|");
    versionon = parts[0].trim();
    changelog = parts.slice(1).join("|").trim();
  }

  if (!changelog) {
    return m.reply(`❌ Changelog no may empty!`);
  }

  await m.react("🕕");

  try {
    const allGroups = await fetchGroupsSafe(sock);
    let groupIds = Object.keys(allGroups);

    const blacklist = db.setting("jpmBlacklist") || [];
    const blacklistedCount = groupIds.filter((id) =>
      blacklist.includes(id),
    ).length;
    groupIds = groupIds.filter((id) => !blacklist.includes(id));

    if (groupIds.length === 0) {
      await m.react("❌");
      return m.reply(
        `❌ *ɢᴀɢᴀʟ*\n\n> No there is group that intemukan${blacklistedCount > 0 ? ` (${blacklistedCount} group in-blacklist)` : ""}`,
      );
    }

    const delayJpm = db.setting("delayJpm") || 5000;
    const botName = config.bot?.name || "Frenzy-AI";
    const saluranId = config.saluran?.id || "120363406397452589@newsletter";
    const saluranName = config.saluran?.name || botName;

    const dateStr = timeHelper.formatDate("DD MMMM YYYY");

    const updateMessage =
      `🚀 *UPDATE !! | ${versionon}*\n\n` +
      `📅 *Date:* ${dateStr}\n\n` +
      `*CHANGELOG:*\n` +
      `${changelog}\n\n` +
      `*CATATAN TERBARU:*\n` +
      `> 💡 Type *${m.prefix}menu* for mengeksplorasi feature-feature this.\n` +
      `> 📢 _Thank you has use ${botName}_`;

    await m.reply(
      `📢 *ᴊᴘᴍ ᴜᴘᴅᴀᴛᴇ*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 🏷️ ᴠᴇʀsɪ: \`${versionon}\`\n` +
        `┃ 👥 ᴛᴀʀɢᴇᴛ: \`${groupIds.length}\` group\n` +
        `┃ ⏱️ ᴊᴇᴅᴀ: \`${delayJpm}ms\`\n` +
        `┃ 📊 ᴇsᴛɪᴍᴀsɪ: \`${Math.ceil((groupIds.length * delayJpm) / 60000)} minute\`\n` +
        `╰┈┈⬡\n\n` +
        `> Mestart broadcast update...`,
    );

    global.statusjpm = true;
    let successCount = 0;
    let failedCount = 0;

    for (const groupId of groupIds) {
      if (global.stopjpm) {
        delete global.stopjpm;
        delete global.statusjpm;

        await m.reply(
          `⏹️ *ᴊᴘᴍ ᴜᴘᴅᴀᴛᴇ ᴅɪʜᴇɴᴛɪᴋᴀɴ*\n\n` +
            `> ✅ Success: \`${successCount}\`\n` +
            `> ❌ Failed: \`${failedCount}\`\n` +
            `> ⏸️ Sisa: \`${groupIds.length - successCount - failedCount}\``,
        );
        return;
      }

      try {
        await sock.sendMessage(groupId, {
          text: updateMessage,
          contextInfo: {
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: saluranId,
              newsletterName: saluranName,
              serverMessageId: 127,
            },
            externalAdReply: cachedThumb
              ? {
                  title: `📢 PENGUMUMAN UPDATE`,
                  body: `Version System: ${versionon}`,
                  thumbnail: cachedThumb,
                  sourceUrl: config.saluran?.link || "",
                  contentType: 1,
                  renderLargerThumbnail: true,
                }
              : undefined,
          },
        });
        successCount++;
      } catch {
        failedCount++;
      }

      await new Promise((resolve) => setTimeout(resolve, delayJpm));
    }

    global.statusjpm = false;
    global.stopjpm = false;

    await m.react("✅");
    await m.reply(
      `✅ *ᴊᴘᴍ ᴜᴘᴅᴀᴛᴇ sᴇʟᴇsᴀɪ!*\n\n` +
        `╭┈┈⬡「 📊 *ʀᴇsᴜʟᴛ* 」\n` +
        `┃ ✅ Success: ${successCount}\n` +
        `┃ ❌ Failed: ${failedCount}\n` +
        `┃ 📊 Total: ${groupIds.length}\n` +
        `╰┈┈┈┈┈┈┈┈⬡`,
    );
  } catch (error) {
    global.statusjpm = false;
    global.stopjpm = false;
    await m.react('☢');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
