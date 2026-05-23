const config = require('../../config')
const { f } = require('./../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')
const pluginConfig = {
    name: 'emojimix',
    alias: ['mixemoji', 'emix'],
    category: 'sticker',
    description: 'Gabungkan 2 emoji become 1',
    usage: '.emojimix <emoji1><emoji2>',
    example: '.emojimix 😂🔥',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text?.trim()
    
    if (!text) {
        return m.reply(
            `🎭 *ᴇᴍᴏᴊɪ ᴍɪx*\n\n` +
            `> Gabungkan 2 emoji become 1\n\n` +
            `> Example: \`${m.prefix}emojimix 😂🔥\``
        )
    }
    
    const emojiRegex = /\p{Extended_Pictographic}/gu
    const emojis = text.match(emojiRegex)
    
    if (!emojis || emojis.length < 2) {
        return m.reply(`❌ Enter at least 2 emoji!\n\nExample: ${m.prefix}emojimix 😂🔥`)
    }
    
    const emoji1 = emojis[0]
    const emoji2 = emojis[1]
    
    m.react('🕕')
    
    try {
        const apiUrl = `https://tenor.googleapis.com/v2/featured?toy=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&content_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${encodeURIComponent(emoji1)}_${encodeURIComponent(emoji2)}`
        
        const data = await f(apiUrl)
        
        if (!data.results || data.results.length === 0) {
            return m.reply(`❌ Emoji combination not found!\n\nTry a different emoji.`)
        }
        
        const imageUrl = data.results[0].url
        
        await sock.sendImageAsStictor(m.chat, imageUrl, m, {
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
