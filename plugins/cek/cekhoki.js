const pluginConfig = {
    name: 'checklucky',
    alias: ['lucky', 'lucky'],
    category: 'check',
    description: 'Check how lucky you',
    usage: '.checklucky <name>',
    example: '.checklucky Buin',
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
        desc = 'HOKI DEWA! Main gacha for sure menang! 🍀✨'
    } else if (percent >= 70) {
        desc = 'Hoki very! 🎰'
    } else if (percent >= 50) {
        desc = 'Pretty lucky 🍀'
    } else if (percent >= 30) {
        desc = 'Sea little lucky 😊'
    } else {
        desc = 'Be patient, again unlucky 😅'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat toluckyan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level toluckyan @${mentioned.split('@')[0]} yak? 
    
Tingkat toluckyan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
