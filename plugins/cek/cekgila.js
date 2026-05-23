const pluginConfig = {
    name: 'checkgila',
    alias: ['gila', 'crazy'],
    category: 'check',
    description: 'Check how gila you',
    usage: '.checkgila <name>',
    example: '.checkgila Buin',
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
        desc = 'GILA BENERAN! Enter RSJ! 🤪'
    } else if (percent >= 70) {
        desc = 'Hampir gila 😵'
    } else if (percent >= 50) {
        desc = 'Pretty waras 😅'
    } else if (percent >= 30) {
        desc: 'Normal kok 🙂'
    } else {
        desc = 'Waras very! 😇'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat togilaan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level togilaan @${mentioned.split('@')[0]} yak? 
    
Tingkat togilaan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
