const pluginConfig = {
    name: 'checkevil',
    alias: ['evil', 'evil'],
    category: 'check',
    description: 'Check how evil you',
    usage: '.checkevil <name>',
    example: '.checkevil Buin',
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
        desc = 'VILLAIN LEVEL! 😈👿'
    } else if (percent >= 70) {
        desc = 'Jahat very! 💀'
    } else if (percent >= 50) {
        desc = 'Pretty evil 😏'
    } else if (percent >= 30) {
        desc = 'Sea little nakal 😊'
    } else {
        desc = 'You're good, don't be evil! 😇'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat toevilan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level toevilan @${mentioned.split('@')[0]} yak? 
    
Tingkat toevilan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
