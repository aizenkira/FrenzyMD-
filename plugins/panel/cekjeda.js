const { getDatabase } = require("../../src/lib/frenzy-database");
const {
  hasAccessToServer,
  VALID_SERVERS,
} = require("../../src/lib/frenzy-roles-cpanel");
const timeHelper = require("../../src/lib/frenzy-time");

const DEFAULT_JEDA = 5 * 60 * 1000;

const pluginConfig = {
  name: "checkdelay",
  alias: ["delaystatus", "statusdelay"],
  category: "panel",
  description: "Check status delay panel create",
  usage: ".checkdelay",
  example: ".checkdelay",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 3,
  energy: 0,
  isEnabled: true,
};

function formatTime(ms) {
  if (ms <= 0) return "0 second";

  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0)
    return `${hours} hour ${minutes % 60} minute ${seconds % 60} second`;
  if (minutes > 0) return `${minutes} minute ${seconds % 60} second`;
  return `${seconds} second`;
}

async function handler(m, { sock }) {
  const hasAccess = VALID_SERVERS.some((server) =>
    hasAccessToServer(m.sender, server, m.isOwner),
  );

  if (!hasAccess && !m.isOwner) {
    return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> You don't have access to CPanel!`);
  }

  const db = getDatabase();
  const delayMs = db.setting("panelCreateDelay") ?? DEFAULT_JEDA;
  const lastUsed = db.setting("panelCreateLastUsed") || 0;
  const now = Date.now();
  const elapsed = now - lastUsed;
  const remaining = Math.max(0, delayMs - elapsed);

  let status = "✅ *READY*";
  let statusDesc = "Can create panel now!";

  if (delayMs === 0) {
    status = "⚡ *NO JEDA*";
    statusDesc = "Delay innonactivekan, bebas create!";
  } else if (remaining > 0) {
    status = "🕕 *COOLDOWN*";
    statusDesc = `Wait ${formatTime(remaining)} again`;
  }

  let text = `⏱️ *sᴛᴀᴛᴜs ᴊᴇᴅᴀ ᴘᴀɴᴇʟ*\n\n`;
  text += `╭┈┈⬡「 📊 *sᴛᴀᴛᴜs* 」\n`;
  text += `┃ ${status}\n`;
  text += `┃ ${statusDesc}\n`;
  text += `╰┈┈⬡\n\n`;

  text += `╭┈┈⬡「 ⚙️ *ᴋᴏɴꜰɪɢ* 」\n`;
  text += `┃ ◦ Delay: *${delayMs === 0 ? "OFF" : formatTime(delayMs)}*\n`;
  text += `┃ ◦ Default: *5 minute*\n`;

  if (lastUsed > 0) {
    const lastUsedTime = timeHelper.fromTimestamp(lastUsed, "HH:mm:ss");
    text += `┃ ◦ Last create: *${lastUsedTime}*\n`;
  }

  if (remaining > 0) {
    text += `┃ ◦ Sisa: *${formatTime(remaining)}*\n`;
  }

  text += `╰┈┈⬡\n\n`;

  if (m.isOwner) {
    text += `> _Owner: usage \`${m.prefix}delaycreate\` for setting_`;
  }

  return m.reply(text);
}

module.exports = {
  config: pluginConfig,
  handler,
};
