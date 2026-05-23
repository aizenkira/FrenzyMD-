const pluginConfig = {
    name: 'checkpsikopat',
    alias: ['psikopat', 'psycho'],
    category: 'check',
    description: 'Check how psikopat you',
    usage: '.checkpsikopat <name>',
    example: '.checkpsikopat Buin',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m) {
        const percent = Math.floor(Math.random() * 101)
    const mentioned = m.mentionedJid[0] || m.sender
                    
    let desc = ''
    if (percent >= 90) {
        desc = 'PSIKOPAT AKUT! Jauhi! 😈'
    } else if (percent >= 70) {
        desc = 'Hati-heart the same as person this 👀'
    } else if (percent >= 50) {
        desc = 'Ada sisi gelapnya 🌑'
    } else if (percent >= 30) {
        desc = 'Sea little mysterious 🤔'
    } else {
        desc = 'Normal and kind-hearted 😇'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat toptionkopatan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level toptionkopatan @${mentioned.split('@')[0]} yak? 
    
Tingkat toptionkopatan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
