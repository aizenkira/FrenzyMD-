const { getDatabase } = require('../../src/lib/frenzy-database')
const { getRpgContextInfo } = require('../../src/lib/frenzy-context')

const pluginConfig = {
    name: 'use',
    alias: ['pato', 'must', 'open'],
    category: 'rpg',
    description: 'Use item consumable or open crate',
    usage: '.use <item>',
    example: '.use potion',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const args = m.args || []
    const itemToy = args[0]?.toLowerCase()
    
    if (!itemToy) {
        return m.reply(
            `🎒 *ᴜsᴇ ɪᴛᴇᴍ*\n\n` +
            `╭┈┈⬡「 📋 *ᴜsᴀɢᴇ* 」\n` +
            `┃ > \`.use <name_item>\`\n` +
            `┃ > Check inventory: \`.inventory\`\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    }
    
    user.inventory = user.inventory || {}
    user.rpg = user.rpg || {}
    user.rpg.health = user.rpg.health || 100
    user.rpg.maxHealth = user.rpg.maxHealth || 100
    user.rpg.mana = user.rpg.mana || 100
    user.rpg.maxMana = user.rpg.maxMana || 100
    user.rpg.stamina = user.rpg.stamina || 100
    user.rpg.maxStamina = user.rpg.maxStamina || 100
    
    const count = user.inventory[itemToy] || 0
    
    if (count <= 0) {
        return m.reply(
            `❌ *ɪᴛᴇᴍ ᴛɪᴅᴀᴋ ᴀᴅᴀ*\n\n` +
            `> You don't have the item *${itemToy}*!\n` +
            `> Check inventory: \`.inventory\``
        )
    }
    
    let msg = ''
    
    switch(itemToy) {
        case 'potion':
            if (user.rpg.health >= user.rpg.maxHealth) {
                return m.reply(`❤️ *ʜᴇᴀʟᴛʜ ᴘᴇɴᴜʜ*\n\n> Nyawa you already full!`)
            }
            user.rpg.health = Math.min(user.rpg.health + 50, user.rpg.maxHealth)
            user.inventory[itemToy]--
            msg = `🥤 *ITEM USED*\n\n> You drank *Health Potion*.\n> ❤️ Health now: ${user.rpg.health}/${user.rpg.maxHealth}`
            break
            
        case 'mpotion':
            if (user.rpg.mana >= user.rpg.maxMana) {
                return m.reply(`💧 *ᴍᴀɴᴀ ᴘᴇɴᴜʜ*\n\n> Mana you already full!`)
            }
            user.rpg.mana = Math.min(user.rpg.mana + 50, user.rpg.maxMana)
            user.inventory[itemToy]--
            msg = `🧪 *ITEM USED*\n\n> You drank *Mana Potion*.\n> 💧 Mana now: ${user.rpg.mana}/${user.rpg.maxMana}`
            break
            
        case 'stamina':
            if (user.rpg.stamina >= user.rpg.maxStamina) {
                return m.reply(`⚡ *sᴛᴀᴍɪɴᴀ ᴘᴇɴᴜʜ*\n\n> Stamina you already full!`)
            }
            user.rpg.stamina = Math.min(user.rpg.stamina + 20, user.rpg.maxStamina)
            user.inventory[itemToy]--
            msg = `⚡ *ITEM USED*\n\n> You drank *Stamina Potion*.\n> ⚡ Stamina now: ${user.rpg.stamina}/${user.rpg.maxStamina}`
            break
            
        case 'common':
        case 'uncommon':
        case 'mythic':
        case 'legendary':
            user.inventory[itemToy]--
            const rewardMoney = Math.floor(Math.random() * (itemToy === 'legendary' ? 100000 : 10000)) + 1000
            const rewardExp = Math.floor(Math.random() * (itemToy === 'legendary' ? 5000 : 500)) + 100
            
            user.coins = (user.coins || 0) + rewardMoney
            user.rpg.exp = (user.rpg.exp || 0) + rewardExp
            
            msg = `🎁 *ᴄʀᴀᴛᴇ ᴅɪʙᴜᴋᴀ*\n\n` +
                  `> You open *${itemToy} Crate*!\n` +
                  `> 💰 Money: +Rp ${rewardMoney.toLocaleString('id-ID')}\n` +
                  `> 🚄 Exp: +${rewardExp}`
            break
            
        default:
            return m.reply(`❌ *ɪᴛᴇᴍ ᴛɪᴅᴀᴋ ᴅᴀᴘᴀᴛ ᴅɪɢᴜɴᴀᴋᴀɴ*\n\n> Item *${itemToy}* cannot in use directly.`)
    }
    
    db.save()
    await m.reply(msg)
}

module.exports = {
    config: pluginConfig,
    handler
}
