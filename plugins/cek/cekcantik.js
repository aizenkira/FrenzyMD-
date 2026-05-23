const pluginConfig = {
    name: 'checkgorgeous',
    alias: ['gorgeous', 'beautiful'],
    category: 'check',
    description: 'Check how gorgeous you',
    usage: '.checkgorgeous <name>',
    example: '.checkgorgeous Ani',
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
        desc = 'Absolutely gorgeous! 👸✨'
    } else if (percent >= 70) {
        desc = 'Absolutely beautiful! 💕'
    } else if (percent >= 50) {
        desc = 'Manis and gorgeous~ 🌸'
    } else if (percent >= 30) {
        desc = 'Pretty gorgeous 😊'
    } else {
        desc = 'Tetep gorgeous kok! 💖'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat togorgeousan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level togorgeousan @${mentioned.split('@')[0]} yak? 
    
Tingkat togorgeousan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
