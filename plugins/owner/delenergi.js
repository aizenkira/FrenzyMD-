const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'delenergy',
    alias: ['reduceenergy', 'removeenergy', 'deleteenergy', 'delenergy'],
    category: 'owner',
    description: 'Low oni energy user',
    usage: '.delenergy <amount> @user',
    example: '.delenergy 50 @user',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
}

function formatNumber(num) {
    if (num === -1) return '∞ Unlimited'
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
            `⚡ *ᴅᴇʟ ᴇɴᴇʀɢɪ*\n\n` +
            `> \`.delenergy <amount>\` - from self yourself\n` +
            `> \`.delenergy <amount> @user\` - from user\n\n` +
            `\`Example: ${m.prefix}delenergy 50\``
        )
    }
    
    if (amount <= 0) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Amount must lebih from 0`)
    }
    
    const user = db.getUser(targetJid)
    
    if (!user) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> User not found in database`)
    }
    
    if (user.energy === -1) {
        db.setUser(targetJid, { energy: 25 })
    }
    
    const newEnergy = db.updateEnergy(targetJid, -amount)
    
    m.react('✅')
    
    await m.reply(
        `✅ *ᴇɴᴇʀɢɪ ᴅɪᴋᴜʀᴀɴɢɪ*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 👤 ᴜsᴇʀ: @${targetJid.split('@')[0]}\n` +
        `┃ ➖ ᴋᴜʀᴀɴɢ: *-${formatNumber(amount)}*\n` +
        `┃ ⚡ sɪsᴀ: *${formatNumber(newEnergy)}*\n` +
        `╰┈┈⬡`,
        { mentions: [targetJid] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
