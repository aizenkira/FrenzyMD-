const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: ['block', 'block'],
    alias: [],
    category: 'owner',
    description: 'Block WhatsApp number',
    usage: '.block <number/reply/mention>',
    example: '.block 628xxx',
    isOwner: true,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    let targetJid = null

    if (m.mentionedJid?.length > 0) {
        targetJid = m.mentionedJid[0]
    } else if (m.quoted) {
        targetJid = m.quoted.sender || m.quoted.participant
    } else if (m.args[0]) {
        let num = m.args[0].replace(/[^0-9]/g, '')
        if (!num) return m.reply('❌ Number no valid.')
        targetJid = num + '@s.whatsapp.net'
    } else if (!m.isGroup) {
        targetJid = m.chat
    }

    if (!targetJid) {
        return m.reply(
            '⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n' +
            '> `.block 628xxx` — Block via number\n' +
            '> `.block` (reply message) — Block the sender\n' +
            '> `.block @mention` — Block the mentioned user\n' +
            '> `.block` (in private chat chat) — Block this user'
        )
    }

    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    if (targetJid === botJid) {
        return m.reply('❌ Cannot block number bot yourself.')
    }

    try {
        await sock.updateBlockStatus(targetJid, 'block')
        m.react('🚫')
        return m.reply(
            `🚫 *ɴᴏᴍᴏʀ ᴅɪʙʟᴏᴋɪʀ*\n\n` +
            `> Target: @${targetJid.split('@')[0]}\n` +
            `> Usage \`.unblock\` for unblock`,
            { mentions: [targetJid] }
        )
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
