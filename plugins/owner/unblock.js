const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: ['unblock', 'unblocknumber'],
    alias: [],
    category: 'owner',
    description: 'Buka block number WhatsApp',
    usage: '.unblock <number/reply/mention>',
    example: '.unblock 628xxx',
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
            '> `.unblock 628xxx` — Unblock via number\n' +
            '> `.unblock` (reply message) — Unblock pengirim\n' +
            '> `.unblock @mention` — Unblock that in-mention\n' +
            '> `.unblock` (in private chat chat) — Unblock user this'
        )
    }

    try {
        await sock.updateBlockStatus(targetJid, 'unblock')
        m.react('✅')
        return m.reply(
            `✅ *ɴᴏᴍᴏʀ ᴅɪ-ᴜɴʙʟᴏᴄᴋ*\n\n` +
            `> Target: @${targetJid.split('@')[0]}`,
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
