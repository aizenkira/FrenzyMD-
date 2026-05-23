const pluginConfig = {
    name: 'checkwibu',
    alias: ['wibu', 'weeb'],
    category: 'check',
    description: 'Check how wibu you',
    usage: '.checkwibu <name>',
    example: '.checkwibu Buin',
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
        desc = 'WIBU SEJATI! Ara ara~ 🎌'
    } else if (percent >= 70) {
        desc = 'Wibu seriously! Kimochi~ 😍'
    } else if (percent >= 50) {
        desc = 'Pretty wibu 🌸'
    } else if (percent >= 30) {
        desc = 'Sea little wibu 😊'
    } else {
        desc = 'Bukan wibu, normal! 😎'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat towibuan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level towibuan @${mentioned.split('@')[0]} yak? 
    
Tingkat towibuan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
