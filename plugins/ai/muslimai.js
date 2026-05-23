const { f } = require('../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'muslimai',
    alias: ['islamicai', 'quranai'],
    category: 'ai',
    description: 'AI for asking questions about Islam and the Quran',
    usage: '.muslimai <question>',
    example: '.muslimai Apa that prayer?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')
    if (!text) {
        return m.reply(`☪️ *ᴍᴜsʟɪᴍ ᴀɪ*\n\n> Enter your question about Islam\n\n\`Example: ${m.prefix}muslimai Apa that prayer?\``)
    }
    
    m.react('🕕')
    
    try {
        const url = `https://api.nexray.web.id/ai/muslim?text=${encodeURIComponent(text)}`
        const data = await f(url)
        
        const answer = data.result
        let response = `${answer}`
        
        m.react('✅')
        await m.reply(response)
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
