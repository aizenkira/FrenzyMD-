const { getDatabase } = require('../../src/lib/frenzy-database')
const fs = require('fs')

const pluginConfig = {
    name: 'delsewa',
    alias: ['sewadel', 'deletesewa', 'removesewa'],
    category: 'owner',
    description: 'Delete group from whitelist sewa',
    usage: '.delsewa <link/id group>',
    example: '.delsewa https://chat.whatsapp.com/xxx',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function resolveGroupId(sock, input) {
    if (input.includes('chat.whatsapp.com/')) {
        const inviteCode = input.split('chat.whatsapp.com/')[1]?.split(/[\s?]/)[0]
        try {
            const metadata = await sock.groupGetInviteInfo(inviteCode)
            if (metadata?.id) return { id: metadata.id, name: metadata.subject }
        } catch {}
        return null
    }
    return { id: input.includes('@g.us') ? input : input + '@g.us', name: null }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const input = m.text?.trim()

    if (!db.db.data.sewa) {
        db.db.data.sewa = { enabled: false, groups: {} }
        db.db.write()
    }

    let groupId = null
    let groupName = null

    if (!input) {
        if (!m.isGroup) {
            return m.reply(
                `📝 *HAPUS SEWA*\n\n` +
                `From private: *${m.prefix}delsewa <link/id>*\n` +
                `From group: type *${m.prefix}delsewa* directly in group\n\n` +
                `Example:\n` +
                `• ${m.prefix}delsewa https://chat.whatsapp.com/xxx\n` +
                `• ${m.prefix}delsewa 120363xxx\n\n` +
                `⚠️ If sewabot active, bot will otodeads leave from group that deleted`
            )
        }
        groupId = m.chat
    } else {
        const result = await resolveGroupId(sock, input)
        if (!result) return m.reply(`❌ Link no valid or group not found`)
        groupId = result.id
        groupName = result.name
    }

    if (!groupId) return m.reply(`❌ Cannot menentukan group`)

    const sewaData = db.db.data.sewa.groups[groupId]
    if (!sewaData) return m.reply(`❌ Group no registered in system sewa\n\nView list: *${m.prefix}listsewa*`)

    groupName = groupName || sewaData.name || groupId.split('@')[0]

    delete db.db.data.sewa.groups[groupId]
    db.db.write()

    m.react('✅')
    await m.reply(`✅ *SEWA DIHAPUS*\n\nGroup: *${groupName}*\nID: ${groupId.split('@')[0]}`)

    if (db.db.data.sewa.enabled) {
        try {
            await sock.sendText(groupId, `⛔ Group this has deleted from whitelist sewa.\nBot will meninggalkan group.\n\nContact owner for sewa again.`, null, {
                contextInfo: {
                    forwardingScore: 99,
                    isForwarded: true,
                    externalAdReply: {
                        contentType: 1,
                        title: 'SEWA DIHAPUS',
                        body: 'Group deleted from whitelist',
                        thumbnail: fs.readFileSync('./assets/images/frenzy.jpg'),
                        renderLargerThumbnail: true
                    }
                }
            })
            await new Promise(r => setTimeout(r, 2000))
            await sock.groupLeave(groupId)
        } catch {}
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
