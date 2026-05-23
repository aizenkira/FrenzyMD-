const pluginConfig = {
    name: 'checkgacha',
    alias: ['gacha', 'luck'],
    category: 'check',
    description: 'Luck check gacha you',
    usage: '.checkgacha <name>',
    example: '.checkgacha Buin',
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
    if (percent >= 90) desc = 'HOKI PARAH! SSR GUARANTEED! ✨💎'
    else if (percent >= 70) desc = 'Lucky! You will definitely get an SR! 🍀'
    else if (percent >= 50) desc = 'Hoki-lucky a little 😊'
    else if (percent >= 30) desc = 'Hmm... pray harder! 🙏'
    else desc = 'SIAL! Later aja gaconly! 💔'
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat togachaan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level togachaan @${mentioned.split('@')[0]} yak? 
    
Tingkat togachaan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = { config: pluginConfig, handler }
