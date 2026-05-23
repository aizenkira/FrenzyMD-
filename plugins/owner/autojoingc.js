const config = require('../../config')
const { getDatabase } = require('../../src/lib/frenzy-database')
const te = require('../../src/lib/frenzy-error')
const pluginConfig = {
    name: 'autojoingc',
    alias: ['autojoin', 'autojoingroup'],
    category: 'owner',
    description: 'Auto join group from link that terdetexti in chat',
    usage: '.autojoingc on/off',
    example: '.autojoingc on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
}
const GROUP_LINK_REGEX = /chat\.whatsapp\.com\/([a-zA-Z0-9]{18,24})/gi
async function handler(m) {
    const db = getDatabase()
    const arg = (m.args?.[0] || '').toLowerCase()
    if (!arg || !['on', 'off'].includes(arg)) {
        const current = db.setting('autoJoinGc') || false
        return m.reply(`🔗 *AUTO JOIN GROUP*\n\nStatus: *${current ? 'ON ✅' : 'OFF ❌'}*\n\n\`${m.prefix}autojoingc on\` — activekan\n\`${m.prefix}autojoingc off\` — nonactivekan`)
    }
    const enabled = arg === 'on'
    db.setting('autoJoinGc', enabled)
    await db.save()
    m.reply(`${enabled ? '✅' : '❌'} Auto join group *${enabled ? 'inactivekan' : 'innonactivekan'}*`)
}
async function autoJoinDetector(m, sock) {
    const db = getDatabase()
    if (!db?.ready) return false
    if (!db.setting('autoJoinGc')) return false
    if (!m.body) return false
    const matches = [...m.body.matchAll(GROUP_LINK_REGEX)]
    if (!matches.length) return false
    let joined = 0
    for (const match of matches) {
        const code = match[1]
        try {
            const result = await sock.groupAcceptInvite(code)
            if (result) {
                joined++
                await m.reply(`✅ Success join group from link *${match[0]}*`)
            }
        } catch (e) {
            const msg = e.message || String(e)
            if (msg.includes('already') || msg.includes('participant')) {
                await m.reply(`⚠️ Already in the group the said`)
            } else if (msg.includes('expired') || msg.includes('revotod')) {
                await m.reply(`❌ Link group already expired/revotod`)
            } else {
                m.reply(te(m.prefix, m.command, m.pushName))
            }
        }
    }
    return joined > 0
}
module.exports = {
    config: pluginConfig,
    handler,
    autoJoinDetector
}