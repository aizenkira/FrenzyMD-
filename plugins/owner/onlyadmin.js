const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'onlyadmin',
    alias: ['selfadmin', 'publicadmin', 'adminonly'],
    category: 'owner',
    description: 'Only admin group that can access command bot',
    usage: '.onlyadmin on/off',
    example: '.onlyadmin on',
    isOwner: true,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    const args = m.args[0]?.toLowerCase()
    const cmd = m.command.toLowerCase()
    const current = db.setting('onlyAdmin') || false

    if (cmd === 'selfadmin') {
        if (current) {
            db.setting('onlyAdmin', false)
            m.react('❌')
            return m.reply('❌ *ᴏɴʟʏᴀᴅᴍɪɴ ɴᴏɴᴀᴋᴛɪꜰ*\n\n> Bot can inaccess all person')
        }
        db.setting('onlyAdmin', true)
        db.setting('selfAdmin', false)
        db.setting('publicAdmin', false)
        m.react('✅')
        return m.reply(
            '✅ *ᴏɴʟʏᴀᴅᴍɪɴ ᴀᴋᴛɪꜰ*\n\n' +
            '╭┈┈⬡「 🔒 *ᴀᴋsᴇs* 」\n' +
            '┃ ✅ Admin group\n' +
            '┃ ✅ Owner bot\n' +
            '┃ ❌ Member regular\n' +
            '╰┈┈⬡\n\n' +
            '> Usage `.onlyadmin off` for menonactivekan'
        )
    }

    if (cmd === 'publicadmin') {
        if (current) {
            db.setting('onlyAdmin', false)
            m.react('❌')
            return m.reply('❌ *ᴏɴʟʏᴀᴅᴍɪɴ ɴᴏɴᴀᴋᴛɪꜰ*\n\n> Bot can inaccess all person')
        }
        db.setting('onlyAdmin', true)
        db.setting('selfAdmin', false)
        db.setting('publicAdmin', false)
        m.react('✅')
        return m.reply(
            '✅ *ᴏɴʟʏᴀᴅᴍɪɴ ᴀᴋᴛɪꜰ*\n\n' +
            '╭┈┈⬡「 🔒 *ᴀᴋsᴇs* 」\n' +
            '┃ ✅ Admin group\n' +
            '┃ ✅ Owner bot\n' +
            '┃ ✅ Private chat (all)\n' +
            '┃ ❌ Member regular in group\n' +
            '╰┈┈⬡\n\n' +
            '> Usage `.onlyadmin off` for menonactivekan'
        )
    }

    if (!args || args === 'status') {
        return m.reply(
            `🔒 *ᴏɴʟʏᴀᴅᴍɪɴ*\n\n` +
            `> Status: ${current ? '✅ Active' : '❌ Nonactive'}\n\n` +
            `*Usage:*\n` +
            `> \`.onlyadmin on\` — Activekan\n` +
            `> \`.onlyadmin off\` — Nonactivekan\n\n` +
            `_Only admin group, owner, and private chat that can access bot_`
        )
    }

    if (args === 'on') {
        if (current) return m.reply('⚠️ OnlyAdmin already active.')
        db.setting('onlyAdmin', true)
        db.setting('selfAdmin', false)
        db.setting('publicAdmin', false)
        m.react('✅')
        return m.reply(
            '✅ *ᴏɴʟʏᴀᴅᴍɪɴ ᴀᴋᴛɪꜰ*\n\n' +
            '╭┈┈⬡「 🔒 *ᴀᴋsᴇs* 」\n' +
            '┃ ✅ Admin group\n' +
            '┃ ✅ Owner bot\n' +
            '┃ ✅ Private chat (all)\n' +
            '┃ ❌ Member regular in group\n' +
            '╰┈┈⬡'
        )
    }

    if (args === 'off') {
        if (!current) return m.reply('⚠️ OnlyAdmin already nonactive.')
        db.setting('onlyAdmin', false)
        m.react('❌')
        return m.reply('❌ *ᴏɴʟʏᴀᴅᴍɪɴ ɴᴏɴᴀᴋᴛɪꜰ*\n\n> Bot can inaccess all person')
    }

    return m.reply('❌ Argumen no valid. Usage: `on` or `off`')
}

module.exports = {
    config: pluginConfig,
    handler
}
