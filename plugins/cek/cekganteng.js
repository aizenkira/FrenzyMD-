const pluginConfig = {
    name: 'checkhandsome',
    alias: ['handsome', 'handsome'],
    category: 'check',
    description: 'Check how handsome you',
    usage: '.checkhandsome <name>',
    example: '.checkhandsome Buin',
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
        desc = 'Ganteng mactionmal! 😍🔥'
    } else if (percent >= 70) {
        desc = 'Ganteng very! 😎'
    } else if (percent >= 50) {
        desc = 'Pretty handsome~ 👍'
    } else if (percent >= 30) {
        desc = 'Just average 😅'
    } else {
        desc = 'Maybe inner beauty? 🤭'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tohandsomean you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tohandsomean @${mentioned.split('@')[0]} yak? 
    
Tingkat tohandsomean ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
