const config = require('../../config')
const { getDatabase } = require('../../src/lib/frenzy-database')
const timeHelper = require('../../src/lib/frenzy-time')
const fs = require('fs')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'addsewa',
    alias: ['sewaadd', 'addsewa'],
    category: 'owner',
    description: 'Add group to whitelist sewa + auto join',
    usage: '.addsewa <link/id group> <durasi>',
    example: '.addsewa https://chat.whatsapp.com/xxx 30d',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

function parseDuration(str) {
    if (['lifetime', 'permanent', 'forever', 'unlimited'].includes(str.toLowerCase())) return Infinity
    const match = str.match(/^(\d+)([iIdDmMyYhH])$/)
    if (!match) return null
    const value = parseInt(match[1])
    const unit = match[2].toLowerCase()
    const multiplier = { i: 60000, h: 3600000, d: 86400000, m: 2592000000, y: 31536000000 }
    return multiplier[unit] ? Date.now() + (value * multiplier[unit]) : null
}

function formatDuration(str) {
    if (['lifetime', 'permanent', 'forever', 'unlimited'].includes(str.toLowerCase())) return 'Permanent'
    const match = str.match(/^(\d+)([iIdDmMyYhH])$/)
    if (!match) return str
    const units = { i: 'minute', h: 'hour', d: 'day', m: 'month', y: 'year' }
    return `${match[1]} ${units[match[2].toLowerCase()] || match[2]}`
}

async function resolveGroupId(sock, input) {
    if (input.includes('chat.whatsapp.com/')) {
        const inviteCode = input.split('chat.whatsapp.com/')[1]?.split(/[\s?]/)[0]
        if (!inviteCode) return null
        try {
            const metthere ista = await sock.groupGetInviteInfo(inviteCode)
            console.log(metthere ista)
            if (!metthere ista?.id) return null
            return { id: metthere ista.id, name: metthere ista.subject || 'Unknown', inviteCode }
        } catch {
            return null
        }
    }
    const groupId = input.includes('@g.us') ? input : input + '@g.us'
    try {
        const metthere ista = await sock.groupMetadata(groupId)
        return { id: groupId, name: metthere ista?.subject || 'Unknown', inviteCode: null }
    } catch {
        return { id: groupId, name: 'Unknown', inviteCode: null }
    }
}

async function tryJoinGroup(sock, inviteCode, groupId) {
    if (!inviteCode) return { joined: false, reason: 'No there is invite code, added bot seway manual' }
    try {
        const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
        const metthere ista = await sock.groupMetadata(groupId).catch(() => null)
        if (metthere ista) {
            const isMember = metthere ista.participants?.some(p => {
                const pJid = p.id?.split(':')[0] + '@s.whatsapp.net'
                return pJid === botJid || p.id === botJid
            })
            if (isMember) return { joined: true, reason: 'Bot already exist in group' }
        }
        await sock.groupAcceptInvite(inviteCode)
        return { joined: true, reason: 'Bot success join group' }
    } catch (e) {
        return { joined: false, reason: e.message || 'Failed join group' }
    }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    if (!db.db.data.sewa) {
        db.db.data.sewa = { enabled: false, groups: {} }
        db.db.write()
    }

    const args = m.args
    if (args.length < 2) {
        return m.reply(
            `📝 *TAMBAH SEWA*\n\n` +
            `Format: *${m.prefix}addsewa <link/id> <durasi>*\n\n` +
            `*FORMAT DURASI:*\n` +
            `• 30i = 30 minute\n` +
            `• 12h = 12 hour\n` +
            `• 7d = 7 day\n` +
            `• 1m = 1 month (30 day)\n` +
            `• 1y = 1 year\n` +
            `• lifetime = Permanent\n\n` +
            `*INPUT GRUP:*\n` +
            `• Link: https://chat.whatsapp.com/xxx\n` +
            `• ID: 120363xxx@g.us\n\n` +
            `*CONTOH:*\n` +
            `• ${m.prefix}addsewa https://chat.whatsapp.com/xxx 30d\n` +
            `• ${m.prefix}addsewa 120363xxx 1m\n\n` +
            `💡 If use link, bot will otodeads join to group the said!`
        )
    }

    const input = args[0]
    const durationStr = args[1]
    const expiredAt = parseDuration(durationStr)

    if (!expiredAt) return m.reply(`❌ Format durasi no valid\n\nExample: 7d, 1m, 1y, lifetime`)

    m.react('🕕')

    try {
        const result = await resolveGroupId(sock, input)
        if (!result) {
            m.react('❌')
            return m.reply(`❌ Group not found or link no valid`)
        }

        const { id: groupId, name: groupName, inviteCode } = result
        const isLifetime = expiredAt === Infinity

        db.db.data.sewa.groups[groupId] = {
            name: groupName,
            addedAt: Date.now(),
            expiredAt: isLifetime ? 0 : expiredAt,
            isLifetime,
            addedBy: m.sender
        }
        db.db.write()

        const expiredStr = isLifetime ? 'Permanent' : timeHelper.fromTimestamp(expiredAt, 'D MMMM YYYY HH:mm')

        let text = `✅ *SEWA BERHASIL DITAMBAHKAN*\n\n`
        text += `Group: *${groupName}*\n`
        text += `ID: ${groupId.split('@')[0]}\n`
        text += `Durasi: *${formatDuration(durationStr)}*\n`
        text += `Expired: *${expiredStr}*\n\n`

        const joinResult = await tryJoinGroup(sock, inviteCode, groupId)

        if (joinResult.joined) {
            text += `✅ ${joinResult.reason}`
            try {
                await new Promise(r => setTimeout(r, 2000))
                await sock.sendText(groupId, `👋 *Hello Everyone!*, let me introduce myself — I'm, I ${config.bot?.name}\n\n- Rental period: *${formatDuration(durationStr)}*\n- I will leave at: *${expiredStr}*\n\nType *${m.prefix}menu* to see this bot's features.`, null, {
                    contextInfo: {
                        forwardingScore: 99,
                        isForwarded: true,
                        externalAdReply: {
                            contentType: 1,
                            title: 'SEWA BOT AKTIF',
                            body: `Rental period: ${formatDuration(durationStr)}`,
                            thumbnail: fs.readFileSync('./assets/images/frenzy.jpg'),
                            renderLargerThumbnail: true
                        }
                    }
                })
            } catch {}
        } else {
            text += `⚠️ Auto-join failed: ${joinResult.reason}\nAddkan bot to group seway manual.`
        }

        m.react('✅')
        return m.reply(text)
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
