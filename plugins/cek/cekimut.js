const pluginConfig = {
    name: 'checkimut',
    alias: ['imut', 'cute'],
    category: 'check',
    description: 'Check how imut you',
    usage: '.checkimut <name>',
    example: '.checkimut Ani',
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
        desc = 'IMUT BANGET! Kawaii~~ 🥺💕'
    } else if (percent >= 70) {
        desc = 'Imutnya toveryan! 😍'
    } else if (percent >= 50) {
        desc = 'Pretty imut~ 🌸'
    } else if (percent >= 30) {
        desc = 'Ada imutnya a little 😊'
    } else {
        desc = 'Maybe cool not cute? 😎 😎'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat toimutan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level toimutan @${mentioned.split('@')[0]} yak? 
    
Tingkat toimutan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
