const pluginConfig = {
    name: 'checkgamer',
    alias: ['gamer', 'pro'],
    category: 'check',
    description: 'Check how pro gamer you',
    usage: '.checkgamer <name>',
    example: '.checkgamer Buin',
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
        desc = 'PRO PLAYER! Esports level! 🏆'
    } else if (percent >= 70) {
        desc = 'Jago very! 🎮'
    } else if (percent >= 50) {
        desc = 'Pretty pro 👍'
    } else if (percent >= 30) {
        desc = 'Still a noob 😅'
    } else {
        desc = 'Meninng main masak-maswill 🍳'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat togameran you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level togameran @${mentioned.split('@')[0]} yak? 
    
Tingkat togameran ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
