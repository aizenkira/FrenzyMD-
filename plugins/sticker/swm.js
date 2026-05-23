/**
 * @file plugins/sticker/swm.js
 * @description Plugin for replace packname and author on the sticker
 */

const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'swm',
    alias: ['wm', 'stickerwm', 'stickermark', 'colong'],
    category: 'sticker',
    description: 'Change the packname and author of the sticker',
    usage: '.swm <packname>|<author>',
    example: '.swm BotName|Author',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 1,
    isEnabled: true
}

async function handler(m, { sock, config: botConfig }) {
    const quoted = m.quoted
    
    if (!quoted) {
        return m.reply(
            `🖼️ *sᴛɪᴄᴋᴇʀ ᴡᴀᴛᴇʀᴍᴀʀᴋ*\n\n` +
            `> Reply sticker with caption:\n` +
            `> \`${m.prefix}swm packname|author\`\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> \`${m.prefix}swm frenzy-AI|LuckyArchz\`\n` +
            `> \`${m.prefix}swm BotKu\` _(only packname)_\n` +
            `> \`${m.prefix}swm |Author\` _(only author)_`
        )
    }
    
    const isStictor = quoted.type === 'stickerMessage' || quoted.isStictor
    if (!isStictor) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Reply message sticker, not ${quoted.type?.replace('Message', '') || 'content else'}`)
    }
    
    const input = m.text?.trim()
    if (!input) {
        return m.reply(
            `❌ *ɢᴀɢᴀʟ*\n\n` +
            `> Enter packname and/or author\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> \`${m.prefix}swm frenzy-AI|LuckyArchz\`\n` +
            `> \`${m.prefix}swm BotKu\` _(only packname)_`
        )
    }
    
    let packname, author
    
    if (input.includes('|')) {
        const parts = input.split('|')
        packname = parts[0]?.trim() || botConfig.sticker?.packname || botConfig.bot?.name || 'frenzy-AI'
        author = parts[1]?.trim() || botConfig.sticker?.author || botConfig.owner?.name || 'Bot'
    } else {
        packname = input
    }
    
    if (packname.length > 50) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Packname too long (max 50 karakter)`)
    }
    
    if (author?.length > 50) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Author too long (max 50 karakter)`)
    }
    
    m.react('🕕')
    
    try {
        const buffer = await quoted.download()
        
        if (!buffer || buffer.length === 0) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Failed mendownload sticker`)
        }
        
        const isAnimated = quoted.msg?.isAnimated || false
        
        if (isAnimated) {
            await sock.sendVideoAsStictor(m.chat, buffer, m, !author ? {
                packname,
            } : {
                packname,
                author
            })
        } else {
            await sock.sendImageAsStictor(m.chat, buffer, m, !author ? {
                packname,
            } : {
                packname,
                author
            })
        }
        
        m.react('✅')
        
    } catch (error) {
        console.error('[SWM] Error:', error.message)
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
