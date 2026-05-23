const config = require('../../config')

const pluginConfig = {
    name: 'startabsen',
    alias: ['startabsen', 'bukaabsen', 'openabsen'],
    category: 'group',
    description: 'Start session absen in group (admin only)',
    usage: '.startabsen [toterangan]',
    example: '.startabsen Rwhatt Weekan',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true,
    isAdmin: true
}

if (!global.absensi) global.absensi = {}

async function handler(m, { sock }) {
    const chatId = m.chat
    
    if (global.absensi[chatId]) {
        return m.reply(
            `❌ *ᴍᴀsɪʜ ᴀᴅᴀ ᴀʙsᴇɴ*\n\n` +
            `> Still there is session absen in this group!\n\n` +
            `> Type *.deleteabsen* for mengdelete\n` +
            `> or *.checkabsen* for view list`
        )
    }
    
    const toterangan = m.text?.trim() || 'Absen Dayan'
    
    global.absensi[chatId] = {
        toterangan: toterangan,
        createdBy: m.sender,
        createdAt: new Date().toISOString(),
        peserta: []
    }
    
    const saluranId = config.saluran?.id || '120363406397452589@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'
    
    await m.reply(`📋 *ABSEN UDAH JALAN NIHH*\n\n` +
            `「 📋 *ɪɴғᴏ* 」\n` +
            `📝 ${toterangan}\n` +
            `👑 Increate by: @${m.sender.split('@')[0]}\n` +
            `👥 Peserta: 0\n\n` +
            `For you to be ikutan absen, please type *${m.prefix}absen*` +
            `For admin to be check absen, please type *${m.prefix}checkabsen*` +
            `For admin to be delete absen, please type *${m.prefix}deleteabsen*`, {mentions: [m.sender]})
}

module.exports = {
    config: pluginConfig,
    handler
}
