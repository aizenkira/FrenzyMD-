const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'bratvermeil',
    alias: ['bratv', 'bratnime'],
    category: 'sticker',
    description: 'Create sticker brat version Vermeil',
    usage: '.bratvermeil <text>',
    example: '.bratvermeil Don't forget must',
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
            `👿 *ʙʀᴀᴛ ᴠᴇʀᴍᴇɪʟ*\n\n` +
            `> Enter text for promoted to sticker.\n\n` +
            `> Example: \`${m.prefix}bratvermeil Don't forget must\``
        )
    }
    
    m.react('🎨')
    
    try {
        const apikey = 'cuki-x'
        const baseUrl = `https://api.cuki.biz.id/api/canvas/brat/bratnime-vermeil?text=${encodeURIComponent(text)}&apikey=${apikey}`
        await sock.sendImageAsStictor(m.chat, baseUrl, m, {
            packname: config.sticker?.packname || 'frenzy-AI',
            author: config.sticker?.author || 'Brat Vermeil'
        })
        
        m.react('✅')
        
    } catch (err) {
        console.error('[Brat Vermeil]', err)
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
