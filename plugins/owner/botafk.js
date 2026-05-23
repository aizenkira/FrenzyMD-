const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'botafk',
    alias: ['afkbot', 'afkmode'],
    category: 'owner',
    description: 'Mode AFK for bot - bot no merespon command, only reply message AFK',
    usage: '.botafk <alasan>',
    example: '.botafk Again rest',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const currentAfk = db.setting('botAfk')
    
    if (currentAfk && currentAfk.active) {
        db.setting('botAfk', { active: false })
        m.react('✅')
        
        const afkDuration = Date.now() - currentAfk.since
        const duration = formatDuration(afkDuration)
        
        return m.reply(
            `✅ *ʙᴏᴛ ᴋᴇᴍʙᴀʟɪ ᴏɴʟɪɴᴇ*\n\n` +
            `╭┈┈⬡「 📊 *sᴛᴀᴛɪsᴛɪᴋ ᴀꜰᴋ* 」\n` +
            `┃ ⏱️ ᴅᴜʀᴀsɪ: \`${duration}\`\n` +
            `┃ 📝 ᴀʟᴀsᴀɴ: \`${currentAfk.reason || '-'}\`\n` +
            `╰┈┈⬡\n\n` +
            `> Bot ready to receive commands!`
        )
    } else {
        const reason = m.args.join(' ') || 'AFK'
        
        db.setting('botAfk', {
            active: true,
            reason: reason,
            since: Date.now()
        })
        
        m.react('💤')
        return m.reply(
            `💤 *ʙᴏᴛ ᴀꜰᴋ ᴀᴋᴛɪꜰ*\n\n` +
            `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
            `┃ 📝 ᴀʟᴀsᴀɴ: \`${reason}\`\n` +
            `┃ ⏰ sᴇᴊᴀᴋ: \`${require('moment-timezone')().tz('Asia/Jakarta').format('HH:mm:ss')}\`\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 🔒 *ᴀᴋsᴇs* 」\n` +
            `┃ ✅ Owner bot\n` +
            `┃ ✅ Bot yourself (fromMe)\n` +
            `┃ ❌ All other users\n` +
            `╰┈┈⬡\n\n` +
            `> User else will will message AFK\n` +
            `> Type \`${m.prefix}botafk\` for again online`
        )
    }
}

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    
    if (days > 0) return `${days} day ${hours % 24} hour`
    if (hours > 0) return `${hours} hour ${minutes % 60} minute`
    if (minutes > 0) return `${minutes} minute ${seconds % 60} second`
    return `${seconds} second`
}

module.exports = {
    config: pluginConfig,
    handler
}
