const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'addenergy',
    alias: ['addenergy', 'giveenergy', 'addenergy'],
    category: 'owner',
    description: 'Add energy user',
    usage: '.addenergy <amount> @user',
    example: '.addenergy 100 @user',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
}

function formatNumber(num) {
    if (num === -1) return '∞ Unlimited'
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.args || []

    let amount = 0
    let isUnlimited = false
    let targetJid = null

    if (m.text?.toLowerCase().includes('--unlimited') || m.text?.toLowerCase().includes('--unli')) {
        isUnlimited = true
    }

    const numArg = args.find(a => !isNaN(a) && !a.includes('@') && !a.startsWith('-'))
    if (numArg) amount = parseInt(numArg)

    if (m.quoted) {
        targetJid = m.quoted.sender
    } else if (m.mentionedJid?.length) {
        targetJid = m.mentionedJid[0]
    } else {
        const phoneArg = args.find(a => a !== numArg && a.length > 5 && /^\d+$/.test(a.replace(/[^0-9]/g, '')))
        if (phoneArg) {
            targetJid = phoneArg.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
        }
    }

    if (!targetJid && (amount > 0 || isUnlimited)) {
        targetJid = m.sender
    }

    if (!targetJid || (!isUnlimited && amount <= 0)) {
        return m.reply(
            `⚡ *ᴀᴅᴅ ᴇɴᴇʀɢɪ*\n\n` +
            `> \`.addenergy <amount>\` - to yourself\n` +
            `> \`.addenergy <amount> @user\` - to user\n` +
            `> \`.addenergy --unlimited\` - unlimited\n\n` +
            `\`Example: ${m.prefix}addenergy 100\``
        )
    }

    const user = db.getUser(targetJid) || db.setUser(targetJid)
    const config = require('../../config')
    const effectiveUnlimited = user.energy === -1 ||
        (config.isOwner(targetJid) && (config.energy?.owner ?? -1) === -1) ||
        (config.isPremium(targetJid) && (config.energy?.premium ?? -1) === -1)

    if (!isUnlimited && effectiveUnlimited) {
        return m.reply(
            `⚡ *INFORMASI*\n` +
            `@${targetJid.split('@')[0]} already has energy *∞ Unlimited*\n` +
            `No perlu added energy again`,
            { mentions: [targetJid] }
        )
    }

    if (isUnlimited) {
        db.setUser(targetJid, { energy: -1 })

        m.react('✅')
        await m.reply(
            `✅ *Energy @${targetJid.split('@')[0]} now unlimited / no terlimit*`,
            { mentions: [targetJid] }
        )
    } else {
        const newEnergy = db.updateEnergy(targetJid, amount)

        m.react('✅')
        await m.reply(
            `✅ Energy *@${targetJid.split('@')[0]}* success received semany *${formatNumber(amount)}*!\nNow ina has *${formatNumber(newEnergy)}* energy`,
            { mentions: [targetJid] }
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
