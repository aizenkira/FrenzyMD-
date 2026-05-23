const config = require('../../config')
const fs = require("fs")
const te = require('../../src/lib/frenzy-error')
const soundCommands = ['sound']
for (let i = 1; i <= 250; i++) {
    soundCommands.push(`sound${i}`)
}

const pluginConfig = {
    name: soundCommands,
    alias: [],
    category: 'content',
    description: 'Send sound effect (sound1 - sound250)',
    usage: '.sound1 or .sound250',
    example: '.sound1',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const command = m.command?.toLowerCase()
    
    if (command === 'sound' || !command.startsWith('sound')) {
        return m.reply(
            `🔊 *sᴏᴜɴᴅ ᴇꜰꜰᴇᴄᴛ*\n\n` +
            `> Available: sound1 - sound250\n` +
            `> Example: \`${m.prefix}sound1\``
        )
    }
    
    const num = parseInt(command.replace('sound', ''))
    if (isNaN(num) || num < 1 || num > 250) {
        return m.reply(`❌ Choice no valid. Usage sound1 until sound250.`)
    }
    
    m.react('🕕')
    try {
        const link = `https://raw.githubusercontent.com/Leoo7z/Music/main/${command}.mp3`
        
        await sock.sendMedia(m.chat, link, null, m, {
            type: 'audio',
            mimetype: 'audio/mpeg',
            ptt: false
        })
        
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
