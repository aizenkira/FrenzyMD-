const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'addcoins',
    alias: ['addcoins', 'givecoins', 'addcoin', 'adddcoin'],
    category: 'owner',
    description: 'Add coins user (max 9 Triliun)',
    usage: '.addcoins <amount> @user',
    example: '.addcoins 100000 @user',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
}

const MAX_KOIN = 9000000000000

function formatCoins(num) {
    if (num === -1) return '∞ Unlimited'
    if (num >= 1000000000000) return (num / 1000000000000).toFixed(2) + 'T'
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B'
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []

    const numArg = args.find(a => !isNaN(a) && !a.startsWith('@'))
    let amount = parseInt(numArg) || 0

    let targetJid = null
    if (m.quoted) {
        targetJid = m.quoted.sender
    } else if (m.mentionedJid?.length) {
        targetJid = m.mentionedJid[0]
    }

    if (!targetJid && amount > 0) {
        targetJid = m.sender
    }

    if (!targetJid || amount <= 0) {
        return m.reply(
            `💰 *ᴀᴅᴅ ᴋᴏɪɴ*\n\n` +
            `> \`.addcoins <amount>\` - to yourself\n` +
            `> \`.addcoins <amount> @user\` - to other people\n` +
            `> Max: 9.000.000.000.000 (9T)\n\n` +
            `\`Example: ${m.prefix}addcoins 100000\``
        )
    }

    if (amount > MAX_KOIN) amount = MAX_KOIN

    const user = db.getUser(targetJid) || db.setUser(targetJid)

    if (user.coins === -1) {
        return m.reply(
            `💰 *INFORMATION*\n` +
            `@${targetJid.split('@')[0]} already has coins *∞ Unlimited*\n` +
            `No perlu added coins again`,
            { mentions: [targetJid] }
        )
    }

    const newCoins = db.updateCoins(targetJid, amount)

    m.react('✅')
    await m.reply(
        `✅ Success added coins *@${targetJid.split('@')[0]}* semany *${formatCoins(amount)}*`,
        { mentions: [targetJid] }
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
