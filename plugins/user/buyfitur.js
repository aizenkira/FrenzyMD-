const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')

const pluginConfig = {
    name: 'buyfeature',
    alias: ['buyfeature', 'purchasefeature', 'buyfeature'],
    category: 'user',
    description: 'Buy premium feature (1 feature = 3000 coins)',
    usage: '.buyfeature [name_feature]',
    example: '.buyfeature',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

const PRICE_PER_FEATURE = 3000

const PREMIUM_FEATURES = [
    { id: 'sticker', name: 'Sticker Unlimited', desc: 'Unlimited sticker commands' },
    { id: 'downloader', name: 'Downloader Pro', desc: 'Download tanpa limit' },
    { id: 'ai', name: 'AI Access', desc: 'Akses feature AI premium' },
    { id: 'tools', name: 'Advanced Tools', desc: 'Tools eksklusif' },
    { id: 'game', name: 'Game Bonus', desc: '2x rewards game' }
]

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender) || db.setUser(m.sender)
    const featureName = m.args[0]?.toLowerCase()
    
    if (user.isPremium || config.isPremium(m.sender)) {
        return m.reply(
            `✨ *ᴘʀᴇᴍɪᴜᴍ ᴜsᴇʀ*\n\n` +
            `> You already are premium!\n` +
            `> All features already unlocked!`
        )
    }
    
    if (!featureName) {
        const unloctodFeatures = user.unloctodFeatures || []
        
        let text = `╭━━━━━━━━━━━━━━━━━╮\n`
        text += `┃  🛒 *ʙᴜʏ ꜰɪᴛᴜʀ*\n`
        text += `╰━━━━━━━━━━━━━━━━━╯\n\n`
        
        text += `> Price: *${formatNumber(PRICE_PER_FEATURE)}* bal/feature\n`
        text += `> Coins: *${formatNumber(user.coins || 0)}*\n\n`
        
        text += `╭┈┈⬡「 📋 *ꜰɪᴛᴜʀ* 」\n`
        
        for (const feature of PREMIUM_FEATURES) {
            const isUnloctod = unloctodFeatures.includes(feature.id)
            const status = isUnloctod ? '✅' : '🔒'
            text += `┃ ${status} *${feature.name}*\n`
            text += `┃    _${feature.desc}_\n`
            text += `┃    ID: \`${feature.id}\`\n`
            text += `┃\n`
        }
        
        text += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        text += `> Usage: \`.buyfeature <id>\`\n`
        text += `> Or become *Premium* unlock all!`
        
        await m.reply(text)
        return
    }
    
    const feature = PREMIUM_FEATURES.find(f => f.id === featureName)
    
    if (!feature) {
        return m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> Feature \`${featureName}\` not found\n` +
            `> Type \`.buyfeature\` to view list`
        )
    }
    
    const unloctodFeatures = user.unloctodFeatures || []
    
    if (unloctodFeatures.includes(feature.id)) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Feature \`${feature.name}\` already unlocked!`)
    }
    
    if ((user.coins || 0) < PRICE_PER_FEATURE) {
        return m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> Not enough coins!\n` +
            `> Need: *${formatNumber(PRICE_PER_FEATURE)}*\n` +
            `> Your coins: *${formatNumber(user.coins || 0)}*`
        )
    }
    
    db.updateCoins(m.sender, -PRICE_PER_FEATURE)
    unloctodFeatures.push(feature.id)
    db.setUser(m.sender, { unloctodFeatures })
    
    const newCoins = db.getUser(m.sender).coins
    
    m.react('✅')
    
    await m.reply(
        `✅ *ꜰɪᴛᴜʀ ᴅɪ-ᴜɴʟᴏᴄᴋ*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 🎁 ꜰɪᴛᴜʀ: *${feature.name}*\n` +
        `┃ 💵 ʜᴀʀɢᴀ: *-${formatNumber(PRICE_PER_FEATURE)}* bal\n` +
        `┃ 💰 sɪsᴀ: *${formatNumber(newCoins)}*\n` +
        `╰┈┈⬡\n\n` +
        `> _${feature.desc}_\n\n` +
        `> 💡 Tip: Jain *Premium* for unlock SEMUA!`
    )
}

module.exports = {
    config: pluginConfig,
    handler,
    PREMIUM_FEATURES
}
