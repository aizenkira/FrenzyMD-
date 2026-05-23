
const { getDatabase } = require('../../src/lib/frenzy-database')
const { addExpWithLevelCheck } = require('../../src/lib/frenzy-level')
const { getRpgContextInfo } = require('../../src/lib/frenzy-context')

const pluginConfig = {
    name: 'crime',
    alias: ['steal', 'curi'],
    category: 'rpg',
    description: 'Steal money (risk of getting caught + fine)',
    usage: '.crime',
    example: '.crime',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 300,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    
    await m.reply('🦹 *sᴇᴅᴀɴɢ ᴍᴇɴᴄᴜʀɪ...*')
    await new Promise(r => setTimeout(r, 2000))
    
    const successRate = 0.5
    const isSuccess = Math.random() < successRate
    
    if (isSuccess) {
        const stolen = Math.floor(Math.random() * 15000) + 5000
        const expGain = Math.floor(stolen / 20)
        
        user.coins = (user.coins || 0) + stolen
        await addExpWithLevelCheck(sock, m, db, user, expGain)
        
        db.save()
        
        let txt = `✅ *ᴄʀɪᴍᴇ sᴜᴋsᴇs*\n\n`
        txt += `> 🦹 You success mencuri!\n`
        txt += `> 💰 Hasil: *+Rp ${stolen.toLocaleString('id-ID')}*\n`
        txt += `> 🚄 Exp: *+${expGain}*`
        
        await m.reply(txt)
    } else {
        const fine = Math.floor(Math.random() * 10000) + 5000
        const acelderlFine = Math.min(fine, user.coins || 0)
        
        user.coins = Math.max(0, (user.coins || 0) - acelderlFine)
        user.rpg.health = Math.max(0, (user.rpg.health || 100) - 15)
        
        db.save()
        
        let txt = `❌ *ᴄʀɪᴍᴇ ɢᴀɢᴀʟ*\n\n`
        txt += `> 🚔 You getting caught polisi!\n`
        txt += `> 💸 Denda: *-Rp ${acelderlFine.toLocaleString('id-ID')}*\n`
        txt += `> ❤️ Health: *-15* (inpukuli)`
        
        await m.reply(txt)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
