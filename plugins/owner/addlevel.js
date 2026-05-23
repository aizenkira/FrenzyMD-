const { getDatabase } = require('../../src/lib/frenzy-database')
const { calculateLevel, getRole } = require('./../../src/lib/frenzy-level')

const pluginConfig = {
    name: 'addlevel',
    alias: ['addlevel', 'givelevel', 'addlvl'],
    category: 'owner',
    description: 'Add level user (via exp)',
    usage: '.addlevel <amount> @user',
    example: '.addlevel 5 @user',
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
            `📊 *ᴀᴅᴅ ʟᴇᴠᴇʟ*\n\n` +
            `╭┈┈⬡「 📋 *ᴜsᴀɢᴇ* 」\n` +
            `┃ > \`.addlevel <amount>\` - to yourself\n` +
            `┃ > \`.addlevel <amount> @user\` - to other people\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> Example: \`${m.prefix}addlevel 5\``
        )
    }
    
    if (levels <= 0) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Amount level must lebih from 0`)
    }
    
    const user = db.getUser(targetJid) || db.setUser(targetJid)
    
    const oldLevel = calculateLevel(user.exp || 0)
    const expToAdd = levels * 20000
    
    const levelHelper = require('../../src/lib/frenzy-level')
    const addResult = await levelHelper.addExpWithLevelCheck(sock, m, db, user, expToAdd)
    
    m.react('✅')
    
    await m.reply(
        `✅ Success adding level to *@${targetJid.split('@')[0]}* \n\nThey now have *${addResult.newLevel || calculateLevel(user.exp)}* level. and has role *${getRole(addResult.newLevel || calculateLevel(user.exp))}*`,
        { mentions: [targetJid] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
