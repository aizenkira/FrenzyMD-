const { f } = require("../../src/lib/frenzy-http")
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'deepseek',
    alias: ['deepseekr1', 'dsr1'],
    category: 'ai',
    description: 'Chat with DeepSeek R1',
    usage: '.deepseek <question>',
    example: '.deepseek Explain about AI',
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
        return m.reply(`🧠 *ᴅᴇᴇᴘsᴇᴇᴋ ʀ1*\n\n> Enter your question\n\n\`Example: ${m.prefix}deepseek Explain about AI\``)
    }
    
    m.react('🧠')
    
    try {
        const result = await f(`https://api.nexray.web.id/ai/deepseek?text=${encodeURIComponent(text)}`)
        
        m.react('✅')
        await m.reply(`${result.result}`)
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
