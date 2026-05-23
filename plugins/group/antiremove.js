const pluginConfig = {
    name: 'antiremove',
    alias: ['antidelete', 'antidelete', 'ar'],
    category: 'group',
    description: 'Mengactivekan/menonactivekan anti delete message in group',
    usage: '.antiremove <on/off>',
    example: '.antiremove on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: false
}

async function handler(m, { sock, db }) {
    const action = (m.args || [])[0]?.toLowerCase()
    const group = db.getGroup(m.chat) || {}

    if (!action) {
        const status = group.antiremove || 'off'
        await m.reply(
            `🗑️ *AntiRemove*\n\n` +
            `> Status: *${status === 'on' ? '✅ Active' : '❌ Nonactive'}*\n\n` +
            `> \`.antiremove on/off\``
        )
        return
    }

    if (action === 'on') {
        db.setGroup(m.chat, { ...group, antiremove: 'on' })
        m.react('✅')
        await m.reply(`✅ *AntiRemove inactivekan*\n> Message that deleted will in-forward again.`)
        return
    }

    if (action === 'off') {
        db.setGroup(m.chat, { ...group, antiremove: 'off' })
        m.react('❌')
        await m.reply(`❌ *AntiRemove innonactivekan*`)
        return
    }

    await m.reply(`❌ Usage \`.antiremove on\` or \`.antiremove off\``)
}

module.exports = {
    config: pluginConfig,
    handler
}
