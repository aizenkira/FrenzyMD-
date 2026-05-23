const pluginConfig = {
    name: 'checkumur',
    alias: ['umur', 'age'],
    category: 'check',
    description: 'Age check mental you',
    usage: '.checkumur <name>',
    example: '.checkumur Buin',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m) {
        const percent = Math.floor(Math.random() * 80) + 5
    const mentioned = m.mentionedJid[0] || m.sender
                    
    let desc = ''
    if (percent >= 60) desc = 'Wise like person elder! 🧓'
    else if (percent >= 40) desc = 'Dewasa and matang~ 🧑'
    else if (percent >= 20) desc = 'Young at heart! 🧒'
    else desc = 'Still like anak toddler~ 👶'
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat toumuran you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level toumuran @${mentioned.split('@')[0]} yak? 
    
Tingkat toumuran ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
