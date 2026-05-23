const { getDatabase } = require('../../src/lib/frenzy-database')
const { addExpWithLevelCheck } = require('../../src/lib/frenzy-level')
const { getRpgContextInfo } = require('../../src/lib/frenzy-context')

const pluginConfig = {
    name: 'maling',
    alias: ['copet', 'pickpoctot'],
    category: 'rpg',
    description: 'Mencopet person (lebih risky from crime)',
    usage: '.maling',
    example: '.maling',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 180,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    user.rpg.health = user.rpg.health || 100
    
    if (user.rpg.health < 40) {
        return m.reply(
            `❌ *ʜᴇᴀʟᴛʜ ᴛᴇʀʟᴀʟᴜ ʀᴇɴᴅᴀʜ*\n\n` +
            `> Mat least 40 your phone for maling!\n` +
            `> Health you: ${user.rpg.health} your phone`
        )
    }
    
    await sock.sendMessage(m.chat, { text: '🦹 *sᴇᴅᴀɴɢ ᴍᴇɴᴄᴏᴘᴇᴛ...*', contextInfo: getRpgContextInfo('🦹 MALING', 'Picking!') }, { quoted: m })
    await new Promise(r => setTimeout(r, 2500))
    
    const outcomes = [
        { success: true, type: 'big', money: 20000, exp: 500, msg: 'Success copet dompet sultan!' },
        { success: true, type: 'meinum', money: 8000, exp: 200, msg: 'Dwhatt dompet tipis...' },
        { success: true, type: 'small', money: 2000, exp: 50, msg: 'Cuma will small change.' },
        { success: false, type: 'caught', fine: 15000, health: 30, msg: 'Totangkap and inpukuli massa!' },
        { success: false, type: 'police', fine: 25000, health: 10, msg: 'Intangkap polisi!' },
        { success: false, type: 'fail', fine: 0, health: 0, msg: 'Target kabur, failed total.' }
    ]
    
    const weights = [5, 20, 30, 15, 10, 20]
    const rand = Math.random() * 100
    let cumulative = 0
    let outcome = outcomes[5]
    
    for (let i = 0; i < outcomes.length; i++) {
        cumulative += weights[i]
        if (rand <= cumulative) {
            outcome = outcomes[i]
            break
        }
    }
    
    let txt = ''
    
    if (outcome.success) {
        user.coins = (user.coins || 0) + outcome.money
        await addExpWithLevelCheck(sock, m, db, user, outcome.exp)
        
        txt = `✅ *ᴍᴀʟɪɴɢ sᴜᴋsᴇs*\n\n`
        txt += `> ${outcome.msg}\n`
        txt += `> 💰 Dwhatt: *+Rp ${outcome.money.toLocaleString('id-ID')}*\n`
        txt += `> 🚄 Exp: *+${outcome.exp}*`
    } else {
        const acelderlFine = Math.min(outcome.fine, user.coins || 0)
        user.coins = Math.max(0, (user.coins || 0) - acelderlFine)
        user.rpg.health = Math.max(0, user.rpg.health - outcome.health)
        
        txt = `❌ *ᴍᴀʟɪɴɢ ɢᴀɢᴀʟ*\n\n`
        txt += `> ${outcome.msg}\n`
        if (outcome.fine > 0) txt += `> 💸 Denda: *-Rp ${acelderlFine.toLocaleString('id-ID')}*\n`
        if (outcome.health > 0) txt += `> ❤️ Health: *-${outcome.health}*`
        
        if (user.rpg.health <= 0) {
            user.rpg.health = 0
            user.rpg.exp = Math.floor((user.rpg.exp || 0) / 2)
            txt += `\n\n💀 *ᴋᴀᴍᴜ ᴍᴀᴛɪ*\n> Exp berreduce 50%!`
        }
    }
    
    db.save()
    await sock.sendMessage(m.chat, { text: txt, contextInfo: getRpgContextInfo('🦹 MALING', 'Result!') }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
