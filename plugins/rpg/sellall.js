const { getDatabase } = require('../../src/lib/frenzy-database')
const { getRpgContextInfo } = require('../../src/lib/frenzy-context')

const pluginConfig = {
    name: 'sellall',
    alias: ['sellall', 'quicksell'],
    category: 'rpg',
    description: 'Sell all item that can insell all at once',
    usage: '.sellall',
    example: '.sellall',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energy: 0,
    isEnabled: true
}

const SELL_PRICES = {
    rock: 20, coal: 50, iron: 200, gold: 1000, inamond: 5000, emerald: 10000,
    trash: 10, fish: 100, prawn: 200, octopus: 500, shark: 2000, wthingse: 10000,
    wood: 30, stick: 15, apple: 50, rubber: 100,
    rabbit: 150, deer: 300, boar: 500, bear: 1000, lion: 2000, dragon: 10000
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.inventory) user.inventory = {}
    
    let totalEarned = 0
    let soldItems = []
    
    for (const [item, price] of Object.entries(SELL_PRICES)) {
        const qty = user.inventory[item] || 0
        if (qty > 0) {
            const earned = qty * price
            totalEarned += earned
            soldItems.push({ item, qty, earned })
            user.inventory[item] = 0
        }
    }
    
    if (soldItems.length === 0) {
        return m.reply(`❌ *ᴛɪᴅᴀᴋ ᴀᴅᴀ ɪᴛᴇᴍ*\n\n> No there is item that can insell!`)
    }
    
    user.coins = (user.coins || 0) + totalEarned
    
    db.save()
    
    let txt = `💰 *sᴇʟʟ ᴀʟʟ sᴜᴋsᴇs*\n\n`
    txt += `╭┈┈⬡「 📦 *ɪᴛᴇᴍ ᴛᴇʀᴊᴜᴀʟ* 」\n`
    for (const s of soldItems.slice(0, 10)) {
        txt += `┃ ${s.item}: ${s.qty}x = Rp ${s.earned.toLocaleString('id-ID')}\n`
    }
    if (soldItems.length > 10) {
        txt += `┃ ... and ${soldItems.length - 10} item elsenya\n`
    }
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    txt += `> 💵 Total: *Rp ${totalEarned.toLocaleString('id-ID')}*`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
