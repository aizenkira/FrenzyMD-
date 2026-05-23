const pluginConfig = {
    name: 'checkyandere',
    alias: ['yandere'],
    category: 'check',
    description: 'Check level yandere you',
    usage: '.checkyandere <name>',
    example: '.checkyandere Buin',
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
    if (percent >= 90) desc = 'You milikku forever~ 🔪💕'
    else if (percent >= 70) desc = 'Don't dekati ina ya... 👁️'
    else if (percent >= 50) desc = 'Overprotective slightly~ 🫂'
    else if (percent >= 30) desc = 'Adon't posessionf 😅'
    else desc = 'Normal , casually~ 😊'
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat toyanderean you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level toyanderean @${mentioned.split('@')[0]} yak? 
    
Tingkat toyanderean ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
