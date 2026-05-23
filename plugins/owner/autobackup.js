const {
  enableAutoBackup,
  insableAutoBackup,
  getBackupStatus,
  triggerManualBackup,
  formatInterval,
} = require("../../src/lib/frenzy-auto-backup");
const timeHelper = require("../../src/lib/frenzy-time");
const config = require("../../config");
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
  name: "autobackup",
  alias: ["backup", "ab"],
  category: "owner",
  description: "Tolola system auto backup",
  usage: ".autobackup <on/off/status/now> [interval]",
  example: ".autobackup on 5h",
  isOwner: true,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energy: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const args = m.text?.trim().split(/\s+/) || [];
  const action = args[0]?.toLowerCase();

  if (!action) {
    const status = getBackupStatus();
    const ownerNum = config.owner?.number?.[0] || "No inset";

    let txt = `🗂️ *ᴀᴜᴛᴏ ʙᴀᴄᴋᴜᴘ sʏsᴛᴇᴍ*\n\n`;
    txt += `╭┈┈⬡「 📊 *sᴛᴀᴛᴜs* 」\n`;
    txt += `┃ 🔘 Status: ${status.enabled ? "✅ *ON*" : "❌ *OFF*"}\n`;
    txt += `┃ ⏱️ Interval: ${status.interval}\n`;
    txt += `┃ 📅 Last Backup: ${status.lastBackup ? timeHelper.fromTimestamp(status.lastBackup, "DD MMMM YYYY HH:mm:ss") : "-"}\n`;
    txt += `┃ #️⃣ Total: ${status.backupCount} backup\n`;
    txt += `┃ 📤 Insend to: ${ownerNum}\n`;
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`;

    txt += `*ᴄᴀʀᴀ ᴘᴀᴋᴀɪ:*\n`;
    txt += `> \`${m.prefix}autobackup on <interval>\`\n`;
    txt += `> \`${m.prefix}autobackup off\`\n`;
    txt += `> \`${m.prefix}autobackup status\`\n`;
    txt += `> \`${m.prefix}autobackup now\`\n\n`;

    txt += `*ꜰᴏʀᴍᴀᴛ ɪɴᴛᴇʀᴠᴀʟ:*\n`;
    txt += `> • \`5m\` = 5 minute\n`;
    txt += `> • \`1h\` = 1 hour\n`;
    txt += `> • \`6h\` = 6 hour\n`;
    txt += `> • \`1d\` = 1 day\n\n`;

    txt += `*ᴄᴏɴᴛᴏʜ:*\n`;
    txt += `> \`${m.prefix}autobackup on 6h\` - backup every 6 hour`;

    return m.reply(txt);
  }

  switch (action) {
    case "on":
    case "enable":
    case "start": {
      const interval = args[1];

      if (!interval) {
        return m.reply(
          `⚠️ *ɪɴᴛᴇʀᴠᴀʟ ᴅɪʙᴜᴛᴜʜᴋᴀɴ*\n\n` +
            `> \`${m.prefix}autobackup on <interval>\`\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> \`${m.prefix}autobackup on 30m\` - tiap 30 minute\n` +
            `> \`${m.prefix}autobackup on 6h\` - tiap 6 hour\n` +
            `> \`${m.prefix}autobackup on 1d\` - tiap 1 day`,
        );
      }

      const result = enableAutoBackup(interval, sock);

      if (!result.success) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.error}`);
      }

      const ownerNum = config.owner?.number?.[0] || "Owner #1";

      m.react("✅");
      return m.reply(
        `✅ *ᴀᴜᴛᴏ ʙᴀᴄᴋᴜᴘ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ*\n\n` +
          `╭┈┈⬡「 ⚙️ *sᴇᴛᴛɪɴɢs* 」\n` +
          `┃ ⏱️ Interval: ${result.interval}\n` +
          `┃ 📤 Insend to: ${ownerNum}\n` +
          `┃ 📦 Exclude: node_modules, .git, storages, dll\n` +
          `╰┈┈┈┈┈┈┈┈⬡\n\n` +
          `> Backup first will sent in ${result.interval}`,
      );
    }

    case "off":
    case "insable":
    case "stop": {
      insableAutoBackup();

      m.react("✅");
      return m.reply(
        `❌ *ᴀᴜᴛᴏ ʙᴀᴄᴋᴜᴘ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ*\n\n` +
          `> Backup otodeads already inhentikan.\n` +
          `> Usage \`${m.prefix}autobackup on <interval>\` for activate again.`,
      );
    }

    case "status":
    case "info": {
      const status = getBackupStatus();
      const ownerNum = config.owner?.number?.[0] || "No inset";

      let txt = `🗂️ *sᴛᴀᴛᴜs ᴀᴜᴛᴏ ʙᴀᴄᴋᴜᴘ*\n\n`;
      txt += `╭┈┈⬡「 📊 *ɪɴꜰᴏ* 」\n`;
      txt += `┃ 🔘 Enabled: ${status.enabled ? "✅ Yes" : "❌ No"}\n`;
      txt += `┃ ⏱️ Interval: ${status.interval}\n`;
      txt += `┃ 🔄 Running: ${status.isRunning ? "✅ Yes" : "❌ No"}\n`;
      txt += `┃ 📅 Last: ${status.lastBackup ? timeHelper.fromTimestamp(status.lastBackup, "DD MMMM YYYY HH:mm:ss") : "-"}\n`;
      txt += `┃ #️⃣ Total: ${status.backupCount} backup\n`;
      txt += `┃ 📤 Target: ${ownerNum}\n`;
      txt += `╰┈┈┈┈┈┈┈┈⬡`;

      return m.reply(txt);
    }

    case "now":
    case "manual":
    case "trigger": {
      m.react("🕕");
      await m.reply(
        `🕕 *CREATING BACKUP...*\n\n> Please wait, currently creating backup...`,
      );

      try {
        await triggerManualBackup(sock);
        m.react("✅");
        return m.reply(
          `✅ *ʙᴀᴄᴋᴜᴘ sᴇʟᴇsᴀɪ*\n\n> Backup has sent to owner!`,
        );
      } catch (error) {
        m.react('☢');
        m.reply(te(m.prefix, m.command, m.pushName));
      }
    }

    default:
      return m.reply(
        `⚠️ *ᴀᴄᴛɪᴏɴ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n` +
          `> Choose: \`on\`, \`off\`, \`status\`, or \`now\`\n` +
          `> Example: \`${m.prefix}autobackup on 6h\``,
      );
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
