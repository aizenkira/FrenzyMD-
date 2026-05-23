const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'tembak',
    alias: ['nembak', 'propose'],
    category: 'fun',
    description: 'Menembak someone for pawayn',
    usage: '.tembak @tag',
    example: '.tembak @628xxx',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energy: 1,
    isEnabled: true
}

if (!global.tembakSessions) global.tembakSessions = {}

const SESSION_TIMEOUT = 3600000
const romanticQuotes = [
    'I not pilot, but I can make your heart soar with me 💕',
    'You know what I like rain? Because rain that like you, refreshing in heart 🌧️',
    'You is the alasan what I senyum tanpa sebab 😊',
    'Kalau you bintang, I want become langit that always nemenin you ✨',
    'I don't need GPS, because my heart already points to your direction 💘',
    'You know what you have in common with coffee? Coffee keeps me awake, you make me can't sleep thinking about you ☕',
    'May pinhour your heart? Janji bakal injaga forever 💖',
    'Kalau cinta that is the lagu, you is the meloin terhow beautiful 🎵',
    'I need 3 things: The Sun, Month, and You. The Sun for day, Month for night, You for forever 🌙',
    'You is the puzzle last that kuneedkan for complete my life 🧩'
]

let thumbFun = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'frenzy-games.jpg')
    if (fs.existsSync(thumbPath)) thumbFun = fs.readFileSync(thumbPath)
} catch (e) {}

function getContextInfo(title = '💘 *ᴛᴇᴍʙᴀᴋ*', body = 'Confess your love!') {
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
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
    const args = m.args || []
    
    let targetJid = null
    
    if (m.quoted) {
        targetJid = m.quoted.sender
    } else if (m.mentionedJid?.[0]) {
        targetJid = m.mentionedJid[0]
    } else if (args[0]) {
        let num = args[0].replace(/[^0-9]/g, '')
        if (num.length > 5 && num.length < 20) {
            targetJid = num + '@s.whatsapp.net'
        }
    }
    
    if (!targetJid) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}tembak @tag\`\n\n` +
            `> Example:\n` +
            `> \`${m.prefix}tembak @628xxx\`\n` +
            `> Reply message + \`${m.prefix}tembak\``
        )
    }
    
    if (targetJid === m.sender) {
        return m.reply(`Cannot menembak self yourself!`)
    }
    
    if (targetJid === m.botNumber) {
        return m.reply(`Bot cannot pawayn!`)
    }
    
    let senderData = db.getUser(m.sender) || {}
    let targetData = db.getUser(targetJid) || {}
    
    if (!senderData.fun) senderData.fun = {}
    if (!targetData.fun) targetData.fun = {}
    
    if (senderData.fun.pasangan) {
        const partnerData = db.getUser(senderData.fun.pasangan)
        if (partnerData?.fun?.pasangan === m.sender) {
            return m.reply(
                `❌ *sᴜᴅᴀʜ ᴘᴜɴʏᴀ ᴘᴀsᴀɴɢᴀɴ*\n\n` +
                `Pasanganmu: @${senderData.fun.pasangan.split('@')[0]}\n` +
                `Putus first the same as ${partnerData.name} with way: \`${m.prefix}putus\``,
                { mentions: [senderData.fun.pasangan] }
            )
        }
    }
    
    if (targetData.fun.pasangan && targetData.fun.pasangan !== m.sender) {
        const targetPartner = db.getUser(targetData.fun.pasangan)
        if (targetPartner?.fun?.pasangan === targetJid) {
            return m.reply(
                `💔 *ᴅɪᴀ sᴜᴅᴀʜ ᴘᴀᴄᴀʀᴀɴ*\n\n` +
                `Pasangannya: @${targetData.fun.pasangan.split('@')[0]}`,
                { mentions: [targetData.fun.pasangan] }
            )
        }
    }
    
    if (targetData.fun.tembakTarget === m.sender || targetData.fun.pasangan === m.sender) {
        senderData.fun.pasangan = targetJid
        targetData.fun.pasangan = m.sender
        
        db.setUser(m.sender, senderData)
        db.setUser(targetJid, targetData)
        
        delete global.tembakSessions[`${m.chat}_${targetJid}`]
        
        await m.react('💕')
        return m.reply(`💕 *CIE CIEE :3*\n\n` +
                `@${m.sender.split('@')[0]} and @${targetJid.split('@')[0]} resmi pawayn !\n\n` +
                `Hopefully lasting yak! 💍`, { mentions: [m.sender, targetJid] })
    }
    
    senderData.fun.tembakTarget = targetJid
    if (!senderData.fun.tembakCount) senderData.fun.tembakCount = 0
    senderData.fun.tembakCount++
    db.setUser(m.sender, senderData)
    
    global.tembakSessions[`${m.chat}_${targetJid}`] = {
        shooter: m.sender,
        target: targetJid,
        chat: m.chat,
        timestamp: Date.now()
    }

    await m.react('💘')

    const sentMsg = await m.reply(`💘 *ADA YANG NEMBAK NIHH*\n\n` +
            `Hei @${targetJid.split('@')[0]} , you intembak by @${m.sender.split('@')[0]} nichh\n\n` +
            `⏱️ BerlI *1 hour* from now\n` +
            `usage: \`${m.prefix}receive\` / \`${m.prefix}reject\``,
        { mentions: [targetJid, m.sender] })
    
    if (sentMsg?.key?.id) {
        global.tembakSessions[`${m.chat}_${targetJid}`].messageId = sentMsg.key.id
    }
}

async function answerHandler(m, sock) {
    if (!m.body) return false
    
    const text = m.body.trim().toLowerCase()
    if (text !== 'receive' && text !== 'reject') return false
    if (!m.quoted) return false
    
    const db = getDatabase()
    
    const allSessions = Object.entries(global.tembakSessions || {}).filter(
        ([toy, val]) => val.target === m.sender && val.chat === m.chat
    )
    
    if (allSessions.length === 0) return false
    
    const validSession = allSessions.find(([toy, val]) => {
        return Date.now() - val.timestamp < 3600000
    })
    
    if (!validSession) return false
    
    const [sessToy, sessData] = validSession
    
    if (text === 'receive') {
        let shooterData = db.getUser(sessData.shooter) || {}
        let targetData = db.getUser(m.sender) || {}
        
        if (!shooterData.fun) shooterData.fun = {}
        if (!targetData.fun) targetData.fun = {}
        
        shooterData.fun.pasangan = m.sender
        targetData.fun.pasangan = sessData.shooter
        
        db.setUser(sessData.shooter, shooterData)
        db.setUser(m.sender, targetData)
        
        delete global.tembakSessions[sessToy]
        
        await m.react('💕')
        await m.reply(`💕 *WIDIHHHH, CIE CIE DITERIMA* @${sessData.shooter.split('@')[0]}\n\n` +
                `@${m.sender.split('@')[0]} and @${sessData.shooter.split('@')[0]} resmi pawayn\n\n` +
                `Hopefully lasting and bahagia 💍`, { mentions: [m.sender, sessData.shooter] })
        
        return true
    }
    
    if (text === 'reject') {
        let shooterData = db.getUser(sessData.shooter) || {}
        let targetData = db.getUser(m.sender) || {}
        
        if (!shooterData.fun) shooterData.fun = {}
        if (!targetData.fun) targetData.fun = {}
        
        delete shooterData.fun.pasangan
        delete shooterData.fun.tembakTarget
        delete targetData.fun.pasangan
        
        db.setUser(sessData.shooter, shooterData)
        db.setUser(m.sender, targetData)
        
        delete global.tembakSessions[sessToy]
        
        await m.react('💔')
        await m.reply(`💔 *WADUHH, YANG SABAR YAK* @${sessData.shooter.split('@')[0]}\n\n` +
                `@${m.sender.split('@')[0]} reject @${sessData.shooter.split('@')[0]} as a partner\n\n` +
                `Be patient, there are plenty more out there! 😢`, { mentions: [m.sender, sessData.shooter] })
        return true
    }
    
    return false
}

module.exports = {
    config: pluginConfig,
    handler,
    answerHandler
}
