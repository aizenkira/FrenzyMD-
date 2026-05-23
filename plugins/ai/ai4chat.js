const { f } = require('../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'ai4chat',
    alias: ['ai'],
    category: 'ai',
    description: 'Chat with AI4Chat',
    usage: '.ai4chat <question>',
    example: '.ai4chat Apa that JavaScript?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 1,
    isEnabled: true
}

async function handler(m) {
    const text = m.text
    if (!text) {
        return m.reply(`🤖 *ᴀɪᴄʜᴀᴛ*\n\n> Enter your question\n\n\`Example: ${m.prefix}ai4chat Apa that JavaScript?\``)
    }
    m.react('🕕')
    try {
        const data = await f(`https://api.zenzxz.my.id/ai/copilot?message=${encodeURIComponent(text)}&model=gpt-5`)
        m.react('✅')
        await m.reply(`${data.result.text}`)
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
