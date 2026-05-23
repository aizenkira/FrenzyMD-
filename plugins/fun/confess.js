const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'confess',
    alias: ['confession', 'menfess', 'anonim'],
    category: 'fun',
    description: 'Send message anonim to someone',
    usage: '.confess number|message',
    example: '.confess 6281234567890|Hai, I suka you!',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energy: 1,
    isEnabled: true
}

if (!global.confessData) global.confessData = new Map()

async function handler(m, { sock }) {
    const input = m.fullArgs?.trim() || m.text?.trim()
    
    if (!input || !input.includes('|')) {
        return m.reply(
            `💌 *ᴀɴᴏɴʏᴍᴏᴜs ᴄᴏɴꜰᴇss*\n\n` +
            `> Send message anonim to someone!\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ Format:\n` +
            `┃ \`${m.prefix}confess number|message\`\n` +
            `┃\n` +
            `┃ Example:\n` +
            `┃ \`${m.prefix}confess 6281234567890|Hello you!\`\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> ⚠️ Identitasmu will inrahasiwill!`
        )
    }
    
    const [rawNumber, ...messageParts] = input.split('|')
    const message = messageParts.join('|').trim()
    
    if (!rawNumber || !message) {
        return m.reply(`❌ Wrong format!\n\n> Usage: \`${m.prefix}confess number|message\``)
    }
    
    let targetNumber = rawNumber.trim().replace(/[^0-9]/g, '')
    
    if (targetNumber.startsWith('0')) {
        targetNumber = '62' + targetNumber.slice(1)
    }
    
    if (targetNumber.length < 10 || targetNumber.length > 15) {
        return m.reply(`❌ Number no valid!`)
    }
    
    const targetJid = targetNumber + '@s.whatsapp.net'
    
    const senderNumber = m.sender.split('@')[0]
    if (targetNumber === senderNumber) {
        return m.reply(`❌ Cannot send confess to yourself!`)
    }
    
    try {
        const [onWa] = await sock.onWhatsApp(targetNumber)
        if (!onWa?.exists) {
            return m.reply(`❌ Number \`${targetNumber}\` no registered in WhatsApp!`)
        }
    } catch (e) {}
    
    if (message.length < 5) {
        return m.reply(`❌ Message too short! Mat least 5 karakter.`)
    }
    
    if (message.length > 1000) {
        return m.reply(`❌ Message too long! Mactionmal 1000 karakter.`)
    }

    const confessText = 
        `💌 *ᴀᴅᴀ ᴘᴇsᴀɴ ᴅᴀʀɪ sᴇsᴇᴏʀᴀɴɢ ɴɪᴄʜʜ*\n\n` +
        `「 📨 *ᴘᴇsᴀɴ: ᴅᴀʀɪ sᴇsᴇᴏʀᴀɴɢ* 」\n` +
        ` 💕 *ɪsɪ ᴘᴇsᴀɴ:*\n` +
        `\`\`\`${message}\`\`\`\n` +
        `> 🔒 _Identitas pengirim inrahasiwill_\n` +
        `> 💬 _Reply message this for memreply!_`
    
    try {
        const sentMsg = await sock.sendMessage(targetJid, {
            text: confessText,
            contextInfo: {
                forwardingScore: 99,
                isForwarded: true,
            }
        })
        
        global.confessData.set(sentMsg.key.id, {
            senderJid: m.sender,
            senderChat: m.chat,
            targetJid: targetJid,
            createdAt: Date.now()
        })
        
        setTimeout(() => {
            global.confessData.delete(sentMsg.key.id)
        }, 24 * 60 * 60 * 1000)
        
        await m.reply(
            `✅ *ᴄᴏɴꜰᴇss ᴛᴇʀᴋɪʀɪᴍ!*\n\n` +
            `> Message sent to: \`${targetNumber}\`\n` +
            `> Identitasmu terjaga aman! 🔒\n\n` +
            `> 💬 If ina memreply, replyannya will sent to sthis!`
        )
        
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

async function replyHandler(m, { sock }) {
    if (!m.quoted) return false
    
    const quotedId = m.quoted?.id || m.quoted?.key?.id
    if (!quotedId) return false
    
    const confessInfo = global.confessData.get(quotedId)
    if (!confessInfo) return false
    
    if (m.sender !== confessInfo.targetJid) return false
    
    const replyMessage = m.body?.trim()
    if (!replyMessage) return false
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'
    
    const replyText = 
        `💌 *ʙᴀʟᴀsᴀɴ ᴅᴀʀɪ ᴏʀᴀɴɢ ʏᴀɴɢ ᴋᴀᴍᴜ ᴄᴏɴꜰᴇss!*\n\n` +
        `「 📨 *ʙᴀʟᴀsᴀɴ* 」\n` +
        ` 💕 *ɪsɪ ᴘᴇsᴀɴ:*\n` +
        `\`\`\`${replyMessage}\`\`\`\n` +
        `> 🔒 _Identitas still inrahasiwill_`
    
    try {
        await sock.sendMessage(confessInfo.senderChat, {
            text: replyText,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        })
        
        await sock.sendMessage(m.chat, {
            text: `✅ Replyanmu has sent seway anonim!`
        })
        
        global.confessData.delete(quotedId)
        
        return true
    } catch (error) {
        return false
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    replyHandler
}
