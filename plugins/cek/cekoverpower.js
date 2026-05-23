const pluginConfig = {
    name: 'checkoverpower',
    alias: ['overpower', 'op'],
    category: 'check',
    description: 'Check level overpower you',
    usage: '.checkoverpower <name>',
    example: '.checkoverpower Buin',
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
    if (percent >= 90) desc = 'OVERPOWER BANGET! LEGEND! 👑🔥'
    else if (percent >= 70) desc = 'Super strong! 💪'
    else if (percent >= 50) desc = 'Pretty strong~ 😎'
    else if (percent >= 30) desc = 'Just average 🤔'
    else desc = 'Still perlu latihan 📝'
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tooverpoweran you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tooverpoweran @${mentioned.split('@')[0]} yak? 
    
Tingkat tooverpoweran ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
