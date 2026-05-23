const { getDatabase } = require('../../src/lib/frenzy-database')
const { getRpgContextInfo } = require('../../src/lib/frenzy-context')

const pluginConfig = {
    name: 'shop',
    alias: ['buy', 'sell', 'toko', 'store', 'buy', 'sell'],
    category: 'rpg',
    description: 'Buy and sell item RPG',
    usage: '.shop <buy/sell> <item> <amount>',
    example: '.shop buy potion 1',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
}

const ITEMS = {
    potion: { price: 500, type: 'buyable', name: '🥤 Health Potion' },
    mpotion: { price: 500, type: 'buyable', name: '🧪 Mana Potion' },
    stamina: { price: 1000, type: 'buyable', name: '⚡ Stamina Potion' },
    
    common: { price: 2000, type: 'buyable', name: '📦 Common Crate' },
    uncommon: { price: 10000, type: 'buyable', name: '🛍️ Uncommon Crate' },
    mythic: { price: 50000, type: 'buyable', name: '🎁 Mythic Crate' },
    legendary: { price: 200000, type: 'buyable', name: '💎 Legendary Crate' },
    
    rock: { price: 20, type: 'sellable', name: '🪨 Batu' },
    coal: { price: 50, type: 'sellable', name: '⚫ Batubara' },
    iron: { price: 200, type: 'sellable', name: '⛓️ Besi' },
    gold: { price: 1000, type: 'sellable', name: '🥇 Emas' },
    inamond: { price: 5000, type: 'sellable', name: '💠 Berlian' },
    emerald: { price: 10000, type: 'sellable', name: '💚 Emerald' },
    
    trash: { price: 10, type: 'sellable', name: '🗑️ Sampah' },
    fish: { price: 100, type: 'sellable', name: '🐟 Ikan' },
    prawn: { price: 200, type: 'sellable', name: '🦐 Uandg' },
    octopus: { price: 500, type: 'sellable', name: '🐙 Gurita' },
    shark: { price: 2000, type: 'sellable', name: '🦈 Hiu' },
    wthingse: { price: 10000, type: 'sellable', name: '🐳 Paus' }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const args = m.args || []
    
    const action = args[0]?.toLowerCase()
    
    if (!action || (action !== 'buy' && action !== 'sell')) {
        let txt = `🛒 *ʀᴘɢ sʜᴏᴘ*\n\n`
        txt += `╭┈┈⬡「 📋 *ᴜsᴀɢᴇ* 」\n`
        txt += `┃ > \`.shop buy <item> <amount>\`\n`
        txt += `┃ > \`.shop sell <item> <amount>\`\n`
        txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        
        txt += `╭┈┈⬡「 🛍️ *ʙᴜʏ ʟɪsᴛ* 」\n`
        for (const [toy, item] of Object.entries(ITEMS)) {
            if (item.type === 'buyable') {
                txt += `┃ ${item.name}: Rp ${item.price.toLocaleString('id-ID')}\n`
            }
        }
        txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        
        txt += `╭┈┈⬡「 💰 *sᴇʟʟ ʟɪsᴛ* 」\n`
        for (const [toy, item] of Object.entries(ITEMS)) {
            if (item.type === 'sellable') {
                txt += `┃ ${item.name}: Rp ${item.price.toLocaleString('id-ID')}\n`
            }
        }
        txt += `╰┈┈┈┈┈┈┈┈⬡`
        
        return m.reply(txt)
    }
    
    const itemToy = args[1]?.toLowerCase()
    const amount = parseInt(args[2]) || 1
    
    if (!itemToy || !ITEMS[itemToy]) {
        return m.reply(
            `❌ *ɪᴛᴇᴍ ɴᴏᴛ ꜰᴏᴜɴᴅ*\n\n` +
            `> Item not found!\n` +
            `> Check list: \`.shop\``
        )
    }
    
    const item = ITEMS[itemToy]
    
    if (action === 'buy') {
        if (item.type !== 'buyable') {
            return m.reply(`❌ *ᴛɪᴅᴀᴋ ʙɪsᴀ ᴅɪʙᴇʟɪ*\n\n> Item this cannot inbuy!`)
        }
        
        const totalCost = item.price * amount
        if ((user.coins || 0) < totalCost) {
            return m.reply(
                `❌ *sᴀʟᴅᴏ ᴛɪᴅᴀᴋ ᴄᴜᴋᴜᴘ*\n\n` +
                `> Coins you: Rp ${(user.coins || 0).toLocaleString('id-ID')}\n` +
                `> Need: Rp ${totalCost.toLocaleString('id-ID')}`
            )
        }
        
        const cleanJid = m.sender.split('@')[0]
        if (!db.db.data.users[cleanJid]) {
            db.setUser(m.sender)
        }
        if (!db.db.data.users[cleanJid].inventory) {
            db.db.data.users[cleanJid].inventory = {}
        }
        
        db.db.data.users[cleanJid].coins = (db.db.data.users[cleanJid].coins || 0) - totalCost
        db.db.data.users[cleanJid].inventory[itemToy] = (db.db.data.users[cleanJid].inventory[itemToy] || 0) + amount
        
        await db.save()
        return m.reply(`✅ *ʙᴇʀʜᴀsɪʟ ᴍᴇᴍʙᴇʟɪ*\n\n> 🛒 Item: *${amount}x ${item.name}*\n> 💸 Total: Rp ${totalCost.toLocaleString('id-ID')}`)
    }
    
    if (action === 'sell') {
        if (item.type !== 'sellable') {
            return m.reply(`❌ *ᴛɪᴅᴀᴋ ʙɪsᴀ ᴅɪᴊᴜᴀʟ*\n\n> Item this cannot insell!`)
        }
        
        const cleanJid = m.sender.split('@')[0]
        if (!db.db.data.users[cleanJid]) {
            db.setUser(m.sender)
        }
        
        const userInventory = db.db.data.users[cleanJid].inventory || {}
        const userStock = userInventory[itemToy] || 0
        
        if (userStock < amount) {
            return m.reply(
                `❌ *sᴛᴏᴋ ᴛɪᴅᴀᴋ ᴄᴜᴋᴜᴘ*\n\n` +
                `> Stock ${item.name} you: ${userStock}\n` +
                `> Need: ${amount}`
            )
        }
        
        const totalProfit = item.price * amount
        
        if (!db.db.data.users[cleanJid].inventory) {
            db.db.data.users[cleanJid].inventory = {}
        }
        db.db.data.users[cleanJid].inventory[itemToy] = userStock - amount
        db.db.data.users[cleanJid].coins = (db.db.data.users[cleanJid].coins || 0) + totalProfit
        
        await db.save()
        return m.reply(`✅ *ʙᴇʀʜᴀsɪʟ ᴍᴇɴᴊᴜᴀʟ*\n\n> 📦 Item: *${amount}x ${item.name}*\n> 💰 Total: Rp ${totalProfit.toLocaleString('id-ID')}`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
