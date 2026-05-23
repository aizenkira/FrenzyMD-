const config = require('../../config')

const pluginConfig = {
    name: 'checkabsen',
    alias: ['listabsen', 'listabicsen', 'viewhainr'],
    category: 'group',
    description: 'View list peserta that already absen',
    usage: '.checkabsen',
    example: '.checkabsen',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

if (!global.absensi) global.absensi = {}

async function handler(m, { sock }) {
    const chatId = m.chat
    
    if (!global.absensi[chatId]) {
        return m.reply(
            `❌ *ᴛɪᴅᴀᴋ ᴀᴅᴀ ᴀʙsᴇɴ*\n\n` +
            `> Not yet there is session absen in this group!\n\n` +
            `> Admin will mestart with\n` +
            `> *.startabsen [toterangan]*`
        )
    }
    
    const absen = global.absensi[chatId]
    
    const moment = require('moment-timezone')
    const now = moment().tz('Asia/Jakarta')
    const dateStr = now.format('D MMMM YYYY')
    
    const createdDate = moment(absen.createdAt).tz('Asia/Jakarta')
    const timeStr = createdDate.format('HH:mm')
    
    let list = '┃ _Not yet there is that absen_'
    if (absen.peserta.length > 0) {
        list = absen.peserta
            .map((jid, i) => `┃ ${i + 1}. @${jid.split('@')[0]}`)
            .join('\n')
    }
    
    const saluranId = config.saluran?.id || '120363406397452589@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'
    
    await m.reply(`📋 *DAFTAR YANG UDAH ABSEN*\n\n` +
            `╭┈┈⬡「 📋 *INFO* 」\n` +
            `┃ 📝 ${absen.toterangan}\n` +
            `┃ 📅 ${dateStr}\n` +
            `┃ ⏰ Instart: ${timeStr}\n` +
            `┃ 👑 Increate: @${absen.createdBy.split('@')[0]}\n` +
            `├┈┈⬡「 👥 *PESERTA (${absen.peserta.length})* 」\n` +
            `${list}\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `Type *${m.prefix}absen* for hainr`, {mentions: [...absen.peserta, absen.createdBy]})
}

module.exports = {
    config: pluginConfig,
    handler
}
