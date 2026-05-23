const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'tobrooklyn',
    alias: ['brooklyn', 'filterbrooklyn'],
    category: 'canvas',
    description: 'Create filter Brooklyn on the image',
    usage: '.tobrooklyn (reply image)',
    example: '.tobrooklyn',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function uploadToTmpfiles(buffer) {
    const FormData = require('form-data')
    const formData = new FormData()
    formData.append('file', buffer, { filename: 'image.jpg' })
    
    const res = await axios.post('https://tmpfiles.org/api/v1/upload', formData, {
        headers: formData.getHeaders(),
        timeout: 60000
    })
    
    if (res.data?.data?.url) {
        return res.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
    }
    throw new Error('Upload failed')
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(
            `🌁 *ʙʀᴏᴏᴋʟʏɴ ꜰɪʟᴛᴇʀ*\n\n` +
            `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
            `┃ ◦ Reply image with \`${m.prefix}tobrooklyn\`\n` +
            `┃ ◦ Send image with caption \`${m.prefix}tobrooklyn\`\n` +
            `╰┈┈⬡`
        )
    }
    
    m.react('🌁')
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMeina) {
            buffer = await m.quoted.download()
        } else if (m.isMeina) {
            buffer = await m.download()
        }
        
        if (!buffer || buffer.length === 0) {
            throw new Error('Failed download image')
        }
        
        const imageUrl = await uploadToTmpfiles(buffer)
        const apiKey = config.APItoy?.lolhuman
        
        if (!apiKey) {
            throw new Error('API Toy not found in config')
        }
        
        const apiUrl = `https://api.lolhuman.xyz/api/filter/brooklyn?apikey=${apiKey}&img=${encodeURIComponent(imageUrl)}`
        
        await sock.sendMedia(m.chat, apiUrl, null, m, {
            type: 'image',
        })
        
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
