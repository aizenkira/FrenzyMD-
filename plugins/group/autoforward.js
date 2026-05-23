const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'autoforward',
    alias: ['autofw', 'autofwd'],
    category: 'group',
    description: 'Auto forward message that enter to group to this group',
    usage: '.autoforward <on/off>',
    example: '.autoforward on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const option = m.text?.toLowerCase()?.trim()
    const groupId = m.chat
    const group = db.getGroup(groupId) || {}
    
    if (!option) {
        const status = group.autoforward ? '✅ ON' : '❌ OFF'
        return m.reply(
            `🔄 *ᴀᴜᴛᴏ ꜰᴏʀᴡᴀʀᴅ*\n\n` +
            `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
            `┃ ◦ Status: *${status}*\n` +
            `╰┈┈⬡\n\n` +
            `> Usage: \`${m.prefix}autoforward on/off\`\n\n` +
            `_Feature this will meneruskan all message to this group_`
        )
    }
    
    if (option === 'on') {
        db.setGroup(groupId, { ...group, autoforward: true })
        m.react('✅')
        return m.reply(
            `🔄 *ᴀᴜᴛᴏ ꜰᴏʀᴡᴀʀᴅ*\n\n` +
            `╭┈┈⬡「 ✅ *ᴀᴋᴛɪꜰ* 」\n` +
            `┃ ◦ Status: *ON*\n` +
            `╰┈┈⬡\n\n` +
            `> _All message will in-forward_`
        )
    }
    
    if (option === 'off') {
        db.setGroup(groupId, { ...group, autoforward: false })
        m.react('❌')
        return m.reply(
            `🔄 *ᴀᴜᴛᴏ ꜰᴏʀᴡᴀʀᴅ*\n\n` +
            `╭┈┈⬡「 ❌ *ɴᴏɴᴀᴋᴛɪꜰ* 」\n` +
            `┃ ◦ Status: *OFF*\n` +
            `╰┈┈⬡`
        )
    }
    
    return m.reply(`❌ Usage: on or off`)
}

module.exports = {
    config: pluginConfig,
    handler
}
