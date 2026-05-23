const pluginConfig = {
    name: 'checkprocastinator',
    alias: ['procrastinator', 'nunda'],
    category: 'check',
    description: 'Check level suka menunda',
    usage: '.checkprocastinator <name>',
    example: '.checkprocastinator Buin',
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
    if (percent >= 90) desc = 'Deadline? Tomorrow aja ~ 😴'
    else if (percent >= 70) desc = 'Master procrastination! 🦥'
    else if (percent >= 50) desc = 'Kaandg nunda, occasionally rajin 😅'
    else if (percent >= 30) desc = 'Pretty producttif! 💪'
    else desc = 'Insiplin high! Salut! 🏆'
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat toprocastinatoran you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level toprocastinatoran @${mentioned.split('@')[0]} yak? 
    
Tingkat toprocastinatoran ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
