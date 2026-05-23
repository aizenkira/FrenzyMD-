const config = require('../../config')
const { getDatabase } = require('../../src/lib/frenzy-database')
const { addJadiBotPremium, removeJadiBotPremium, getJadiBotPremiums } = require('../../src/lib/frenzy-jadibot-database')

const pluginConfig = {
    name: 'addprem',
    alias: ['addpremium', 'setprem', 'delprem', 'delpremium', 'listprem', 'premlist'],
    category: 'owner',
    description: 'Tolola premium users',
    usage: '.addprem <number/@tag> [day]\n.delprem <number/@tag>\n.listprem\n.checkprem <number/@tag>',
    example: '.addprem 6281234567890 30',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
}

function formatDate(ts) {
    return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function extractTarget(m) {
    if (m.quoted) return m.quoted.sender?.replace(/[^0-9]/g, '') || ''
    if (m.mentionedJid?.length) return m.mentionedJid[0]?.replace(/[^0-9]/g, '') || ''
    if (m.args?.length) return m.args[0].replace(/[^0-9]/g, '')
    return ''
}

async function handler(m, { sock, botId, isJadiBot }) {
    const db = getDatabase()
    const cmd = m.command.toLowerCase()

    const isAdd = ['addprem', 'addpremium', 'setprem'].includes(cmd)
    const isDel = ['delprem', 'delpremium'].includes(cmd)
    const isList = ['listprem', 'premlist'].includes(cmd)

    if (!db.data.premium) db.data.premium = []

    if (isList) {
        if (isJadiBot && botId) {
            const jbPremiums = getJadiBotPremiums(botId)
            if (jbPremiums.length === 0) {
                return m.reply(`💎 No premium users in this bot yet\nUsage \`${m.prefix}addprem\` for add`)
            }
            let txt = `💎 *DAFTAR PREMIUM JADIBOT* — ${botId}\n\n`
            jbPremiums.forEach((p, i) => {
                const num = typeof p === 'string' ? p : p.jid
                txt += `${i + 1}. \`${num}\`\n`
            })
            txt += `\nTotal: *${jbPremiums.length}* premium`
            return m.reply(txt)
        }

        if (db.data.premium.length === 0) {
            return m.reply(`💎 Not yet there is premium registered`)
        }
        let txt = `💎 *DAFTAR PREMIUM*\n\n`
        const now = Date.now()
        db.data.premium.forEach((p, i) => {
            const num = typeof p === 'string' ? p : p.id
            const remaining = typeof p === 'object' && p.expired
                ? Math.ceil((p.expired - now) / (1000 * 60 * 60 * 24))
                : null
            const status = remaining === null ? 'Permanent' : (remaining > 0 ? remaining + 'd' : 'Expired')
            txt += `${i + 1}. \`${num}\` — ${status}\n`
        })
        txt += `\nTotal: *${db.data.premium.length}* premium`
        return m.reply(txt)
    }

    let targetNumber = extractTarget(m)

    if (!targetNumber) {
        return m.reply(`💎 *${isAdd ? 'ADD' : 'DEL'} PREMIUM*\n\nEnter number or tag user\n\`Example: ${m.prefix}${cmd} 6281234567890\``)
    }

    if (targetNumber.startsWith('0')) {
        targetNumber = '62' + targetNumber.slice(1)
    }

    if (targetNumber.length < 10 || targetNumber.length > 15) {
        return m.reply(`❌ Format number no valid`)
    }

    if (isJadiBot && botId) {
        if (isAdd) {
            if (addJadiBotPremium(botId, targetNumber)) {
                m.react('💎')
                return m.reply(`✅ Success added *${targetNumber}* as premium bot`)
            } else {
                return m.reply(`❌ \`${targetNumber}\` already premium in JadiBot this`)
            }
        } else if (isDel) {
            if (removeJadiBotPremium(botId, targetNumber)) {
                m.react('✅')
                return m.reply(`✅ Success mengdelete *${targetNumber}* from premium bot`)
            } else {
                return m.reply(`❌ \`${targetNumber}\` not a premium user in JadiBot this`)
            }
        }
        return
    }

    if (isAdd) {
        const existingIndex = db.data.premium.findIndex(p =>
            typeof p === 'string' ? p === targetNumber : p.id === targetNumber
        )

        const days = parseInt(m.args?.find(a => /^\d+$/.test(a) && a.length <= 4)) || 30
        const pushName = m.quoted?.pushName || m.pushName || 'Unknown'
        const now = Date.now()

        let newExpired

        if (existingIndex !== -1) {
            const currentData = db.data.premium[existingIndex]
            const currentExpired = typeof currentData === 'string' ? now : (currentData.expired || now)
            const baseTime = currentExpired > now ? currentExpired : now
            newExpired = baseTime + (days * 24 * 60 * 60 * 1000)

            if (typeof currentData === 'string') {
                db.data.premium[existingIndex] = {
                    id: targetNumber,
                    expired: newExpired,
                    name: pushName,
                    addedAt: now
                }
            } else {
                db.data.premium[existingIndex].expired = newExpired
                db.data.premium[existingIndex].name = pushName
            }
        } else {
            newExpired = now + (days * 24 * 60 * 60 * 1000)
            db.data.premium.push({
                id: targetNumber,
                expired: newExpired,
                name: pushName,
                addedAt: now
            })
        }

        const jid = targetNumber + '@s.whatsapp.net'
        const user = db.getUser(jid) || db.setUser(jid)

        if (user.energy !== -1) {
            user.energy = config.limits?.premium || 100
        }
        user.isPremium = true

        db.setUser(jid, user)
        db.updateExp(jid, 200000)
        db.updateCoins(jid, 20000)

        db.save()

        m.react('💎')
        return m.reply(`✅ Success ${existingIndex !== -1 ? 'memperlong' : 'added'} premium *${targetNumber}* forever *${days} day*\nExpired: *${formatDate(newExpired)}*`)
    } else if (isDel) {
        const index = db.data.premium.findIndex(p =>
            typeof p === 'string' ? p === targetNumber : p.id === targetNumber
        )

        if (index === -1) {
            return m.reply(`❌ *${targetNumber}* not a premium user`)
        }

        db.data.premium.splice(index, 1)

        const jid = targetNumber + '@s.whatsapp.net'
        const user = db.getUser(jid)
        if (user) {
            user.isPremium = false
            db.setUser(jid, user)
        }

        db.save()
        m.react('✅')
        return m.reply(`✅ Success mengdelete *${targetNumber}* from premium`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
