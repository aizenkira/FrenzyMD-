const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'stamina',
    alias: ['energy', 'checkstamina'],
    category: 'rpg',
    description: 'Check and pulihkan stamina',
    usage: '.stamina / .stamina isi',
    example: '.stamina',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

let thumbRpg = null
try {
    const thumbPath = path.join(process.cwd(), 'assets', 'images', 'frenzy-rpg.jpg')
    if (fs.existsSync(thumbPath)) thumbRpg = fs.readFileSync(thumbPath)
} catch (e) {}

function getContextInfo(title = '⚡ *sᴛᴀᴍɪɴᴀ*', body = 'Energy') {
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

function createStaminaBar(current, max) {
    const filled = Math.round((current / max) * 10)
    const empty = 10 - filled
    return '█'.repeat(filled) + '░'.repeat(empty)
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const user = db.getUser(m.sender)
    const args = m.args || []
    
    if (!user.rpg) user.rpg = {}
    user.rpg.stamina = user.rpg.stamina ?? 100
    user.rpg.maxStamina = user.rpg.maxStamina || 100
    
    const subCmd = args[0]?.toLowerCase()
    
    if (subCmd === 'isi' || subCmd === 'restore' || subCmd === 'heal') {
        const potionCost = 5000
        
        if (user.rpg.stamina >= user.rpg.maxStamina) {
            return m.reply(`⚡ *sᴛᴀᴍɪɴᴀ ᴘᴇɴᴜʜ*\n\n> Stamina you already full!`)
        }
        
        if ((user.coins || 0) < potionCost) {
            return m.reply(
                `❌ *sᴀʟᴅᴏ ᴛɪᴅᴀᴋ ᴄᴜᴋᴜᴘ*\n\n` +
                `> Biaya: Rp ${potionCost.toLocaleString('id-ID')}\n` +
                `> Balance: Rp ${(user.coins || 0).toLocaleString('id-ID')}`
            )
        }
        
        user.coins -= potionCost
        const restored = user.rpg.maxStamina - user.rpg.stamina
        user.rpg.stamina = user.rpg.maxStamina
        
        db.save()
        
        await m.react('⚡')
        return sock.sendMessage(m.chat, {
            text: `⚡ *sᴛᴀᴍɪɴᴀ ᴅɪɪsɪ*\n\n` +
                `╭┈┈⬡「 💊 *ʀᴇsᴛᴏʀᴇ* 」\n` +
                `┃ ⚡ Stamina: *+${restored}*\n` +
                `┃ 💵 Biaya: *-Rp ${potionCost.toLocaleString('id-ID')}*\n` +
                `┃ 📊 Now: *${user.rpg.stamina}/${user.rpg.maxStamina}*\n` +
                `╰┈┈┈┈┈┈┈┈⬡`,
            contextInfo: getContextInfo()
        }, { quoted: m })
    }
    
    const staminaBar = createStaminaBar(user.rpg.stamina, user.rpg.maxStamina)
    
    let txt = `⚡ *sᴛᴀᴍɪɴᴀ sᴛᴀᴛᴜs*\n\n`
    txt += `╭┈┈⬡「 📊 *ɪɴꜰᴏ* 」\n`
    txt += `┃ ⚡ Stamina: *${user.rpg.stamina}/${user.rpg.maxStamina}*\n`
    txt += `┃ 📊 [${staminaBar}]\n`
    txt += `╰┈┈┈┈┈┈┈┈⬡\n\n`
    txt += `> Isi stamina: \`${m.prefix}stamina isi\` (Rp 5.000)\n`
    txt += `> Stamina pulih otodeads every hour`
    
    await sock.sendMessage(m.chat, {
        text: txt,
        contextInfo: getContextInfo()
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
