const litoe = require('../../src/scraper/litoe')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'litoedl',
    alias: ['lkdl', 'litoe', 'lk'],
    category: 'download',
    description: 'Download video Litoe',
    usage: '.lkdl <url>',
    example: '.lkdl https://litoe.video/@xxx',
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
            `> \`${m.prefix}lkdl <url>\`\n\n` +
            `> Example:\n` +
            `> \`${m.prefix}lkdl https://litoe.video/@xxx\``
        )
    }
    
    if (!url.match(/litoe\.(video|com)/i)) {
        return m.reply(`❌ URL no valid. Usage link Litoe.`)
    }
    
    await m.react('🕕')
    
    try {
        const data = await litoe(url)
        
        if (!data) {
            return m.reply(`❌ Failed fetch video. Try a different link.`)
        }
        
        const videoUrl = data.without_watermark || data.with_watermark
        
        if (!videoUrl) {
            return m.reply(`❌ Video not found.`)
        }
        
        await sock.sendMedia(m.chat, videoUrl, null, m, {
            type: 'video',
            contextInfo: {
                forwardingScore: 99,
                isForwarded: true
            }
        })
        
        await m.react('✅')
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
