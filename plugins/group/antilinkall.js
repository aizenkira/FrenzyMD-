const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')

const pluginConfig = {
    name: 'antilinkall',
    alias: ['alall', 'antialllink'],
    category: 'group',
    description: 'Anti all jenis link',
    usage: '.antilinkall <on/off/metode> [kick/remove]',
    example: '.antilinkall on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
}



async function handler(m, { sock }) {
    const db = getDatabase()
    const option = m.text?.toLowerCase()?.trim()
    
    if (!option) {
        const groupData = db.getGroup(m.chat) || {}
        const status = groupData.antilinkall || 'off'
        const mode = groupData.antilinkallMode || 'remove'
        
        return m.reply(
            `🔗 *ᴀɴᴛɪʟɪɴᴋ ᴀʟʟ*\n\n` +
            `╭┈┈⬡「 📋 *sᴛᴀᴛᴜs* 」\n` +
            `┃ ◦ Status: *${status.toUpperCase()}*\n` +
            `┃ ◦ Mode: *${mode.toUpperCase()}*\n` +
            `╰┈┈⬡\n\n` +
            `> Detect all jenis link (http/https/www)\n\n` +
            `*ᴄᴀʀᴀ ᴘᴀᴋᴀɪ:*\n` +
            `> \`${m.prefix}antilinkall on\` - Activekan\n` +
            `> \`${m.prefix}antilinkall off\` - Nonactivekan\n` +
            `> \`${m.prefix}antilinkall metode kick\` - Mode kick user\n` +
            `> \`${m.prefix}antilinkall metode remove\` - Mode delete message`
        )
    }
    
    if (option === 'on') {
        db.setGroup(m.chat, { antilinkall: 'on' })
        return m.reply(`✅ *ᴀɴᴛɪʟɪɴᴋ ᴀʟʟ* inactivekan!\n\n> All link will deleted otodeads.`)
    }
    
    if (option === 'off') {
        db.setGroup(m.chat, { antilinkall: 'off' })
        return m.reply(`❌ *ᴀɴᴛɪʟɪɴᴋ ᴀʟʟ* innonactivekan!`)
    }
    
    if (option.startsWith('metode')) {
        const method = m.args?.[1]?.toLowerCase()
        if (method === 'kick') {
            db.setGroup(m.chat, { antilinkall: 'on', antilinkallMode: 'kick' })
            return m.reply(`✅ *ᴀɴᴛɪʟɪɴᴋ ᴀʟʟ* mode KICK inactivekan!\n\n> User that send link will kictod.`)
        } else if (method === 'remove' || method === 'delete') {
            db.setGroup(m.chat, { antilinkall: 'on', antilinkallMode: 'remove' })
            return m.reply(`✅ *ᴀɴᴛɪʟɪɴᴋ ᴀʟʟ* mode DELETE inactivekan!\n\n> Message with link will deleted.`)
        } else {
            return m.reply(`❌ Metode no valid! Usage: \`kick\` or \`remove\`\n\n> Example: \`${m.prefix}antilinkall metode kick\``)
        }
    }
    
    if (option === 'kick') {
        db.setGroup(m.chat, { antilinkall: 'on', antilinkallMode: 'kick' })
        return m.reply(`✅ *ᴀɴᴛɪʟɪɴᴋ ᴀʟʟ* mode KICK inactivekan!\n\n> User that send link will kictod.`)
    }
    
    if (option === 'remove' || option === 'delete') {
        db.setGroup(m.chat, { antilinkall: 'on', antilinkallMode: 'remove' })
        return m.reply(`✅ *ᴀɴᴛɪʟɪɴᴋ ᴀʟʟ* mode DELETE inactivekan!\n\n> Message with link will deleted.`)
    }
    
    return m.reply(`❌ Option no valid! Usage: \`on\`, \`off\`, \`metode kick\`, \`metode remove\``)
}

module.exports = {
    config: pluginConfig,
    handler
}
