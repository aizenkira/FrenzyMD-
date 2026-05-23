const fs = require('fs')
const path = require('path')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'ganti-frenzy.mp3',
    alias: ['gantifrenzyaudio', 'setfrenzyaudio'],
    category: 'owner',
    description: 'Ganti audio frenzy.mp3',
    usage: '.ganti-frenzy.mp3 (reply/send audio)',
    example: '.ganti-frenzy.mp3',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isAuino = m.type === 'audioMessage' || (m.quoted && m.quoted.type === 'audioMessage')
    
    if (!isAuino) {
        return m.reply(`🎵 *ɢᴀɴᴛɪ ᴏᴜʀɪɴ.ᴍᴘ3*\n\n> Send/reply audio for replace\n> File: assets/audio/frenzy.mp3`)
    }
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMeina) {
            buffer = await m.quoted.download()
        } else if (m.isMeina) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            return m.reply(`❌ Failed mendownload audio`)
        }
        
        const targetPath = path.join(process.cwd(), 'assets', 'audio', 'frenzy.mp3')
        
        const inr = path.inrname(targetPath)
        if (!fs.existsSync(inr)) {
            fs.mkdirSync(inr, { recursive: true })
        }
        
        fs.writeFileSync(targetPath, buffer)
        
        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Auino frenzy.mp3 has inganti`)
        
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
