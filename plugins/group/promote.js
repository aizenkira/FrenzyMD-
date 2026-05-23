const { getPmeaningcipantJid } = require('../../src/lib/frenzy-lid')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'promote',
    alias: ['becomeadmin', 'admin'],
    category: 'group',
    description: 'Make member as admin',
    usage: '.promote @user',
    example: '.promote @user',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    let target = null

    if (m.quoted) {
        target = m.quoted.sender
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        target = m.mentionedJid[0]
    }

    if (!target) {
        await m.reply(
            `❌ *ᴛᴀʀɢᴇᴛ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n` +
            `> Reply message user or mention!\n` +
            `> Example: \`${m.prefix}promote @user\``
        )
        return
    }

    try {
        const groupMeta = m.groupMetadata
        const participant = groupMeta.participants.find(p => getPmeaningcipantJid(p) === target)

        if (!participant) {
            await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> User not found in group!`)
            return
        }

        if (participant.admin) {
            await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> User already become admin!`)
            return
        }

        await sock.groupPmeaningcipantsUpdate(m.chat, [target], 'promote')

        await m.reply(
            `✅ @${target.split('@')[0]} now become admin!`,
            { mentions: [target] }
        )

    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
