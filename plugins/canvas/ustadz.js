const axios = require('axios')
const config = require('../../config')
const { f } = require('../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'ustadz',
    alias: ['ustad', 'quoteustadz', 'canvasustadz'],
    category: 'canvas',
    description: 'Create quote style ustadz',
    usage: '.ustadz <text>',
    example: '.ustadz Don't forget prayer',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text?.trim()
    
    if (!text) {
        return m.reply(
            `👲 *ᴄᴀɴᴠᴀs ᴜsᴛᴀᴅᴢ*\n\n` +
            `> Enter text for promoted to quote.\n\n` +
            `> Example: \`${m.prefix}ustadz Don't forget to be grateful\``
        )
    }
    
    m.react('🕕')
    
    try {
        const baseUrl = 'https://api.cuki.biz.id/api/canvas/ustadz?apikey=cuki-x&text=' + text
        const apikey = 'cuki-x'
        
        const response = await f(baseUrl)
        
        const imageUrl = response.results.url
        
        await sock.sendMedia(m.chat, imageUrl, null, m, {
            type: 'image',
        })
        
        m.react('✅')
        
    } catch (err) {
        console.error('[Canvas Ustadz]', err)
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
