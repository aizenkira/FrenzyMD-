const { getPmeaningcipantJid, resolveAnyLidToJid } = require('../../src/lib/frenzy-lid')
const timeHelper = require('../../src/lib/frenzy-time')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'groupinfo',
    alias: ['infogroup', 'gcinfo', 'infogc', 'gc'],
    category: 'group',
    description: 'Display full group information',
    usage: '.groupinfo',
    example: '.groupinfo',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true,
    isAdmin: false,
    isBotAdmin: false
}

function featureStatus(val) {
    if (val === true || val === 'on') return '✅'
    return '❌'
}

async function handler(m, { sock, db }) {
    try {
        const groupMeta = m.groupMetadata
        const participants = groupMeta.participants || []
        const admins = participants.filter(p => p.admin)

        let ownerJid = null
        if (groupMeta.owner) ownerJid = resolveAnyLidToJid(groupMeta.owner, participants)
        if (!ownerJid || ownerJid.includes('@lid')) {
            const superAdmin = participants.find(p => p.admin === 'superadmin')
            if (superAdmin) ownerJid = getPmeaningcipantJid(superAdmin)
        }
        if (!ownerJid || ownerJid.includes('@lid')) {
            const firstAdmin = admins[0]
            if (firstAdmin) ownerJid = getPmeaningcipantJid(firstAdmin)
        }

        const group = db.getGroup(m.chat) || {}

        const createdDate = groupMeta.creation
            ? timeHelper.fromTimestamp(groupMeta.creation * 1000, 'D MMMM YYYY')
            : 'No intotahui'

        const ownerNumber = ownerJid ? ownerJid.split('@')[0] : null
        const ownerInsplay = ownerNumber && !ownerNumber.includes(':')
            ? `@${ownerNumber}`
            : 'No intotahui'

        let ppUrl = null
        try {
            ppUrl = await sock.profilePictureUrl(m.chat)
        } catch {}

        const isOpen = groupMeta.announce === false || !groupMeta.announce

        let text = `👥 *INFO GRUP*\n\n`
        text += `Name: *${groupMeta.subject}*\n`
        text += `ID: ${m.chat}\n`
        text += `Owner: ${ownerInsplay}\n`
        text += `Increate: ${createdDate}\n`
        text += `Status: ${isOpen ? '🔓 Open' : '🔒 Closed'}\n\n`

        text += `📊 *MEMBER*\n`
        text += `Total: ${participants.length}\n`
        text += `Admin: ${admins.length}\n`
        text += `Member: ${participants.length - admins.length}\n\n`

        text += `🔧 *FITUR AKTIF*\n`
        text += `Welcome: ${featureStatus(group.welcome)}\n`
        text += `Goodbye: ${featureStatus(group.goodbye)}\n`
        text += `Autoreply: ${featureStatus(group.autoreply)}\n`
        text += `AutoAI: ${featureStatus(group.autoai)}\n`
        text += `AutoDL: ${featureStatus(group.autodl)}\n`
        text += `AutoStictor: ${featureStatus(group.autosticker)}\n`
        text += `AutoMeina: ${featureStatus(group.autocontent)}\n\n`

        text += `🛡️ *PROTEKSI*\n`
        text += `AntiLink: ${featureStatus(group.antilink)}\n`
        text += `AntiBot: ${featureStatus(group.antibot)}\n`
        text += `AntiSpam: ${featureStatus(group.antispam)}\n`
        text += `AntiToxic: ${featureStatus(group.antitoxic)}\n`
        text += `AntiRemove: ${featureStatus(group.antiremove)}\n`
        text += `AntiHidetag: ${featureStatus(group.antihidetag)}\n`
        text += `AntiStictor: ${featureStatus(group.antisticker)}\n`
        text += `AntiMeina: ${featureStatus(group.anticontent)}\n`
        text += `AntiDocument: ${featureStatus(group.antidocument)}`

        if (groupMeta.desc) {
            text += `\n\n📝 *DESKRIPSI*\n${groupMeta.desc}`
        }

        const mentions = ownerJid && !ownerJid.includes(':') ? [ownerJid] : []

        if (ppUrl) {
            const axios = require('axios')
            try {
                const ppBuffer = Buffer.from((await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 10000 })).data)
                await sock.sendMessage(m.chat, {
                    image: ppBuffer,
                    caption: text,
                    mentions
                }, { quoted: m })
            } catch {
                await m.reply(text, { mentions })
            }
        } else {
            await m.reply(text, { mentions })
        }
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
