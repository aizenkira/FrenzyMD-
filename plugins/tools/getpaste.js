const axios = require("axios");
const timeHelper = require("../../src/lib/frenzy-time");
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
  name: "getpaste",
  alias: ["pastebin", "getpb"],
  category: "tools",
  description: "Fetch content from Pastebin",
  usage: ".getpaste <link pastebin>",
  example: ".getpaste https://pastebin.com/Gu8RZaqv",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energy: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const text = m.text?.trim();

  if (!text || !text.includes("pastebin.com")) {
    return m.reply(
      `📋 *ɢᴇᴛ ᴘᴀsᴛᴇʙɪɴ*\n\n` +
        `> Enter link Pastebin that is valid\n\n` +
        `> Example: \`${m.prefix}getpaste https://pastebin.com/Gu8RZaqv\``,
    );
  }

  m.react("📋");

  try {
    const apiUrl = `https://zelapioffciall.koyeb.app/tools/pastebin?url=${encodeURIComponent(text)}`;
    const { data } = await axios.get(apiUrl, { timeout: 15000 });

    if (!data.status || !data.content) {
      throw new Error("Failed fetch content from link the said.");
    }

    const lineCount = data.content.split("\n").length;
    const timestamp = timeHelper.formatDateTime("DD MMMM YYYY HH:mm:ss");

    const caption =
      `📋 *ᴋᴏɴᴛᴇɴ ᴘᴀsᴛᴇʙɪɴ*\n\n` +
      `> 🕹 ID: ${data.paste_id || "Unknown"}\n` +
      `> 📆 Time: ${timestamp}\n` +
      `> 📝 Amount Baris: ${lineCount}\n\n` +
      `\`\`\`\n${data.content.substring(0, 3000)}${data.content.length > 3000 ? "\n... (terpotong)" : ""}\n\`\`\``;

    await m.reply(caption);
    m.react("✅");
  } catch (err) {
    m.react('☢');
    m.reply(te(m.prefix, m.command, m.pushName))
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
