const { getDatabase } = require('../../src/lib/frenzy-database')
const { getGroupMode } = require('../group/botmode')
const config = require('../../config')
const { getBinaryNodeChild } = require('ourin')

const fs = require('fs')
const te = require('../../src/lib/frenzy-error')

let cachedThumb = null
try {
    if (fs.existsSync('./assets/images/frenzy.jpg')) {
        cachedThumb = fs.readFileSync('./assets/images/frenzy.jpg')
    }
} catch (e) {}
const pluginConfig = {
    name: 'jpmch',
    alias: ['jpmchannel'],
    category: 'jpm',
    description: 'Send message to all channel WhatsApp',
    usage: '.jpmch <message>',
    example: '.jpmch Hello allnya!',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energy: 0,
    isEnabled: true
}

/**
 * Fetch all channel that in-subscribe (from thisbaileysnya)
 * @param {Object} sock - Soctot Baileys
 * @returns {Promise<Object>} List channel
 */
async function fetchAllSubscribedChannels(sock) {
    const data = {}
    const encoder = new TextEncoder()
    const queryIds = ['6388546374527196']
    
    for (const queryId of queryIds) {
        try {
            const result = await sock.query({
                tag: 'iq',
                attrs: {
                    id: sock.generateMessageTag(),
                    type: 'get',
                    xmlns: 'w:mex',
                    to: '@s.whatsapp.net',
                },
                content: [
                    {
                        tag: 'query',
                        attrs: { 'query_id': queryId },
                        content: encoder.encode(JSON.stringify({
                            variables: {}
                        }))
                    }
                ]
            })
            const child = getBinaryNodeChild(result, 'result')
            if (!child?.content) continue
            const parsed = JSON.parse(child.content.toString())
            const newsletters = parsed?.data?.['xwa2_newsletter_subscribed'] 
                || parsed?.data?.['newsletter_subscribed']
                || parsed?.data?.['subscribed']
                || []
            
            if (newsletters.length > 0) {

                for (const ch of newsletters) {
                    if (ch.id) {
                        data[ch.id] = {
                            id: ch.id,
                            name: ch.thread_metadata?.name?.text || ch.name || 'Unknown',
                            subscribers: ch.thread_metadata?.subscribers_count || 0
                        }
                    }
                }
                break
            }
        } catch (e) {

            continue
        }
    }
    
    return data
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
            `📢 *CHANNEL JPM (JASA PESAN MASSAL)*\n\n` +
            `System broadcast otodeads to seluruh channel WhatsApp that mensubscribe bot this.\n\n` +
            `*PENGGUNAAN:*\n` +
            `• *${m.prefix}jpmch <message>* — Send JPM text to channel\n` +
            `• *${m.prefix}jpmch (reply photo/video)* — Send JPM content to channel\n\n` +
            `*CONTOH:*\n` +
            `> \`${m.prefix}jpmch Hello all, ikuti update latest we!\``
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
        
        let channels = {}
        try {
            channels = await fetchAllSubscribedChannels(sock)
        } catch (e) {
            m.react('☢')
            m.reply(te(m.prefix, m.command, m.pushName))
        }
        
        const channelIds = Object.keys(channels)
        
        if (channelIds.length === 0) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> No there is channel that intemukan or bot not yet subscribe channel whatsoever`)
        }

        const delayJpm = db.setting('delayJpm') || 5000
        
        await m.reply(
            `📢 *ᴊᴘᴍ ᴄʜᴀɴɴᴇʟ*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 📝 ᴘᴇsᴀɴ: \`${text.substring(0, 50)}${text.length > 50 ? '...' : ''}\`\n` +
            `┃ 📷 ᴍᴇᴅɪᴀ: \`${contentBuffer ? contentType : 'No'}\`\n` +
            `┃ 📺 ᴛᴀʀɢᴇᴛ: \`${channelIds.length}\` channel\n` +
            `┃ ⏱️ ᴊᴇᴅᴀ: \`${delayJpm}ms\`\n` +
            `╰┈┈⬡\n\n` +
            `> Mestart JPM to all channel...`
        )
        
        global.statusjpm = true
        let successCount = 0
        let failedCount = 0
        
        for (const chId of channelIds) {
            const chName = channels[chId]?.name || chId

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

            let contextInfo = {}
            try {
                contextInfo = {
                    isForwarded: true,
                    forwardingScore: 99,
                    forwardedNewsletterMessageInfo: {
                        newsletterName: config.saluran?.name || config.bot?.name,
                        newsletterJid: config.saluran?.id || '',
                    }
                }
                
                if (cachedThumb) {
                    contextInfo.externalAdReply = {
                        title: '📢 JPM CHANNEL',
                        body: 'Message Broadcast',
                        thumbnail: cachedThumb,
                        contentType: 1,
                        sourceUrl: config.saluran?.link || '',
                        renderLargerThumbnail: true,
                    }
                }
            } catch (e) {}
            
            try {
                if (contentBuffer) {
                    await sock.sendMessage(chId, {
                        [contentType]: contentBuffer,
                        caption: text,
                        contextInfo
                    })
                } else {
                    await sock.sendMessage(chId, { text: text, contextInfo })
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
            `✅ *ᴊᴘᴍ ᴄʜᴀɴɴᴇʟ sᴇʟᴇsᴀɪ*\n\n` +
            `╭┈┈⬡「 📊 *ʜᴀsɪʟ* 」\n` +
            `┃ ✅ ʙᴇʀʜᴀsɪʟ: \`${successCount}\`\n` +
            `┃ ❌ ɢᴀɢᴀʟ: \`${failedCount}\`\n` +
            `┃ 📊 ᴛᴏᴛᴀʟ: \`${channelIds.length}\`\n` +
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
