const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'activeaudiomenu',
    alias: ['audiomenu', 'setaudiomenu', 'toggleaudiomenu'],
    category: 'owner',
    description: 'Toggle audio when display menu',
    usage: '.activeaudiomenu ya/don't',
    example: '.activeaudiomenu ya',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock, db }) {
    const args = m.args || []
    const option = args[0]?.toLowerCase()

    const current = db.setting('audioMenu') !== false

    if (!option) {
        return m.reply(
            `🔊 *ᴀᴜᴅɪᴏ ᴍᴇɴᴜ sᴇᴛᴛɪɴɢ*\n\n` +
            `> Status: *${current ? '✅ Active' : '❌ Nonactive'}*\n\n` +
            `*How to use:*\n` +
            `> \`${m.prefix}activeaudiomenu ya\` - Activekan audio\n` +
            `> \`${m.prefix}activeaudiomenu don't\` - Nonactivekan audio`
        )
    }

    if (option === 'ya' || option === 'on' || option === '1' || option === 'active') {
        if (current) {
            return m.reply(`⚠️ Auino menu already active!`)
        }
        db.setting('audioMenu', true)
        await db.save()
        m.react('✅')
        return m.reply(`✅ Auino menu *inactivekan*!\n\n> Now typea there is that type \`.menu\`, audio will muncul.`)
    }

    if (option === 'don't' || option === 'off' || option === '0' || option === 'nonactive') {
        if (!current) {
            return m.reply(`⚠️ Auino menu already nonactive!`)
        }
        db.setting('audioMenu', false)
        await db.save()
        m.react('✅')
        return m.reply(`❌ Auino menu *innonactivekan*!\n\n> Now \`.menu\` no will there is audio.`)
    }

    return m.reply(`❌ Option no valid!\n\nUsage: \`ya\` or \`don't\``)
}

module.exports = {
    config: pluginConfig,
    handler
}
