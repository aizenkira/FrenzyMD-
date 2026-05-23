const { uploadImage } = require('../../src/lib/frenzy-uploader')
const { f } = require('../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'toemotebatu',
    alias: ['emotebatu', 'moai', 'tomoai'],
    category: 'ai',
    description: 'Change image to emote batu 🗿',
    usage: '.toemotebatu (reply image)',
    example: '.toemotebatu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energy: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(`🗿 *ᴇᴍᴏᴛᴇ ʙᴀᴛᴜ*\n\n> Send/reply image\n\n\`${m.prefix}toemotebatu\``)
    }
    
    m.react('🕕')
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMeina) {
            buffer = await m.quoted.download()
        } else if (m.isMeina) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            m.react('❌')
            return m.reply(`❌ Failed mendownload image`)
        }
        
        const imageUrl = await uploadImage(buffer, 'image.jpg')
        
        const url = `https://api-faa.my.id/faa/tomoai?url=${encodeURIComponent(imageUrl)}`
        const res = await f(url, 'arrayBuffer')
        
        m.react('✅')
        
        await sock.sendMedia(m.chat, Buffer.from(res), null, m, {
            type: 'image'
        })
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
