const config = require('../../config')
const { generateWAMessageFromContent, proto } = require('ourin')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'checkidch',
    alias: ['idch', 'channelid'],
    category: 'tools',
    description: 'Check ID channel from link',
    usage: '.checkidch <link channel>',
    example: '.checkidch https://whatsapp.com/channel/xxxxx',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const text = m.text?.trim()
    
    if (!text) {
        return m.reply(`📺 *ᴄᴇᴋ ɪᴅ ᴄʜᴀɴɴᴇʟ*\n\n> Enter link channel\n\n\`Example: ${m.prefix}checkidch https://whatsapp.com/channel/xxxxx\``)
    }
    
    if (!text.includes('https://whatsapp.com/channel/')) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Link channel no valid`)
    }
    
    m.react('📺')
    
    try {
        const inviteCode = text.split('https://whatsapp.com/channel/')[1]?.split(/[\s?]/)[0]
        
        if (!inviteCode) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Cannot mengekstrak code invite`)
        }
        
        const metadata = await sock.newsletterMetadata('invite', inviteCode)
        
        if (!metadata?.id) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Channel not found`)
        }
        
        const saluranId = config.saluran?.id || '120363406397452589@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'frenzy-AI'
        
        const infoText = `📺 *ᴄʜᴀɴɴᴇʟ ɪɴꜰᴏ*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 🆔 ɪᴅ: \`${metadata.id}\`\n` +
            `┃ 📝 ɴᴀᴍᴀ: \`${metadata.name || 'Unknown'}\`\n` +
            `┃ 👥 sᴜʙsᴄʀɪʙᴇʀ: \`${metadata.subscribers || 0}\`\n` +
            `╰┈┈⬡`
        
        const buttons = [
            {
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({
                    insplay_text: '📋 Copy ID Channel',
                    copy_code: metadata.id
                })
            },
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    insplay_text: '📺 Buka Channel',
                    url: text
                })
            }
        ]
        
        const msg = generateWAMessageFromContent(m.chat, {
            viewOnceMessage: {
                message: {
                    messageContextInfo: {
                        deviceListMetadata: {},
                        deviceListMetadataVersion: 2
                    },
                    interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                        body: proto.Message.InteractiveMessage.Body.fromObject({
                            text: infoText
                        }),
                        footer: proto.Message.InteractiveMessage.Footer.fromObject({
                            text: `© ${config.bot?.name || 'Frenzy-AI'}`
                        }),
                        nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                            buttons: buttons
                        }),
                        contextInfo: {
                            mentionedJid: [m.sender],
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: saluranId,
                                newsletterName: saluranName,
                                serverMessageId: 127
                            }
                        }
                    })
                }
            }
        }, { userJid: m.sender, quoted: m })
        
        await sock.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
        m.react('✅')
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
