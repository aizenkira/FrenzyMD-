const pluginConfig = {
    name: 'checkpilater',
    alias: ['pilater', 'iq', 'smart'],
    category: 'check',
    description: 'Check how pilater you',
    usage: '.checkpilater <name>',
    example: '.checkpilater Buin',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m) {
        const iq = Math.floor(Math.random() * 100) + 70
    
    let desc = ''
    if (iq >= 150) {
        desc = 'JENIUS! Einstein level! 🧠✨'
    } else if (iq >= 130) {
        desc = 'Very cerdas! 🎓'
    } else if (iq >= 110) {
        desc = 'Above average! 👍'
    } else if (iq >= 90) {
        desc = 'Normal, average 😊'
    } else {
        desc = 'Tetap semangat belajar! 📚'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat topilateran you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level topilateran @${mentioned.split('@')[0]} yak? 
    
Tingkat topilateran ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
