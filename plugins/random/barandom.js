const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'barandom',
    alias: ['bluearchive', 'ba'],
    category: 'random',
    description: 'Random image Blue Archive',
    usage: '.barandom',
    example: '.barandom',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const api = 'https://api.nexray.web.id/random/ba'
    await m.react('🕕')
    try {
        await sock.sendMedia(m.chat, api, null, m, {
            type: 'image'
        })
        
        await m.react('✅')
    } catch (e) {
        await m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
