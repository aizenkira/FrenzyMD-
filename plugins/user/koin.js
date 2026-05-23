const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'coins',
    alias: ['balance', 'money', 'cash', 'coin', 'coins'],
    category: 'user',
    description: 'Check coins user',
    usage: '.coins [@user]',
    example: '.coins',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
}

function formatCoins(num) {
    if (num >= 1000000000000) return (num / 1000000000000).toFixed(2) + 'T'
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + 'B'
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
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
    const coinsInsplay = formatCoins(user.coins || 0)
    
    const isSelf = targetJid === m.sender
    
    let text = `*〔 💰 KOIN INFO 〕*\n\n`

text += `*〔 👤 User 〕* ${targetName}\n`
text += `*〔 💰 Coins 〕* ${coinsInsplay}\n`

const config = require('../../config')
const isOwner = config.isOwner(targetJid) ? 'Owner' : ''
const isPremium = user.isPremium ? 'Premium' : 'Free'

text += `*〔 💎 Status 〕* ${isOwner || isPremium}\n`

if (isSelf) {
  text += `\n*〔 🛒 SHOP 〕*\n`
  text += `• \`.buyenergy <jml>\` (1 = 100 coins)\n`
  text += `• \`.buyfeature\` (1 = 3000 coins)\n`
  text += `\n_🎮 Main game for will coins!_`
}
    
    await m.reply(text)
}

module.exports = {
    config: pluginConfig,
    handler
}
