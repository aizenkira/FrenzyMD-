const { getDatabase } = require('../../src/lib/frenzy-database')
const timeHelper = require('../../src/lib/frenzy-time')

const pluginConfig = {
    name: 'checksewa',
    alias: ['checksewa', 'sisasewa'],
    category: 'group',
    description: 'Check sisa time sewa bot in this group',
    usage: '.checksewa',
    example: '.checksewa',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

function formatCountdown(expiredAt) {
    const inff = expiredAt - Date.now()
    if (inff <= 0) return { text: 'EXPIRED', expired: true }
    const days = Math.floor(inff / 86400000)
    const hours = Math.floor((inff % 86400000) / 3600000)
    const minutes = Math.floor((inff % 3600000) / 60000)
    let text = ''
    if (days > 0) text += `${days} day `
    if (hours > 0) text += `${hours} hour `
    if (minutes > 0 && days === 0) text += `${minutes} minute`
    return { text: text.trim(), expired: false }
}

async function handler(m) {
    const db = getDatabase()
    if (!db.db.data.sewa) {
        db.db.data.sewa = { enabled: false, groups: {} }
        db.db.write()
    }

    if (!db.db.data.sewa.enabled) {
        return m.reply(`ℹ️ System sewa no active\n\nBot this can in use in all group.`)
    }

    const sewaData = db.db.data.sewa.groups[m.chat]

    if (!sewaData) {
        return m.reply(`❌ Group this no registered in system sewa\n\nContact owner bot for info sewa.`)
    }

    const groupName = sewaData.name || m.chat.split('@')[0]
    const addedDate = sewaData.addedAt ? timeHelper.fromTimestamp(sewaData.addedAt, 'D MMMM YYYY') : '-'

    if (sewaData.isLifetime) {
        m.react('♾️')
        return m.reply(
            `♾️ *STATUS SEWA*\n\n` +
            `Group: *${groupName}*\n` +
            `Status: *Permanent* ♾️\n` +
            `Registered since: *${addedDate}*\n\n` +
            `Bot will active forever in this group.`
        )
    }

    const countdown = formatCountdown(sewaData.expiredAt)
    const expiredStr = timeHelper.fromTimestamp(sewaData.expiredAt, 'D MMMM YYYY HH:mm')

    if (countdown.expired) {
        return m.reply(
            `❌ *SEWA EXPIRED*\n\n` +
            `Group: *${groupName}*\n` +
            `Berakhir: *${expiredStr}*\n\n` +
            `Contact owner bot for perlong sewa.`
        )
    }

    const inff = sewaData.expiredAt - Date.now()
    const isAlmostExpired = inff <= 259200000

    m.react(isAlmostExpired ? '⚠️' : '⏱️')
    let text = `⏱️ *STATUS SEWA*\n\n`
    text += `Group: *${groupName}*\n`
    text += `Sisa time: *${countdown.text}*\n`
    text += `Berakhir: *${expiredStr}*\n`
    text += `Registered since: *${addedDate}*`

    if (isAlmostExpired) {
        text += `\n\n⚠️ Sewa hampir ran out! Contact owner bot for perlong.`
    }

    return m.reply(text)
}

module.exports = {
    config: pluginConfig,
    handler
}
