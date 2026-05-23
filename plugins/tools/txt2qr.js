const axios = require('axios')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'txt2qr',
    alias: ['texttoqr', 'qrcode', 'qrcreate'],
    category: 'tools',
    description: 'Generate QR code from text',
    usage: '.txt2qr <text>',
    example: '.txt2qr https://google.com',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    
    if (!text) {
        return m.reply(`📱 *ᴛᴇxᴛ ᴛᴏ Qʀ*\n\n> Enter text/URL\n\n\`Example: ${m.prefix}txt2qr https://google.com\``)
    }
    
    m.react('📱')
    
    try {
        const url = `https://api-faa.my.id/faa/qr-create?text=${encodeURIComponent(text)}`
        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000
        })
        
        m.react('✅')
        
        await sock.sendMessage(m.chat, {
            image: Buffer.from(res.data),
            caption: `📱 *Qʀ ᴄᴏᴅᴇ*\n\n> ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`
        }, { quoted: m })
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
