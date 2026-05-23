const pluginConfig = {
    name: 'checkkpopers',
    alias: ['kpopers', 'kpop'],
    category: 'check',
    description: 'Check level kpopers you',
    usage: '.checkkpopers <name>',
    example: '.checkkpopers Buin',
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
    if (percent >= 90) desc = 'ARMY/BLINK level max! 💜💗'
    else if (percent >= 70) desc = 'Die-hard fan ! 🎤'
    else if (percent >= 50) desc = 'Casual listener~ 🎵'
    else if (percent >= 30) desc = 'Tau a little-a little aja 😅'
    else desc = 'Bukan kpopers 🤷'
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tokpopersan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tokpopersan @${mentioned.split('@')[0]} yak? 
    
Tingkat tokpopersan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
