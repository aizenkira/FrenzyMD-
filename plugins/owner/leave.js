const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'leave',
    alias: ['leavegroup', 'leavegroup', 'leave', 'bye'],
    category: 'owner',
    description: 'Bot leave from group',
    usage: '.leave [link]',
    example: '.leave',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

function extractInviteCode(text) {
    const patterns = [
        /chat\.whatsapp\.com\/([a-zA-Z0-9]{20,})/i,
        /wa\.me\/([a-zA-Z0-9]{20,})/i
    ]
    
    for (const pattern of patterns) {
        const match = text.match(pattern)
        if (match) return match[1]
    }
    
    return null
}

async function handler(m, { sock }) {
    const input = m.args.join(' ').trim()
    
    let targetGroupJid = null
    let groupName = ''
    
    if (!input && m.isGroup) {
        targetGroupJid = m.chat
        try {
            const meta = m.groupMetadata
            groupName = meta.subject || 'Group this'
        } catch {
            groupName = 'Group this'
        }
    } else if (input) {
        const inviteCode = extractInviteCode(input)
        
        if (!inviteCode) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Link invite no valid`)
        }
        
        try {
            const groupInfo = await sock.groupGetInviteInfo(inviteCode)
            targetGroupJid = groupInfo.id
            groupName = groupInfo.subject || 'Unknown'
        } catch (error) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Cannot fetch info group from link`)
        }
    } else {
        return m.reply(
            `🚪 *ʟᴇᴀᴠᴇ ɢʀᴜᴘ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ◦ In group: \`.leave\`\n` +
            `┃ ◦ Via link: \`.leave <link>\`\n` +
            `╰┈┈⬡\n\n` +
            `\`Example: ${m.prefix}leave https://chat.whatsapp.com/xxx\``
        )
    }
    
    if (!targetGroupJid) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Group not found`)
    }
    
    m.react('🕕')
    
    try {
        global.sewaLeaving = true
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'frenzy-AI'
        
        if (m.isGroup && targetGroupJid === m.chat) {
            await sock.sendMessage(m.chat, {
                text: `👋 *ɢᴏᴏᴅʙʏᴇ*\n\n` +
                    `> Bot will leave from this group.\n` +
                    `> Thank you already use bot!`,
                contextInfo: {
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName,
                        serverMessageId: 127
                    }
                }
            })
        }
        
        await sock.groupLeave(targetGroupJid)
        
        global.sewaLeaving = false
        
        if (!m.isGroup || targetGroupJid !== m.chat) {
            m.react('✅')
            await m.reply(
                `✅ *ʙᴇʀʜᴀsɪʟ ᴋᴇʟᴜᴀʀ*\n\n` +
                `> Bot has leave from: *${groupName}*`
            )
        }
        
    } catch (error) {
        global.sewaLeaving = false
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
