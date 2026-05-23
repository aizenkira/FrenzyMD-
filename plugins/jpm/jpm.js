const { getDatabase } = require('../../src/lib/frenzy-database')
const { getGroupMode } = require('../group/botmode')
const { fetchGroupsSafe } = require('../../src/lib/frenzy-jpm-helper')
const config = require('../../config')
const fs = require('fs')
const te = require('../../src/lib/frenzy-error')

let cachedThumb = null
try {
    if (fs.existsSync('./assets/images/frenzy.jpg')) {
        cachedThumb = fs.readFileSync('./assets/images/frenzy.jpg')
    }
} catch (e) {}

const pluginConfig = {
    name: 'jpm',
    alias: ['jasher', 'jaser'],
    category: 'jpm',
    description: 'Send message to all group (JPM)',
    usage: '.jpm <message>',
    example: '.jpm Hello allnya!',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energy: 0,
    isEnabled: true
}

function getContextInfo(title = '📢 ᴊᴘᴍ', body = 'Jasa Message Massal') {
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
    
    if (cachedThumb) {
        contextInfo.externalAdReply = {
            title: title,
            body: body,
            thumbnail: cachedThumb,
            sourceUrl: config.saluran?.link || '',
            contentType: 1,
            renderLargerThumbnail: true
        }
    }
    
    return contextInfo
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    if (m.isGroup) {
        const groupMode = getGroupMode(m.chat, db)
        if (groupMode !== 'md') {
            return m.reply(`❌ *ᴍᴏᴅᴇ ᴛɪᴅᴀᴋ sᴇsᴜᴀɪ*\n\n> JPM only terseina in mode MD\n\n\`${m.prefix}botmode md\``)
        }
    }
    
    const text = m.fullArgs?.trim() || m.text?.trim()
    if (!text) {
        return m.reply(
            `📢 *JPM (JASA PESAN MASSAL)*\n\n` +
            `System broadcast otodeads to seluruh group that registered.\n\n` +
            `*PENGGUNAAN:*\n` +
            `• *${m.prefix}jpm <message>* — Send plain JPM text\n` +
            `• *${m.prefix}jpm (reply photo/video)* — Send JPM with content\n\n` +
            `*FITUR LAIN:*\n` +
            `• *${m.prefix}jpmht* — JPM with mode Hidetag (tag all member)\n` +
            `• *${m.prefix}autojpm* — Auto JPM with interval otodeads\n` +
            `• *${m.prefix}setdelayjpm* — Configure send delay per group\n` +
            `• *${m.prefix}stopjpm* — Menghentikan process JPM that currently running\n\n` +
            `*CONTOH:*\n` +
            `> \`${m.prefix}jpm Hello allnya! This message otodeads from owner.\``
        )
    }
    
    if (global.statusjpm) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> JPM currently running. Type \`${m.prefix}stopjpm\` for menghentikan.`)
    }
    
    m.react('📢')
    
    try {
        let contentBuffer = null
        let contentType = null
        const qmsg = m.quoted || m
        
        if (qmsg.isImage) {
            try {
                contentBuffer = await qmsg.download()
                contentType = 'image'
            } catch (e) {}
        } else if (qmsg.isVideo) {
            try {
                contentBuffer = await qmsg.download()
                contentType = 'video'
            } catch (e) {}
        }
        
        const allGroups = await fetchGroupsSafe(sock)
        let groupIds = Object.keys(allGroups)
        
        const blacklist = db.setting('jpmBlacklist') || []
        const blacklistedCount = groupIds.filter(id => blacklist.includes(id)).length
        groupIds = groupIds.filter(id => !blacklist.includes(id))
        
        if (groupIds.length === 0) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> No there is group that intemukan${blacklistedCount > 0 ? ` (${blacklistedCount} group in-blacklist)` : ''}`)
        }
        
        const delayJpm = db.setting('delayJpm') || 5000
        
        await sock.sendMessage(m.chat, {
            text: `📢 *ᴊᴘᴍ*\n\n` +
                `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                `┃ 📝 ᴘᴇsᴀɴ: \`${text.substring(0, 50)}${text.length > 50 ? '...' : ''}\`\n` +
                `┃ 📷 ᴍᴇᴅɪᴀ: \`${contentBuffer ? contentType : 'No'}\`\n` +
                `┃ 👥 ᴛᴀʀɢᴇᴛ: \`${groupIds.length}\` group\n` +
                `┃ ⏱️ ᴊᴇᴅᴀ: \`${delayJpm}ms\`\n` +
                `┃ 📊 ᴇsᴛɪᴍᴀsɪ: \`${Math.ceil((groupIds.length * delayJpm) / 60000)} minute\`\n` +
                `╰┈┈⬡\n\n` +
                `> Mestart JPM to all group...`,
            contextInfo: getContextInfo('📢 ᴊᴘᴍ', 'Seninng...')
        }, { quoted: m })
        
        global.statusjpm = true
        let successCount = 0
        let failedCount = 0
        
        const contextInfo = getContextInfo('📢 ᴊᴘᴍ', config.bot?.name || 'frenzy')
        
        for (const groupId of groupIds) {
            if (global.stopjpm) {
                delete global.stopjpm
                delete global.statusjpm
                
                await sock.sendMessage(m.chat, {
                    text: `⏹️ *ᴊᴘᴍ ᴅɪʜᴇɴᴛɪᴋᴀɴ*\n\n` +
                        `╭┈┈⬡「 📊 *sᴛᴀᴛᴜs* 」\n` +
                        `┃ ✅ ʙᴇʀʜᴀsɪʟ: \`${successCount}\`\n` +
                        `┃ ❌ ɢᴀɢᴀʟ: \`${failedCount}\`\n` +
                        `┃ ⏸️ sɪsᴀ: \`${groupIds.length - successCount - failedCount}\`\n` +
                        `╰┈┈⬡`,
                    contextInfo: getContextInfo('⏹️ ᴅɪʜᴇɴᴛɪᴋᴀɴ')
                }, { quoted: m })
                return
            }
            
            try {
                if (contentBuffer) {
                    await sock.sendMedia(groupId, contentBuffer, text, null, {
                        type: contentType,
                        contextInfo: {
                            forwardingScore: 99,
                            isForwarded: true
                        }
                    })
                } else {
                    await sock.sendText(groupId, text, null, {
                        contextInfo: {
                            forwardingScore: 99,
                            isForwarded: true
                        }
                    })
                }
                successCount++
            } catch (err) {
                failedCount++
            }
            
            await new Promise(resolve => setTimeout(resolve, delayJpm))
        }
        
        delete global.statusjpm
        
        m.react('✅')
        await sock.sendMessage(m.chat, {
            text: `✅ *ᴊᴘᴍ sᴇʟᴇsᴀɪ*\n\n` +
                `╭┈┈⬡「 📊 *ʜᴀsɪʟ* 」\n` +
                `┃ ✅ ʙᴇʀʜᴀsɪʟ: \`${successCount}\`\n` +
                `┃ ❌ ɢᴀɢᴀʟ: \`${failedCount}\`\n` +
                `┃ 📊 ᴛᴏᴛᴀʟ: \`${groupIds.length}\`\n` +
                `╰┈┈⬡`,
            contextInfo: getContextInfo('✅ sᴇʟᴇsᴀɪ', `${successCount}/${groupIds.length}`)
        }, { quoted: m })
        
    } catch (error) {
        delete global.statusjpm
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
