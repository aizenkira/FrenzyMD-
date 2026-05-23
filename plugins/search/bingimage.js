const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'bingimage',
    alias: ['imagesearch', 'search forimage', 'bingimg'],
    category: 'search',
    description: 'Cari artwork in Pixiv',
    usage: '.search forimage <query>',
    example: '.search forimage rem',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    try {
        const query = m.text
        
        if (!query) {
            return m.reply(`❌ *Enter kata kunci pensearch foran!*\n\n> Example: ${m.prefix}search forimage rem`)
        }
        
        await m.react('🔍')
        
        const apikey = config.APIkey?.neoxr || 'Milik-Bot-OurinMD'
        const url = `https://api-faa.my.id/faa/google-image?query=${encodeURIComponent(query)}&apikey=${apikey}`
        
        const response = await axios.get(url, { timeout: 30000 })
        const data = response.data
        
        if (!data.status) {
            await m.react('❌')
            return m.reply(`❌ *Not found hasil for:* ${query}`)
        }
        const results = data.result
        const album = await Promise.all(
        results.map(async (url) => {
            const res = await axios.get(url, { responseType: "arraybuffer" })
            return {
            image: Buffer.from(res.data)
            }
        })
        )
        await sock.sendMessage(m.chat, {
            albumMessage: album
        }, { quoted: m })
        
    } catch (error) {
        await m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
