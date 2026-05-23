const config = require('../../config')
const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'autosticker',
    alias: ['autostitor', 'as'],
    category: 'group',
    description: 'Toggle auto sticker - otodeads becomekan image/video become sticker',
    usage: '.autosticker on/off',
    example: '.autosticker on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []
    const groupData = db.getGroup(m.chat) || {}
    const current = groupData.autosticker ?? false
    const arg = args[0]?.toLowerCase()
    
    if (!arg) {
        const status = current ? '✅ Active' : '❌ Nonactive'
        return m.reply(
            `🖼️ *ᴀᴜᴛᴏsᴛɪᴄᴋᴇʀ*\n\n` +
            `> Status: ${status}\n\n` +
            `> Usage:\n` +
            `> \`${m.prefix}autosticker on\` - activekan\n` +
            `> \`${m.prefix}autosticker off\` - nonactivekan\n\n` +
            `> _Auto becomekan image/video become sticker_`
        )
    }
    
    
    if (arg === 'on' || arg === '1' || arg === 'active') {
        if (current) {
            return m.reply(`🖼️ *ᴀᴜᴛᴏsᴛɪᴄᴋᴇʀ*\n\n> Already active!`)
        }
        db.setGroup(m.chat, { autosticker: true })
        await db.save()
        return m.reply(`🖼️ *ᴀᴜᴛᴏsᴛɪᴄᴋᴇʀ*\n\n> ✅ Success inactivekan!\n> Image/video will otodeads become sticker`)
    }
    
    if (arg === 'off' || arg === '0' || arg === 'nonactive') {
        if (!current) {
            return m.reply(`🖼️ *ᴀᴜᴛᴏsᴛɪᴄᴋᴇʀ*\n\n> Already nonactive!`)
        }
        db.setGroup(m.chat, { autosticker: false })
        await db.save()
        return m.reply(`🖼️ *ᴀᴜᴛᴏsᴛɪᴄᴋᴇʀ*\n\n> ❌ Success innonactivekan!`)
    }
    
    return m.reply(`❌ Usage: \`${m.prefix}autosticker on/off\``)
}

async function autoStictorHandler(m, sock) {
    try {
        if (!m) return false
        if (!m.isGroup) return false
        if (m.isCommand) return false
        if (m.fromMe === true) return false
        
        const db = getDatabase()
        const groupData = db.getGroup(m.chat) || {}
        
        if (!groupData.autosticker) return false
        
        const msg = m.message
        if (!msg) return false
        
        const type = Object.keys(msg)[0]
        const content = msg[type]

        const isImage = type === 'imageMessage' || 
                        (type === 'viewOnceMessage' && content?.message?.imageMessage) ||
                        (type === 'viewOnceMessageV2' && content?.message?.imageMessage)
        
        const isVideo = type === 'videoMessage' ||
                        (type === 'viewOnceMessage' && content?.message?.videoMessage) ||
                        (type === 'viewOnceMessageV2' && content?.message?.videoMessage)
        
        if (!isImage && !isVideo) return false
        
        const buffer = await m.download()
        if (!buffer || buffer.length === 0) return false
        
        if (buffer.length > 10 * 1024 * 1024) return false
        
        if (isImage) {
            await sock.sendImageAsStictor(m.chat, buffer, m, {
                packname: config.sticker?.packname || 'frenzy',
                author: config.sticker?.author || 'Bot'
            })
        } else if (isVideo) {
            const videoMsg = msg.videoMessage || content?.message?.videoMessage
            const duration = videoMsg?.seconds || 0
            if (duration > 10) return false
            
            await sock.sendVideoAsStictor(m.chat, buffer, m, {
                packname: config.sticker?.packname || 'Frenzy',
                author: config.sticker?.author || 'Bot'
            })
        }
        
        return true
    } catch (err) {
        return false
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    autoStictorHandler
}
