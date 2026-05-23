const { getDatabase } = require('../../src/lib/frenzy-database')
const { getRpgContextInfo } = require('../../src/lib/frenzy-context')

const pluginConfig = {
    name: 'leveluprpg',
    alias: ['lvluprpg', 'rpglevelup'],
    category: 'rpg',
    description: 'Toggle notification level up RPG',
    usage: '.leveluprpg <on/off>',
    example: '.leveluprpg on',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const args = m.args || []
    const sub = args[0]?.toLowerCase()
    
    if (!user.settings) user.settings = {}
    
    if (sub === 'on') {
        user.settings.rpgLevelupNotif = true
        db.save()
        return m.reply(
            `✅ *ʀᴘɢ ʟᴇᴠᴇʟ ᴜᴘ ɴᴏᴛɪꜰ*\n\n` +
            `> Status: *ON* ✅\n` +
            `> You will receive a notification RPG when leveling up!`
        )
    }
    
    if (sub === 'off') {
        user.settings.rpgLevelupNotif = false
        db.save()
        return m.reply(
            `❌ *ʀᴘɢ ʟᴇᴠᴇʟ ᴜᴘ ɴᴏᴛɪꜰ*\n\n` +
            `> Status: *OFF* ❌\n` +
            `> Notifikasi RPG level up innonactivekan.`
        )
    }
    
    const status = user.settings.rpgLevelupNotif !== false ? 'ON ✅' : 'OFF ❌'
    return m.reply(
        `🔔 *ʀᴘɢ ʟᴇᴠᴇʟ ᴜᴘ ɴᴏᴛɪꜰ*\n\n` +
        `> Status currently: *${status}*\n\n` +
        `╭┈┈⬡「 📋 *ᴜsᴀɢᴇ* 」\n` +
        `┃ > \`.leveluprpg on\` - Activekan\n` +
        `┃ > \`.leveluprpg off\` - Nonactivekan\n` +
        `╰┈┈┈┈┈┈┈┈⬡`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
