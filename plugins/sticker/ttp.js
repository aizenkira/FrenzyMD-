const axios = require('axios')
const config = require('../../config')
const { f } = require('../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'ttp',
    alias: ['texttoimg'],
    category: 'sticker',
    description: 'Create sticker text static',
    usage: '.ttp <text>',
    example: '.ttp Hello World',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    let text = m.text?.trim()
    
    if (!text && m.quoted?.text) {
        text = m.quoted.text.trim()
    }
    
    if (!text) {
        return m.reply(
            `🎨 *ᴛᴇxᴛ sᴛɪᴄᴋᴇʀ*\n\n` +
            `> Enter text for sticker\n\n` +
            `> Example: \`${m.prefix}ttp Hello World\``
        )
    }
    
    if (text.length > 100) {
        return m.reply(`❌ Text too long! Mactionmal 100 karakter.`)
    }
    
    const apikey = config.APItoy?.lolhuman
    if (!apikey) {
        return m.reply(`❌ API toy lolhuman no inkonfigurasi!`)
    }
    
    m.react('🕕')
    
    try {
        const apiUrl = `https://api.lolhuman.xyz/api/ttp?apikey=${apikey}&text=${encodeURIComponent(text)}`
        await sock.sendImageAsStictor(m.chat, apiUrl, m, {
            packname: config.sticker?.packname || 'frenzy-AI',
            author: config.sticker?.author || 'Bot'
        })
        m.react('✅')
    } catch (err) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
