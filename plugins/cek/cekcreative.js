const pluginConfig = {
    name: 'checkcreative',
    alias: ['creative', 'kreatif'],
    category: 'check',
    description: 'Check level kreativitas you',
    usage: '.checkcreative <name>',
    example: '.checkcreative Buin',
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
    if (percent >= 90) desc = 'SUPER KREATIF! Artis sejati! 🎨✨'
    else if (percent >= 70) desc = 'Super imaginative! 💡'
    else if (percent >= 50) desc = 'Pretty kreatif 😊'
    else if (percent >= 30) desc = 'Just average 🤔'
    else desc = 'Low on imagination 😅'
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tocreativean you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tocreativean @${mentioned.split('@')[0]} yak? 
    
Tingkat tocreativean ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
