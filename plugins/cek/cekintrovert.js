const pluginConfig = {
    name: 'checkintrovert',
    alias: ['introvert'],
    category: 'check',
    description: 'Check level introvert you',
    usage: '.checkintrovert <name>',
    example: '.checkintrovert Buin',
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
    if (percent >= 90) desc = 'Home is paradise! Stay home~ 🏠'
    else if (percent >= 70) desc = 'Social battery terlimit 🔋'
    else if (percent >= 50) desc = 'Ambivert, balance~ ⚖️'
    else if (percent >= 30) desc = 'Pretty social butterfly 🦋'
    else desc = 'Extrovert mode ON! 🎉'
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tointrovertan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tointrovertan @${mentioned.split('@')[0]} yak? 
    
Tingkat tointrovertan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
