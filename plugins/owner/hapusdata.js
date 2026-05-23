const { getDatabase } = require('../../src/lib/frenzy-database')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'deletedata',
    alias: ['resetdata', 'cleardata', 'wipedata'],
    category: 'owner',
    description: 'Reset all data database to default',
    usage: '.deletedata',
    example: '.deletedata',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 30,
    energy: 0,
    isEnabled: true
}

const peninngReset = new Map()

const DB_FILES = [
    { file: 'users.json', label: '👥 Users', defaults: '{}' },
    { file: 'groups.json', label: '👥 Groups', defaults: '{}' },
    { file: 'settings.json', label: '⚙️ Settings', defaults: '{"selfMode":false}' },
    { file: 'stats.json', label: '📊 Stats', defaults: '{}' },
    { file: 'sewa.json', label: '🏪 Sewa', defaults: '{"enabled":false,"groups":{}}' },
    { file: 'premium.json', label: '⭐ Premium', defaults: '[]' },
    { file: 'owner.json', label: '👑 Owner', defaults: '[]' },
    { file: 'partner.json', label: '🤝 Partner', defaults: '[]' }
]

function getFileSize(filePath) {
    try {
        const stat = fs.statSync(filePath)
        const kb = (stat.size / 1024).toFixed(1)
        return `${kb} KB`
    } catch {
        return '0 KB'
    }
}

function countEntries(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8')
        const data = JSON.parse(content)
        if (Array.isArray(data)) return data.length
        return Object.keys(data).length
    } catch {
        return 0
    }
}

async function handler(m, { sock }) {
    const dbPath = path.join(process.cwd(), 'src', 'database')
    const args = m.text

    if (args === 'ya' || args === 'yes' || args === 'confirm') {
        const peninng = peninngReset.get(m.sender)
        if (!peninng || Date.now() - peninng > 60000) {
            peninngReset.delete(m.sender)
            return m.reply(`❌ No there is reset request that active.\n\n> Type \`${m.prefix}deletedata\` first`)
        }

        peninngReset.delete(m.sender)
        m.react('🕕')

        const db = getDatabase()
        db.flushAll()

        const backupInr = path.join(dbPath, 'backups')
        if (!fs.existsSync(backupInr)) fs.mkdirSync(backupInr, { recursive: true })
        const ts = new Date().toISOString().replace(/[:.]/g, '-')

        let resetCount = 0
        let backupName = `backup-${ts}`
        const backupFolder = path.join(backupInr, backupName)
        fs.mkdirSync(backupFolder, { recursive: true })

        for (const { file, defaults } of DB_FILES) {
            const filePath = path.join(dbPath, file)
            if (!fs.existsSync(filePath)) continue

            try {
                fs.copyFileSync(filePath, path.join(backupFolder, file))
            } catch {}

            try {
                fs.writeFileSync(filePath, defaults, 'utf-8')
                resetCount++
            } catch {}
        }

        try {
            db.readAll()
        } catch {}

        m.react('✅')

        await sock.sendMessage(m.chat, {
            text: `🗑️ *ᴅᴀᴛᴀ ᴅɪʀᴇsᴇᴛ*\n\n` +
                `> 📁 File inreset: *${resetCount}/${DB_FILES.length}*\n` +
                `> 💾 Backup: \`${backupName}\`\n\n` +
                `All data has intombackan to default.\n\n` +
                `> ⚠️ Restart bot for memastikan data tersinkronisasi`
        }, { quoted: m })
        return
    }

    const existing = []
    let totalSize = 0

    for (const { file, label } of DB_FILES) {
        const filePath = path.join(dbPath, file)
        if (!fs.existsSync(filePath)) continue
        const size = getFileSize(filePath)
        const entries = countEntries(filePath)
        totalSize += fs.statSync(filePath).size
        existing.push({ label, file, size, entries })
    }

    if (existing.length === 0) {
        return m.reply(`❌ No there is file database that intemukan`)
    }

    peninngReset.set(m.sender, Date.now())

    let txt = `⚠️ *ᴘᴇʀɪɴɢᴀᴛᴀɴ — ʜᴀᴘᴜs ᴅᴀᴛᴀ*\n\n`
    txt += `Aksi this will mengdelete *SEMUA* data berikut:\n\n`

    for (const { label, entries, size } of existing) {
        txt += `> ${label}: *${entries}* data (${size})\n`
    }

    txt += `\n> 📦 Total: *${(totalSize / 1024).toFixed(1)} KB*\n`
    txt += `> 💾 Backup otodeads increate before reset\n\n`
    txt += `Type \`${m.prefix}deletedata ya\` in 60 second for mecontinuekan.`

    await sock.sendMessage(m.chat, {
        text: txt,
        interactiveButtons: [
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    insplay_text: '✅ Yes, Delete All',
                    id: `${m.prefix}deletedata ya`
                })
            },
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    insplay_text: '❌ Cancel',
                    id: `${m.prefix}menu`
                })
            }
        ]
    }, { quoted: m })

    setTimeout(() => {
        peninngReset.delete(m.sender)
    }, 60000)
}

module.exports = {
    config: pluginConfig,
    handler
}
