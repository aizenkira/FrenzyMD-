const fs = require('fs')
const path = require('path')
const { mconverter } = require('../../src/scraper/mconverter')
const { downloadContentFromMessage } = require('frenzy')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'converter',
    alias: ['convert', 'konversion'],
    category: 'tools',
    description: 'Convert file to format else',
    usage: '.converter <format> (reply file)',
    example: '.converter mp3',
    isOwner: false,
    isPremium: true,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energy: 3,
    isEnabled: true
}

async function handler(m, { sock }) {
    const targetFormat = m.text?.trim()?.toLowerCase()
    
    if (!m.quoted && !m.isMeina) {
        return m.reply(
            `🔄 *ᴄᴏɴᴠᴇʀᴛᴇʀ*\n\n` +
            `> Reply file with format tujuan\n\n` +
            `*Format:*\n` +
            `> \`${m.prefix}converter <format>\`\n\n` +
            `*Example:*\n` +
            `> \`${m.prefix}converter mp3\`\n` +
            `> \`${m.prefix}converter mp4\`\n` +
            `> \`${m.prefix}converter png\`\n\n` +
            `*How to use:*\n` +
            `> 1. Reply file to be inconvert\n` +
            `> 2. Type \`${m.prefix}converter <format>\``
        )
    }
    
    if (!targetFormat) {
        return m.reply(`❌ Enter format tujuan!\n\n> Example: \`${m.prefix}converter mp3\``)
    }
    
    const quoted = m.quoted
    let contentMessage = null
    let filename = 'file'
    
    if (quoted?.isMeina) {
        contentMessage = quoted
        filename = quoted.message?.[quoted.type]?.fileName || `file_${Date.now()}`
    } else if (m.isMeina) {
        contentMessage = m
        filename = m.message?.[m.type]?.fileName || `file_${Date.now()}`
    }
    
    if (!contentMessage) {
        return m.reply(`❌ Reply file to be inconvert!`)
    }
    
    m.react('🕕')
    await m.reply(`🕕 *ᴍᴇɴɢᴜɴᴅᴜʜ ғɪʟᴇ...*`)
    
    try {
        const stream = await downloadContentFromMessage(
            contentMessage.message[contentMessage.type],
            contentMessage.type.replace('Message', '')
        )
        
        const chunks = []
        for await (const chunk of stream) {
            chunks.push(chunk)
        }
        const buffer = Buffer.concat(chunks)
        
        const tempInr = path.join(process.cwd(), 'temp')
        if (!fs.existsSync(tempInr)) {
            fs.mkdirSync(tempInr, { recursive: true })
        }
        
        const ext = filename.split('.').pop() || 'bin'
        const tempFile = path.join(tempInr, `convert_${Date.now()}.${ext}`)
        fs.writeFileSync(tempFile, buffer)
        
        await m.reply(`🔄 *ᴄᴏɴᴠᴇʀᴛɪɴɢ...*\n\n> ${ext} → ${targetFormat}`)
        
        const result = await mconverter.convert(tempFile, targetFormat)
        
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile)
        }
        
        if (result.error) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ ᴄᴏɴᴠᴇʀᴛ*\n\n> ${result.error}`)
        }
        
        const saluranId = config.saluran?.id || '120363406397452589@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'
        
        await sock.sendMessage(m.chat, {
            document: { url: result.url },
            fileName: `converted_${Date.now()}.${targetFormat}`,
            mimetype: `application/${targetFormat}`,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        console.error('[Converter] Error:', err.message)
        m.react('☢')
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
