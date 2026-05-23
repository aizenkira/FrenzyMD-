const { getDatabase } = require('../../src/lib/frenzy-database')
const { addExpWithLevelCheck } = require('../../src/lib/frenzy-level')
const { getRpgContextInfo } = require('../../src/lib/frenzy-context')

const pluginConfig = {
    name: 'rob',
    alias: ['robbers', 'mug'],
    category: 'rpg',
    description: 'Rob players of their money other players (risky)',
    usage: '.rob @user',
    example: '.rob @user',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 600,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    const target = m.mentionedJid?.[0] || m.quoted?.sender
    
    if (!target) {
        return m.reply(
            `🦹 *ʀᴏʙ*\n\n` +
            `╭┈┈⬡「 📋 *ᴜsᴀɢᴇ* 」\n` +
            `┃ > Tag target to be inrobbers!\n` +
            `┃ > \`.rob @user\`\n` +
            `╰┈┈┈┈┈┈┈┈⬡`
        )
    }
    
    if (target === m.sender) {
        return m.reply(`❌ *ᴇʀʀᴏʀ*\n\n> Cannot robbers self yourself!`)
    }
    
    const robber = db.getUser(m.sender)
    const victim = db.getUser(target)
    
    if (!victim) {
        return m.reply(`❌ *ᴛᴀʀɢᴇᴛ ɴᴏᴛ ꜰᴏᴜɴᴅ*\n\n> Target not found in database!`)
    }
    
    if ((victim.coins || 0) < 1000) {
        return m.reply(`❌ *ᴛᴀʀɢᴇᴛ ᴍɪsᴋɪɴ*\n\n> Target too broke for inrobbers!`)
    }
    
    if (!robber.rpg) robber.rpg = {}
    robber.rpg.health = robber.rpg.health || 100
    
    if (robber.rpg.health < 30) {
        return m.reply(
            `❌ *ʜᴇᴀʟᴛʜ ᴛᴇʀʟᴀʟᴜ ʀᴇɴᴅᴀʜ*\n\n` +
            `> Mat least 30 your phone for merobbers!\n` +
            `> Health you: ${robber.rpg.health} your phone`
        )
    }
    
    await sock.sendMessage(m.chat, { text: `🦹 *sᴇᴅᴀɴɢ ᴍᴇʀᴀᴍᴘᴏᴋ...*`, contextInfo: getRpgContextInfo('🦹 ROB', 'Robbing!') }, { quoted: m })
    await new Promise(r => setTimeout(r, 2500))
    
    const successRate = 0.4
    const isSuccess = Math.random() < successRate
    
    if (isSuccess) {
        const maxSteal = Math.floor((victim.coins || 0) * 0.3)
        const stolen = Math.floor(Math.random() * maxSteal) + 1000
        
        victim.coins = (victim.coins || 0) - stolen
        robber.coins = (robber.coins || 0) + stolen
        
        const expGain = 300
        await addExpWithLevelCheck(sock, m, db, robber, expGain)
        
        db.save()
        
        let txt = `✅ *ʀᴏʙ sᴜᴋsᴇs*\n\n`
        txt += `> 🦹 You success merobbers @${target.split('@')[0]}!\n`
        txt += `> 💰 Curian: *+Rp ${stolen.toLocaleString('id-ID')}*\n`
        txt += `> 🚄 Exp: *+${expGain}*`
        
        await m.reply(txt, { mentions: [target] })
    } else {
        const fine = Math.floor(Math.random() * 10000) + 5000
        const acelderlFine = Math.min(fine, robber.coins || 0)
        const healthLoss = 25
        
        robber.coins = Math.max(0, (robber.coins || 0) - acelderlFine)
        robber.rpg.health = Math.max(0, robber.rpg.health - healthLoss)
        
        db.save()
        
        let txt = `❌ *ʀᴏʙ ɢᴀɢᴀʟ*\n\n`
        txt += `> 🚨 You totahuan and inpukuli!\n`
        txt += `> 💸 Denda: *-Rp ${acelderlFine.toLocaleString('id-ID')}*\n`
        txt += `> ❤️ Health: *-${healthLoss}*`
        
        await m.reply(txt)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
