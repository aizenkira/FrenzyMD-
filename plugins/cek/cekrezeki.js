const pluginConfig = {
    name: 'checkfortune',
    alias: ['fortune', 'fortune'],
    category: 'check',
    description: 'Check your fortune level today',
    usage: '.checkfortune <name>',
    example: '.checkfortune Buin',
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
    if (percent >= 90) desc = 'Income/fortune melimpah! Jackpot! 💰🎉'
    else if (percent >= 70) desc = 'Income/fortune lancar today~ 💵'
    else if (percent >= 50) desc = 'Income is enough, be grateful 🙏'
    else if (percent >= 30) desc = 'Income/fortune pas-pasan 😅'
    else desc = 'Be patient, fortune will come~ 🫂'
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tofortunean you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tofortunean @${mentioned.split('@')[0]} yak? 
    
Tingkat tofortunean ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
