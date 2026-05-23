const { getDatabase } = require('../../src/lib/frenzy-database')
const { getGroupMode } = require('../group/botmode')
const { fetchGroupsSafe } = require('../../src/lib/frenzy-jpm-helper')
const fs = require('fs')
const { config } = require('../../config')
const te = require('../../src/lib/frenzy-error')

let cachedThumb = null
try {
    if (fs.existsSync('./assets/images/frenzy.jpg')) {
        cachedThumb = fs.readFileSync('./assets/images/frenzy.jpg')
    }
} catch (e) {}

const pluginConfig = {
    name: 'jpmht',
    alias: ['jpmhidetag'],
    category: 'jpm',
    description: 'Send message to all group with hidetag',
    usage: '.jpmht <message>',
    example: '.jpmht Hello allnya!',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energy: 0,
    isEnabled: true
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
            `📢 *JPM HIDETAG (JASA PESAN MASSAL)*\n\n` +
            `System broadcast otodeads to seluruh group that registered with tag all member (hidetag).\n\n` +
            `*PENGGUNAAN:*\n` +
            `• *${m.prefix}jpmht <message>* — Send plain JPM hidetag text\n` +
            `• *${m.prefix}jpmht (reply photo/video)* — Send JPM hidetag with content\n\n` +
            `*CONTOH:*\n` +
            `> \`${m.prefix}jpmht Hello allnya! Don't forget check channel kita ya.\``
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
        
        await m.reply(
            `📢 *ᴊᴘᴍ ʜɪᴅᴇᴛᴀɢ*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 📝 ᴘᴇsᴀɴ: \`${text.substring(0, 50)}${text.length > 50 ? '...' : ''}\`\n` +
            `┃ 📷 ᴍᴇᴅɪᴀ: \`${contentBuffer ? contentType : 'No'}\`\n` +
            `┃ 👥 ᴛᴀʀɢᴇᴛ: \`${groupIds.length}\` group\n` +
            `┃ ⏱️ ᴊᴇᴅᴀ: \`${delayJpm}ms\`\n` +
            `╰┈┈⬡\n\n` +
            `> Mestart JPM hidetag...`
        )
        
        global.statusjpm = true
        let successCount = 0
        let failedCount = 0
        
        for (const groupId of groupIds) {
            if (global.stopjpm) {
                delete global.stopjpm
                delete global.statusjpm
                
                await m.reply(
                    `⏹️ *ᴊᴘᴍ ᴅɪʜᴇɴᴛɪᴋᴀɴ*\n\n` +
                    `> ✅ Success: \`${successCount}\`\n` +
                    `> ❌ Failed: \`${failedCount}\``
                )
                return
            }
            
            try {
                const groupData = allGroups[groupId]
                const mentions = groupData.participants.map(p => p.id || p.jid).filter(Boolean)
                const contextInfo = {
                    mentionedJid: mentions,
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: config.saluran?.id,
                        newsletterName: config.saluran?.name,
                        serverMessageId: 127
                    },
                    externalAdReply: cachedThumb ? {
                                title: '📢 JPM HIDETAG',
                                body: 'Message Massal with Hidetag',
                                thumbnail: cachedThumb,
                                sourceUrl: config.saluran?.link || '',
                                contentType: 1,
                                renderLargerThumbnail: true
                            } : undefined
                }
                if (contentBuffer) {
                    await sock.sendMessage(groupId, {
                        [contentType]: contentBuffer,
                        caption: text,
                        mentions: mentions,
                        contextInfo: contextInfo
                    })
                } else {
                    await sock.sendMessage(groupId, { 
                        text: text,
                        mentions: mentions,
                        contextInfo: contextInfo
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
        await m.reply(
            `✅ *ᴊᴘᴍ ʜɪᴅᴇᴛᴀɢ sᴇʟᴇsᴀɪ*\n\n` +
            `╭┈┈⬡「 📊 *ʜᴀsɪʟ* 」\n` +
            `┃ ✅ ʙᴇʀʜᴀsɪʟ: \`${successCount}\`\n` +
            `┃ ❌ ɢᴀɢᴀʟ: \`${failedCount}\`\n` +
            `┃ 📊 ᴛᴏᴛᴀʟ: \`${groupIds.length}\`\n` +
            `╰┈┈⬡`
        )
        
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
