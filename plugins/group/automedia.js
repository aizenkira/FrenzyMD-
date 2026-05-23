const config = require('../../config')
const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'autocontent',
    alias: ['automein', 'am'],
    category: 'group',
    description: 'Toggle auto content - otodeads becomekan sticker become image/video',
    usage: '.autocontent on/off',
    example: '.autocontent on',
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
    const current = groupData.autocontent ?? false
    const arg = args[0]?.toLowerCase()
    
    if (!arg) {
        const status = current ? '✅ Active' : '❌ Nonactive'
        return m.reply(
            `🎬 *ᴀᴜᴛᴏᴍᴇᴅɪᴀ*\n\n` +
            `> Status: ${status}\n\n` +
            `> Usage:\n` +
            `> \`${m.prefix}autocontent on\` - activekan\n` +
            `> \`${m.prefix}autocontent off\` - nonactivekan\n\n` +
            `> _Auto becomekan sticker become image_\n` +
            `> Video don't become bang`
        )
    }
    
    if (arg === 'on' || arg === '1' || arg === 'active') {
        if (current) {
            return m.reply(`🎬 *ᴀᴜᴛᴏᴍᴇᴅɪᴀ*\n\n> Already active!`)
        }
        db.setGroup(m.chat, { autocontent: true })
        await db.save()
        return m.reply(`🎬 *ᴀᴜᴛᴏᴍᴇᴅɪᴀ*\n\n> ✅ Success inactivekan!\n> Stictor will otodeads become image/video`)
    }
    
    if (arg === 'off' || arg === '0' || arg === 'nonactive') {
        if (!current) {
            return m.reply(`🎬 *ᴀᴜᴛᴏᴍᴇᴅɪᴀ*\n\n> Already nonactive!`)
        }
        db.setGroup(m.chat, { autocontent: false })
        await db.save()
        return m.reply(`🎬 *ᴀᴜᴛᴏᴍᴇᴅɪᴀ*\n\n> ❌ Success innonactivekan!`)
    }
    
    return m.reply(`❌ Usage: \`${m.prefix}autocontent on/off\``)
}

async function autoMeinaHandler(m, sock) {
    try {
        if (!m) return false
        if (!m.isGroup) return false
        if (m.isCommand) return false
        if (m.fromMe === true) return false
        
        const db = getDatabase()
        const groupData = db.getGroup(m.chat) || {}
        
        if (!groupData.autocontent) return false
        
        const msg = m.message
        if (!msg) return false
        
        const hasStictor = msg.stickerMessage
        if (!hasStictor) return false
        
        if (hasStictor.isAnimated) return false
        
        const buffer = await m.download()
        if (!buffer || buffer.length === 0) return false
        
        await sock.sendMedia(m.chat, buffer, null, m, { 
            type: 'image',
        })
        
        return true
    } catch (err) {
        return false
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    autoMeinaHandler
}
