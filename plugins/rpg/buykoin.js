const { getDatabase } = require('../../src/lib/frenzy-database')
const { getRpgContextInfo } = require('../../src/lib/frenzy-context')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'buycoins',
    alias: ['buycoins', 'buycoin', 'exptocoins', 'exptocoin'],
    category: 'rpg',
    description: 'Tukar EXP become Coins',
    usage: '.buycoins <amount>',
    example: '.buycoins 10000',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

const EXP_PER_KOIN = 2

let thumbRpg = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'frenzy-rpg.jpg')
    if (fs.existsSync(thumbPath)) thumbRpg = fs.readFileSync(thumbPath)
} catch (e) {}

function getContextInfo(title = '💱 *ʙᴜʏ ᴋᴏɪɴ*', body = 'Tukar EXP') {
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

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    
    if (!user.rpg) user.rpg = {}
    
    const args = m.args || []
    const amountStr = args[0]
    
    if (!amountStr) {
        let txt = `💱 *ʙᴜʏ ᴋᴏɪɴ*\n\n`
        txt += `> Tukar EXP become Coins!\n\n`
        txt += `╭┈┈⬡「 📊 *ᴋᴜʀs* 」\n`
        txt += `┃ 💎 ${EXP_PER_KOIN} EXP = 1 Coins\n`
        txt += `╰┈┈⬡\n\n`
        txt += `╭┈┈⬡「 📋 *sᴀʟᴅᴏᴍᴜ* 」\n`
        txt += `┃ 🚄 EXP: *${(user.exp || 0).toLocaleString('id-ID')}*\n`
        txt += `┃ 💰 Coins: * ${(user.coins || 0).toLocaleString('id-ID')}*\n`
        txt += `╰┈┈⬡\n\n`
        txt += `> Example: \`.buycoins 10000\`\n`
        txt += `> Will use ${10000 * EXP_PER_KOIN} EXP for 10.000 Coins`
        
        return m.reply(txt)
    }
    
    let coinsAmount = 0
    if (amountStr === 'all' || amountStr === 'max') {
        coinsAmount = Math.floor((user.exp || 0) / EXP_PER_KOIN)
    } else {
        coinsAmount = parseInt(amountStr)
    }
    
    if (!coinsAmount || coinsAmount <= 0) {
        return m.reply(`❌ Enter amount coins that is valid!`)
    }
    
    const expNeeded = coinsAmount * EXP_PER_KOIN
    
    if ((user.exp || 0) < expNeeded) {
        const maxPossible = Math.floor((user.exp || 0) / EXP_PER_KOIN)
        return m.reply(
            `❌ *Not enough EXP!*\n\n` +
            `> Inneedkan: *${expNeeded.toLocaleString('id-ID')} EXP*\n` +
            `> EXP you: *${(user.exp || 0).toLocaleString('id-ID')} EXP*\n\n` +
            `> Mactionmal: *${maxPossible.toLocaleString('id-ID')} Coins*`
        )
    }
    
    // Use manual user update instead of updateCoins/updateExp to do batch update
    // But since logic was db.setUser, let's stick to update logic here
    const newExp = (user.exp || 0) - expNeeded
    const newCoins = (user.coins || 0) + coinsAmount
    
    db.setUser(m.sender, {
        exp: newExp,
        coins: newCoins
    })
    
    await m.react('💱')
    
    let txt = `💱 *ᴛᴜᴋᴀʀ ʙᴇʀʜᴀsɪʟ!*\n\n`
    txt += `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n`
    txt += `┃ 🚄 EXP: *-${expNeeded.toLocaleString('id-ID')}*\n`
    txt += `┃ 💰 Coins: *+${coinsAmount.toLocaleString('id-ID')}*\n`
    txt += `╰┈┈⬡\n\n`
    txt += `╭┈┈⬡「 📊 *sᴀʟᴅᴏ sᴇᴋᴀʀᴀɴɢ* 」\n`
    txt += `┃ 🚄 EXP: *${newExp.toLocaleString('id-ID')}*\n`
    txt += `┃ 💰 Coins: *${newCoins.toLocaleString('id-ID')}*\n`
    txt += `╰┈┈⬡`
    
    await sock.sendMessage(m.chat, {
        text: txt,
        contextInfo: getContextInfo()
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
