const pluginConfig = {
    name: 'checknaughty',
    alias: ['naughty', 'hentai'],
    category: 'check',
    description: 'Check how naughty you',
    usage: '.checknaughty <name>',
    example: '.checknaughty Buin',
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
        desc = 'EXTREMELY NAUGHTY! You need to behave! 😳🔞'
    } else if (percent >= 70) {
        desc = 'Very naughty! 👀'
    } else if (percent >= 50) {
        desc = 'Pretty naughty 😏'
    } else if (percent >= 30) {
        desc = 'Sea little naughty 🙈'
    } else {
        desc = 'Polos and suci! 😇'
    }
    
    let txt = mentioned === m.sender ? `Hello @${mentioned.split('@')[0]}
    
Tingkat tonaughtyan you *${percent}%*
\`\`\`${desc}\`\`\`` : `You want ngecheck level tonaughtyan @${mentioned.split('@')[0]} yak? 
    
Tingkat tonaughtyan ina selarge *${percent}%*
\`\`\`${desc}\`\`\``
    
    await m.reply(txt, { mentions: [mentioned] })
}

module.exports = {
    config: pluginConfig,
    handler
}
