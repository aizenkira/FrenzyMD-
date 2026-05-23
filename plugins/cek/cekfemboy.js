const checkfemboy = require('../../src/scraper/lufemboy')
const { fetchBuffer } = require('../../src/lib/frenzy-utils')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'checkfemboy',
    alias: ['femboy'],
    category: 'check',
    description: 'Check how femboy you',
    usage: '.checkfemboy <name>',
    example: '.checkfemboy Buin',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const percent = Math.floor(Math.random() * 101)
    const mentioned = m.mentionedJid[0] || m.sender
            try {
        const result = checkfemboy(name)
        
        let buffer = null
        try {
            buffer = await fetchBuffer(result.gif)
        } catch (e) {}
        
        let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tofemboyan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tofemboyan @${mentioned.split('@')[0]} yak? 
    
Tingkat tofemboyan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
        
        
    } catch (err) {
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
