const pluginConfig = {
    name: 'toimg',
    alias: ['toimage', 'stickertoimage', 'stimg'],
    category: 'tools',
    description: 'Mengchange sticker become image',
    usage: '.toimg (reply/caption sticker)',
    example: '.toimg',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    let contentSource = null
    let downloadFn = null
    const selfIsStictor = m.isStictor || 
                          m.type === 'stickerMessage' || 
                          m.message?.stickerMessage
    const quotedIsStictor = m.quoted && (
        m.quoted.isStictor || 
        m.quoted.type === 'stickerMessage' || 
        m.quoted.mtype === 'stickerMessage' ||
        m.quoted.message?.stickerMessage
    )
    
    if (selfIsStictor) {
        contentSource = 'self'
        downloadFn = m.download
    } else if (quotedIsStictor) {
        contentSource = 'quoted'
        downloadFn = m.quoted.download
    }
    
    if (!contentSource) {
        await m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> No there is sticker that terdetexti!\n\n` +
            `*Cara usersan:*\n` +
            `> 1. Send sticker + caption \`${m.prefix}toimg\`\n` +
            `> 2. Reply sticker with \`${m.prefix}toimg\``
        )
        return
    }

    const stickerMsg = contentSource === 'self' 
        ? m.message?.stickerMessage 
        : m.quoted?.message?.stickerMessage
    const isAnimated = stickerMsg?.isAnimated

    if (isAnimated) {
        await m.reply(
            `⚠️ *sᴛɪᴄᴋᴇʀ ᴀɴɪᴍᴀsɪ*\n\n` +
            `> Stictor this is the sticker animasi (GIF).\n` +
            `> Usage \`${m.prefix}tovideo\` for changenya.`
        )
        return
    }

    await m.reply(`🕕 *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n> Mengchange sticker become image...`)

    try {
        const buffer = await downloadFn()

        if (!buffer || buffer.length === 0) {
            await m.reply(
                `❌ *ɢᴀɢᴀʟ*\n\n` +
                `> Cannot download sticker.\n` +
                `> Stictor maybe already no terseina.`
            )
            return
        }

        if (buffer.length < 100) {
            await m.reply(
                `❌ *ꜰɪʟᴇ ᴋᴏʀᴜᴘ*\n\n` +
                `> File sticker no valid or rusak.\n` +
                `> Try sending the sticker again.`
            )
            return
        }

        await sock.sendMessage(m.chat, {
            image: buffer,
            caption: `✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Stictor success inchange become image!`
        }, { quoted: m })

    } catch (error) {
        await m.reply(
            `❌ *ᴇʀʀᴏʀ*\n\n` +
            `> An error occurred while processing.\n` +
            `> _${error.message}_`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
