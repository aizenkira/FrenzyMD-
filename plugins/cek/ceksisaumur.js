const pluginConfig = {
    name: 'checksisaumur',
    alias: ['sisaumur', 'umur'],
    category: 'check',
    description: 'Remathisng age check you',
    usage: '.checksisaumur <name>',
    example: '.checksisaumur Buin',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m) {
        
    const year = Math.floor(Math.random() * 80) + 20
    const month = Math.floor(Math.random() * 12)
    const day = Math.floor(Math.random() * 30)
    
    let desc = ''
    if (year > 80) {
        desc = 'Long umur very! 🎉'
    } else if (year > 60) {
        desc = 'Pretty long~ ✨'
    } else if (year > 40) {
        desc = 'Pretty lah ya 😊'
    } else {
        desc = 'Jaga tohealthyan ya! 🙏'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tosisaumuran you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tosisaumuran @${mentioned.split('@')[0]} yak? 
    
Tingkat tosisaumuran ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
