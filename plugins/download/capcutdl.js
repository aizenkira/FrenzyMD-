const { capcut } = require('btch-downloader')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'capcutdl',
    alias: ['ccdl', 'capcut', 'cc'],
    category: 'download',
    description: 'Download video CapCut',
    usage: '.ccdl <url>',
    example: '.ccdl https://www.capcut.com/t/xxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}ccdl <url>\`\n\n` +
            `> Example:\n` +
            `> \`${m.prefix}ccdl https://www.capcut.com/t/xxx\``
        )
    }
    
    if (!url.match(/capcut\.com/i)) {
        return m.reply(`❌ URL no valid. Usage link CapCut.`)
    }
    
    await m.react('🕕')
    
    try {
        const data = await capcut(url)
        
        if (!data?.status || !data?.originalVideoUrl) {
            return m.reply(`❌ Failed fetch video. Try a different link.`)
        }
        
        await sock.sendMedia(m.chat, data.originalVideoUrl, null, m, {
            type: 'video',
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
