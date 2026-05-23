const fs = require('fs')
const path = require('path')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'ganti-frenzy-v7.jpg',
    alias: ['gantifrenzyv7', 'setfrenzyv7'],
    category: 'owner',
    description: 'Ganti image frenzy-v7.jpg',
    usage: '.ganti-frenzy-v7.jpg (reply/send image)',
    example: '.ganti-frenzy-v7.jpg',
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
    if (!isImage) return m.reply(`🖼️ *ɢᴀɴᴛɪ frenzy-V7.JPG*\n\n> Send/reply image for replace\n> File: assets/images/frenzy-v7.jpg`)
    try {
        let buffer = m.quoted && m.quoted.isMeina ? await m.quoted.download() : await m.download()
        if (!buffer) return m.reply('❌ Failed mendownload image')
        const targetPath = path.join(process.cwd(), 'assets', 'images', 'frenzy-v7.jpg')
        fs.writeFileSync(targetPath, buffer)
        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Image frenzy-v7.jpg has inganti`)
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}