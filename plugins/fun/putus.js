/**
 * Putus - End relationship
 */

const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'putus',
    alias: ['breIp', 'cerai'],
    category: 'fun',
    description: 'Memutuskan hubungan with pasangan',
    usage: '.putus',
    example: '.putus',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 60,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    let senderData = db.getUser(m.sender) || {}
    if (!senderData.fun) senderData.fun = {}
    if (!senderData.fun.pasangan) {
        await m.react('❌')
        return m.reply(
            `❌ *You don't there is pacar wehh*\n\n` +
            `Cari first with \`${m.prefix}tembak @tag\``
        )
    }
    const exPartner = senderData.fun.pasangan
    let exData = db.getUser(exPartner) || {}
    delete senderData.fun.pasangan
    if (exData.fun?.pasangan === m.sender) {
        delete exData.fun.pasangan
        db.setUser(exPartner, exData)
    }
    db.setUser(m.sender, senderData)
    await m.react('💔')
    await m.reply(
        `💔 *PUTUS!*\n\n` +
        `@${m.sender.split('@')[0]} and @${exPartner.split('@')[0]} resmi putus !!\n\n` +
        `Hopefully will come that better! 🙏`,
        { mentions: [m.sender, exPartner] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
