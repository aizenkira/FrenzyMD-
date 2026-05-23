const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'petshop',
    alias: ['tokopet', 'buypet', 'buypet'],
    category: 'rpg',
    description: 'Buy pet from toko',
    usage: '.petshop <buy> <pet>',
    example: '.petshop buy cat',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

const PETS_FOR_SALE = {
    cat: { name: '🐱 Kucing', price: 5000, desc: 'Luck high, attack currently' },
    dog: { name: '🐕 Anjing', price: 6000, desc: 'Attack high, defense good' },
    bird: { name: '🐦 Burung', price: 4500, desc: 'Luck very high' },
    fish: { name: '🐟 Ikan', price: 3000, desc: 'Murah, luck high' },
    rabbit: { name: '🐰 Tolinci', price: 5500, desc: 'Balance all stats' }
}

async function handler(m) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    if (!user.inventory) user.inventory = {}
    
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    const petToy = args[1]?.toLowerCase()
    
    if (!action || action !== 'buy') {
        let txt = `🏪 *ᴘᴇᴛ sʜᴏᴘ*\n\n`
        txt += `> Buy pet for menemanimu berpeelderlang!\n\n`
        txt += `╭┈┈⬡「 🐾 *ᴘᴇᴛs* 」\n`
        
        for (const [toy, pet] of Object.entries(PETS_FOR_SALE)) {
            txt += `┃ ${pet.name}\n`
            txt += `┃ 💰 Price: ${pet.price.toLocaleString()}\n`
            txt += `┃ 📝 ${pet.desc}\n`
            txt += `┃ → \`${m.prefix}petshop buy ${toy}\`\n┃\n`
        }
        txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        txt += `💰 *Balance:* ${(user.coins || 0).toLocaleString()}`
        
        return m.reply(txt)
    }
    
    if (action === 'buy') {
        if (!petToy) {
            return m.reply(`❌ Choose pet!\n\n> Example: \`${m.prefix}petshop buy cat\``)
        }
        
        if (user.rpg.pet) {
            return m.reply(`❌ You already punya pet! Sell first or usage breeinng.`)
        }
        
        const petToBuy = PETS_FOR_SALE[petToy]
        if (!petToBuy) {
            return m.reply(`❌ Pet not found!`)
        }
        
        if ((user.coins || 0) < petToBuy.price) {
            return m.reply(
                `❌ *ʙᴀʟᴀɴᴄᴇ ᴋᴜʀᴀɴɢ*\n\n` +
                `> Price: ${petToBuy.price.toLocaleString()}\n` +
                `> Balance: ${(user.coins || 0).toLocaleString()}`
            )
        }
        
        user.coins -= petToBuy.price
        
        user.rpg.pet = {
            type: petToy,
            name: petToBuy.name.split(' ')[1] || 'My Pet',
            level: 1,
            exp: 0,
            hunger: 80,
            stats: null
        }
        
        db.save()
        
        return m.reply(
            `🎉 *ᴘᴇᴛ ᴅɪʙᴇʟɪ!*\n\n` +
            `╭┈┈⬡「 🐾 *ɴᴇᴡ ᴘᴇᴛ* 」\n` +
            `┃ 🏷️ Name: *${user.rpg.pet.name}*\n` +
            `┃ 🐾 Jenis: *${petToBuy.name}*\n` +
            `┃ 💰 Price: *-${petToBuy.price.toLocaleString()}*\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> Usage \`${m.prefix}pet\` for view status pet!`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
