const config = require('../../config')
const { uploadToTmpFiles } = require('../../src/lib/frenzy-tmpfiles')
const { default: axios } = require('axios')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'rethis',
    alias: ['hd', 'enhance', 'upscale'],
    category: 'tools',
    description: 'Enhance/upscale image become HD (V4)',
    usage: '.rethis (reply image)',
    example: '.rethis',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')

    if (!isImage) {
        return m.reply(`✨ *ʀᴇᴍɪɴɪ ᴇɴʜᴀɴᴄᴇ*\n\n> Send/reply image for in-enhance\n\n\`${m.prefix}rethis\``)
    }

    m.react('🕕')

    try {
        let buffer
        if (m.quoted && m.quoted.isMeina) {
            buffer = await m.quoted.download()
        } else if (m.isMeina) {
            buffer = await m.download()
        }

        if (!buffer) {
            m.react('❌')
            return m.reply(`❌ Failed mendownload image`)
        }
        const gmbr = await uploadToTmpFiles(buffer, {
            filename: 'image.jpg',
            contentType: 'image/jpeg'
        })
        console.log(gmbr.directUrl)
        const res = await axios.get(`https://api-faa.my.id/faa/hdv4?image=${encodeURIComponent(gmbr.directUrl)}`)
        const data = res.data.result
        m.react('✅')

        const saluranId = config.saluran?.id || '120363406397452589@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'

        await sock.sendMessage(m.chat, {
            image: { url: data.image_upscaled },
            caption: `*DONE*`,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
            }
        }, { quoted: m })

    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
