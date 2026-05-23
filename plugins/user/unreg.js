const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')

const pluginConfig = {
    name: 'unreg',
    alias: ['unregister', 'deletelist'],
    category: 'user',
    description: 'Delete data penlistan you from bot',
    usage: '.unreg',
    example: '.unreg',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user?.isRegistered) {
        return m.reply(
            `❌ You not yet registered!\n\n` +
            `> Register with \`${m.prefix}list <name>\``
        )
    }
    
    const saluranId = config.saluran?.id || '120363406397452589@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'
    
    db.setUser(m.sender, {
        isRegistered: false,
        regName: null,
        regAge: null,
        regGender: null
    })
    
    await db.save()
    
    await sock.sendMessage(m.chat, {
        text: `✅ *ᴜɴʀᴇɢɪsᴛᴇʀ ʙᴇʀʜᴀsɪʟ!*\n\n` +
            `Data penlistan you already deleted.\n\n` +
            `> For list again: \`${m.prefix}list <name>\``,
        contextInfo: {
            forwardingScore: 9999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127
            }
        }
    }, { quoted: m })
    
    m.react('✅')
}

module.exports = {
    config: pluginConfig,
    handler
}
