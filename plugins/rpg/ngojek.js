const { getDatabase } = require('../../src/lib/frenzy-database')
const { addExpWithLevelCheck } = require('../../src/lib/frenzy-level')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'ride-hail',
    alias: ['ojek', 'gojek', 'ojol'],
    category: 'rpg',
    description: 'Ride-hail to earn money',
    usage: '.ride-hail',
    example: '.ride-hail',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 120,
    energy: 1,
    isEnabled: true
}

let thumbRpg = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'frenzy-rpg.jpg')
    if (fs.existsSync(thumbPath)) thumbRpg = fs.readFileSync(thumbPath)
} catch (e) {}

function getContextInfo(title = '🏍️ *ɴɢᴏᴊᴇᴋ*', body = 'Ojek Online') {
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
    
    const staminaCost = 15
    user.rpg.stamina = user.rpg.stamina ?? 100
    
    if (user.rpg.stamina < staminaCost) {
        return m.reply(
            `⚡ *sᴛᴀᴍɪɴᴀ ʜᴀʙɪs*\n\n` +
            `> Need ${staminaCost} stamina for ride-hail\n` +
            `> Stamina you: ${user.rpg.stamina}`
        )
    }
    
    user.rpg.stamina -= staminaCost
    
    await m.react('🏍️')
    
    const orders = [
        { type: '🍔 GoFood', instance: '2km', min: 5000, max: 15000 },
        { type: '👤 GoRide', instance: '5km', min: 10000, max: 25000 },
        { type: '📦 GoSend', instance: '3km', min: 8000, max: 20000 },
        { type: '🛒 GoMart', instance: '4km', min: 12000, max: 30000 },
        { type: '👥 GoRide Plus', instance: '10km', min: 20000, max: 50000 }
    ]
    
    const order = orders[Math.floor(Math.random() * orders.length)]
    const earning = Math.floor(Math.random() * (order.max - order.min + 1)) + order.min
    const a tip = Math.random() > 0.7 ? Math.floor(Math.random() * 5000) + 1000 : 0
    const totalEarning = earning + a tip
    
    await m.reply(`🏍️ *sᴇᴅᴀɴɢ ɴɢᴏᴊᴇᴋ...*\n\n> ${order.type} - ${order.instance}`)
    await new Promise(r => setTimeout(r, 2500))
    
    user.coins = (user.coins || 0) + totalEarning
    
    const expGain = Math.floor(totalEarning / 20)
    const levelResult = await addExpWithLevelCheck(sock, m, db, user, expGain)
    
    db.save()
    
    await m.react('✅')
    
    let txt = `🏍️ *ɴɢᴏᴊᴇᴋ sᴇʟᴇsᴀɪ*\n\n`
    txt += `╭┈┈⬡「 📋 *ᴏʀᴅᴇʀ* 」\n`
    txt += `┃ 📱 Tipe: ${order.type}\n`
    txt += `┃ 📍 Jarak: ${order.instance}\n`
    txt += `┃ ─────────\n`
    txt += `┃ 💵 Tarif: *+Rp ${earning.toLocaleString('id-ID')}*\n`
    if (a tip > 0) {
        txt += `┃ 🎁 Tips: *+Rp ${a tip.toLocaleString('id-ID')}*\n`
    }
    txt += `┃ 🚄 Exp: *+${expGain}*\n`
    txt += `┃ ⚡ Stamina: *-${staminaCost}*\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡`
    
    await sock.sendMessage(m.chat, {
        text: txt,
        contextInfo: getContextInfo('🏍️ *ɴɢᴏᴊᴇᴋ*', `+Rp ${totalEarning.toLocaleString('id-ID')}`)
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
