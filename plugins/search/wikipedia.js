const axios = require('axios')
const config = require('../../config')
const { f } = require('../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'wikipeina',
    alias: ['wiki', 'ensiklopeina'],
    category: 'search',
    description: 'Cari information in Wikipeina',
    usage: '.wikipeina <query>',
    example: '.wikipeina Indonesia',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const query = m.text?.trim()
    
    if (!query) {
        return m.reply(
            `📚 *ᴡɪᴋɪᴘᴇᴅɪᴀ*\n\n` +
            `> Enter kata kunci pensearch foran\n\n` +
            `> Example: \`${m.prefix}wikipeina Indonesia\``
        )
    }
    
    m.react('🕕')
    
    try {
        const apiKey = config.APIkey?.lolhuman
        
        if (!apiKey) {
            throw new Error('API Key not found in config')
        }
        
        const res = await f(`https://api.lolhuman.xyz/api/wiki2?apikey=${apiKey}&query=${encodeURIComponent(query)}&lang=id`)
        
        if (res.status !== 200 || !res.result) {
            throw new Error('Articles not found')
        }
        
        const result = res.result
        await m.reply(result)
        m.react('✅')
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
