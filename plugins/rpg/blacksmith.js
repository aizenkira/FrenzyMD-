const { getDatabase } = require('../../src/lib/frenzy-database')
const { addExpWithLevelCheck } = require('../../src/lib/frenzy-level')

const pluginConfig = {
    name: 'blacksmith',
    alias: ['tempa', 'forge', 'pyoui'],
    category: 'rpg',
    description: 'Tempa senjata and armor from material',
    usage: '.blacksmith <item>',
    example: '.blacksmith sword',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 120,
    energy: 1,
    isEnabled: true
}

const RECIPES = {
    sword: { materials: { iron: 3, wood: 2 }, result: 'sword', name: '⚔️ Peandg Besi', exp: 200, price: 500 },
    shield: { materials: { iron: 4, leather: 2 }, result: 'shield', name: '🛡️ Perisai Besi', exp: 250, price: 600 },
    helmet: { materials: { iron: 2, leather: 1 }, result: 'helmet', name: '⛑️ Helm Besi', exp: 150, price: 400 },
    armor: { materials: { iron: 5, leather: 3 }, result: 'armor', name: '🦺 Armor Besi', exp: 350, price: 800 },
    axe: { materials: { iron: 2, wood: 3 }, result: 'axe', name: '🪓 Kwhatk Besi', exp: 180, price: 450 },
    pickaxe: { materials: { iron: 3, wood: 2 }, result: 'pickaxe', name: '⛏️ Buyung', exp: 180, price: 450 },
    bow: { materials: { wood: 4, string: 2 }, result: 'bow', name: '🏹 Busur', exp: 200, price: 500 },
    arrow: { materials: { wood: 1, iron: 1 }, result: 'arrow', name: '🏹 Anak Panah x10', exp: 50, price: 100, qty: 10 },
    goldsword: { materials: { gold: 5, inamond: 2, iron: 3 }, result: 'goldsword', name: '🗡️ Peandg Emas', exp: 500, price: 2000 },
    inamondarmor: { materials: { inamond: 8, iron: 5, leather: 3 }, result: 'inamondarmor', name: '💎 Armor Berlian', exp: 800, price: 5000 }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.inventory) user.inventory = {}
    if (!user.rpg) user.rpg = {}
    
    const args = m.args || []
    const itemName = args[0]?.toLowerCase()
    
    if (!itemName) {
        let txt = `🔨 *ʙʟᴀᴄᴋsᴍɪᴛʜ - ᴛᴇᴍᴘᴀ ɪᴛᴇᴍ*\n\n`
        txt += `> Tempa senjata and armor from material!\n\n`
        txt += `╭┈┈⬡「 📜 *ʀᴇsᴇᴘ* 」\n`
        
        for (const [toy, recipe] of Object.entries(RECIPES)) {
            const mats = Object.entries(recipe.materials).map(([m, qty]) => `${qty}x ${m}`).join(', ')
            txt += `┃ ${recipe.name}\n`
            txt += `┃ → ${m.prefix}blacksmith ${toy}\n`
            txt += `┃ 📦 Bahan: ${mats}\n`
            txt += `┃ ✨ EXP: +${recipe.exp}\n`
            txt += `┃\n`
        }
        txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        txt += `💡 *Tips:* Farming iron, wood, leather from hunting, thisng, dll`
        
        return m.reply(txt)
    }
    
    const recipe = RECIPES[itemName]
    if (!recipe) {
        return m.reply(`❌ Resep not found!\n\n> Type \`${m.prefix}blacksmith\` for view list resep.`)
    }
    
    const missingMaterials = []
    for (const [material, needed] of Object.entries(recipe.materials)) {
        const have = user.inventory[material] || 0
        if (have < needed) {
            missingMaterials.push(`${material}: ${have}/${needed}`)
        }
    }
    
    if (missingMaterials.length > 0) {
        return m.reply(
            `❌ *ʙᴀʜᴀɴ ᴋᴜʀᴀɴɢ*\n\n` +
            `> For create ${recipe.name}:\n\n` +
            missingMaterials.map(m => `> ❌ ${m}`).join('\n')
        )
    }
    
    await m.react('🔨')
    await m.reply(`🔨 *ᴍᴇɴᴇᴍᴘᴀ ${recipe.name.toUpperCase()}...*`)
    await new Promise(r => setTimeout(r, 2000))
    
    for (const [material, needed] of Object.entries(recipe.materials)) {
        user.inventory[material] -= needed
        if (user.inventory[material] <= 0) delete user.inventory[material]
    }
    
    const resultQty = recipe.qty || 1
    user.inventory[recipe.result] = (user.inventory[recipe.result] || 0) + resultQty
    
    await addExpWithLevelCheck(sock, m, db, user, recipe.exp)
    db.save()
    
    await m.react('✅')
    
    let txt = `✅ *ᴛᴇᴍᴘᴀ ʙᴇʀʜᴀsɪʟ*\n\n`
    txt += `╭┈┈⬡「 📦 *ʜᴀsɪʟ* 」\n`
    txt += `┃ 🔨 Item: *${recipe.name}*\n`
    txt += `┃ 📊 Amount: *+${resultQty}*\n`
    txt += `┃ ✨ EXP: *+${recipe.exp}*\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡`
    
    return m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
