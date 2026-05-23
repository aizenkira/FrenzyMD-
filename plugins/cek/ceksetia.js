const pluginConfig = {
    name: 'checksetia',
    alias: ['setia', 'loyal'],
    category: 'check',
    description: 'Check level tosetiaan you',
    usage: '.checksetia <name>',
    example: '.checksetia Buin',
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
    if (percent >= 90) desc = 'Loyal until death! 💍💕'
    else if (percent >= 70) desc = 'Very setia and tulus! ❤️'
    else if (percent >= 50) desc = 'Pretty setia~ 😊'
    else if (percent >= 30) desc = 'Hmm... occasionally goyah 😅'
    else desc = 'Playboy/Playgirl mode? 😏'
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tosetiaan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tosetiaan @${mentioned.split('@')[0]} yak? 
    
Tingkat tosetiaan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
