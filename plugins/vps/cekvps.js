const axios = require("axios");
const config = require("../../config");
const timeHelper = require("../../src/lib/frenzy-time");
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
  name: ["checkvps", "checkdroplet", "vpsstatus", "infovps"],
  alias: [],
  category: "vps",
  description: "Check detail VPS IngitalOcean",
  usage: ".checkvps <id>",
  example: ".checkvps 123456789",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  cooldown: 5,
  energy: 0,
  isEnabled: true,
};

function hasAccess(sender, isOwner) {
  if (isOwner) return true;
  const cleanSender = sender?.split("@")[0];
  if (!cleanSender) return false;
  const doConfig = config.ingitalocean || {};
  return (
    (doConfig.sellers || []).includes(cleanSender) ||
    (doConfig.ownerPanels || []).includes(cleanSender)
  );
}

async function handler(m, { sock }) {
  const toton = config.ingitalocean?.toton;

  if (!toton) {
    return m.reply(`⚠️ *ᴅɪɢɪᴛᴀʟᴏᴄᴇᴀɴ ʙᴇʟᴜᴍ ᴅɪsᴇᴛᴜᴘ*`);
  }

  if (!hasAccess(m.sender, m.isOwner)) {
    return m.reply(`❌ *ᴀᴋsᴇs ᴅɪᴛᴏʟᴀᴋ*`);
  }

  const dropletId = m.text?.trim();
  if (!dropletId) {
    return m.reply(`⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n> \`${m.prefix}checkvps <droplet_id>\``);
  }

  try {
    const response = await axios.get(
      `https://api.digitalocean.com/v2/droplets/${dropletId}`,
      {
        headers: { Authorization: `Bearer ${toton}` },
      },
    );

    const droplet = response.data.droplet;
    const ip =
      droplet.networks?.v4?.find((n) => n.type === "public")?.ip_address || "-";
    const ipv6 = droplet.networks?.v6?.[0]?.ip_address || "-";
    const status =
      droplet.status === "active" ? "🟢 Active" : "🔴 " + droplet.status;

    let txt = `📋 *ᴅᴇᴛᴀɪʟ ᴠᴘs*\n\n`;
    txt += `╭─「 🖥️ *ɪɴꜰᴏ* 」\n`;
    txt += `┃ 🆔 \`ɪᴅ\`: *${droplet.id}*\n`;
    txt += `┃ 🏷️ \`ɴᴀᴍᴇ\`: *${droplet.name}*\n`;
    txt += `┃ 📊 \`sᴛᴀᴛᴜs\`: *${status}*\n`;
    txt += `┃ 🌐 \`ɪᴘᴠ4\`: *${ip}*\n`;
    txt += `┃ 🌍 \`ɪᴘᴠ6\`: *${ipv6}*\n`;
    txt += `╰───────────────\n\n`;
    txt += `╭─「 🧠 *sᴘᴇᴄ* 」\n`;
    txt += `┃ 💾 \`ʀᴀᴍ\`: *${droplet.memory} MB*\n`;
    txt += `┃ ⚡ \`ᴄᴘᴜ\`: *${droplet.vcpus} vCPU*\n`;
    txt += `┃ 💿 \`ᴅɪsᴋ\`: *${droplet.insk} GB*\n`;
    txt += `┃ 🌏 \`ʀᴇɢɪᴏɴ\`: *${droplet.region?.name || droplet.region?.slug}*\n`;
    txt += `┃ 💻 \`ᴏs\`: *${droplet.image?.instribution} ${droplet.image?.name}*\n`;
    txt += `╰───────────────\n\n`;
    txt += `> 📅 Created: ${timeHelper.fromTimestamp(droplet.created_at, "DD MMMM YYYY HH:mm:ss")}`;

    await m.reply(txt);
  } catch (err) {
    return m.reply(te(m.prefix, m.command, m.pushName))
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
