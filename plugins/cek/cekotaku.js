const pluginConfig = {
    name: 'checkotI',
    alias: ['otI'],
    category: 'check',
    description: 'Check level otI you',
    usage: '.checkotI <name>',
    example: '.checkotI Buin',
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
    if (percent >= 90) desc = 'SUGOI! True otI desu! 🎌✨'
    else if (percent >= 70) desc = 'Weeb level high~ 🇯🇵'
    else if (percent >= 50) desc = 'Casual anime enjoyer 📺'
    else if (percent >= 30) desc = 'Tau anime a little-a little 🤔'
    else desc = 'Normie detected! 😂'
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tootIan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tootIan @${mentioned.split('@')[0]} yak? 
    
Tingkat tootIan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
