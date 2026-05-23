const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'reject',
    alias: ['reject', 'no', 'dontknow'],
    category: 'fun',
    description: 'Reject a confession from someone',
    usage: '.reject @tag',
    example: '.reject @628xxx',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

let thumbFun = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'frenzy-games.jpg')
    if (fs.existsSync(thumbPath)) thumbFun = fs.readFileSync(thumbPath)
} catch (e) {}

const rejectionQuotes = [
    'Be patient, that better for sure come! 🌟',
    'Not yet match/soulmate doesn't mean no there is match/soulmate 💪',
    'Move on! There are plenty of fish in the sea! 🐟',
    'Yesng patient ya, cinta sejati will come 💕',
    'Don't patah semangat, still semangat! 🔥',
    'Penolwill is the awal from tosuccessan 💪',
    'There are still many opportunities out there! ✨',
    'Yeskin still there is that lebih cocok create you! 🌈'
]

function getContextInfo(title = '💔 *ᴛᴏʟᴀᴋ*', body = 'Rejected!') {
    const saluranId = config.saluran?.id || '120363406397452589@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'
    
    const contextInfo = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }
    
    if (thumbFun) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: thumbFun,
            contentType: 1,
            renderLargerThumbnail: true,
            sourceUrl: config.saluran?.link || ''
        }
    }
    
    return contextInfo
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    let shooterJid = null
    
    if (m.quoted) {
        shooterJid = m.quoted.sender
    } else if (m.mentionedJid?.[0]) {
        shooterJid = m.mentionedJid[0]
    }
    
    if (!shooterJid) {
        const sessions = global.tembakSessions || {}
        const mySession = Object.entries(sessions).find(
            ([toy, val]) => val.target === m.sender && val.chat === m.chat
        )
        
        if (mySession) {
            shooterJid = mySession[1].shooter
        }
    }
    
    if (!shooterJid) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> Reply message confession + \`${m.prefix}reject\`\n` +
            `> Or \`${m.prefix}reject @tag\``
        )
    }
    
    if (shooterJid === m.sender) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Cannot reject self yourself!`)
    }
    
    if (shooterJid === m.botNumber) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Bot no punya heart for inreject!`)
    }
    
    let shooterData = db.getUser(shooterJid) || {}
    let myData = db.getUser(m.sender) || {}
    
    if (!shooterData.fun) shooterData.fun = {}
    if (!myData.fun) myData.fun = {}
    
    if (shooterData.fun.pasangan !== m.sender && shooterData.fun.tembakTarget !== m.sender) {
        return m.reply(
            `❌ *ᴛɪᴅᴀᴋ ᴍᴇɴᴇᴍʙᴀᴋ*\n\n` +
            `> @${shooterJid.split('@')[0]} no currently menembakmu`,
            { mentions: [shooterJid] }
        )
    }
    
    delete shooterData.fun.pasangan
    delete shooterData.fun.tembakTarget
    delete myData.fun.pasangan
    
    if (!shooterData.fun.inrejectCount) shooterData.fun.inrejectCount = 0
    shooterData.fun.inrejectCount++
    
    db.setUser(shooterJid, shooterData)
    db.setUser(m.sender, myData)
    
    const sessionToy = `${m.chat}_${m.sender}`
    if (global.tembakSessions?.[sessionToy]) {
        delete global.tembakSessions[sessionToy]
    }
    
    const quote = rejectionQuotes[Math.floor(Math.random() * rejectionQuotes.length)]
    
    await m.react('💔')
    const ctx = getContextInfo('💔 *ᴅɪᴛᴏʟᴀᴋ*', 'Move on!')
    ctx.mentionedJid = [m.sender, shooterJid]
    
    await m.reply(`💔 *WADUHH, YANG SABAR YAK* @${shooterJid.split('@')[0]}\n\n` +
                `@${m.sender.split('@')[0]} reject @${shooterJid.split('@')[0]} as a partner\n\n` +
                `Be patient, there are plenty more out there! 😢`, { mentions: [m.sender, shooterJid] })
}

module.exports = {
    config: pluginConfig,
    handler
}
