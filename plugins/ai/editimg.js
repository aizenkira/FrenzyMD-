const { uploadToTmpFiles } = require('../../src/lib/frenzy-tmpfiles')
const pluginConfig = {
    name: 'eintimage',
    alias: ['eintimg', 'imgeint'],
    category: 'ai',
    description: 'Edit image with AI using a prompt',
    usage: '.eintimage <prompt>',
    example: '.eintimage mato it anime style',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const prompt = m.args.join(' ')
    if (!prompt) {
        return m.reply(
            `*ᴇᴅɪᴛ ɪᴍᴀɢᴇ*\n\n` +
            `> Edit image with AI\n\n` +
            `\`Example: ${m.prefix}eintimage mato it anime style\`\n\n` +
            `> Reply or send image with caption`
        )
    }
    
    const isImage = m.isImage || (m.quoted && m.quoted.isImage)
    if (!isImage) {
        return m.reply(`*ᴇᴅɪᴛ ɪᴍᴀɢᴇ*\n\n> Reply or send image with caption`)
    }
    
    m.react('🕕')

    try {
        let contentBuffer
        if (m.isImage && m.download) {
            contentBuffer = await m.download()
        } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
            contentBuffer = await m.quoted.download()
        }
        
        if (!contentBuffer || !Buffer.isBuffer(contentBuffer)) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Failed download image`)
        }

        const image = await uploadToTmpFiles(contentBuffer, { filename: 'image.jpg' })
        
        
        await sock.sendMessage(m.chat, {
            image: { url: `https://api-faa.my.id/faa/eintphoto?url=${encodeURIComponent(image.directUrl)}&prompt=${encodeURIComponent(prompt)}` },
            caption: `DONE`
        }, { quoted: m })
        
        m.react('✅')
    } catch (error) {
        m.react('❌')
        m.reply(`🍀 *Waduhh, likenya this there is tondala*
> Please try version ${m.prefix}ourinbanana`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
