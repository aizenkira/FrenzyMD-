const pluginConfig = {
    name: 'checkhigh',
    alias: ['high', 'tall'],
    category: 'check',
    description: 'Height check random',
    usage: '.checkhigh <name>',
    example: '.checkhigh Buin',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m) {
        const high = Math.floor(Math.random() * 50) + 150
    
    let desc = ''
    if (high >= 190) {
        desc = 'TINGGI BANGET! Model bastotball! 🏀'
    } else if (high >= 175) {
        desc = 'High ideal! 😎'
    } else if (high >= 165) {
        desc = 'Pretty high 👍'
    } else if (high >= 155) {
        desc = 'Styourd kok 🙂'
    } else {
        desc = 'Imut and mungil! 🥺'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tohighan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tohighan @${mentioned.split('@')[0]} yak? 
    
Tingkat tohighan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
