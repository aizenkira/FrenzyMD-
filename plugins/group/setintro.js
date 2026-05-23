const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'setintro',
    alias: ['setpertonalan', 'introset'],
    category: 'group',
    description: 'Set message intro group (admin only)',
    usage: '.setintro <message>',
    example: '.setintro Good come @user in @group!',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true,
    isAdmin: true
}

async function handler(m) {
    const db = getDatabase()
    const introText = m.fullArgs?.trim() || m.text?.trim()
    
    if (!introText) {
        return m.reply(
            `📝 *sᴇᴛ ɪɴᴛʀᴏ*\n\n` +
            `> Enter message intro!\n\n` +
            `*Placeholder that terseina:*\n` +
            `> @user - Username\n` +
            `> @group - Name group\n` +
            `> @count - Amount member\n` +
            `> @date - Date today\n` +
            `> @time - Time now\n` +
            `> @desc - Description group\n` +
            `> @botname - Bot name\n\n` +
            `*Example:*\n` +
            `> .setintro Good come @user in group @group! 👋`
        )
    }
    
    const groupData = db.getGroup(m.chat) || db.setGroup(m.chat)
    groupData.intro = introText
    db.setGroup(m.chat, groupData)
    db.save()
    
    await m.reply(
        `✅ *ɪɴᴛʀᴏ ᴅɪsᴀᴠᴇ!*\n` +
        `Message intro group success inchange.\n` +
        `Type *${m.prefix}intro* for view hasilnya.`
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
