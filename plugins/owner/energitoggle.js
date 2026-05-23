const { getDatabase } = require('../../src/lib/frenzy-database')
const config = require('../../config')

const pluginConfig = {
    name: ['insableenergy', 'enableenergy'],
    alias: ['offenergy', 'onenergy'],
    category: 'owner',
    description: 'Enable/insable system energy',
    usage: '.insableenergy or .enableenergy',
    example: '.insableenergy',
    isOwner: true,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m) {
    const db = getDatabase()
    const cmd = m.command.toLowerCase()
    const isEnable = ['enableenergy', 'onenergy'].includes(cmd)

    db.setting('energy', isEnable)
    db.save()

    m.react(isEnable ? '⚡' : '🔌')
    return m.reply(
        isEnable
            ? '⚡ *sɪsᴛᴇᴍ ᴇɴᴇʀɢɪ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ*\n\n> Every command now memerlukan energy.'
            : '🔌 *sɪsᴛᴇᴍ ᴇɴᴇʀɢɪ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ*\n\n> Command no again memneedkan energy.'
    )
}

module.exports = {
    config: pluginConfig,
    handler
}
