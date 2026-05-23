const { getPmeaningcipantJids } = require('../../src/lib/frenzy-lid')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: ['ht', 'hidetag'],
    category: 'group',
    description: 'Hidetag with support reply message (text/content)',
    usage: '.ht [message] or reply message',
    example: '.ht or reply message lalu .ht',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energy: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: false
}

async function handler(m, { sock }) {
    try {
        const groupMeta = m.groupMetadata
        const participants = groupMeta.participants || []
        const mentions = getPmeaningcipantJids(participants)

        const quoted = m.quoted
        const text = m.fullArgs?.trim()

        // ===== REPLY MODE =====
        if (quoted) {
            const qMsg = quoted.message || {}
            const type = Object.keys(qMsg)[0]

            // ===== IMAGE =====
            if (type === 'imageMessage') {
                const content = await quoted.download()
                const caption = qMsg.imageMessage?.caption || text || ''

                return sock.sendMessage(m.chat, {
                    image: content,
                    caption,
                    mentions
                })
            }

            // ===== VIDEO =====
            if (type === 'videoMessage') {
                const content = await quoted.download()
                const caption = qMsg.videoMessage?.caption || text || ''

                return sock.sendMessage(m.chat, {
                    video: content,
                    caption,
                    mentions
                })
            }

            // ===== STICKER =====
            if (type === 'stickerMessage') {
                const content = await quoted.download()

                await sock.sendMessage(m.chat, {
                    sticker: content,
                    mentions
                })

                if (text) {
                    await sock.sendMessage(m.chat, {
                        text,
                        mentions
                    })
                }
                return
            }

            // ===== AUDIO =====
            if (type === 'audioMessage') {
                const content = await quoted.download()
                const audioMsg = qMsg.audioMessage || {}

                await sock.sendMessage(m.chat, {
                    audio: content,
                    mimetype: audioMsg.mimetype,
                    ptt: audioMsg.ptt || false,
                    mentions
                })

                if (text) {
                    await sock.sendMessage(m.chat, {
                        text,
                        mentions
                    })
                }
                return
            }

            // ===== DOCUMENT =====
            if (type === 'documentMessage') {
                const content = await quoted.download()
                const docMsg = qMsg.documentMessage || {}

                await sock.sendMessage(m.chat, {
                    document: content,
                    mimetype: docMsg.mimetype,
                    fileName: docMsg.fileName || 'file',
                    mentions
                })

                if (text) {
                    await sock.sendMessage(m.chat, {
                        text,
                        mentions
                    })
                }
                return
            }

            // ===== TEXT / OTHER =====
            const quotedText =
                quoted.text ||
                qMsg.conversation ||
                qMsg.extendedTextMessage?.text ||
                ''

            const finalText = text || quotedText

            if (!finalText) {
                return m.reply('❌ *Message empty*')
            }

            return sock.sendMessage(m.chat, {
                text: finalText,
                mentions
            })
        }
        if (!text) {
            return m.reply(
                `📢 *HIDETAG*\n\n` +
                `• Reply message lalu type \`${m.prefix}ht\`\n` +
                `• Or type \`${m.prefix}ht <message>\`\n\n` +
                `Support: text, image, video, sticker, audio, document`
            )
        }

        await sock.sendMessage(m.chat, {
            text,
            mentions
        }, { quoted: m    })

    } catch (err) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}