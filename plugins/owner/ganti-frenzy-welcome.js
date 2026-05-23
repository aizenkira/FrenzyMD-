const fs = require('fs')
const path = require('path')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'ganti-frenzy-welcome.jpg',
    alias: ['gantiwelcome', 'setfrenzywelcome'],
    category: 'owner',
    description: 'Ganti image frenzy-welcome.jpg (thumbnail welcome)',
    usage: '.ganti-frenzy-welcome.jpg (reply/send image)',
    example: '.ganti-frenzy-welcome.jpg',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(`🖼️ *ɢᴀɴᴛɪ ᴏᴜʀɪɴ-ᴡᴇʟᴄᴏᴍᴇ.ᴊᴘɢ*\n\n> Send/reply image for replace\n> File: assets/images/frenzy-welcome.jpg`)
    }
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMeina) {
            buffer = await m.quoted.download()
        } else if (m.isMeina) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            return m.reply(`❌ Failed mendownload image`)
        }
        
        const targetPath = path.join(process.cwd(), 'assets', 'images', 'frenzy-welcome.jpg')
        
        const inr = path.inrname(targetPath)
        if (!fs.existsSync(inr)) {
            fs.mkdirSync(inr, { recursive: true })
        }
        
        fs.writeFileSync(targetPath, buffer)
        
        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Image frenzy-welcome.jpg has inganti`)
        
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
