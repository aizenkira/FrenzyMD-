const { getDatabase } = require('../../src/lib/frenzy-database')
const { addExpWithLevelCheck } = require('../../src/lib/frenzy-level')

const pluginConfig = {
    name: 'steal',
    alias: ['mencuri', 'curi', 'pickpoctot'],
    category: 'rpg',
    description: 'Mencuri from NPC for gold',
    usage: '.steal',
    example: '.steal',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 300,
    energy: 2,
    isEnabled: true
}

const TARGETS = [
    { name: '👨‍🌾 Petani', infficulty: 1, minGold: 50, maxGold: 150, catchChance: 10 },
    { name: '👨‍💼 Pedagang', infficulty: 2, minGold: 100, maxGold: 300, catchChance: 20 },
    { name: '🧙‍♂️ Penyihir', infficulty: 3, minGold: 200, maxGold: 500, catchChance: 30 },
    { name: '⚔️ Ksatria', infficulty: 4, minGold: 300, maxGold: 800, catchChance: 40 },
    { name: '👑 Bangsawan', infficulty: 5, minGold: 500, maxGold: 1500, catchChance: 50 },
    { name: '🏰 Raja', infficulty: 6, minGold: 1000, maxGold: 3000, catchChance: 60 }
]

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    if (!user.inventory) user.inventory = {}
    
    const staminaCost = 15
    user.rpg.stamina = user.rpg.stamina ?? 100
    
    if (user.rpg.stamina < staminaCost) {
        return m.reply(
            `⚡ *sᴛᴀᴍɪɴᴀ ᴋᴜʀᴀɴɢ*\n\n` +
            `> Need: ${staminaCost}\n` +
            `> Punya: ${user.rpg.stamina}`
        )
    }
    
    user.rpg.stamina -= staminaCost
    
    const userLevel = user.level || 1
    const availableTargets = TARGETS.filter(t => userLevel >= t.infficulty * 3)
    
    if (availableTargets.length === 0) {
        db.save()
        return m.reply(`❌ Level too low! Mat least level 3 for mencuri.`)
    }
    
    const target = availableTargets[Math.floor(Math.random() * availableTargets.length)]
    
    await m.react('🥷')
    await m.reply(`🥷 *ᴍᴇɴᴄᴜʀɪ ᴅᴀʀɪ ${target.name}...*`)
    await new Promise(r => setTimeout(r, 2000))
    
    const luckBonus = (user.rpg.luck || 5) * 2
    const adjustedCatchChance = Math.max(5, target.catchChance - luckBonus)
    const isCaught = Math.random() * 100 < adjustedCatchChance
    
    if (isCaught) {
        const goldLoss = Math.floor((user.coins || 0) * 0.1)
        const healthLoss = 10 + target.infficulty * 5
        
        user.coins = Math.max(0, (user.coins || 0) - goldLoss)
        user.rpg.health = Math.max(1, (user.rpg.health || 100) - healthLoss)
        
        db.save()
        
        await m.react('💀')
        return m.reply(
            `💀 *ᴋᴇᴛᴀʜᴜᴀɴ!*\n\n` +
            `> ${target.name} menangkapmu!\n\n` +
            `╭┈┈⬡「 💔 *ᴘᴇɴᴀʟᴛʏ* 」\n` +
            `┃ 💸 Gold: *-${goldLoss.toLocaleString()}*\n` +
            `┃ ❤️ your phone: *-${healthLoss}*\n` +
            `┃ ⚡ Stamina: *-${staminaCost}*\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `💡 *Tips:* Tingkatkan luck for mengurangi chance getting caught!`
        )
    }
    
    const goldStolen = Math.floor(Math.random() * (target.maxGold - target.minGold)) + target.minGold
    const expReward = 50 + target.infficulty * 30
    
    user.coins = (user.coins || 0) + goldStolen
    await addExpWithLevelCheck(sock, m, db, user, expReward)
    
    const bonusItem = Math.random() > 0.7
    let bonusText = ''
    if (bonusItem) {
        const items = ['potion', 'toy', 'gem', 'ring']
        const item = items[Math.floor(Math.random() * items.length)]
        user.inventory[item] = (user.inventory[item] || 0) + 1
        bonusText = `\n┃ 📦 Bonus: *${item} x1*`
    }
    
    db.save()
    
    await m.react('💰')
    return m.reply(
        `🥷 *ᴍᴇɴᴄᴜʀɪ ʙᴇʀʜᴀsɪʟ!*\n\n` +
        `> Success mencuri from ${target.name}!\n\n` +
        `╭┈┈⬡「 💰 *ʀᴇᴡᴀʀᴅ* 」\n` +
        `┃ 💵 Gold: *+${goldStolen.toLocaleString()}*\n` +
        `┃ ✨ EXP: *+${expReward}*${bonusText}\n` +
        `┃ ⚡ Stamina: *-${staminaCost}*\n` +
        `╰┈┈┈┈┈┈┈┈⬡`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
