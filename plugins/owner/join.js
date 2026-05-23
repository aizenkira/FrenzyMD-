const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'join',
    alias: ['joingroup', 'joingroup', 'gabung'],
    category: 'owner',
    description: 'Bot join to group via link invite',
    usage: '.join <link>',
    example: '.join https://chat.whatsapp.com/xxx',
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
        /wa\.me\/([a-zA-Z0-9]{20,})/i,
        /^([a-zA-Z0-9]{20,})$/
    ]
    
    for (const pattern of patterns) {
        const match = text?.match(pattern)
        if (match) return match[1]
    }
    
    return null
}

async function handler(m, { sock }) {
    const input = m.args.join(' ').trim()
    
    if (!input) {
        return m.reply(
            `🔗 *ᴊᴏɪɴ ɢʀᴜᴘ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ◦ Send link invite group\n` +
            `┃ ◦ Bot will otodeads join\n` +
            `╰┈┈⬡\n\n` +
            `\`Example: ${m.prefix}join https://chat.whatsapp.com/xxx\``
        )
    }
    
    const inviteCode = extractInviteCode(input)
    
    if (!inviteCode) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Link invite no valid`)
    }
    
    m.react('🕕')
    
    try {
        const groupInfo = await sock.groupGetInviteInfo(inviteCode)
        
        if (!groupInfo) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Cannot fetch info group`)
        }
        
        const botJid = sock.user?.id?.replace(/:.*@/, '@') || ''
        const isMember = groupInfo.participants?.some(p => 
            p.id === botJid || p.id?.includes(sock.user?.id?.split(':')[0])
        )
        
        if (isMember) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Bot already become member in this group`)
        }
        
        await sock.groupAcceptInvite(inviteCode)
        
        m.react('✅')
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'frenzy-AI'
        
        await m.reply({
            text: `✅ *ʙᴇʀʜᴀsɪʟ ᴊᴏɪɴ*\n\n` +
                `╭┈┈⬡「 📋 *ɪɴꜰᴏ ɢʀᴜᴘ* 」\n` +
                `┃ 🏠 ɴᴀᴍᴀ: *${groupInfo.subject || 'Unknown'}*\n` +
                `┃ 👥 ᴍᴇᴍʙᴇʀ: *${groupInfo.size || groupInfo.participants?.length || 0}*\n` +
                `┃ 👤 ᴏᴡɴᴇʀ: *${groupInfo.owner?.split('@')[0] || 'Unknown'}*\n` +
                `╰┈┈⬡`,
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
        
    } catch (error) {
        m.react('❌')
        
        let errorMsg = error.message
        if (errorMsg.includes('not-authorized')) {
            errorMsg = 'Link already no valid or expired'
        } else if (errorMsg.includes('gone')) {
            errorMsg = 'Group already no there is'
        } else if (errorMsg.includes('conflict')) {
            errorMsg = 'Bot already become member'
        }
        
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
