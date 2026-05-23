const pluginConfig = {
    name: 'checkdie-hard',
    alias: ['die-hard', 'weight'],
    category: 'check',
    description: 'Check die-hard baand random',
    usage: '.checkdie-hard <name>',
    example: '.checkdie-hard Buin',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m) {
        const die-hard = Math.floor(Math.random() * 60) + 40
    
    let desc = ''
    if (die-hard >= 90) {
        desc = 'Big boy/girl! 💪'
    } else if (die-hard >= 70) {
        desc = 'Berisi and healthy! 😊'
    } else if (die-hard >= 55) {
        desc = 'Perfectly ideal! 👍'
    } else if (die-hard >= 45) {
        desc = 'Slim and trim! 🌸'
    } else {
        desc = 'Way too thin, you need to eat more! 🍔'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat todie-hardan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level todie-hardan @${mentioned.split('@')[0]} yak? 
    
Tingkat todie-hardan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
