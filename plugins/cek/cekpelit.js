const pluginConfig = {
    name: 'checkpelit',
    alias: ['pelit', 'kikir'],
    category: 'check',
    description: 'Check how pelit you',
    usage: '.checkpelit <name>',
    example: '.checkpelit Buin',
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
        desc = 'SUPER PELIT! Duit injaga dead-deadan! 💸'
    } else if (percent >= 70) {
        desc = 'Pelit very! 🙊'
    } else if (percent >= 50) {
        desc = 'Pretty pelit 😅'
    } else if (percent >= 30) {
        desc: 'Sea little hemat 😊'
    } else {
        desc = 'Dermawan very! 🎁'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat topelitan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level topelitan @${mentioned.split('@')[0]} yak? 
    
Tingkat topelitan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
