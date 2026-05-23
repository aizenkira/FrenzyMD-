const axios = require('axios')
const { f } = require('../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'glm4',
    alias: ['glm', 'glm46v'],
    category: 'ai',
    description: 'Chat with GLM 4.6V',
    usage: '.glm4 <question>',
    example: '.glm4 Hello, how are you?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text
    if (!text) {
        return m.reply(`🌐 *ɢʟᴍ 4.6ᴠ*\n\n> Enter your question\n\n\`Example: ${m.prefix}glm4 Hello, how are you?\``)
    }
    
    m.react('🕕')
    
    try {
        const url = `https://api.nexray.web.id/ai/glm?text=${encodeURIComponent(text)}&model=glm-4.6`
        const data = await f(url)
            
        const content = data.result
        
        m.react('✅')
        await m.reply(`${content}`)
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
