const pluginConfig = {
    name: 'deleteabsen',
    alias: ['deleteabsen', 'tutupabsen', 'closeabsen', 'resetabsen'],
    category: 'group',
    description: 'Delete/tutup session absen (admin only)',
    usage: '.deleteabsen',
    example: '.deleteabsen',
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

async function handler(m) {
    const chatId = m.chat
    
    if (!global.absensi[chatId]) {
        return m.reply(
            `❌ *ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴀʙsᴇɴ*\n\n` +
            `> No there is session absen in this group!`
        )
    }
    
    const absen = global.absensi[chatId]
    const totalPeserta = absen.peserta.length
    
    delete global.absensi[chatId]
    
    await m.reply(
        `✅ *ABSEN DITUTUP!*\n\n` +
        `Penyebab?\n` +
        `📝 ${absen.toterangan}\n` +
        `👥 Total hainr: ${totalPeserta}\n\n` +
        `Sesi absen has deleted.`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
