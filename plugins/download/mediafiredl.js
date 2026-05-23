const config = require('../../config')
const { f } = require('./../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'contentfiredl',
    alias: ['mfdl', 'contentfire', 'mf'],
    category: 'download',
    description: 'Download file from MeinaFire',
    usage: '.mfdl <url>',
    example: '.mfdl https://www.contentfire.com/file/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energy: 1,
    isEnabled: true
}


async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}mfdl <url>\`\n\n` +
            `> Example:\n` +
            `> \`${m.prefix}mfdl https://www.contentfire.com/file/xxx\``
        )
    }
    
    if (!url.match(/contentfire\.com/i)) {
        return m.reply(`❌ *URL no valid. Usage link MeinaFire.*`)
    }
    await m.react('🕕')
    
    try {
        const { data } = await f(`https://api.neoxr.eu/api/contentfire?url=${encodeURIComponent(url)}&apikey=${config.APItoy.neoxr}`)
        await sock.sendMedia(m.chat, data.url, null, m, {
            type: 'document',
            fileName: data.title,
            mimetype: data.mime,
            fileSize: data.size,
            contextInfo: {
                forwardingScore: 99,
                isForwarded: true
            }
        })
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
