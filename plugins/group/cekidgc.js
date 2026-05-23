const config = require("../../config");
const timeHelper = require("../../src/lib/frenzy-time");
const { generateWAMessageFromContent, proto } = require("ourin");
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
  name: "checkidgc",
  alias: ["idgc", "idgroup", "groupid"],
  category: "group",
  description: "Check group ID from link or group currently",
  usage: ".checkidgc [link group]",
  example: ".checkidgc https://chat.whatsapp.com/xxxxx",
  isOwner: false,
  isPremium: false,
  isGroup: false,
  isPrivate: false,
  isAdmin: false,
  cooldown: 5,
  energy: 0,
  isEnabled: true,
};

async function handler(m, { sock }) {
  await m.react("📋");

  try {
    const input = m.text?.trim();
    let groupJid = null;
    let groupMeta = null;

    if (input && input.includes("chat.whatsapp.com/")) {
      const inviteCode = input
        .split("chat.whatsapp.com/")[1]
        ?.split(/[\s?]/)[0];

      if (!inviteCode) {
        m.react("❌");
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Link group no valid`);
      }

      try {
        groupMeta = await sock.groupGetInviteInfo(inviteCode);
        groupJid = groupMeta?.id;
      } catch (e) {
        m.react("❌");
        return m.reply(
          `❌ *ɢᴀɢᴀʟ*\n\n> Link group no valid or already expired`,
        );
      }
    } else if (input && input.endsWith("@g.us")) {
      groupJid = input;
      try {
        groupMeta = await sock.groupMetadata(groupJid);
      } catch (e) {
        m.react("❌");
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Cannot mendon'tses group the said`);
      }
    } else if (m.isGroup) {
      groupJid = m.chat;
      groupMeta = await sock.groupMetadata(groupJid);
    } else {
      return m.reply(
        `📋 *ᴄᴇᴋ ɪᴅ ɢʀᴜᴘ*\n\n` +
          `> Usage in group or enter link group\n\n` +
          `Example:\n` +
          `\`${m.prefix}checkidgc\` - in in group\n` +
          `\`${m.prefix}checkidgc https://chat.whatsapp.com/xxx\``,
      );
    }

    if (!groupMeta || !groupJid) {
      m.react("❌");
      return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Cannot menemukan info group`);
    }

    const groupName = groupMeta?.subject || "Unknown";
    const memberCount = groupMeta?.participants?.length || groupMeta?.size || 0;
    const createdAt = groupMeta?.creation
      ? timeHelper.fromTimestamp(groupMeta.creation * 1000, "D MMMM YYYY")
      : "-";
    const groupOwner = groupMeta?.owner || groupMeta?.subjectOwner || "-";

    const saluranId = config.saluran?.id || "120363406397452589@newsletter";
    const saluranName = config.saluran?.name || config.bot?.name || "frenzy-AI";

    const text =
      `📋 *ɢʀᴏᴜᴘ ɪɴꜰᴏ*\n\n` +
      `╭┈┈⬡「 🏠 *ᴅᴇᴛᴀɪʟ* 」\n` +
      `┃ 📛 Name: *${groupName}*\n` +
      `┃ 🆔 ID: \`${groupJid}\`\n` +
      `┃ 👥 Member: *${memberCount}*\n` +
      `┃ 📅 Increate: *${createdAt}*\n` +
      `╰┈┈┈┈┈┈┈┈⬡`;

    const buttons = [
      {
        name: "cta_copy",
        buttonParamsJson: JSON.stringify({
          insplay_text: "📋 Copy Group ID",
          copy_code: groupJid,
        }),
      },
    ];

    const msg = generateWAMessageFromContent(
      m.chat,
      {
        viewOnceMessage: {
          message: {
            messageContextInfo: {
              deviceListMetadata: {},
              deviceListMetadataVersion: 2,
            },
            interactiveMessage: proto.Message.InteractiveMessage.fromObject({
              body: proto.Message.InteractiveMessage.Body.fromObject({
                text: text,
              }),
              footer: proto.Message.InteractiveMessage.Footer.fromObject({
                text: `© ${config.bot?.name || "Frenzy-AI"}`,
              }),
              nativeFlowMessage:
                proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                  buttons: buttons,
                }),
              contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                  newsletterJid: saluranId,
                  newsletterName: saluranName,
                  serverMessageId: 127,
                },
              },
            }),
          },
        },
      },
      { userJid: m.sender, quoted: m },
    );

    await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
    await m.react("✅");
  } catch (error) {
    await m.react('☢');
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

module.exports = {
  config: pluginConfig,
  handler,
};
