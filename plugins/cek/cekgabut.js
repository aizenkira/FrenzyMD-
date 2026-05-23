const pluginConfig = {
    name: 'checkbored',
    alias: ['bored', 'bored'],
    category: 'check',
    description: 'Check level toBoredan you',
    usage: '.checkbored <name>',
    example: '.checkbored Buin',
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
    if (percent >= 90) desc = 'MAX BOREDOM LEVEL! Just play with the bot~ 🥱'
    else if (percent >= 70) desc = 'Seriously bored! 😴'
    else if (percent >= 50) desc = 'Pretty bored 😅'
    else if (percent >= 30) desc = 'Not that busy 📝'
    else desc = 'Super busy! Very productive! 💼'
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat toboredan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level toboredan @${mentioned.split('@')[0]} yak? 
    
Tingkat toboredan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
