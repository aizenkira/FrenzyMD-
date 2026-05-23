const pluginConfig = {
    name: 'checkjomblo',
    alias: ['jomblo', 'single'],
    category: 'check',
    description: 'Check level tojombloan you',
    usage: '.checkjomblo <name>',
    example: '.checkjomblo Buin',
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
    if (percent >= 90) desc = 'Jomblo abain! Single is happiness~ 💔😎'
    else if (percent >= 70) desc = 'Strong independent person! 💪'
    else if (percent >= 50) desc = 'StillPDKT mode ON 😍'
    else if (percent >= 30) desc = 'Ada that nactionr it seems~ 👀'
    else desc = 'Soon taken! 💕'
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tojombloan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tojombloan @${mentioned.split('@')[0]} yak? 
    
Tingkat tojombloan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
