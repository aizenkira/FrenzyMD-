const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'kannabrat',
    alias: ['kanna', 'kannagen'],
    category: 'sticker',
    description: 'Create sticker Kanna with text',
    usage: '.kannabrat <text>',
    example: '.kannabrat Hello World',
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
            `🎀 *ᴋᴀɴɴᴀ ʙʀᴀᴛ*\n\n` +
            `> Enter text for sticker\n\n` +
            `> Example: \`${m.prefix}kannabrat Hello World\``
        )
    }
    
    if (text.length > 50) {
        return m.reply(`❌ Text too long! Mactionmal 50 karakter.`)
    }
    
    const apikey = config.APItoy?.lolhuman
    if (!apikey) {
        return m.reply(`❌ API toy lolhuman no inkonfigurasi!`)
    }
    
    m.react('🎀')
    
    try {
        const apiUrl = `https://api.lolhuman.xyz/api/creator/kannagen?apikey=${apikey}&text=${encodeURIComponent(text)}`
        await sock.sendImageAsStictor(m.chat, apiUrl, m, {
            packname: config.sticker.packname,
            author: config.sticker.author
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
