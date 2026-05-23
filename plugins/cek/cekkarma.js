const pluginConfig = {
    name: 'checkkarma',
    alias: ['karma'],
    category: 'check',
    description: 'Check your karma level',
    usage: '.checkkarma <name>',
    example: '.checkkarma Buin',
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
    if (percent >= 80) desc = 'Good karma! Heaven awaits you~ ✨'
    else if (percent >= 60) desc = 'Pretty good, keep improving! 🙏'
    else if (percent >= 40) desc = 'Neutral, permany togoodan~ ⚖️'
    else if (percent >= 20) desc = 'Watch out for bad karma! ⚠️'
    else desc = 'Wow, you really need to repent... 😱'
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tokarmaan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tokarmaan @${mentioned.split('@')[0]} yak? 
    
Tingkat tokarmaan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
