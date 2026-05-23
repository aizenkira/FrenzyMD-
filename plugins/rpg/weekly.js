const { getDatabase } = require('../../src/lib/frenzy-database')
const { getRpgContextInfo } = require('../../src/lib/frenzy-context')

const pluginConfig = {
    name: 'weekly',
    alias: ['weekan'],
    category: 'rpg',
    description: 'Claim here is weekan (lebih large from daily)',
    usage: '.weekly',
    example: '.weekly',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energy: 0,
    isEnabled: true
}

const WEEKLY_COOLDOWN = 7 * 24 * 60 * 60 * 1000

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.cooldowns) user.cooldowns = {}
    const lastWeekly = user.cooldowns.weekly || 0
    const now = Date.now()
    
    if (now - lastWeekly < WEEKLY_COOLDOWN) {
        const remaining = lastWeekly + WEEKLY_COOLDOWN - now
        const days = Math.floor(remaining / (1000 * 60 * 60 * 24))
        const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        return m.reply(`🕕 *ᴡᴇᴇᴋʟʏ ᴄᴏᴏʟᴅᴏᴡɴ*\n\n> You already klaim week this.\n> Wait: *${days} day ${hours} hour* again.`)
    }
    
    const expReward = Math.floor(Math.random() * 20000) + 10000
    const moneyReward = Math.floor(Math.random() * 50000) + 30000
    const crateReward = Math.floor(Math.random() * 3) + 1
    
    if (!user.rpg) user.rpg = {}
    user.rpg.exp = (user.rpg.exp || 0) + expReward
    user.coins = (user.coins || 0) + moneyReward
    
    if (!user.inventory) user.inventory = {}
    user.inventory.uncommon = (user.inventory.uncommon || 0) + crateReward
    
    user.cooldowns.weekly = now
    db.save()
    
    let txt = `🎊 *ᴡᴇᴇᴋʟʏ ᴄʟᴀɪᴍ sᴜᴋsᴇs*\n\n`
    txt += `╭┈┈⬡「 🎁 *ʀᴇᴡᴀʀᴅs* 」\n`
    txt += `┃ 🚄 Exp: *+${expReward.toLocaleString('id-ID')}*\n`
    txt += `┃ 🪙 Money: *+Rp ${moneyReward.toLocaleString('id-ID')}*\n`
    txt += `┃ 🛍️ Uncommon Crate: *+${crateReward}*\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    txt += `> Claim again next week!`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
