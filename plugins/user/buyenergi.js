const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'buyenergy',
    alias: ['buyenergy', 'purchaseenergy', 'buyenergy'],
    category: 'user',
    description: 'Buy energy with coins (1 energy = 100 coins)',
    usage: '.buyenergy <amount>',
    example: '.buyenergy 10',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

const PRICE_PER_ENERGI = 100

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const amount = parseInt(m.args[0]) || 0
    
    if (amount <= 0) {
        const user = db.getUser(m.sender) || db.setUser(m.sender)
        
        return m.reply(
            `🛒 *ʙᴜʏ ᴇɴᴇʀɢɪ*\n\n` +
            `╭┈┈⬡「 💰 *ɪɴꜰᴏ* 」\n` +
            `┃ 💵 ʜᴀʀɢᴀ: *${PRICE_PER_ENERGI}* coins/energy\n` +
            `┃ 💰 ᴋᴏɪɴ ᴋᴀᴍᴜ: *${formatNumber(user.coins || 0)}*\n` +
            `╰┈┈⬡\n\n` +
            `> Usage: \`.buyenergy <amount>\`\n\n` +
            `\`Example: ${m.prefix}buyenergy 10\``
        )
    }
    
    const totalPrice = amount * PRICE_PER_ENERGI
    const user = db.getUser(m.sender) || db.setUser(m.sender)
    
    if ((user.coins || 0) < totalPrice) {
        return m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> Not enough coins!\n` +
            `> Need: *${formatNumber(totalPrice)}*\n` +
            `> You punya: *${formatNumber(user.coins || 0)}*`
        )
    }
    
    db.updateCoins(m.sender, -totalPrice)
    
    if (user.energy === -1) {
        m.react('✅')
        return m.reply(
            `✅ *ᴘᴇᴍʙᴇʟɪᴀɴ ʙᴇʀʜᴀsɪʟ*\n\n` +
            `> But you already punya unlimited energy!\n` +
            `> Coins intombackan.`
        )
    }
    
    const newEnergy = db.updateEnergy(m.sender, amount)
    const newCoins = db.getUser(m.sender).coins
    
    m.react('✅')
    
    await m.reply(
        `✅ *ᴘᴇᴍʙᴇʟɪᴀɴ ʙᴇʀʜᴀsɪʟ*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ ⚡ ᴇɴᴇʀɢɪ: *+${formatNumber(amount)}*\n` +
        `┃ 💵 ʜᴀʀɢᴀ: *-${formatNumber(totalPrice)}* coins\n` +
        `╰┈┈⬡\n\n` +
        `╭┈┈⬡「 💰 *sᴀʟᴅᴏ* 」\n` +
        `┃ ⚡ ᴇɴᴇʀɢɪ: *${formatNumber(newEnergy)}*\n` +
        `┃ 💰 ᴋᴏɪɴ: *${formatNumber(newCoins)}*\n` +
        `╰┈┈⬡`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
