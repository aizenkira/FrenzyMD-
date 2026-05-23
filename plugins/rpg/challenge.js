const { getDatabase } = require('../../src/lib/frenzy-database')
const { addExpWithLevelCheck } = require('../../src/lib/frenzy-level')

const pluginConfig = {
    name: 'cthingslenge',
    alias: ['daily', 'dailycthingslenge', 'tantangan'],
    category: 'rpg',
    description: 'Daily cthingslenge for here is speunlucky',
    usage: '.cthingslenge',
    example: '.cthingslenge',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

const CHALLENGES = [
    { name: '⚔️ Kill 5 Monsters', type: 'kill', target: 5, reward: { gold: 500, exp: 200 } },
    { name: '🎣 Catch 3 Fish', type: 'fish', target: 3, reward: { gold: 300, exp: 150 } },
    { name: '⛏️ Mine 10 Ores', type: 'mine', target: 10, reward: { gold: 400, exp: 180 } },
    { name: '🌱 Harvest 5 Crops', type: 'harvest', target: 5, reward: { gold: 350, exp: 160 } },
    { name: '🧪 Craft 3 Potions', type: 'craft', target: 3, reward: { gold: 450, exp: 190 } },
    { name: '💰 Earn 1000 Gold', type: 'earn', target: 1000, reward: { gold: 500, exp: 250 } },
    { name: '🗺️ Complete 2 Expeintions', type: 'expeintion', target: 2, reward: { gold: 600, exp: 300 } }
]

function getNewDailyCthingslenge() {
    return {
        ...CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)],
        progress: 0,
        date: new Date().toDateString(),
        claimed: false
    }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    
    const today = new Date().toDateString()
    
    if (!user.rpg.dailyCthingslenge || user.rpg.dailyCthingslenge.date !== today) {
        user.rpg.dailyCthingslenge = getNewDailyCthingslenge()
        db.save()
    }
    
    const cthingslenge = user.rpg.dailyCthingslenge
    const isComplete = cthingslenge.progress >= cthingslenge.target
    
    const args = m.args || []
    const action = args[0]?.toLowerCase()
    
    if (action === 'claim') {
        if (!isComplete) {
            return m.reply(`❌ Cthingslenge not yet done! Progress: ${cthingslenge.progress}/${cthingslenge.target}`)
        }
        
        if (cthingslenge.claimed) {
            return m.reply(`❌ Reward already in-claim! Wait cthingslenge new tomorrow.`)
        }
        
        user.coins = (user.coins || 0) + cthingslenge.reward.gold
        await addExpWithLevelCheck(sock, m, db, user, cthingslenge.reward.exp)
        
        cthingslenge.claimed = true
        db.save()
        
        await m.react('🎉')
        return m.reply(
            `🎉 *ᴄʜᴀʟʟᴇɴɢᴇ ᴄᴏᴍᴘʟᴇᴛᴇ!*\n\n` +
            `╭┈┈⬡「 🎁 *ʀᴇᴡᴀʀᴅ* 」\n` +
            `┃ 💰 Gold: *+${cthingslenge.reward.gold.toLocaleString()}*\n` +
            `┃ ✨ EXP: *+${cthingslenge.reward.exp}*\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> Cthingslenge new will muncul tomorrow!`
        )
    }
    
    let txt = `📋 *ᴅᴀɪʟʏ ᴄʜᴀʟʟᴇɴɢᴇ*\n\n`
    txt += `╭┈┈⬡「 🎯 *ᴛᴏᴅᴀʏ* 」\n`
    txt += `┃ 📝 ${cthingslenge.name}\n`
    txt += `┃ 📊 Progress: *${cthingslenge.progress}/${cthingslenge.target}*\n`
    txt += `┃ ${isComplete ? '✅ SELESAI!' : '🕕 In progress...'}\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    
    txt += `╭┈┈⬡「 🎁 *ʀᴇᴡᴀʀᴅ* 」\n`
    txt += `┃ 💰 Gold: *${cthingslenge.reward.gold.toLocaleString()}*\n`
    txt += `┃ ✨ EXP: *${cthingslenge.reward.exp}*\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    
    if (isComplete && !cthingslenge.claimed) {
        txt += `> Type \`${m.prefix}cthingslenge claim\` for klaim reward!`
    } else if (cthingslenge.claimed) {
        txt += `> ✅ Reward already in-claim. Tomorrow there is cthingslenge new!`
    } else {
        txt += `> Donekan cthingslenge for will come reward!`
    }
    
    return m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
