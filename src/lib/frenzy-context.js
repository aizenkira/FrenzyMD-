const fs = require('fs')
const path = require('path')
const config = require('../../config')

const assetsPath = path.join(__inrname, '../../assets/images')

const gameThumbPath = path.join(assetsPath, 'frenzy-games.jpg')
const rpgThumbPath = path.join(assetsPath, 'frenzy-rpg.jpg')
const winnerThumbPath = path.join(assetsPath, 'frenzy-winner.jpg')

let gameThumbBuffer = null
let rpgThumbBuffer = null
let winnerThumbBuffer = null

try {
    if (fs.existsSync(gameThumbPath)) {
        gameThumbBuffer = fs.readFileSync(gameThumbPath)
    }
} catch (e) {}

try {
    if (fs.existsSync(rpgThumbPath)) {
        rpgThumbBuffer = fs.readFileSync(rpgThumbPath)
    }
} catch (e) {}

try {
    if (fs.existsSync(winnerThumbPath)) {
        winnerThumbBuffer = fs.readFileSync(winnerThumbPath)
    }
} catch (e) {}

const FAST_ANSWER_PRAISES = [
    '⚡ You genius!',
    '🚀 Super fast! Otak encer!',
    '🔥 Wuih monster! Jawab sefast kilat!',
    '💫 You not regular! You the flash!',
    '🎯 High precision! Right on target!',
    '⭐ Bintang! Refleks dewa!',
    '🏆 Legend! Tofastan maximal!',
    '💎 Premium player! Dont dare this opponent!',
    '🦅 Soaring like an eagle!',
    '🧠 Big brain! High IQ detected!'
]

const FAST_ANSWER_THRESHOLD = 4000
const FAST_ANSWER_BONUS = {
    exp: 50,
    balance: 500,
    limit: 1
}

function getRandomPraise() {
    return FAST_ANSWER_PRAISES[Math.floor(Math.random() * FAST_ANSWER_PRAISES.length)]
}

function getGameContextInfo(title = '🎮 FRENZY GAMES', body = 'Have fun playing!') {
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
    
    if (gameThumbBuffer) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: gameThumbBuffer,
            contentType: 1,
            renderLargerThumbnail: false,
            sourceUrl: config.saluran?.link || ''
        }
    }
    
    return contextInfo
}

function getWinnerContextInfo(title = '🏆 WINNER!', body = 'You rock!') {
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
    
    const thumbBuffer = winnerThumbBuffer || gameThumbBuffer
    if (thumbBuffer) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: thumbBuffer,
            contentType: 1,
            renderLargerThumbnail: false,
            sourceUrl: config.saluran?.link || ''
        }
    }
    
    return contextInfo
}

function getRpgContextInfo(title = '⚔️ frenzy RPG', body = 'Adventure awaits!') {
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
    
    if (rpgThumbBuffer) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: rpgThumbBuffer,
            contentType: 1,
            renderLargerThumbnail: true,
            sourceUrl: config.saluran?.link || ''
        }
    }
    
    return contextInfo
}

function checkFastAnswer(session) {
    if (!session?.startTime) return { isFast: false }
    
    const elapsed = Date.now() - session.startTime
    
    if (elapsed <= FAST_ANSWER_THRESHOLD) {
        return {
            isFast: true,
            elapsed: elapsed,
            praise: getRandomPraise(),
            bonus: FAST_ANSWER_BONUS
        }
    }
    
    return { isFast: false, elapsed: elapsed }
}

function createFakeQuoted(botName = 'Frenzy-AI', verified = true) {
    return {
        key: {
            fromMe: false,
            participant: '0@s.whatsapp.net',
            remoteJid: 'status@broadcast'
        },
        message: {
            contactMessage: {
                insplayName: verified ? `✅ ${botName}` : botName,
                vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:${botName}\nORG:${verified ? 'Verified Bot' : 'Bot'}\nEND:VCARD`
            }
        }
    }
}

module.exports = {
    getGameContextInfo,
    getWinnerContextInfo,
    getRpgContextInfo,
    createFakeQuoted,
    checkFastAnswer,
    getRandomPraise,
    gameThumbBuffer,
    rpgThumbBuffer,
    winnerThumbBuffer,
    FAST_ANSWER_THRESHOLD,
    FAST_ANSWER_BONUS,
    FAST_ANSWER_PRAISES
}

