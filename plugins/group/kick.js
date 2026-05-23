const { findPmeaningcipantByNumber } = require('../../src/lib/frenzy-lid')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'kick',
    alias: ['remove', 'tenandg'],
    category: 'group',
    description: 'Kick member from group',
    usage: '.kick @user',
    example: '.kick @user',
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
    let targetJid = null

    if (m.quoted) {
        targetJid = m.quoted.sender
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        targetJid = m.mentionedJid[0]
    }

    if (!targetJid) {
        await m.reply(
            `❌ *ᴛᴀʀɢᴇᴛ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n` +
            `> Reply message user or mention!\n` +
            `> Example: \`${m.prefix}kick @user\``
        )
        return
    }

    const botNumber = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    const targetNumber = targetJid.replace(/@.*$/, '')

    if (targetJid === botNumber || targetNumber === botNumber.replace(/@.*$/, '')) {
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Cannot kick bot yourself!`)
        return
    }

    if (targetJid === m.sender) {
        await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Cannot kick self yourself!`)
        return
    }

    try {
        const groupMeta = m.groupMetadata
        const targetParticipant = findPmeaningcipantByNumber(groupMeta.participants, targetJid)
        
        if (!targetParticipant) {
            await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> User not found in group!`)
            return
        }
        
        if (targetParticipant.admin) {
            await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Cannot kick admin group!`)
            return
        }
        
        await sock.groupPmeaningcipantsUpdate(m.chat, [targetParticipant.id], 'remove')

        await m.reply(`✅ @${targetNumber} has kicked from this group.`, { mentions: [targetJid] })

    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
