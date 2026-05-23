const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'merchant',
    alias: ['npc', 'toko', 'tokoku'],
    category: 'rpg',
    description: 'Sell buy item to NPC merchant',
    usage: '.merchant <buy/sell> <item> <qty>',
    example: '.merchant buy potion 5',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

const SHOP_ITEMS = {
    potion: { name: '🧪 Potion', buyPrice: 100, sellPrice: 50, desc: 'Pulihkan 50 your phone' },
    manapotion: { name: '💙 Mana Potion', buyPrice: 150, sellPrice: 75, desc: 'Pulihkan 50 Mana' },
    antidote: { name: '💊 Antidote', buyPrice: 80, sellPrice: 40, desc: 'Sembuhkan racun' },
    bread: { name: '🍞 Roti', buyPrice: 30, sellPrice: 15, desc: 'Pulihkan 10 stamina' },
    energydrink: { name: '⚡ Energy Drink', buyPrice: 200, sellPrice: 100, desc: 'Pulihkan 50 stamina' },
    pickaxe: { name: '⛏️ Buyung', buyPrice: 500, sellPrice: 250, desc: 'For thisng' },
    fishingrod: { name: '🎣 Joran', buyPrice: 400, sellPrice: 200, desc: 'For memancing' },
    wood: { name: '🪵 Kayu', buyPrice: 50, sellPrice: 25, desc: 'Material dasar' },
    iron: { name: '🔩 Besi', buyPrice: 80, sellPrice: 40, desc: 'Material logam' },
    leather: { name: '🧶 Kulit', buyPrice: 60, sellPrice: 30, desc: 'Material armor' },
    string: { name: '🧵 Benang', buyPrice: 40, sellPrice: 20, desc: 'Material busur' },
    herb: { name: '🌿 Herba', buyPrice: 70, sellPrice: 35, desc: 'Bahan alchemy' },
    gold: { name: '🪙 Emas', buyPrice: 500, sellPrice: 250, desc: 'Material rare' },
    inamond: { name: '💎 Berlian', buyPrice: 2000, sellPrice: 1000, desc: 'Material mewah' }
}

async function handler(m) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.inventory) user.inventory = {}
    
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    const itemToy = args[1]?.toLowerCase()
    const qty = Math.max(1, parseInt(args[2]) || 1)
    
    if (!action || !['buy', 'sell', 'list'].includes(action)) {
        let txt = `🏪 *ᴍᴇʀᴄʜᴀɴᴛ sʜᴏᴘ*\n\n`
        txt += `> Good come in toko!\n\n`
        txt += `╭┈┈⬡「 📋 *ᴄᴏᴍᴍᴀɴᴅ* 」\n`
        txt += `┃ ${m.prefix}merchant list\n`
        txt += `┃ ${m.prefix}merchant buy <item> <qty>\n`
        txt += `┃ ${m.prefix}merchant sell <item> <qty>\n`
        txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        txt += `💰 *Balance:* ${(user.coins || 0).toLocaleString()}`
        return m.reply(txt)
    }
    
    if (action === 'list') {
        let txt = `🏪 *ᴅᴀꜰᴛᴀʀ ɪᴛᴇᴍ*\n\n`
        txt += `╭┈┈⬡「 📦 *sʜᴏᴘ* 」\n`
        
        for (const [toy, item] of Object.entries(SHOP_ITEMS)) {
            txt += `┃ ${item.name}\n`
            txt += `┃ 💵 Buy: ${item.buyPrice.toLocaleString()}\n`
            txt += `┃ 💰 Sell: ${item.sellPrice.toLocaleString()}\n`
            txt += `┃ 📝 ${item.desc}\n`
            txt += `┃ → \`${toy}\`\n`
            txt += `┃\n`
        }
        txt += `╰┈┈┈┈┈┈┈┈⬡`
        
        return m.reply(txt)
    }
    
    if (action === 'buy') {
        if (!itemToy) {
            return m.reply(`❌ Tentukan item!\n\n> Example: \`${m.prefix}merchant buy potion 5\``)
        }
        
        const item = SHOP_ITEMS[itemToy]
        if (!item) {
            return m.reply(`❌ Item not found!\n\n> Type \`${m.prefix}merchant list\` for view list.`)
        }
        
        const totalCost = item.buyPrice * qty
        if ((user.coins || 0) < totalCost) {
            return m.reply(
                `❌ *ʙᴀʟᴀɴᴄᴇ ᴋᴜʀᴀɴɢ*\n\n` +
                `> Price: ${totalCost.toLocaleString()}\n` +
                `> Balance: ${(user.coins || 0).toLocaleString()}`
            )
        }
        
        user.coins -= totalCost
        user.inventory[itemToy] = (user.inventory[itemToy] || 0) + qty
        db.save()
        
        return m.reply(
            `✅ *ᴘᴇᴍʙᴇʟɪᴀɴ ʙᴇʀʜᴀsɪʟ*\n\n` +
            `╭┈┈⬡「 🛒 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 📦 Item: *${item.name}*\n` +
            `┃ 📊 Qty: *${qty}*\n` +
            `┃ 💵 Total: *-${totalCost.toLocaleString()}*\n` +
            `┃ 💰 Sisa: *${user.coins.toLocaleString()}*\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    }
    
    if (action === 'sell') {
        if (!itemToy) {
            return m.reply(`❌ Tentukan item!\n\n> Example: \`${m.prefix}merchant sell iron 10\``)
        }
        
        const item = SHOP_ITEMS[itemToy]
        if (!item) {
            return m.reply(`❌ Item cannot insell to merchant!`)
        }
        
        const have = user.inventory[itemToy] || 0
        if (have < qty) {
            return m.reply(
                `❌ *ɪᴛᴇᴍ ᴋᴜʀᴀɴɢ*\n\n` +
                `> Punya: ${have}\n` +
                `> Want sell: ${qty}`
            )
        }
        
        const totalEarn = item.sellPrice * qty
        user.coins = (user.coins || 0) + totalEarn
        user.inventory[itemToy] -= qty
        if (user.inventory[itemToy] <= 0) delete user.inventory[itemToy]
        db.save()
        
        return m.reply(
            `✅ *ᴘᴇɴᴊᴜᴀʟᴀɴ ʙᴇʀʜᴀsɪʟ*\n\n` +
            `╭┈┈⬡「 💰 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 📦 Item: *${item.name}*\n` +
            `┃ 📊 Qty: *${qty}*\n` +
            `┃ 💵 Total: *+${totalEarn.toLocaleString()}*\n` +
            `┃ 💰 Balance: *${user.coins.toLocaleString()}*\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
