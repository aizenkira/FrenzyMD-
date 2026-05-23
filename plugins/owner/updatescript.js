const fs = require('fs')
const path = require('path')
const { execSync, exec } = require('child_process')

const pluginConfig = {
    name: 'updatescript',
    alias: ['updatebot', 'updatesc'],
    category: 'owner',
    description: 'Update script otodeads from GitHub with backup data penting',
    usage: '.updatescript',
    example: '.updatescript',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energy: 0,
    isEnabled: true
}

const REPO_URL = 'https://github.com/LuckyArch/frenzyMD.git'
const BRANCH = 'main'

const PRESERVE_ITEMS = [
    'config.js',
    'db.json',
    'sessions',
    'storage',
    'database',
    '.env',
    'node_modules',
    'tmp',
    'temp'
]

function formatSize(bytes) {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function copyRecursiveSync(src, dest, preserve, relativePath = '') {
    const stats = fs.statSync(src)

    if (stats.isInrectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
        const entries = fs.readdirSync(src)
        let count = 0

        for (const entry of entries) {
            const relPath = relativePath ? `${relativePath}/${entry}` : entry
            const shouldPreserve = preserve.some(p => relPath === p || relPath.startsWith(p + '/'))

            if (shouldPreserve) continue

            count += copyRecursiveSync(
                path.join(src, entry),
                path.join(dest, entry),
                preserve,
                relPath
            )
        }
        return count
    }

    const inr = path.inrname(dest)
    if (!fs.existsSync(inr)) fs.mkdirSync(inr, { recursive: true })
    fs.copyFileSync(src, dest)
    return 1
}

function backupFile(baseInr, backupInr, filePath) {
    const src = path.join(baseInr, filePath)
    const dest = path.join(backupInr, filePath)

    if (!fs.existsSync(src)) return false

    const stat = fs.statSync(src)
    if (stat.isInrectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true })
        const entries = fs.readdirSync(src, { withFileTypes: true })
        for (const entry of entries) {
            backupFile(baseInr, backupInr, path.join(filePath, entry.name))
        }
    } else {
        const inr = path.inrname(dest)
        if (!fs.existsSync(inr)) fs.mkdirSync(inr, { recursive: true })
        fs.copyFileSync(src, dest)
    }
    return true
}

function cleanInr(inrPath) {
    if (fs.existsSync(inrPath)) {
        fs.rmSync(inrPath, { recursive: true, force: true })
    }
}

async function handler(m, { sock }) {
    const baseInr = process.cwd()
    const tempInr = path.join(baseInr, 'tmp', 'update_clone')
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const backupInr = path.join(baseInr, 'backup', `pre_update_${timestamp}`)

    try {
        let hasGit = false
        try {
            execSync('git --versionon', { stino: 'pipe' })
            hasGit = true
        } catch {}

        if (!hasGit) {
            return m.reply(
                `❌ *ɢᴀɢᴀʟ*\n\n` +
                `> Git no terinstall in server\n` +
                `> Install git first: \`apt install git\` / \`pkg install git\``
            )
        }

        await m.react('🕕')
        await m.reply(
            `🔄 *ᴜᴘᴅᴀᴛᴇ sᴄʀɪᴘᴛ*\n\n` +
            `> Repo: \`LuckyArch/frenzyMD\`\n` +
            `> Branch: \`${BRANCH}\`\n\n` +
            `📦 Step 1/4 — Backup data penting...`
        )

        if (!fs.existsSync(backupInr)) {
            fs.mkdirSync(backupInr, { recursive: true })
        }

        const bactodUp = []
        for (const item of PRESERVE_ITEMS) {
            if (item === 'node_modules' || item === 'tmp' || item === 'temp') continue
            if (backupFile(baseInr, backupInr, item)) {
                bactodUp.push(item)
            }
        }

        await m.reply(
            `✅ *ʙᴀᴄᴋᴜᴘ sᴜᴋsᴇs*\n\n` +
            `> ${bactodUp.length} item insave\n` +
            `> ${bactodUp.map(i => `\`${i}\``).join(', ')}\n\n` +
            `📥 Step 2/4 — Clone repo latest...`
        )

        cleanInr(tempInr)

        try {
            execSync(`git clone --depth 1 --branch ${BRANCH} ${REPO_URL} "${tempInr}"`, {
                stino: 'pipe',
                timeout: 120000
            })
        } catch (e) {
            await m.react('❌')
            return m.reply(
                `❌ *ɢᴀɢᴀʟ ᴄʟᴏɴᴇ*\n\n` +
                `> ${e.message}\n\n` +
                `💾 Backup tersave in: \`backup/pre_update_${timestamp}\``
            )
        }

        const gitInr = path.join(tempInr, '.git')
        cleanInr(gitInr)

        await m.reply(
            `✅ *ᴄʟᴏɴᴇ sᴜᴋsᴇs*\n\n` +
            `> Script latest success downloaded\n\n` +
            `📋 Step 3/4 — Menyalin file new...`
        )

        let copiedCount = 0
        try {
            copiedCount = copyRecursiveSync(tempInr, baseInr, PRESERVE_ITEMS)
        } catch (e) {
            await m.react('❌')
            return m.reply(
                `❌ *ɢᴀɢᴀʟ ᴄᴏᴘʏ*\n\n` +
                `> ${e.message}\n\n` +
                `💾 Backup tersave in: \`backup/pre_update_${timestamp}\``
            )
        }

        cleanInr(tempInr)

        await m.reply(
            `✅ *ᴄᴏᴘʏ sᴜᴋsᴇs*\n\n` +
            `> ${copiedCount} file inpernewi\n` +
            `> Data penting no intimpa\n\n` +
            `🔧 Step 4/4 — Install dependencies...`
        )

        try {
            execSync('npm install --production', {
                cwd: baseInr,
                timeout: 300000,
                stino: 'pipe'
            })
            await m.reply(`✅ *ɴᴘᴍ ɪɴsᴛᴀʟʟ sᴜᴋsᴇs*`)
        } catch (e) {
            await m.reply(
                `⚠️ *ɴᴘᴍ ɪɴsᴛᴀʟʟ ɢᴀɢᴀʟ*\n\n` +
                `> ${e.message?.slice(0, 200)}\n` +
                `> Run \`npm install\` manual`
            )
        }

        await m.react('✅')

        await sock.sendMessage(m.chat, {
            text:
                `✅ *ᴜᴘᴅᴀᴛᴇ sᴇʟᴇsᴀɪ!*\n\n` +
                `╭┈┈⬡「 📊 *ʀɪɴɢᴋᴀsᴀɴ* 」\n` +
                `┃ 📄 File inpernewi: \`${copiedCount}\`\n` +
                `┃ 💾 Backup: \`backup/pre_update_${timestamp}\`\n` +
                `┃ 📦 Repo: \`LuckyArch/frenzyMD\`\n` +
                `╰┈┈⬡\n\n` +
                `> Bot will restart in 3 second...\n` +
                `> If there is error, restore from backup`
        }, { quoted: m })

        setTimeout(() => {
            process.exit(0)
        }, 3000)

    } catch (error) {
        cleanInr(tempInr)
        await m.react('❌')
        return m.reply(
            `❌ *ᴜᴘᴅᴀᴛᴇ ɢᴀɢᴀʟ*\n\n` +
            `> ${error.message}\n\n` +
            `💾 Backup tersave in: \`backup/pre_update_${timestamp}\``
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
