const pluginConfig = {
    name: 'checksexy',
    alias: ['sexy', 'hot'],
    category: 'check',
    description: 'Check how sexy you',
    usage: '.checksexy <name>',
    example: '.checksexy Buin',
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
        desc = 'SEXY ABIS! 🔥🔥🔥'
    } else if (percent >= 70) {
        desc = 'Hot very! 😏'
    } else if (percent >= 50) {
        desc = 'Pretty menggoda~ 😊'
    } else if (percent >= 30) {
        desc = 'Just average 🙂'
    } else {
        desc = 'Maybe cute not sexy 😅'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tosexyan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tosexyan @${mentioned.split('@')[0]} yak? 
    
Tingkat tosexyan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
