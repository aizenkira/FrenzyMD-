const pluginConfig = {
    name: 'checkmatch/soulmate',
    alias: ['match/soulmate', 'match'],
    category: 'check',
    description: 'Check tococokan match/soulmate',
    usage: '.checkmatch/soulmate <name1> & <name2>',
    example: '.checkmatch/soulmate Buin & Ani',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m) {
    const input = m.text?.trim() || ''
    const parts = input.split(/[&,]/).map(s => s.trim()).filter(s => s)
    
    if (parts.length < 2) {
        return m.reply(`💕 *ᴄᴇᴋ ᴊᴏᴅᴏʜ*\n\n> Enter 2 name!\n\n> Example: ${m.prefix}checkmatch/soulmate Buin & Ani`)
    }
    
    const percent = Math.floor(Math.random() * 101)
    const mentioned = m.mentionedJid[0] || m.sender
                    
    let desc = ''
    if (percent >= 90) {
        desc = 'Jodoh very! Just get married already! 💍'
    } else if (percent >= 70) {
        desc = 'Cocok very! 💕'
    } else if (percent >= 50) {
        desc = 'Pretty cocok~ 😊'
    } else if (percent >= 30) {
        desc = 'Hmm, perlu usaha lebih 🤔'
    } else {
        desc = 'Maybe search for another one? 😅'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tomatch/soulmatean you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tomatch/soulmatean @${mentioned.split('@')[0]} yak? 
    
Tingkat tomatch/soulmatean ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
