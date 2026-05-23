const { getDatabase } = require('../../src/lib/frenzy-database')
const ms = require('ms')

const pluginConfig = {
    name: 'access',
    alias: ['addaccess', 'delaccess', 'listaccess', 'addaccess', 'delaccess', 'listaccess'],
    category: 'owner',
    description: 'Grant temporary/permanent command access to users',
    usage: '.addaccess <cmd> <duration> <user>',
    example: '.addaccess addowner 30d @user',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 0,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock, plugins }) {
    const db = getDatabase()
    const cmd = m.command.toLowerCase()
    const isAdd = ['addaccess', 'addaccess'].includes(cmd)
    const isDel = ['delaccess', 'delaccess'].includes(cmd)
    const isList = ['listaccess', 'listaccess'].includes(cmd)
    let target = m.mentionedJid?.[0]
    if (!target && m.quoted) target = m.quoted.sender
    if (!target && m.args.length > 0) {
        for (const arg of m.args) {
            if (/^\d{5,15}$/.test(arg)) {
                target = arg + '@s.whatsapp.net'
                break
            } else if (/^@\d+/.test(arg)) {
                target = arg.replace('@', '') + '@s.whatsapp.net'
                break
            }
        }
    }
    let commandTarget = null
    let durationTarget = null
    if (isAdd) {
        if (!target) return m.reply(`❌ *Target Invalid*\n\nTag user / Reply chat / Tulis number target`)
        const cleanArgs = m.args.filter(a => !a.includes('@') && !/^\d{10,}$/.test(a))
        if (cleanArgs.length < 2) {
            return m.reply(
                `⚠️ *Format Wrong*\n\n` +
                `Format: \`${m.prefix}addaccess <command> <durasi> <target>\`\n\n` +
                `*Example:*\n` +
                `> \`${m.prefix}addaccess addowner 30d @user\` (30 Day)\n` +
                `> \`${m.prefix}addaccess unban permanent @user\` (Seoldnya)\n\n` +
                `*Durasi Support:* 1h, 1d, 30d, 1y`
            )
        }
        commandTarget = cleanArgs[0].toLowerCase()
        durationTarget = cleanArgs[1].toLowerCase()
    }
    
    const user = db.getUser(target) || {}
    if (!user.access) user.access = []
    if (isList) {
        if (!target) target = m.sender 
        const targetData = db.getUser(target) || {}
        const accessList = targetData.access || []
        const now = Date.now()
        const activeAccess = accessList.filter(a => a.expired === null || a.expired > now)
        if (activeAccess.length !== accessList.length) {
            targetData.access = activeAccess
            db.setUser(target, targetData)
        }
        
        if (activeAccess.length === 0) {
            return m.reply(`📊 *ᴜsᴇʀ ᴀᴄᴄᴇss*\n\nTarget: @${target.split('@')[0]}\nStatus: *No punya access khusus*`)
        }
        
        let txt = `📊 *ᴜsᴇʀ ᴀᴄᴄᴇss*\n\n`
        txt += `Target: @${target.split('@')[0]}\n`
        txt += `Total: *${activeAccess.length}* commands\n`
        txt += `━━━━━━━━━━━━━━━\n\n`
        
        activeAccess.forEach((acc, i) => {
            let expiredTxt = '♾️ Permanent'
            if (acc.expired) {
                const timeLeft = acc.expired - now
                if (timeLeft > 0) {
                    expiredTxt = '🕕 ' + ms(timeLeft, { long: true })
                } else {
                    expiredTxt = '🔴 Expired'
                }
            }
            
            txt += `${i+1}. *${acc.cmd}*\n`
            txt += `   └ ${expiredTxt}\n`
        })
        
        return sock.sendMessage(m.chat, {
            text: txt,
            mentions: [target]
        }, { quoted: m })
    }
    if (isAdd) {
        let expiredTime = null
        if (durationTarget !== 'permanent' && durationTarget !== 'perm') {
            try {
                const durationMs = ms(durationTarget)
                if (!durationMs) return m.reply(`❌ Format durasi wrong! Usage: 1h, 1d, 30d`)
                expiredTime = Date.now() + durationMs
            } catch {
                return m.reply(`❌ Format durasi no intonali!`)
            }
        }
        
        const existingIdx = user.access.findIndex(a => a.cmd === commandTarget)
        if (existingIdx !== -1) {
            user.access[existingIdx].expired = expiredTime
            db.setUser(target, user)
            return m.reply(
                `✅ *ᴀᴋsᴇs ᴅɪᴘᴇʀʙᴀʀᴜɪ*\n\n` +
                `Command: \`${commandTarget}\`\n` +
                `Durasi: *${durationTarget}*\n` +
                `Target: @${target.split('@')[0]}`
            )
        }
        user.access.push({
            cmd: commandTarget,
            expired: expiredTime
        })
        
        // console.log('[DEBUG AddAccess] Saving user with access:', JSON.stringify(user.access))
        db.setUser(target, user)
        // console.log('[DEBUG AddAccess] After save:', JSON.stringify(db.getUser(target)?.access))
        
        await sock.sendMessage(m.chat, {
            text: `✅ *ᴀᴋsᴇs ᴅɪʙᴇʀɪᴋᴀɴ*\n\n` +
                `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                `┃ 🔑 ᴄᴍᴅ: \`${commandTarget}\`\n` +
                `┃ ⏱️ ᴅᴜʀᴀsɪ: *${durationTarget}*\n` +
                `┃ 👤 ᴛᴀʀɢᴇᴛ: @${target.split('@')[0]}\n` +
                `╰┈┈⬡`,
            mentions: [target]
        }, { quoted: m })
    }
    if (isDel) {
        if (!target) return m.reply(`❌ Tag user to be deleted accessnya!`)
        const now = Date.now()
        const activeAccess = user.access.filter(a => a.expired === null || a.expired > now)
        let specificCmd = m.args.find(a => !a.includes('@') && !/^\d+$/.test(a))
        if (specificCmd) {
            specificCmd = specificCmd.toLowerCase()
            const idx = user.access.findIndex(a => a.cmd === specificCmd)
            if (idx === -1) return m.reply(`❌ User no punya access command \`${specificCmd}\``)
            
            user.access.splice(idx, 1)
            db.setUser(target, user)
            return m.reply(`✅ Akses \`${specificCmd}\` success incabut from @${target.split('@')[0]}`)
        }
        
        if (activeAccess.length === 0) {
            return m.reply(`⚠️ User this has no access to any command.`)
        }
        const rows = activeAccess.map(acc => {
            const exp = acc.expired ? ms(acc.expired - now) : 'Permanent'
            return {
                title: `Delete: ${acc.cmd}`,
                description: `Sisa durasi: ${exp}`,
                id: `${m.prefix}delaccess ${acc.cmd} ${target}`
            }
        })
        const listMessage = {
            text: `🔓 *CABUT AKSES*\n\nChoose access command to be deleted from @${target.split('@')[0]}`,
            title: "Manage Access",
            buttonText: "PILIH COMMAND",
            sections: [{
                title: "Active Access List",
                rows: rows
            }]
        }
        
        return sock.sendMessage(m.chat, listMessage, { quoted: m })
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
