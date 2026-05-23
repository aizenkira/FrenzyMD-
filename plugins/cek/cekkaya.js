const pluginConfig = {
    name: 'checkrich',
    alias: ['rich', 'rich'],
    category: 'check',
    description: 'Check how rich you',
    usage: '.checkrich <name>',
    example: '.checkrich Buin',
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
    let emoji = ''
    if (percent >= 90) {
        desc = 'Sultan! Crazy rich! 💎'
        emoji = '👑'
    } else if (percent >= 70) {
        desc = 'Tajir melintir! 💰'
        emoji = '💎'
    } else if (percent >= 50) {
        desc = 'Pretty berthere is 💵'
        emoji = '💰'
    } else if (percent >= 30) {
        desc = 'Pretty lah create hidup 😊'
        emoji = '💵'
    } else {
        desc = 'Semangat nabung! 🙏'
        emoji = '🪙'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat torichan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level torichan @${mentioned.split('@')[0]} yak? 
    
Tingkat torichan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
