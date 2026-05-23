const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')

const pluginConfig = {
    name: 'energy',
    alias: ['cetonergi', 'myenergy', 'energy', 'limit', 'checklimit'],
    category: 'user',
    description: 'Check energy user',
    usage: '.energy [@user]',
    example: '.energy',
    isOwner: false,
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
    
    let targetJid = m.sender
    let targetName = m.pushName || 'You'
    
    if (m.quoted) {
        targetJid = m.quoted.sender
        targetName = m.quoted.pushName || targetJid.split('@')[0]
    } else if (m.mentionedJid?.length) {
        targetJid = m.mentionedJid[0]
        targetName = targetJid.split('@')[0]
    }
    
    const user = db.getUser(targetJid) || db.setUser(targetJid)
    const isOwner = config.owner?.number?.includes(targetJid.replace(/[^0-9]/g, '')) || config.isOwner?.(targetJid)

    const dbToggle = db.setting('energy')
    const energyEnabled = dbToggle !== undefined ? dbToggle : (config.energy?.enabled !== false)

    let finalEnergy
    if (!energyEnabled || isOwner) {
        finalEnergy = -1
    } else if (user.isPremium) {
        finalEnergy = user.energy ?? config.energy?.premium ?? 100
    } else {
        finalEnergy = user.energy ?? config.energy?.default ?? 25
    }

    const isUnlimited = finalEnergy === -1
    const energyInsplay = formatNumber(finalEnergy)
    
    const isSelf = targetJid === m.sender
    
    let userStatus = 'Free'
    if (isOwner) userStatus = 'Owner'
    else if (user.isPremium) userStatus = 'Premium'
    if (!energyEnabled) userStatus += ' (Energy OFF)'
    
    let text = `*〔 ⚡ ENERGI INFO 〕*\n\n`

text += `*〔 👤 User 〕* ${targetName}\n`
text += `*〔 ⚡ Energy 〕* ${energyInsplay}\n`
text += `*〔 💎 Status 〕* ${userStatus}\n\n`
    
    if (!energyEnabled) {
        text += `🔌 System energy innonactivekan — all command free`
    } else if (isSelf && !isUnlimited && finalEnergy < 10) {
        text += `⚠️ Energy hampir ran out!\n`
        text += `Usage \`.buyenergy\` for buy`
    } else if (isUnlimited) {
        text += `✨ Energy unlimited active!`
    }
    
    await m.reply(text)
}

module.exports = {
    config: pluginConfig,
    handler
}
