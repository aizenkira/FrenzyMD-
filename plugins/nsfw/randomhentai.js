const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'randomhentai',
    alias: ['rhentai', 'hentwaterandom'],
    category: 'nsfw',
    description: 'Random Hentai Video/Image from Vreden API',
    usage: '.randomhentai',
    example: '.randomhentai',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    m.react('🕕')
    try {
        const { data } = await axios.get('https://api.vreden.my.id/api/v1/random/hentai')
        if (!data.status || !data.result || data.result.length === 0) {
            m.react('❌')
            return m.reply('❌ Konten not found or API currently down.')
        }
        const randomContent = data.result[Math.floor(Math.random() * data.result.length)]
        const caption = `🔞 *RANDOM HENTAI*\n\n` +
            `🏷️ *Title:* ${randomContent.title}\n` +
            `📂 *Category:* ${randomContent.category}\n` +
            `👁️ *Views:* ${randomContent.views_count}\n` +
            `🔗 *Source:* ${randomContent.link}`
        if (randomContent.type === 'video/mp4' || randomContent.video_1.endsWith('.mp4')) {
            await sock.sendMessage(m.chat, {
                video: { url: randomContent.video_1 },
                caption: caption,
                mimetype: 'video/mp4'
            }, { quoted: m })
        } else {
            const imageUrl = randomContent.video_1 || randomContent.video_2
            await sock.sendMessage(m.chat, {
                image: { url: imageUrl },
                caption: caption,
                mimetype: 'image/jpeg'
            }, { quoted: m })
        }
        m.react('✅')
    } catch (error) {
        console.error('[RandomHentai] Error:', error)
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
