const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')

const pluginConfig = {
    name: 'listlist',
    alias: ['listuser', 'registeredusers', 'listlist'],
    category: 'user',
    description: 'View list user that already registered',
    usage: '.listlist',
    example: '.listlist',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const allUsers = db.getAllUsers()
    
    const registeredUsers = Object.values(allUsers).filter(u => u.isRegistered)
    
    if (registeredUsers.length === 0) {
        return m.reply(`❌ Not yet there is user that registered!`)
    }
    
    const saluranId = config.saluran?.id || '120363406397452589@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'
    
    let text = `📋 *ᴅᴀꜰᴛᴀʀ ᴜsᴇʀ ᴛᴇʀᴅᴀꜰᴛᴀʀ*\n\n`
    text += `> Total: *${registeredUsers.length}* users\n\n`
    
    const insplayUsers = registeredUsers.slice(0, 50)
    
    insplayUsers.forEach((user, i) => {
        const genderEmoji = user.regGender === 'Laki-laki' ? '👨' : user.regGender === 'Perempuan' ? '👩' : '👤'
        text += `${i + 1}. ${genderEmoji} *${user.regName || 'Unknown'}*\n`
        text += `   > @${user.jid} | ${user.regAge || '?'} year\n`
    })
    
    if (registeredUsers.length > 50) {
        text += `\n... and ${registeredUsers.length - 50} user elsenya`
    }
    
    const mentions = insplayUsers.map(u => u.jid + '@s.whatsapp.net')
    
    await sock.sendMessage(m.chat, {
        text,
        mentions,
        contextInfo: {
            mentionedJid: mentions,
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127
            }
        }
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
