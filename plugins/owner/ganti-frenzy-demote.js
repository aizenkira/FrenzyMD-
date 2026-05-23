const fs = require('fs')
const path = require('path')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'ganti-frenzy-demote.jpg',
    alias: ['gantifrenzydemote', 'setfrenzydemote'],
    category: 'owner',
    description: 'Ganti image frenzy-demote.jpg',
    usage: '.ganti-frenzy-demote.jpg (reply/send image)',
    example: '.ganti-frenzy-demote.jpg',
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
    if (!isImage) return m.reply(`🖼️ *ɢᴀɴᴛɪ frenzy-DEMOTE.JPG*\n\n> Send/reply image for replace\n> File: assets/images/frenzy-demote.jpg`)
    try {
        let buffer = m.quoted && m.quoted.isMeina ? await m.quoted.download() : await m.download()
        if (!buffer) return m.reply('❌ Failed mendownload image')
        const targetPath = path.join(process.cwd(), 'assets', 'images', 'frenzy-demote.jpg')
        fs.writeFileSync(targetPath, buffer)
        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Image frenzy-demote.jpg has inganti`)
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}