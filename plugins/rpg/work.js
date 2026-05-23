
const { getDatabase } = require('../../src/lib/frenzy-database')
const { addExpWithLevelCheck } = require('../../src/lib/frenzy-level')
const { getRpgContextInfo } = require('../../src/lib/frenzy-context')

const pluginConfig = {
    name: 'work',
    alias: ['torja', 'job'],
    category: 'rpg',
    description: 'Work to earn money',
    usage: '.work',
    example: '.work',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 180,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    
    const staminaCost = 10
    user.rpg.stamina = user.rpg.stamina || 100
    
    if (user.rpg.stamina < staminaCost) {
        return m.reply(
            `⚡ *sᴛᴀᴍɪɴᴀ ʜᴀʙɪs*\n\n` +
            `> Need ${staminaCost} stamina for work.\n` +
            `> Stamina you: ${user.rpg.stamina}`
        )
    }
    
    user.rpg.stamina -= staminaCost
    
    const jobs = [
        { name: '👨‍🌾 Petani', min: 1000, max: 3000 },
        { name: '🧹 Cleaning Service', min: 2000, max: 5000 },
        { name: '📦 Kurir', min: 3000, max: 7000 },
        { name: '👨‍🍳 Koki', min: 4000, max: 10000 },
        { name: '👨‍💻 Programmer', min: 8000, max: 20000 },
        { name: '👨‍⚕️ Dokter', min: 15000, max: 30000 }
    ]
    
    const job = jobs[Math.floor(Math.random() * jobs.length)]
    const salary = Math.floor(Math.random() * (job.max - job.min + 1)) + job.min
    const expGain = Math.floor(salary / 10)
    
    await m.reply(`💼 *sᴇᴅᴀɴɢ ʙᴇᴋᴇʀᴊᴀ...*\n> ${job.name}`)
    await new Promise(r => setTimeout(r, 2000))
    
    user.coins = (user.coins || 0) + salary
    const levelResult = await addExpWithLevelCheck(sock, m, db, user, expGain)
    
    db.save()
    
    let txt = `💼 *ᴡᴏʀᴋ sᴇʟᴇsᴀɪ*\n\n`
    txt += `╭┈┈⬡「 💰 *ɢᴀᴊɪ* 」\n`
    txt += `┃ 👔 Petorjaan: ${job.name}\n`
    txt += `┃ 💵 Gaji: *+Rp ${salary.toLocaleString('id-ID')}*\n`
    txt += `┃ 🚄 Exp: *+${expGain}*\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡`
    
    await m.reply(txt)
}

module.exports = {
    config: pluginConfig,
    handler
}
