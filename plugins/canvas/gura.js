const axios = require('axios')
const { f } = require('../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'gura',
    alias: ['gawr'],
    category: 'canvas',
    description: 'Apply effect Gawr Gura to image',
    usage: '.gura (reply/caption image)',
    example: '.gura',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock }) {
    let contentMsg = null
    let downloadFn = null
    
    if (m.isImage || m.message?.imageMessage) {
        contentMsg = m
        downloadFn = m.download
    } else if (m.quoted?.isImage || m.quoted?.message?.imageMessage) {
        contentMsg = m.quoted
        downloadFn = m.quoted.download
    }
    
    if (!contentMsg) {
        return m.reply(`🦈 *ɢᴜʀᴀ ᴇғғᴇᴄᴛ*\n\n> Send/reply image with command this`)
    }
    
    m.react('🕕')
    
    try {
        const buffer = await downloadFn()
        const formData = new FormData()
        formData.append('file', new Blob([buffer]), 'image.jpg')
        
        const uploadRes = await axios.post('https://tmpfiles.org/api/v1/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
        
        let imageUrl = uploadRes.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
        
        await sock.sendMedia(m.chat, `https://api.nexray.web.id/canvas/gura?url=${encodeURIComponent(imageUrl)}`, null, m, {
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
