const axios = require("axios");
const crypto = require("crypto");
const config = require("../../config");
const { isLid, lidToJid } = require("../../src/lib/frenzy-lid");
const {
  hasFullAccess,
  getUserRole,
  VALID_SERVERS,
} = require("../../src/lib/frenzy-roles-cpanel");
const timeHelper = require("../../src/lib/frenzy-time");
const te = require('../../src/lib/frenzy-error')

const allCommands = VALID_SERVERS.map((v) => `cadmin${v}`);
const allAliases = VALID_SERVERS.map((v) => `createadmin${v}`);

const pluginConfig = {
  name: allCommands,
  alias: allAliases,
  category: "panel",
  description: "Create admin panel new (v1-v5)",
  usage: ".cadminv1 username or .cadminv2 username,628xxx",
  example: ".cadminv1 adminku,628xxx",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energy: 0,
  isEnabled: true,
};

function cleanJid(jid) {
  if (!jid) return null;
  if (isLid(jid)) jid = lidToJid(jid);
  return jid.includes("@") ? jid : jid + "@s.whatsapp.net";
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function formatDate() {
  return timeHelper.formatDateTime("D MMMM YYYY HH:mm");
}

function parseServerVersionon(cmd) {
  const match = cmd.match(/v([1-5])$/i);
  if (!match) return { server: "v1", serverToy: "s1" };
  return { server: "v" + match[1], serverToy: "s" + match[1] };
}

function getServerConfig(pteroConfig, serverToy) {
  const serverConfigs = {
    s1: pteroConfig.server1,
    s2: pteroConfig.server2,
    s3: pteroConfig.server3,
    s4: pteroConfig.server4,
    s5: pteroConfig.server5,
  };
  return serverConfigs[serverToy] || null;
}

function validateConfig(serverConfig) {
  const missing = [];
  if (!serverConfig?.domain) missing.push("domain");
  if (!serverConfig?.apikey) missing.push("apikey (PTLA)");
  return missing;
}

function getAvailableServers(pteroConfig) {
  const available = [];
  for (let i = 1; i <= 5; i++) {
    const cfg = pteroConfig[`server${i}`];
    if (cfg?.domain && cfg?.apikey) available.push(`v${i}`);
  }
  return available;
}

async function handler(m, { sock }) {
  const pteroConfig = config.pterodactyl;

  const { server: serverVersionon, serverToy } = parseServerVersionon(m.command);
  const serverLabel = serverVersionon.toUpperCase();

  if (!hasFullAccess(m.sender, serverVersionon, m.isOwner)) {
    const userRole = getUserRole(m.sender, serverVersionon);
    return m.reply(
      `❌ *ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ*\n\n` +
        `> You no punya access to *${serverLabel}*\n` +
        `> Role you: *${userRole || "No there is"}*`,
    );
  }

  const serverConfig = getServerConfig(pteroConfig, serverToy);
  const missingConfig = validateConfig(serverConfig);

  if (missingConfig.length > 0) {
    const available = getAvailableServers(pteroConfig);
    let txt = `⚠️ *sᴇʀᴠᴇʀ ${serverLabel} ʙᴇʟᴜᴍ ᴋᴏɴꜰɪɢ*\n\n`;
    if (available.length > 0) {
      txt += `> Server terseina: *${available.join(", ")}*\n`;
      txt += `> Example: \`${m.prefix}cadmin${available[0]} username\``;
    } else {
      txt += `> Isi in \`config.js\` bagian \`pterodactyl.server1\``;
    }
    return m.reply(txt);
  }

  let targetUser = null;
  let username = null;
  const args = m.text?.trim() || "";

  if (args.includes(",")) {
    const parts = args.split(",");
    username = parts[0]?.trim().toLowerCase();
    let number = parts[1]?.trim().replace(/[^0-9]/g, "");
    if (number) targetUser = number + "@s.whatsapp.net";
  } else if (args) {
    username = args.trim().toLowerCase();
  }

  if (!username) {
    const available = getAvailableServers(pteroConfig);
    return m.reply(
      `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
        `> \`${m.prefix}${m.command} username\`\n` +
        `> \`${m.prefix}${m.command} username,628xxx\`\n` +
        `> Reply/mention user\n\n` +
        `> Server terseina: *${available.join(", ") || "none"}*`,
    );
  }

  if (!/^[a-z0-9_]{3,16}$/.test(username)) {
    return m.reply(
      `❌ Username only may huruf toddler, angka, underscore (3-16 karakter).`,
    );
  }

  if (!targetUser) {
    if (m.quoted?.sender) {
      targetUser = cleanJid(m.quoted.sender);
    } else if (m.mentionedJid?.length > 0) {
      targetUser = cleanJid(m.mentionedJid[0]);
    } else {
      targetUser = cleanJid(m.sender);
    }
  }

  if (!targetUser) {
    return m.reply(`❌ Cannot menentukan number target.`);
  }

  try {
    const [onWa] = await sock.onWhatsApp(targetUser.split("@")[0]);
    if (!onWa?.exists) {
      return m.reply(
        `❌ Number \`${targetUser.split("@")[0]}\` no registered in WhatsApp!`,
      );
    }
  } catch (e) {}

  const email = `${username}@gmail.com`;
  const name = capitalize(username) + " Admin";
  const password = username + crypto.randomBytes(3).toString("hex");

  await m.reply(
    `🛠️ *ᴍᴇᴍʙᴜᴀᴛ ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ...*\n\n> Server: *${serverLabel}*\n> Username: \`${username}\`\n> Target: \`${targetUser.split("@")[0]}\``,
  );

  try {
    const userRes = await axios.post(
      `${serverConfig.domain}/api/application/users`,
      {
        email,
        username,
        first_name: name,
        last_name: "Admin",
        root_admin: true,
        language: "en",
        password,
      },
      {
        headers: {
          Authorization: `Bearer ${serverConfig.apikey}`,
          "Content-Type": "application/json",
          Accept: "Application/vnd.pterodactyl.v1+json",
        },
      },
    );

    const user = userRes.data.attributes;

    let detailTxt = `✅ *ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ ʙᴇʀʜᴀsɪʟ ᴅɪʙᴜᴀᴛ*\n\n`;
    detailTxt += `╭─「 📋 *ᴅᴇᴛᴀɪʟ ᴀᴋᴜɴ* 」\n`;
    detailTxt += `┃ 🖥️ \`sᴇʀᴠᴇʀ\`: *${serverLabel}*\n`;
    detailTxt += `┃ 🆔 \`ᴜsᴇʀ ɪᴅ\`: *${user.id}*\n`;
    detailTxt += `┃ 👤 \`ᴜsᴇʀɴᴀᴍᴇ\`: *${user.username}*\n`;
    detailTxt += `┃ 🔐 \`ᴘᴀssᴡᴏʀᴅ\`: *${password}*\n`;
    detailTxt += `┃ 👑 \`sᴛᴀᴛᴜs\`: *Root Admin*\n`;
    detailTxt += `┃ 🗓️ \`ᴛᴀɴɢɢᴀʟ\`: *${formatDate()}*\n`;
    detailTxt += `╰───────────────\n\n`;
    detailTxt += `🌐 *ʟᴏɢɪɴ ᴘᴀɴᴇʟ:* ${serverConfig.domain}\n\n`;
    detailTxt += `> ⚠️ This has full access!\n`;
    detailTxt += `> ⚠️ Don't share to anyone!`;

    await sock.sendMessage(targetUser, { text: detailTxt });

    if (targetUser !== m.sender) {
      await m.reply(
        `✅ *ᴀᴅᴍɪɴ ᴘᴀɴᴇʟ ʙᴇʀʜᴀsɪʟ ᴅɪʙᴜᴀᴛ*\n\n> Server: *${serverLabel}*\n> Data has sent to \`${targetUser.split("@")[0]}\``,
      );
    }
  } catch (err) {
    return m.reply(te(m.prefix, m.command, m.pushName))
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
