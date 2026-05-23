const { f } = require('../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'gpt4o',
    alias: ['gpt4'],
    category: 'ai',
    description: 'Chat with GPT-4o',
    usage: '.gpt4o <question>',
    example: '.gpt4o Hello, how are you?',
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
        return m.reply(`🧠 *ɢᴘᴛ-4ᴏ*\n\n> Enter your question\n\n\`Example: ${m.prefix}gpt4o Hello, how are you?\``)
    }
    
    m.react('🕕')
    
    try {
        const url = await f(`https://api.nexray.web.id/ai/chatgpt?text=${encodeURIComponent(text)}&model=gpt-4o`)
        
        m.react('✅')
        await m.reply(`${url.result}`)
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
