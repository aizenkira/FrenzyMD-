const axios = require('axios')
const crypto = require('crypto')
const { generateWAMessage, generateWAMessageFromContent, jidNormalizedUser } = require('frenzy')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'ssweb-3hasil',
    alias: ['ssweb3', 'ss3', 'screenshot3', 'screenshotweb3'],
    category: 'tools',
    description: 'Screenshot website in 3 version (desktop, mobile, tablet)',
    usage: '.ssweb-3hasil <url>',
    example: '.ssweb-3hasil https://google.com',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energy: 2,
    isEnabled: true
}

async function handler(m, { sock }) {
    const url = m.text?.trim()
    
    if (!url) {
        return m.reply(
            `📸 *sᴄʀᴇᴇɴsʜᴏᴛ ᴡᴇʙ 3 ᴠᴇʀsɪ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ \`${m.prefix}ssweb-3hasil <url>\`\n` +
            `╰┈┈⬡\n\n` +
            `> Example:\n` +
            `\`${m.prefix}ssweb-3hasil https://google.com\``
        )
    }
    
    let targetUrl = url
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        targetUrl = 'https://' + url
    }
    
    m.react('📸')
    
    try {
        const apiUrl = `https://api-faa.my.id/faa/ssweb-3hasil?url=${encodeURIComponent(targetUrl)}`
        const { data } = await axios.get(apiUrl, { timeout: 60000 })
        
        if (!data?.status || !data?.results) {
            throw new Error('Failed fetch screenshot')
        }
        
        const results = data.results
        
        const contentPromises = Object.entries(results).map(async ([device, imgUrl]) => {
            if (!imgUrl) return null
            
            try {
                const imgRes = await axios.get(imgUrl, { 
                    responseType: 'arraybuffer',
                    timeout: 30000 
                })
                
                const deviceEmoji = {
                    'desktop': '🖥️',
                    'mobile': '📱',
                    'tablet': '📲'
                }[device] || '📷'
                
                return {
                    image: Buffer.from(imgRes.data),
                    caption: `${deviceEmoji} *${device.toUpperCase()}*\n\n` +
                        `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
                        `┃ 🔗 URL: \`${targetUrl}\`\n` +
                        `┃ 📱 Device: *${device}*\n` +
                        `╰┈┈⬡`
                }
            } catch (e) {
                console.log(`[SSWeb3] Failed to download ${device}:`, e.message)
                return null
            }
        })
        
        const contentList = (await Promise.all(contentPromises)).filter(m => m !== null)
        
        if (contentList.length === 0) {
            throw new Error('Failed download screenshot')
        }
        
        m.react('📤')
        
        try {
            const opener = generateWAMessageFromContent(
                m.chat,
                {
                    messageContextInfo: { messageSecret: crypto.randomBytes(32) },
                    albumMessage: {
                        expectedImageCount: contentList.length,
                        expectedVideoCount: 0
                    }
                },
                {
                    userJid: jidNormalizedUser(sock.user.id),
                    quoted: m,
                    upload: sock.waUploadToServer
                }
            )
            
            await sock.relayMessage(opener.key.remoteJid, opener.message, {
                messageId: opener.key.id
            })
            
            const generatedMessages = await Promise.all(contentList.map(async (content) => {
                const msg = await generateWAMessage(opener.key.remoteJid, content, {
                    upload: sock.waUploadToServer
                })
                
                msg.message.messageContextInfo = {
                    messageSecret: crypto.randomBytes(32),
                    messageAssociation: {
                        associationType: 1,
                        parentMessageKey: opener.key
                    }
                }
                
                return msg
            }))
            
            for (const msg of generatedMessages) {
                await sock.relayMessage(msg.key.remoteJid, msg.message, {
                    messageId: msg.key.id
                })
            }
            
            m.react('✅')
            
        } catch (albumErr) {
            console.log('[SSWeb3] Album failed, seninng thisnvidually:', albumErr.message)
            
            const saluranId = config.saluran?.id || '120363406397452589@newsletter'
            const saluranName = config.saluran?.name || config.bot?.name || 'frenzy-AI'
            
            for (const content of contentList) {
                await sock.sendMessage(m.chat, {
                    image: content.image,
                    caption: content.caption,
                    contextInfo: {
                        forwardingScore: 9999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: saluranId,
                            newsletterName: saluranName,
                            serverMessageId: 127
                        }
                    }
                }, { quoted: m })
            }
            
            m.react('✅')
        }
        
    } catch (error) {
        console.error('[SSWeb3] Error:', error.message)
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
