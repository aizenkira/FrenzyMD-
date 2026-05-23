const pluginConfig = {
    name: 'checksocmed',
    alias: ['sosmed', 'medsos'],
    category: 'check',
    description: 'Check level tocanduan sosmed',
    usage: '.checksocmed <name>',
    example: '.checksocmed Buin',
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
    if (percent >= 90) desc = 'Tocanduan seriously! Detox needed! 📱💀'
    else if (percent >= 70) desc = 'Scroll terus tanpa henti~ 📲'
    else if (percent >= 50) desc = 'Normal usage 👍'
    else if (percent >= 30) desc = 'Pretty healthy 🌿'
    else desc = 'Ingital detox master! 🧘'
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tosocmeand you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tosocmeand @${mentioned.split('@')[0]} yak? 
    
Tingkat tosocmeand ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
