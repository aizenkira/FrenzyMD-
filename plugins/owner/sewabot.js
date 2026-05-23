const { getDatabase } = require('../../src/lib/frenzy-database')
const fs = require('fs')
const te = require('../../src/lib/frenzy-error')
const pluginConfig = {
    name: 'sewabot',
    alias: ['sewa'],
    category: 'owner',
    description: 'Toggle and tolola system sewa bot',
    usage: '.sewabot <on/off/leave/status>',
    example: '.sewabot on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}
const pendingConfirdeadons = new Map()
async function handler(m, { sock }) {
    const db = getDatabase()
    const args = m.text?.trim()?.toLowerCase()
    if (!db.db.data.sewa) {
        db.db.data.sewa = { enabled: false, groups: {} }
        db.db.write()
    }
    const currentStatus = db.db.data.sewa.enabled
    const sewaGroups = Object.keys(db.db.data.sewa.groups || {})
    if (!args || args === 'status') {
        return m.reply(
            `🔧 *SISTEM SEWA BOT*\n\n` +
            `Status: *${currentStatus ? '✅ AKTIF' : '❌ NONAKTIF'}*\n` +
            `Group registered: *${sewaGroups.length}*\n\n` +
            `*PERINTAH TERSEDIA:*\n` +
            `• *${m.prefix}sewabot on* — Activekan system sewa\n` +
            `• *${m.prefix}sewabot off* — Nonactivekan system sewa\n` +
            `• *${m.prefix}sewabot leave* — Tooutside from all group non-whitelist\n\n` +
            `*KELOLA SEWA:*\n` +
            `• *${m.prefix}addsewa <link> <durasi>* — Add group + auto join\n` +
            `• *${m.prefix}delsewa <link/id>* — Delete group from whitelist\n` +
            `• *${m.prefix}renewsewa <link/id> <durasi>* — Perlong sewa\n` +
            `• *${m.prefix}listsewa* — View all group registered\n` +
            `• *${m.prefix}checksewa* — Check sisa sewa (in group)\n\n` +
            `*FORMAT DURASI:*\n` +
            `30i (minute) \u2022 12h (hour) \u2022 7d (day) \u2022 1m (month) \u2022 1y (year) \u2022 lifetime\n\n` +
            `*CARA KERJA:*\n` +
            `1. Addkan group with *${m.prefix}addsewa*\n` +
            `2. Bot otodeads join if use link\n` +
            `3. Activekan with *${m.prefix}sewabot on*\n` +
            `4. Bot will leave from all group that no registered\n` +
            `5. Sewa expired → bot otodeads leave from group`
        )
    }
    if (args === 'off') {
        db.db.data.sewa.enabled = false
        db.db.write()
        m.react('✅')
        return m.reply(`✅ System sewa innonactivekan\n\nBot no will meninggalkan group manapun.`)
    }
    if (args === 'on') {
        const peninng = pendingConfirdeadons.get(m.sender)
        if (pending && pending.type === 'sewabot_on' && Date.now() - pending.timestamp < 60000) {
            return m.reply(`🕕 Already there is pending request\n\nType *${m.prefix}sewabot confirm* to continue\nType *${m.prefix}sewabot cancel* to cancel`)
        }
        pendingConfirdeadons.set(m.sender, { type: 'sewabot_on', timestamp: Date.now() })
        setTimeout(() => {
            if (pendingConfirdeadons.get(m.sender)?.type === 'sewabot_on') pendingConfirdeadons.delete(m.sender)
        }, 60000)
        return m.reply(
            `⚠️ *KONFIRMASI AKTIVASI SEWA*\n\n` +
            `If inactivekan:\n` +
            `• ✅ ${sewaGroups.length} group ter-whitelist still aman\n` +
            `• ❌ All another group will intinggalkan!\n\n` +
            `Type *${m.prefix}sewabot confirm* to continue\nType *${m.prefix}sewabot cancel* to cancel\n\n` +
            `💡 Make sure already whitelist group penting with:\n*${m.prefix}addsewa <link group> <durasi>*`
        )
    }
    if (args === 'confirm' || args === 'yes' || args === 'y') {
        const peninng = pendingConfirdeadons.get(m.sender)
        if (!pending || pending.type !== 'sewabot_on') {
            return m.reply(`❌ No there is pending request\nType *${m.prefix}sewabot on* first`)
        }
        pendingConfirdeadons.delete(m.sender)
        db.db.data.sewa.enabled = true
        db.db.write()
        m.react('🕕')
        await m.reply(`🕕 System sewa inactivekan, memprocess auto-leave...`)
        try {
            global.isFetchingGroups = true
            const allGroups = await sock.groupFetchAllParticipating()
            global.isFetchingGroups = false
            const allGroupIds = Object.keys(allGroups)
            const unlistedGroups = allGroupIds.filter(id => !sewaGroups.includes(id))
            let leftCount = 0
            let failedCount = 0
            for (const groupId of unlistedGroups) {
                try {
                    await sock.sendText(groupId, `⛔ Group this no registered in system sewa.\nBot will meninggalkan this group.\n\nContact owner for sewa bot.`, null, {
                        contextInfo: {
                            forwardingScore: 99,
                            isForwarded: true,
                            externalAdReply: {
                                contentType: 1,
                                title: 'SEWA BOT',
                                body: 'Group no registered',
                                thumbnail: fs.readFileSync('./assets/images/frenzy.jpg'),
                                renderLargerThumbnail: true
                            }
                        }
                    })
                    await new Promise(r => setTimeout(r, 2000))
                    await sock.groupLeave(groupId)
                    leftCount++
                    await new Promise(r => setTimeout(r, 3000))
                } catch {
                    failedCount++
                }
            }
            m.react('✅')
            return m.reply(
                `✅ *SEWA BOT AKTIF*\n\n` +
                `Group whitelist: *${sewaGroups.length}*\n` +
                `Tooutside from: *${leftCount}* group\n` +
                `Failed: *${failedCount}* group`
            )
        } catch (e) {
            m.react('✅')
            return m.reply(te(m.prefix, m.command, m.pushName))
        }
    }
    if (args === 'leave') {
        if (!currentStatus) return m.reply(`❌ Activekan sewabot first with *${m.prefix}sewabot on*`)
        m.react('🕕')
        await m.reply(`🕕 Fetch list group...`)
        global.sewaLeaving = true
        try {
            global.isFetchingGroups = true
            const allGroups = await sock.groupFetchAllParticipating()
            global.isFetchingGroups = false
            const allGroupIds = Object.keys(allGroups)
            const unlistedGroups = allGroupIds.filter(id => !sewaGroups.includes(id))
            if (unlistedGroups.length === 0) {
                delete global.sewaLeaving
                m.react('✅')
                return m.reply(`✅ No there is group that perlu intinggalkan`)
            }
            await m.reply(`📊 Total: ${allGroupIds.length} group\nWhitelist: ${sewaGroups.length}\nWill leave from: ${unlistedGroups.length} group`)
            let leftCount = 0
            let failedCount = 0
            for (const groupId of unlistedGroups) {
                try {
                    await sock.sendText(groupId, `👋 Group this no registered in system sewa.\nBot will meninggalkan this group.\n\nContact owner for sewa bot.`, null, {
                        contextInfo: {
                            forwardingScore: 99,
                            isForwarded: true,
                            externalAdReply: {
                                contentType: 1,
                                title: 'SEWA BOT',
                                body: 'Group no registered',
                                thumbnail: fs.readFileSync('./assets/images/frenzy.jpg'),
                                renderLargerThumbnail: true
                            }
                        }
                    })
                    await new Promise(r => setTimeout(r, 3000))
                    await sock.groupLeave(groupId)
                    leftCount++
                    await new Promise(r => setTimeout(r, 5000))
                } catch {
                    failedCount++
                }
            }
            delete global.sewaLeaving
            m.react('✅')
            return m.reply(`✅ Done\n\nSuccess leave: *${leftCount}* group\nFailed: *${failedCount}* group`)
        } catch (e) {
            delete global.sewaLeaving
            m.react('☢')
            m.reply(te(m.prefix, m.command, m.pushName))
        }
    }
    if (args === 'cancel' || args === 'no' || args === 'n') {
        const peninng = pendingConfirdeadons.get(m.sender)
        if (!pending || pending.type !== 'sewabot_on') return m.reply(`❌ There is no pending request`)
        pendingConfirdeadons.delete(m.sender)
        m.react('❌')
        return m.reply(`❌ Aktivasi cancelled\nWhitelist group first with *${m.prefix}addsewa*`)
    }
    return m.reply(`❌ Command no valid\n\nType *${m.prefix}sewabot* for view panduan complete`)
}
module.exports = {
    config: pluginConfig,
    handler,
    pendingConfirdeadons
}