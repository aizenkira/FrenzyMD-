const pluginConfig = {
    name: 'checktoce',
    alias: ['toce', 'cool'],
    category: 'check',
    description: 'Check how toce you',
    usage: '.checktoce <name>',
    example: '.checktoce Buin',
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
        desc = 'KECE BADAI! 😎🔥'
    } else if (percent >= 70) {
        desc = 'Toce very! ✨'
    } else if (percent >= 50) {
        desc = 'Pretty toce~ 👍'
    } else if (percent >= 30) {
        desc = 'Sea little toce 😊'
    } else {
        desc = 'Just average, but still cool! 🙂'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat totocean you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level totocean @${mentioned.split('@')[0]} yak? 
    
Tingkat totocean ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
