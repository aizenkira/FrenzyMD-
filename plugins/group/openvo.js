const { downloadContentFromMessage } = require('ourin')

const pluginConfig = {
    name: 'rvo',
    alias: [],
    category: 'group',
    description: 'Open view-once message in reply',
    usage: '.rvo (reply message 1x view)',
    example: '.rvo',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const quoted = m.quoted

    if (!quoted) {
        await m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> Reply message 1x view with command this!\n` +
            `> Usage: \`${m.prefix}openvo\` (reply message 1x view)`
        )
        return
    }

    const quotedMsg = quoted.message
    if (!quotedMsg) {
        await m.reply(
            `❌ *ᴘᴇsᴀɴ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n` +
            `> Cannot membaca message that in-reply.`
        )
        return
    }

    const type = Object.keys(quotedMsg)[0]
    const content = quotedMsg[type]

    if (!content) {
        await m.reply(
            `❌ *ᴋᴏɴᴛᴇɴ ᴛɪᴅᴀᴋ ᴅɪᴛᴇᴍᴜᴋᴀɴ*\n\n` +
            `> Konten message cannot inbaca.`
        )
        return
    }

    if (!content.viewOnce) {
        await m.reply(
            `❌ *ʙᴜᴋᴀɴ ᴠɪᴇᴡᴏɴᴄᴇ*\n\n` +
            `> Message that in-reply not a view-once message!\n` +
            `> Reply message with ikon 1x view (👁️).`
        )
        return
    }

    await m.react('🕕')

    try {
        let contentType = null
        if (type.includes('image')) {
            contentType = 'image'
        } else if (type.includes('video')) {
            contentType = 'video'
        } else if (type.includes('audio')) {
            contentType = 'audio'
        }

        if (!contentType) {
            await m.reply(
                `Tipenya don't indukung, only support image, video, audio`
            )
            return
        }

        const stream = await downloadContentFromMessage(content, contentType)
        
        let buffer = Buffer.from([])
        for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }

        if (!buffer || buffer.length < 100) {
            await m.reply(
                `❌ *ɢᴀɢᴀʟ ᴍᴇɴɢᴜɴᴅᴜʜ*\n\n` +
                `> Cannot download content.\n` +
                `> Meina maybe already kthere isoutsidesa.`
            )
            return
        }
        const quoted = m.quoted ? m.quoted : m

        if (contentType === 'image') {
            await sock.sendMedia(m.chat, buffer, null, quoted, {
                type: 'image'
            })
        } else if (contentType === 'video') {
            await sock.sendMedia(m.chat, buffer, null, quoted, {
                type: 'video'
            })
        } else if (contentType === 'audio') {
            await sock.sendMedia(m.chat, buffer, null, quoted, {
                type: 'audio',
                mimetype: 'audio/mpeg',
                ptt: true
            })
        }

    } catch (error) {
        await m.reply(
            `❌ *ᴇʀʀᴏʀ*\n\n` +
            `> Failed open message 1x view.\n` +
            `> _${error.message}_`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
