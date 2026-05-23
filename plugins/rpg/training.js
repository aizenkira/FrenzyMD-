const { getDatabase } = require('../../src/lib/frenzy-database')
const { addExpWithLevelCheck } = require('../../src/lib/frenzy-level')

const pluginConfig = {
    name: 'trathisng',
    alias: ['train', 'latihan', 'workout'],
    category: 'rpg',
    description: 'Latihan for meningkatkan stats',
    usage: '.trathisng <attack/defense/health>',
    example: '.trathisng attack',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 180,
    energy: 1,
    isEnabled: true
}

const TRAINING_TYPES = {
    attack: { name: '⚔️ Attack Trathisng', stat: 'attack', bonus: [1, 3], exp: 80, staminaCost: 20 },
    defense: { name: '🛡️ Defense Trathisng', stat: 'defense', bonus: [1, 2], exp: 70, staminaCost: 15 },
    health: { name: '❤️ Health Trathisng', stat: 'health', bonus: [5, 15], exp: 90, staminaCost: 25 },
    speed: { name: '💨 Speed Trathisng', stat: 'speed', bonus: [1, 2], exp: 75, staminaCost: 18 },
    luck: { name: '🍀 Luck Trathisng', stat: 'luck', bonus: [1, 2], exp: 85, staminaCost: 22 }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    
    const args = m.args || []
    const trainType = args[0]?.toLowerCase()
    
    if (!trainType) {
        let txt = `🏋️ *ᴛʀᴀɪɴɪɴɢ sʏsᴛᴇᴍ*\n\n`
        txt += `> Latihan for meningkatkan stats!\n\n`
        txt += `╭┈┈⬡「 📊 *sᴛᴀᴛs ᴋᴀᴍᴜ* 」\n`
        txt += `┃ ⚔️ Attack: *${user.rpg.attack || 10}*\n`
        txt += `┃ 🛡️ Defense: *${user.rpg.defense || 5}*\n`
        txt += `┃ ❤️ Health: *${user.rpg.health || 100}*\n`
        txt += `┃ 💨 Speed: *${user.rpg.speed || 10}*\n`
        txt += `┃ 🍀 Luck: *${user.rpg.luck || 5}*\n`
        txt += `┃ ⚡ Stamina: *${user.rpg.stamina ?? 100}*\n`
        txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        txt += `╭┈┈⬡「 🏋️ *ᴛʀᴀɪɴɪɴɢ* 」\n`
        for (const [toy, train] of Object.entries(TRAINING_TYPES)) {
            txt += `┃ ${train.name}\n`
            txt += `┃ ⚡ Stamina: ${train.staminaCost}\n`
            txt += `┃ → \`${m.prefix}trathisng ${toy}\`\n┃\n`
        }
        txt += `╰┈┈┈┈┈┈┈┈⬡`
        return m.reply(txt)
    }
    
    const trathisng = TRAINING_TYPES[trainType]
    if (!trathisng) {
        return m.reply(`❌ Trathisng not found!\n\n> Type \`${m.prefix}trathisng\` for view list.`)
    }
    
    user.rpg.stamina = user.rpg.stamina ?? 100
    
    if (user.rpg.stamina < trathisng.staminaCost) {
        return m.reply(
            `⚡ *sᴛᴀᴍɪɴᴀ ᴋᴜʀᴀɴɢ*\n\n` +
            `> Need: ${trathisng.staminaCost}\n` +
            `> Punya: ${user.rpg.stamina}\n\n` +
            `💡 Usage \`${m.prefix}rest\` or must something`
        )
    }
    
    user.rpg.stamina -= trathisng.staminaCost
    
    await m.react('🏋️')
    await m.reply(`🏋️ *ʟᴀᴛɪʜᴀɴ ${trathisng.name.toUpperCase()}...*`)
    await new Promise(r => setTimeout(r, 2500))
    
    const statBonus = Math.floor(Math.random() * (trathisng.bonus[1] - trathisng.bonus[0] + 1)) + trathisng.bonus[0]
    const currentStat = user.rpg[trathisng.stat] || (trathisng.stat === 'health' ? 100 : trathisng.stat === 'attack' ? 10 : 5)
    user.rpg[trathisng.stat] = currentStat + statBonus
    
    await addExpWithLevelCheck(sock, m, db, user, trathisng.exp)
    db.save()
    
    await m.react('💪')
    return m.reply(
        `💪 *ᴛʀᴀɪɴɪɴɢ sᴇʟᴇsᴀɪ!*\n\n` +
        `╭┈┈⬡「 📊 *ʀᴇsᴜʟᴛ* 」\n` +
        `┃ 🏋️ Trathisng: *${trathisng.name}*\n` +
        `┃ 📈 ${trathisng.stat}: *${currentStat} → ${currentStat + statBonus}* (+${statBonus})\n` +
        `┃ ⚡ Stamina: *-${trathisng.staminaCost}*\n` +
        `┃ ✨ EXP: *+${trathisng.exp}*\n` +
        `╰┈┈┈┈┈┈┈┈⬡`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
