const pluginConfig = {
    name: 'checkpatient',
    alias: ['patient', 'patience'],
    category: 'check',
    description: 'Check level topatientan you',
    usage: '.checkpatient <name>',
    example: '.checkpatient Buin',
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
    if (percent >= 90) desc = 'Be patient level dewa! Zen master~ 🧘'
    else if (percent >= 70) desc = 'Very patient! Commendable 👏'
    else if (percent >= 50) desc = 'Pretty patient 😊'
    else if (percent >= 30) desc = 'Kaandg emosian a little 😅'
    else desc = 'Quick to anger ... 😤'
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat topatientan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level topatientan @${mentioned.split('@')[0]} yak? 
    
Tingkat topatientan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
