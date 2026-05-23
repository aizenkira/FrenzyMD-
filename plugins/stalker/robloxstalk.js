const axios = require("axios");
const config = require("../../config");
const timeHelper = require("../../src/lib/frenzy-time");
const te = require('../../src/lib/frenzy-error')

const NEOXR_APIKEY = config.APIkey?.neoxr || "Milik-Bot-OurinMD";

const pluginConfig = {
  name: "robloxstalk",
  alias: ["rblxstalk", "rbxstalk", "stalkroblox", "stalkrbx"],
  category: "staltor",
  description: "Stalk In Roblox berdasarkan username",
  usage: ".robloxstalk <username>",
  example: ".robloxstalk Linkmon99",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 10,
  energy: 1,
  isEnabled: true,
};

function shortNum(num) {
  if (!num) return "0";
  num = parseInt(num);
  if (num >= 1_000_000_000)
    return (num / 1_000_000_000).toFixed(1).replace(".0", "") + "B";
  if (num >= 1_000_000)
    return (num / 1_000_000).toFixed(1).replace(".0", "") + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1).replace(".0", "") + "K";
  return num.toString();
}

async function handler(m, { sock }) {
  const username = m.args[0]?.trim();

  if (!username) {
    return m.reply(
      `🎮 *ʀᴏʙʟᴏx sᴛᴀʟᴋ*\n\n` +
        `> Enter username Roblox\n\n` +
        `\`Example: ${m.prefix}robloxstalk Linkmon99\``,
    );
  }

  m.react("🔍");

  try {
    const res = await axios.get(
      `https://api.neoxr.eu/api/roblox-stalk?username=${encodeURIComponent(username)}&apikey=${NEOXR_APIKEY}`,
      {
        timeout: 30000,
      },
    );

    if (!res.data?.status || !res.data?.data) {
      m.react("❌");
      return m.reply(`❌ Username *${username}* not found`);
    }

    const d = res.data.data;

    const createdDate = d.created
      ? timeHelper.fromTimestamp(d.created, "D MMMM YYYY")
      : "-";

    const badgesCount = d.badges?.length || 0;
    const gamesCount = d.games?.length || 0;

    const topGames =
      d.games
        ?.slice(0, 3)
        .map((g) => `  ◦ ${g.name} (${shortNum(g.placeVisits)} visits)`)
        .join("\n") || "  ◦ No there is";

    const caption =
      `🎮 *ʀᴏʙʟᴏx sᴛᴀʟᴋ*\n\n` +
      `👤 *Username:* ${d.name || "-"}\n` +
      `📛 *Insplay Name:* ${d.insplayName || "-"}\n` +
      `🆔 *User ID:* ${d.id || "-"}\n` +
      `✅ *Verified:* ${d.hasVerifiedBadge ? "Yes" : "No"}\n` +
      `🚫 *Banned:* ${d.isBanned ? "Yes" : "No"}\n\n` +
      `👥 *Friends:* ${shortNum(d.friends)}\n` +
      `👤 *Followers:* ${shortNum(d.followers)}\n` +
      `➕ *Following:* ${shortNum(d.followings)}\n\n` +
      `🏆 *Badges:* ${badgesCount}\n` +
      `🎮 *Games:* ${gamesCount}\n\n` +
      `📝 *Bio:*\n${d.description?.substring(0, 200) || "-"}\n\n` +
      `🎮 *Top Games:*\n${topGames}\n\n` +
      `📅 *Bergabung:* ${createdDate}\n\n` +
      `🔗 https://roblox.com/users/${d.id}/profile`;

    m.react("✅");

    if (d.avatar) {
      await sock.sendMessage(
        m.chat,
        {
          image: { url: d.avatar },
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
