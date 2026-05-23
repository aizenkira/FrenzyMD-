const { getDatabase } = require('../../src/lib/frenzy-database')
const { addExpWithLevelCheck } = require('../../src/lib/frenzy-level')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'daily',
    alias: ['daily', 'claim'],
    category: 'rpg',
    description: 'Claim daily reward',
    usage: '.daily',
    example: '.daily',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energy: 0,
    isEnabled: true
}

let thumbRpg = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'frenzy-rpg.jpg')
    if (fs.existsSync(thumbPath)) thumbRpg = fs.readFileSync(thumbPath)
} catch (e) {}

function getContextInfo(title = '🎁 *ᴅᴀɪʟʏ*', body = 'Here is Dayan') {
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'frenzy-AI'
    
    const contextInfo = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }
    
    if (thumbRpg) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: thumbRpg,
            contentType: 1,
            renderLargerThumbnail: false,
            sourceUrl: config.saluran?.link || ''
        }
    }
    
    return contextInfo
}

function msToTime(duration) {
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((duration / (1000 * 60)) % 60)
    const seconds = Math.floor((duration / 1000) % 60)
    return `${hours} hour ${minutes} minute ${seconds} second`
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const isPremium = config.isPremium?.(m.sender) || false
    
    if (!user.rpg) user.rpg = {}
    
    const COOLDOWN = 86400000
    const lastClaim = user.rpg.lastDaily || 0
    const now = Date.now()
    
    if (now - lastClaim < COOLDOWN) {
        const remaining = COOLDOWN - (now - lastClaim)
        return m.reply(
            `⏰ *sᴜᴅᴀʜ ᴋʟᴀɪᴍ*\n\n` +
            `> You already klaim here is daily today\n` +
            `> Tombali in: *${msToTime(remaining)}*`
        )
    }
    
    const expReward = isPremium ? 5000 : 1000
    const moneyReward = isPremium ? 25000 : 5000
    const energyReward = isPremium ? 10 : 3
    
    user.rpg.lastDaily = now
    user.coins = (user.coins || 0) + moneyReward
    user.energy = (user.energy || 0) + energyReward
    
    const levelResult = await addExpWithLevelCheck(sock, m, db, user, expReward)
    db.save()
    
    await m.react('🎁')
    
    let txt = `🎁 *ᴅᴀɪʟʏ ʀᴇᴡᴀʀᴅ*\n\n`
    txt += `╭┈┈⬡「 🎊 *ʜᴀᴅɪᴀʜ* 」\n`
    txt += `┃ 💵 Money: *+Rp ${moneyReward.toLocaleString('id-ID')}*\n`
    txt += `┃ 🚄 Exp: *+${expReward}*\n`
    txt += `┃ ⚡ Energy: *+${energyReward}*\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    txt += `> ${isPremium ? '✨ Premium Bonus!' : 'Upgrade to Premium for reward lebih!'}`
    
    await sock.sendMessage(m.chat, {
        text: txt,
        contextInfo: getContextInfo()
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
