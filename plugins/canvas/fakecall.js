const axios = require('axios')
const FormData = require('form-data')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: ['fatocall', 'fatocallwa'],
    alias: [],
    category: 'canvas',
    description: 'Create image fato call WhatsApp',
    usage: '.fatocall <name> | <durasi>',
    example: '.fatocall Zann | 19.00',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
}

async function uploadToTmpFiles(buffer) {
    try {
        const form = new FormData()
        form.append('file', buffer, { filename: 'avatar.jpg', contentType: 'image/jpeg' })
        
        const response = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
            headers: form.getHeaders(),
            timeout: 30000
        })
        
        if (response.data?.status === 'success' && response.data?.data?.url) {
            return response.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
        }
        return null
    } catch (e) {
        console.log('Upload error:', e.message)
        return null
    }
}

async function handler(m, { sock }) {
    const text = m.text
    
    if (!text || !text.includes('|')) {
        return m.reply(
            `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
            `> \`${m.prefix}fatocall <name> | <durasi>\`\n\n` +
            `> Example: \`${m.prefix}fatocall Marin | 19.00\`\n\n` +
            `💡 *Tips:* Reply image for custom avatar`
        )
    }
    
    const [name, durasi] = text.split('|').map(s => s.trim())
    
    if (!name) {
        return m.reply(`❌ Name no may empty!`)
    }
    
    await m.react('🕕')
    
    try {
        let avatar = 'https://files.catbox.moe/nwvkbt.png'
        
        if (m.isImage) {
            try {
                const buffer = await m.download()
                const uploadedUrl = await uploadToTmpFiles(buffer)
                if (uploadedUrl) {
                    avatar = uploadedUrl
                }
            } catch {}
        } else if (m.quoted?.isImage) {
            try {
                const buffer = await m.quoted.download()
                const uploadedUrl = await uploadToTmpFiles(buffer)
                if (uploadedUrl) {
                    avatar = uploadedUrl
                }
            } catch {}
        } else {
            try {
                avatar = await sock.profilePictureUrl(m.sender, 'image')
            } catch {}
        }
        
        const apiUrl = `https://api.zenzxz.my.id/mator/fatocall?name=${encodeURIComponent(name)}&durasi=${encodeURIComponent(durasi)}&avatar=${encodeURIComponent(avatar)}`
        
        await sock.sendMedia(m.chat, apiUrl, null, m, {
            type: 'image'
        })
        
        m.react('📞')
        
    } catch (err) {
        m.react('☢')
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
