const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'onlythisgroup',
    alias: ['onlythisgroup', 'lockgroup', 'lockgroup'],
    category: 'owner',
    description: 'Bot only active in this group saja',
    usage: '.onlythisgroup',
    example: '.onlythisgroup',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const current = db.setting('onlyThisGroup') || null

    if (current === m.chat) {
        db.setting('onlyThisGroup', null)
        db.save()
        return m.reply(`🔓 *UNLOCKED*\n\nBot active in all group`)
    }

    db.setting('onlyThisGroup', m.chat)
    db.save()

    const meta = await sock.groupMetadata(m.chat).catch(() => null)
    const groupName = meta?.subject || m.chat

    await m.reply(
        `🔒 *LOCKED*\n\n` +
        `Bot only active in:\n` +
        `*${groupName}*\n\n` +
        `Group else cannot use bot\n` +
        `Type again for unlock`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
