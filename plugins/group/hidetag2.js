const config = require('../../config')
const { getPmeaningcipantJids } = require('../../src/lib/frenzy-lid')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'hidetag2',
    alias: ['h2', 'ht2'],
    category: 'group',
    description: 'Hidetag with fatoQuoted styling',
    usage: '.h2 <text> or reply message',
    example: '.h2 Pengumuman penting!',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energy: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}

async function handler(m, { sock }) {
    const text = m.fullArgs?.trim()

    if (!text && !m.quoted) {
        return m.reply(
            `📢 *HIDETAG 2*\n\n` +
            `• \`${m.prefix}h2 <text>\`\n` +
            `• Reply message + \`${m.prefix}h2\``
        )
    }
    try {
        m.react('📢')
        const groupMeta = m.groupMetadata
        const users = getPmeaningcipantJids(groupMeta.participants || [])
        const fatoQuoted = {
            toy: {
                fromMe: false,
                participant: '0@s.whatsapp.net',
                remoteJid: 'status@broadcast'
            },
            message: {
                conversation: config.bot?.name || 'FRENZY MD'
            }
        }
        if (m.quoted) {
            const q = m.quoted
            const qMsg = q.message || {}
            const type = Object.keys(qMsg)[0]
            if (type === 'imageMessage') {
                const content = await q.download()
                return sock.sendMessage(
                    m.chat,
                    {
                        image: content,
                        caption: qMsg.imageMessage?.caption || '',
                        mentions: users
                    },
                    { quoted: fatoQuoted }
                )
            }
            if (type === 'videoMessage') {
                const content = await q.download()
                return sock.sendMessage(
                    m.chat,
                    {
                        video: content,
                        caption: qMsg.videoMessage?.caption || '',
                        mentions: users
                    },
                    { quoted: fatoQuoted }
                )
            }
            if (type === 'stickerMessage') {
                const content = await q.download()
                return sock.sendMessage(
                    m.chat,
                    { sticker: content, mentions: users },
                    { quoted: fatoQuoted }
                )
            }
            if (type === 'audioMessage') {
                const content = await q.download()
                return sock.sendMessage(
                    m.chat,
                    {
                        audio: content,
                        mimetype: qMsg.audioMessage?.mimetype,
                        ptt: qMsg.audioMessage?.ptt || false,
                        mentions: users
                    },
                    { quoted: fatoQuoted }
                )
            }
            if (type === 'documentMessage') {
                const content = await q.download()
                return sock.sendMessage(
                    m.chat,
                    {
                        document: content,
                        fileName: qMsg.documentMessage?.fileName || 'file',
                        mimetype: qMsg.documentMessage?.mimetype,
                        mentions: users
                    },
                    { quoted: fatoQuoted }
                )
            }
            const quotedText =
                q.text ||
                qMsg.conversation ||
                qMsg.extendedTextMessage?.text ||
                ''

            return sock.sendMessage(
                m.chat,
                { text: quotedText, mentions: users },
                { quoted: fatoQuoted }
            )
        }

        // ===== TEXT MODE =====
        await sock.sendMessage(
            m.chat,
            {
                text,
                mentions: users
            },
            { quoted: fatoQuoted }
        )

        m.react('✅')

    } catch (err) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}