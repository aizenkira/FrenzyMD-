const { f } = require('../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'matedeadka',
    alias: ['mathgpt', 'math', 'mathsolver'],
    category: 'ai',
    description: 'AI for menyelesaikan soal matedeadka',
    usage: '.matedeadka <soal> or reply image soal',
    example: '.matedeadka 2+2 berwhat?',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.args.join(' ')

    if (!text) {
        return m.reply(`📐 *ᴍᴀᴛʜ ɢᴘᴛ*\n\n> Enter soal matedeadka\n\n\`Example: ${m.prefix}matedeadka 2+2 berwhat?\``)
    }
    
    m.react('🕕')
    
    try {
        let url = `https://api.nexray.web.id/ai/mathgpt?text=${encodeURIComponent(text || 'solve this')}`
        const data = await f(url)

        const answer = data.result
        
        m.react('✅')
        await m.reply(`${answer}`)
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
