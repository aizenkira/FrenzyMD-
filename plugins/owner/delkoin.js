const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'delcoins',
    alias: ['reducecoins', 'removecoins', 'delcoin', 'delmoney'],
    category: 'owner',
    description: 'Low oni coins user',
    usage: '.delcoins <amount> @user',
    example: '.delcoins 50000 @user',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
}

function formatCoins(num) {
    if (num >= 1000000000000) return (num / 1000000000000).toFixed(2) + 'T'
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B'
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function extractTarget(m) {
    if (m.quoted) return m.quoted.sender
    if (m.mentionedJid?.length) return m.mentionedJid[0]
    return null
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args
    
    const numArg = args.find(a => !isNaN(a) && !a.startsWith('@'))
    const amount = parseInt(numArg) || 0
    
    let targetJid = extractTarget(m)
    
    if (!targetJid && amount > 0) {
        targetJid = m.sender
    }
    
    if (!targetJid || amount <= 0) {
        return m.reply(
            `💰 *ᴅᴇʟ ᴋᴏɪɴ*\n\n` +
            `> \`.delcoins <amount>\` - from self yourself\n` +
            `> \`.delcoins <amount> @user\` - from user\n\n` +
            `\`Example: ${m.prefix}delcoins 50000\``
        )
    }
    
    if (amount <= 0) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Amount must lebih from 0`)
    }
    
    const user = db.getUser(targetJid)
    
    if (!user) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> User not found in database`)
    }
    
    const newCoins = db.updateCoins(targetJid, -amount)
    
    m.react('✅')
    
    await m.reply(
        `✅ *ᴋᴏɪɴ ᴅɪᴋᴜʀᴀɴɢɪ*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 👤 ᴜsᴇʀ: @${targetJid.split('@')[0]}\n` +
        `┃ ➖ ᴋᴜʀᴀɴɢ: *-${formatCoins(amount)}*\n` +
        `┃ 💰 sɪsᴀ: *${formatCoins(newCoins)}*\n` +
        `╰┈┈⬡`,
        { mentions: [targetJid] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
