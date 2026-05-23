const axios = require('axios')
const config = require('../../config')
const { f } = require('../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')

const NEOXR_APIKEY = config.APItoy?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: 'quotesimage',
    alias: ['quoteimg', 'quotes-image', 'qimg'],
    category: 'random',
    description: 'Random quotes image',
    usage: '.quotesimage',
    example: '.quotesimage',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    m.react('🕕')
    
    try {
        const res = await f(`https://api.neoxr.eu/api/quotesimage?apikey=${NEOXR_APIKEY}`)
        
        if (!res.status || !res.data?.url) {
            m.react('❌')
            return m.reply(`❌ Failed fetch quotes image`)
        }
        
        await sock.sendMedia(m.chat, res.data.url, null, m, {
            type: 'image'
        })
        
        m.react('✅')
        
    } catch (err) {
        m.react('☢')
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
