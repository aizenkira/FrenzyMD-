const { getDatabase } = require('../../src/lib/frenzy-database')
const { calculateLevel, getRole } = require('../user/level')

const pluginConfig = {
    name: 'dellevel',
    alias: ['reducelevel', 'removelevel', 'dellvl'],
    category: 'owner',
    description: 'Low oni level user (via exp)',
    usage: '.dellevel <amount> @user',
    example: '.dellevel 5 @user',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
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
    let levels = parseInt(numArg) || 0
    
    let targetJid = extractTarget(m)
    
    if (!targetJid && levels > 0) {
        targetJid = m.sender
    }
    
    if (!targetJid || levels <= 0) {
        return m.reply(
            `📊 *ᴅᴇʟ ʟᴇᴠᴇʟ*\n\n` +
            `╭┈┈⬡「 📋 *ᴜsᴀɢᴇ* 」\n` +
            `┃ > \`.dellevel <amount>\` - to yourself\n` +
            `┃ > \`.dellevel <amount> @user\` - to other people\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> Example: \`${m.prefix}dellevel 5\``
        )
    }
    
    const user = db.getUser(targetJid) || db.setUser(targetJid)
    if (!user.rpg) user.rpg = {}
    
    const oldLevel = calculateLevel(user.rpg.exp || 0)
    const expToRemove = levels * 20000
    user.rpg.exp = Math.max(0, (user.rpg.exp || 0) - expToRemove)
    const newLevel = calculateLevel(user.rpg.exp)
    
    db.save()
    m.react('✅')
    
    await m.reply(
        `✅ *ʟᴇᴠᴇʟ ᴅɪᴋᴜʀᴀɴɢɪ*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 👤 User: @${targetJid.split('@')[0]}\n` +
        `┃ ➖ Low on: *-${levels} Level*\n` +
        `┃ 🚄 Exp Removed: *-${expToRemove.toLocaleString('id-ID')}*\n` +
        `┃ 📊 Level: *${oldLevel} → ${newLevel}*\n` +
        `┃ ${getRole(newLevel)}\n` +
        `╰┈┈┈┈┈┈┈┈⬡`,
        { mentions: [targetJid] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
