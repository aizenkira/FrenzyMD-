const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'oh-no',
    alias: ['ohno', 'ohnomeme'],
    category: 'canvas',
    description: 'Create meme oh no',
    usage: '.oh-no <text>',
    example: '.oh-no I forget ngerbecome PR',
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
            `😱 *ᴏʜ ɴᴏ ᴍᴇᴍᴇ*\n\n` +
            `> Enter text for meme\n\n` +
            `> Example: \`${m.prefix}oh-no I forget ngerbecome PR\``
        )
    }
    
    const apikey = config.APItoy?.lolhuman
    if (!apikey) {
        return m.reply(`❌ API toy lolhuman no inkonfigurasi!`)
    }
    
    m.react('🕕')
    
    try {
        await sock.sendMedia(m.chat, `https://api.lolhuman.xyz/api/creator/ohno?apikey=${apikey}&text=${encodeURIComponent(text)}`, null, m, {
            type: 'image',
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
