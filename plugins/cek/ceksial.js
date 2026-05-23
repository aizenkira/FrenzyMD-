const pluginConfig = {
    name: 'checkunlucky',
    alias: ['unlucky', 'unlucky'],
    category: 'check',
    description: 'Check how unlucky you',
    usage: '.checkunlucky <name>',
    example: '.checkunlucky Buin',
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
        desc = 'SIAL BANGET! Meninng in rumah aja! 😭'
    } else if (percent >= 70) {
        desc = 'Unlucky again ~ 😢'
    } else if (percent >= 50) {
        desc = 'Pretty unlucky 😓'
    } else if (percent >= 30) {
        desc = 'Sea little unlucky 😕'
    } else {
        desc = 'Don't be unlucky, be lucky! 🍀'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tounluckyan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tounluckyan @${mentioned.split('@')[0]} yak? 
    
Tingkat tounluckyan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
