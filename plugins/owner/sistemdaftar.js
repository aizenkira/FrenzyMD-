const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')

const pluginConfig = {
    name: 'systemlist',
    alias: ['regmode', 'requiredlist', 'togglereg'],
    category: 'owner',
    description: 'Toggle system required list on/off',
    usage: '.systemlist <on/off>',
    example: '.systemlist on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.text?.trim().toLowerCase()
    
    const currentStatus = db.setting('registrationRequired') ?? config.registration?.enabled ?? false
    
    const saluranId = config.saluran?.id || '120363208449943317@newsletter'
    const saluranName = config.saluran?.name || config.bot?.name || 'frenzy-AI'
    
    if (!args) {
        return m.reply(
            `⚙️ *sɪsᴛᴇᴍ ᴅᴀꜰᴛᴀʀ*\n\n` +
            `Status: ${currentStatus ? '✅ ON (Registration Required)' : '❌ OFF'}\n\n` +
            `*Usage:*\n` +
            `> \`${m.prefix}systemlist on\` - Requiredkan list\n` +
            `> \`${m.prefix}systemlist off\` - Matikan required list\n\n` +
            `> If ON, user must \`${m.prefix}list\` before use command`
        )
    }
    
    if (args === 'on' || args === '1' || args === 'true') {
        db.setting('registrationRequired', true)
        await db.save()
        
        await sock.sendMessage(m.chat, {
            text: `✅ *sɪsᴛᴇᴍ ᴅᴀꜰᴛᴀʀ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ!*\n\n` +
                `User now required list before use command!\n\n` +
                `> Command: \`${m.prefix}list <name>\``,
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
        return
    }
    
    if (args === 'off' || args === '0' || args === 'false') {
        db.setting('registrationRequired', false)
        await db.save()
        
        await sock.sendMessage(m.chat, {
            text: `❌ *sɪsᴛᴇᴍ ᴅᴀꜰᴛᴀʀ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ!*\n\n` +
                `User no perlu list for use command.`,
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
        
        m.react('❌')
        return
    }
    
    return m.reply(`❌ Option no valid!\n\n> Usage: \`on\` or \`off\``)
}

module.exports = {
    config: pluginConfig,
    handler
}
