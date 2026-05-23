const axios = require("axios");
const config = require("../../config");
const timeHelper = require("../../src/lib/frenzy-time");
const te = require('../../src/lib/frenzy-error')

const NEOXR_APIKEY = config.APIkey?.neoxr || "Milik-Bot-OurinMD";

const pluginConfig = {
  name: "inscordstalk",
  alias: ["dcstalk", "dsstalk", "stalkdc", "stalkinscord"],
  category: "staltor",
  description: "Stalk In Inscord berdasarkan User ID",
  usage: ".inscordstalk <userid>",
  example: ".inscordstalk 297574907510784000",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energy: 1,
  isEnabled: true,
};

async function handler(m, { sock }) {
  const userId = m.args[0]?.trim();

  if (!userId) {
    return m.reply(
      `🎮 *ᴅɪsᴄᴏʀᴅ sᴛᴀʟᴋ*\n\n` +
        `> Enter Inscord User ID\n\n` +
        `\`Example: ${m.prefix}inscordstalk 297574907510784000\``,
    );
  }

  if (!/^\d+$/.test(userId)) {
    return m.reply(`❌ User ID must a number between. Example: 297574907510784000`);
  }

  m.react("🔍");

  try {
    const res = await axios.get(
      `https://api.neoxr.eu/api/dcstalk?id=${userId}&apikey=${NEOXR_APIKEY}`,
      {
        timeout: 30000,
      },
    );

    if (!res.data?.status || !res.data?.data) {
      m.react("❌");
      return m.reply(`❌ User ID *${userId}* not found`);
    }

    const d = res.data.data;

    const createdDate = d.created_at
      ? timeHelper.fromTimestamp(d.created_at, "D MMMM YYYY")
      : "-";

    const caption =
      `🎮 *ᴅɪsᴄᴏʀᴅ sᴛᴀʟᴋ*\n\n` +
      `👤 *Username:* ${d.username || "-"}\n` +
      `📛 *Insplay Name:* ${d.global_name || "-"}\n` +
      `🔢 *Inscriminator:* #${d.inscriminator || "0"}\n` +
      `🆔 *User ID:* ${d.id}\n\n` +
      `📅 *Increate:* ${createdDate}\n\n` +
      `> _Inscord User Lookup_`;

    m.react("✅");

    if (d.avatar_url) {
      await sock.sendMessage(
        m.chat,
        {
          image: { url: d.avatar_url },
          caption,
        },
        { quoted: m },
      );
    } else {
      await m.reply(caption);
    }
  } catch (error) {
    m.react('☢');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
