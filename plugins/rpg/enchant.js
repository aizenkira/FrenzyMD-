const { getDatabase } = require('../../src/lib/frenzy-database')
const { addExpWithLevelCheck } = require('../../src/lib/frenzy-level')

const pluginConfig = {
    name: 'enchant',
    alias: ['upgrade', 'enhance', 'levelkan'],
    category: 'rpg',
    description: 'Upgrade equipment with enchantment',
    usage: '.enchant <item>',
    example: '.enchant sword',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 120,
    energy: 2,
    isEnabled: true
}

const ENCHANTABLE = {
    sword: { name: '⚔️ Peandg', stat: 'attack', bonus: 5, cost: 500, successRate: 70 },
    shield: { name: '🛡️ Perisai', stat: 'defense', bonus: 4, cost: 500, successRate: 70 },
    armor: { name: '🦺 Armor', stat: 'health', bonus: 20, cost: 800, successRate: 60 },
    helmet: { name: '⛑️ Helm', stat: 'defense', bonus: 3, cost: 400, successRate: 75 },
    bow: { name: '🏹 Busur', stat: 'attack', bonus: 4, cost: 450, successRate: 72 },
    goldsword: { name: '🗡️ Peandg Emas', stat: 'attack', bonus: 10, cost: 2000, successRate: 50 },
    inamondarmor: { name: '💎 Armor Berlian', stat: 'health', bonus: 50, cost: 5000, successRate: 40 }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.inventory) user.inventory = {}
    if (!user.rpg) user.rpg = {}
    if (!user.rpg.enchants) user.rpg.enchants = {}
    
    const args = m.args || []
    const itemName = args[0]?.toLowerCase()
    
    if (!itemName) {
        let txt = `✨ *ᴇɴᴄʜᴀɴᴛ - ᴜᴘɢʀᴀᴅᴇ ᴇǫᴜɪᴘ*\n\n`
        txt += `> Tingkatkan equipment for bonus stats!\n\n`
        txt += `╭┈┈⬡「 📦 *ɪᴛᴇᴍ* 」\n`
        
        for (const [toy, item] of Object.entries(ENCHANTABLE)) {
            const currentLevel = user.rpg.enchants[toy] || 0
            txt += `┃ ${item.name}\n`
            txt += `┃ 📊 Level: ${currentLevel}/10\n`
            txt += `┃ 💪 Bonus: +${item.bonus} ${item.stat}\n`
            txt += `┃ 💰 Cost: ${item.cost.toLocaleString()}\n`
            txt += `┃ 🎯 Rate: ${item.successRate}%\n`
            txt += `┃ → \`${toy}\`\n┃\n`
        }
        txt += `╰┈┈┈┈┈┈┈┈⬡`
        
        return m.reply(txt)
    }
    
    const item = ENCHANTABLE[itemName]
    if (!item) {
        return m.reply(`❌ Item cannot in-enchant!\n\n> Type \`${m.prefix}enchant\` for view list.`)
    }
    
    if ((user.inventory[itemName] || 0) < 1) {
        return m.reply(`❌ You no punya ${item.name}!`)
    }
    
    const currentLevel = user.rpg.enchants[itemName] || 0
    if (currentLevel >= 10) {
        return m.reply(`❌ ${item.name} already level MAX (10)!`)
    }
    
    const cost = item.cost * (currentLevel + 1)
    if ((user.coins || 0) < cost) {
        return m.reply(
            `❌ *ʙᴀʟᴀɴᴄᴇ ᴋᴜʀᴀɴɢ*\n\n` +
            `> Need: ${cost.toLocaleString()}\n` +
            `> Balance: ${(user.coins || 0).toLocaleString()}`
        )
    }
    
    user.coins -= cost
    
    await m.react('✨')
    await m.reply(`✨ *ᴍᴇɴɢ-ᴇɴᴄʜᴀɴᴛ ${item.name.toUpperCase()}...*\n\n> Level ${currentLevel} → ${currentLevel + 1}`)
    await new Promise(r => setTimeout(r, 2000))
    
    const adjustedRate = Math.max(20, item.successRate - (currentLevel * 5))
    const isSuccess = Math.random() * 100 < adjustedRate
    
    if (isSuccess) {
        user.rpg.enchants[itemName] = currentLevel + 1
        user.rpg[item.stat] = (user.rpg[item.stat] || 0) + item.bonus
        
        await addExpWithLevelCheck(sock, m, db, user, 150)
        db.save()
        
        await m.react('🎉')
        return m.reply(
            `🎉 *ᴇɴᴄʜᴀɴᴛ ʙᴇʀʜᴀsɪʟ!*\n\n` +
            `╭┈┈⬡「 ✨ *ʀᴇsᴜʟᴛ* 」\n` +
            `┃ 📦 Item: *${item.name}*\n` +
            `┃ 📊 Level: *${currentLevel} → ${currentLevel + 1}*\n` +
            `┃ 💪 Bonus: *+${item.bonus} ${item.stat}*\n` +
            `┃ 💰 Cost: *-${cost.toLocaleString()}*\n` +
            `┃ ✨ EXP: *+150*\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    } else {
        db.save()
        
        await m.react('💔')
        return m.reply(
            `💔 *ᴇɴᴄʜᴀɴᴛ ɢᴀɢᴀʟ!*\n\n` +
            `╭┈┈⬡「 😢 *ʀᴇsᴜʟᴛ* 」\n` +
            `┃ 📦 Item: *${item.name}*\n` +
            `┃ 📊 Level: *${currentLevel}* (no level up)\n` +
            `┃ 💰 Cost: *-${cost.toLocaleString()}* (hangus)\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `💡 *Tips:* Try again! Rate: ${adjustedRate}%`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
