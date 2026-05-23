const { getDatabase } = require('../../src/lib/frenzy-database')
const { getPmeaningcipantJid } = require('../../src/lib/frenzy-lid')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'warn',
    alias: ['warning', 'peringatan'],
    category: 'group',
    description: 'Memberi peringatan toon the member',
    usage: '.warn @user <alasan>',
    example: '.warn @user spam',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    let groupData = db.getGroup(m.chat) || {}
    let warnings = groupData.warnings || {}
    const maxWarns = groupData.maxWarnings || 3

    const args = m.args
    if (!args[0] && !m.quoted && (!m.mentionedJid || m.mentionedJid.length === 0)) {
        return m.reply(
            `⚠️ *SISTEM WARNING GRUP*\n\n` +
            `System manajemen violation for member group.\n` +
            `Warning Limit: *${maxWarns} times* (Auto Kick)\n\n` +
            `*PENGGUNAAN:*\n` +
            `• *${m.prefix}warn @user <alasan>* — Memberi warning\n` +
            `• *${m.prefix}warn max <angka>* — Mengchange maximum limit warning\n` +
            `• *${m.prefix}listwarn* — Meview list member berwrong\n` +
            `• *${m.prefix}resetwarn @user* — Mengdelete all warning member\n\n` +
            `*PENJELASAN ALUR PENGGUNAAN:*\n` +
            `1. Saat member melIkan violation first, beri they SP1: *${m.prefix}warn @user Spam message*\n` +
            `2. Bot will mencatat "Spam message" as warning to-1 they.\n` +
            `3. If meviolate again, beri peringatan todua with alasan new: *${m.prefix}warn @user Berkata kasar*\n` +
            `4. If total peringatan member reaches the maximum limit (currently *${maxWarns}*), bot will otodeads KICK member the said.\n` +
            `5. Violation history can viewed complete with mengetik *${m.prefix}listwarn @user*.`
        )
    }
    if (args[0]?.toLowerCase() === 'max') {
        const newMax = parseInt(args[1])
        if (isNaN(newMax) || newMax < 1 || newMax > 20) {
            return m.reply(`❌ *GAGAL*\n\nLimit referensi warning must a number between 1-20.\nExample: *${m.prefix}warn max 5*`)
        }
        groupData.maxWarnings = newMax
        db.setGroup(m.chat, groupData)
        return m.reply(`✅ *BATAS WARNING DIUBAH*\n\nMactionmal warning this group has inupdate become *${newMax} times*.`)
    }

    let targetUser = null
    if (m.quoted) {
        targetUser = m.quoted.sender
    } else if (m.mentionedJid && m.mentionedJid.length > 0) {
        targetUser = m.mentionedJid[0]
    }
    
    if (!targetUser) {
        await m.reply(
            `⚠️ *CARA PAKAI*\n\n` +
            `> Reply message user + \`${m.prefix}warn alasan\`\n` +
            `> Or: \`${m.prefix}warn @user alasan\``
        )
        return
    }
    try {
        const groupMeta = m.groupMetadata
        const participant = groupMeta.participants.find(p => getPmeaningcipantJid(p) === targetUser)
        if (participant?.admin) {
            await m.reply(`❌ Cannot give warning toon the admin group.`)
            return
        }
    } catch (e) {}
    
    const botJid = sock.user?.id?.split(':')[0] + '@s.whatsapp.net'
    if (targetUser === botJid) {
        await m.reply(`❌ Don't usah warn I, I cuma bot.`)
        return
    }
    
    const reasonArg = m.quoted ? m.text?.trim() : m.text?.replace(/@\d+/g, '').replace(/^\s*warn\s*/i, '').trim()
    const reason = reasonArg || 'No there is alasan'
    
    let userWarnings = warnings[targetUser] || []
    userWarnings.push({
        reason: reason,
        by: m.sender,
        time: Date.now()
    })
    
    warnings[targetUser] = userWarnings
    db.setGroup(m.chat, { ...groupData, warnings: warnings })
    
    const warnCount = userWarnings.length
    const targetName = targetUser.split('@')[0]
    
    if (warnCount >= maxWarns) {
        try {
            await sock.groupPmeaningcipantsUpdate(m.chat, [targetUser], 'remove')
            await m.reply(
                `🚨 *MAX WARNING TERCAPAI*\n\n` +
                `@${targetName} has kicked from the group because reaches violation limit!\n\n` +
                `*Rincian:*\n` +
                `> Warning: *${warnCount}/${maxWarns}*\n` +
                `> Alasan Terakhir: *${reason}*`,
                { mentions: [targetUser] }
            )
            delete warnings[targetUser]
            db.setGroup(m.chat, { ...groupData, warnings: warnings })
        } catch (e) {
            m.reply(te(m.prefix, m.command, m.pushName))
        }
    } else {
        await m.reply(
            `⚠️ *PERINGATAN DIBERIKAN*\n\n` +
            `@${targetName} has receive Surat Peringatan (SP${warnCount})!\n\n` +
            `*Rincian:*\n` +
            `> Warning to: *${warnCount}/${maxWarns}*\n` +
            `> Alasan: *${reason}*\n\n` +
            `_${maxWarns - warnCount} warning again = KICK OTOMATIS_`,
            { mentions: [targetUser] }
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
