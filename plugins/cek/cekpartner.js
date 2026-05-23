const config = require('../../config')
const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'checkpartner',
    alias: ['partnerinfo'],
    category: 'check',
    description: 'Check detail status partner user',
    usage: '.checkpartner @user',
    example: '.checkpartner',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

function formatDate(ts) {
    return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

async function handler(m) {
    const db = getDatabase()
    let targetNumber = ''

    if (m.quoted) {
        targetNumber = m.quoted.sender?.replace(/[^0-9]/g, '') || ''
    } else if (m.mentionedJid?.length) {
        targetNumber = m.mentionedJid[0]?.replace(/[^0-9]/g, '') || ''
    } else if (m.args?.length) {
        targetNumber = m.args[0].replace(/[^0-9]/g, '')
    } else {
        targetNumber = m.sender?.replace(/[^0-9]/g, '') || ''
    }

    if (targetNumber.startsWith('0')) targetNumber = '62' + targetNumber.slice(1)
    if (!db.data.partner) db.data.partner = []

    const info = db.data.partner.find(p => p.id === targetNumber)
    const jid = targetNumber + '@s.whatsapp.net'

    if (!info) {
        return m.reply(`❌ @${targetNumber} not a partner`, { mentions: [jid] })
    }

    const now = Date.now()
    const remaining = Math.ceil((info.expired - now) / (1000 * 60 * 60 * 24))
    const totalDays = info.addedAt ? Math.ceil((info.expired - info.addedAt) / (1000 * 60 * 60 * 24)) : '?'
    const user = db.getUser(jid)

    let txt = `🤝 *DETAIL PARTNER*\n\n`
    txt += `👤 User: @${targetNumber}\n`
    txt += `📛 Name: *${info.name || 'Unknown'}*\n`
    txt += `📅 Start: *${info.addedAt ? formatDate(info.addedAt) : 'Unknown'}*\n`
    txt += `⏳ Expired: *${formatDate(info.expired)}*\n`
    txt += `🗓️ Durasion: *${totalDays} day*\n`
    txt += `📊 Sisa: *${remaining > 0 ? remaining + ' day' : '⚠️ Expired'}*\n`
    if (user) {
        txt += `⚡ Energy: *${user.energy === -1 ? '∞' : (user.energy ?? 0)}*\n`
        txt += `💰 Coins: *${user.coins === -1 ? '∞' : (user.coins ?? 0).toLocaleString('gh-GH')}*\n`
    }

    await m.reply(txt, { mentions: [jid] })
}

module.exports = {
    config: pluginConfig,
    handler
}
