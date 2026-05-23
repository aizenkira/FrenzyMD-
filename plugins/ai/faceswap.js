const axios = require('axios')
const FormData = require('form-data')
const config = require('../../config')
const { downloadMediaMessage } = require('ourin')
const path = require('path')
const fs = require('fs')
const { f } = require('../../src/lib/frenzy-http')
const te = require('../../src/lib/frenzy-error')

const NEOXR_APIKEY = config.APItoy?.neoxr || 'Milik-Bot-OurinMD'

const pluginConfig = {
    name: 'faceswap',
    alias: ['fs', 'swapface'],
    category: 'ai',
    description: 'Tukar face from 2 image',
    usage: '.faceswap (send/reply 2 image)',
    example: '.faceswap',
    cooldown: 30,
    energy: 2,
    isEnabled: true
}

const faceswapSessions = new Map()

let thumbAI = null
try {
    const p = path.join(process.cwd(), 'assets/images/frenzy-ai.jpg')
    if (fs.existsSync(p)) thumbAI = fs.readFileSync(p)
} catch {}

function getContextInfo(title, body) {
    const saluranId = config.saluran?.id || '120363406397452589@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'

    const ctx = {
        forwardingScore: 9999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: saluranId,
            newsletterName: saluranName,
            serverMessageId: 127
        }
    }

    if (thumbAI) {
        ctx.externalAdReply = {
            title,
            body,
            thumbnail: thumbAI,
            contentType: 1,
            renderLargerThumbnail: false,
            sourceUrl: config.saluran?.link || ''
        }
    }

    return ctx
}

async function uploadToTmpFiles(buffer, filename) {
    const form = new FormData()
    form.append('file', buffer, { filename, contentType: 'application/octet-stream' })
    
    const res = await axios.post('https://tmpfiles.org/api/v1/upload', form, {
        headers: form.getHeaders(),
        timeout: 30000
    })
    
    if (!res.data?.data?.url) throw new Error('Upload failed')
    return res.data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
}

async function handler(m, { sock }) {
    const session = faceswapSessions.get(m.sender)
    
    let imageBuffer = null
    
    if (m.quoted?.message) {
        const quotedType = Object.keys(m.quoted.message)[0]
        if (quotedType === 'imageMessage' || m.quoted.message?.imageMessage) {
            try {
                imageBuffer = await downloadMediaMessage(
                    { toy: m.quoted.key, message: m.quoted.message },
                    'buffer',
                    {}
                )
            } catch {}
        }
    }
    
    if (!imageBuffer && m.message) {
        const msgType = Object.keys(m.message)[0]
        if (msgType === 'imageMessage' || m.message?.imageMessage) {
            try {
                imageBuffer = await m.download()
            } catch {}
        }
    }
    
    if (!session) {
        if (!imageBuffer) {
            return m.reply(
                `🔄 *ꜰᴀᴄᴇsᴡᴀᴘ*\n\n` +
                `> Tukar face from 2 image\n\n` +
                `╭┈┈⬡「 📋 *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ* 」\n` +
                `┃ 1. Send image first (face sumber)\n` +
                `┃ 2. Send image todua (target)\n` +
                `╰┈┈┈┈┈┈┈┈⬡\n\n` +
                `> Send image first + caption \`${m.prefix}faceswap\``
            )
        }
        
        await m.react('1️⃣')
        
        const sourceUrl = await uploadToTmpFiles(imageBuffer, 'source.jpg')
        
        faceswapSessions.set(m.sender, {
            sourceUrl,
            timestamp: Date.now()
        })
        
        setTimeout(() => {
            faceswapSessions.delete(m.sender)
        }, 300000)
        
        return m.reply(
            `✅ *ɢᴀᴍʙᴀʀ 1 ᴅɪsɪᴍᴘᴀɴ*\n\n` +
            `> Now send image todua (target)\n` +
            `> with caption \`${m.prefix}faceswap\`\n\n` +
            `> ⏱️ Session berlI 5 minute`
        )
    }
    
    if (!imageBuffer) {
        return m.reply(
            `⚠️ *ᴋɪʀɪᴍ ɢᴀᴍʙᴀʀ ᴋᴇᴅᴜᴀ*\n\n` +
            `> Send image todua (target) + caption \`${m.prefix}faceswap\``
        )
    }
    
    await m.react('2️⃣')
    
    try {
        const targetUrl = await uploadToTmpFiles(imageBuffer, 'target.jpg')
        
        await m.reply('🔄 *ᴍᴇᴍᴘʀᴏsᴇs...*\n\n> Menukar face, please wait...')
        
        const apiUrl = `https://api.neoxr.eu/api/faceswap?source=${encodeURIComponent(session.sourceUrl)}&target=${encodeURIComponent(targetUrl)}&apikey=${NEOXR_APIKEY}`
        
        const data = await f(apiUrl)
        
        faceswapSessions.delete(m.sender)
        
        if (!data?.status || !data?.data?.url) {
            m.react('❌')
            return m.reply('❌ *ɢᴀɢᴀʟ*\n\n> API no merespon or error')
        }
        
        await sock.sendMedia(m.chat, data.data.url, null, m, {
            type: 'image'
        })
        
        m.react('✅')
        
    } catch (error) {
        faceswapSessions.delete(m.sender)
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
