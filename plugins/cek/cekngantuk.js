const pluginConfig = {
    name: 'checksleepy',
    alias: ['sleepy', 'sleepy'],
    category: 'check',
    description: 'Check level sleepy you',
    usage: '.checksleepy <name>',
    example: '.checksleepy Buin',
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
    if (percent >= 90) desc = 'ZZZZZ... Tidur there! 😴💤'
    else if (percent >= 70) desc = 'Eyes barely open ~ 😪'
    else if (percent >= 50) desc = 'Adon't sleepy a little 🥱'
    else if (percent >= 30) desc = 'Still fresh! ☕'
    else desc = 'Melek very! Insomnia? 👀'
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tosleepyan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tosleepyan @${mentioned.split('@')[0]} yak? 
    
Tingkat tosleepyan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
