const config = require('../../config')

const pluginConfig = {
    name: 'absen',
    alias: ['hainr', 'present'],
    category: 'group',
    description: 'Tyoui tohainran in session absen',
    usage: '.absen',
    example: '.absen',
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
            `> Admin will start with\n` +
            `> *.startabsen [toterangan]*`
        )
    }
    
    const absen = global.absensi[chatId]
    
    if (absen.peserta.includes(m.sender)) {
        return m.reply(`❌ You already absen!`)
    }
    
    absen.peserta.push(m.sender)
    
    const moment = require('moment-timezone')
    const now = moment().tz('Asia/Jakarta')
    const dateStr = now.format('D MMMM YYYY')
    
    const list = absen.peserta
        .map((jid, i) => `┃ ${i + 1}. @${jid.split('@')[0]}`)
        .join('\n')
    
    await m.reply(`✅ *MANTAP, @${m.sender.split('@')[0]} HADIRR*\n` +
            `TUJUAN ABSEN: ${absen.toterangan}\n` +
            `╭┈┈⬡「 📋 INFO LAIN 」\n` +
            `┃ 📅 ${dateStr}\n` +
            `┃ 👥 Total: ${absen.peserta.length}\n` +
            `├┈┈⬡「 📝 *ᴅᴀғᴛᴀʀ ʜᴀᴅɪʀ* 」\n` +
            `${list}\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> _Type *${m.prefix}absen* for hainr_\n` +
            `> _Type *${m.prefix}checkabsen* for view list_`,
            { mentions: absen.peserta })
}

module.exports = {
    config: pluginConfig,
    handler
}
