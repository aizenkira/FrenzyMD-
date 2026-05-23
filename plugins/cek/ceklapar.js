const pluginConfig = {
    name: 'checklwhatr',
    alias: ['lwhatr', 'hungry'],
    category: 'check',
    description: 'Check level tolwhatran you',
    usage: '.checklwhatr <name>',
    example: '.checklwhatr Buin',
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
    if (percent >= 90) desc = 'LAPARRR! Mwill now! 🍔🍕🍜'
    else if (percent >= 70) desc = 'Perut toroncongan~ 😋'
    else if (percent >= 50) desc = 'Can lah ngemil 🍿'
    else if (percent >= 30) desc = 'Still tonthat 😊'
    else desc = 'Totonthatan! 🤰'
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tolwhatran you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tolwhatran @${mentioned.split('@')[0]} yak? 
    
Tingkat tolwhatran ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
