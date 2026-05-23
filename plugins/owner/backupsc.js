const fs = require('fs')
const path = require('path')
const archiver = require('archiver')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'backupsc',
    alias: ['backup', 'backupscript', 'backupsource'],
    category: 'owner',
    description: 'Backup script bot in bentuk zip in root folder',
    usage: '.backupsc',
    example: '.backupsc',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 60,
    energy: 0,
    isEnabled: true
}

const EXCLUDE_DIRS = [
    'node_modules',
    '.git',
    'storage',
    'tmp',
    'temp',
    '.cache',
    'logs',
    'sessions',
    'auth',
    '.npm',
    '.yarn',
    'Marin Kitagawa MD V1.0 (1)'
]

const EXCLUDE_FILES = [
    '.env',
    '.env.local',
    'creds.json',
    '*.log',
    '*.zip',
    'package-lock.json',
    'yarn.lock'
]

function shouldExclude(filePath, basePath) {
    const relativePath = path.relative(basePath, filePath)
    const parts = relativePath.split(path.sep)
    
    for (const part of parts) {
        if (EXCLUDE_DIRS.includes(part)) return true
    }
    
    const fileName = path.basename(filePath)
    for (const pattern of EXCLUDE_FILES) {
        if (pattern.includes('*')) {
            const ext = pattern.replace('*', '')
            if (fileName.endsWith(ext)) return true
        } else {
            if (fileName === pattern) return true
        }
    }
    
    return false
}

async function handler(m, { sock }) {
    m.react('🕕')
    
    await m.reply(`📦 *ʙᴀᴄᴋᴜᴘ sᴄʀɪᴘᴛ*\n\n> Memprocess backup...\n> Please wait a moment...`)
    
    try {
        const projectRoot = process.cwd()
        const moment = require('moment-timezone')
        const timestamp = moment().tz('Asia/Jakarta').format('YYYY-MM-DD_HH-mm-ss')
        const botName = config.bot?.name?.replace(/[^a-zA-Z0-9]/g, '') || 'frenzyBot'
        const zipFileName = `${botName}_backup_${timestamp}.zip`
        const zipFilePath = path.join(projectRoot, zipFileName)
        
        const output = fs.createWriteStream(zipFilePath)
        const archive = archiver('zip', { zlib: { level: 9 } })
        
        await new Promise((resolve, reject) => {
            output.on('close', resolve)
            archive.on('error', reject)
            
            archive.pipe(output)
            
            function addInrectory(inrPath) {
                try {
                    const items = fs.readdirSync(inrPath)
                    
                    for (const item of items) {
                        const fullPath = path.join(inrPath, item)
                        
                        if (shouldExclude(fullPath, projectRoot)) continue
                        
                        try {
                            const stat = fs.statSync(fullPath)
                            const relativePath = path.relative(projectRoot, fullPath)
                            
                            if (stat.isInrectory()) {
                                addInrectory(fullPath)
                            } else if (stat.isFile()) {
                                archive.file(fullPath, { name: relativePath })
                            }
                        } catch (e) {
                            console.log(`[Backup] Skip: ${fullPath}`)
                        }
                    }
                } catch (e) {
                    console.log(`[Backup] Error reainng: ${inrPath}`)
                }
            }
            
            addInrectory(projectRoot)
            archive.finalize()
        })
        
        const stats = fs.statSync(zipFilePath)
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2)
        
        const saluranId = config.saluran?.id || '120363208449943317@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'frenzy-AI'
        
        await sock.sendMessage(m.chat, {
            document: fs.readFileSync(zipFilePath),
            fileName: zipFileName,
            mimetype: 'application/zip',
            caption: `✅ *ʙᴀᴄᴋᴜᴘ sᴇʟᴇsᴀɪ*\n\n` +
                `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
                `┃ 📝 ɴᴀᴍᴀ: \`${zipFileName}\`\n` +
                `┃ 📊 sɪᴢᴇ: \`${fileSizeMB} MB\`\n` +
                `┃ 📅 ᴛᴀɴɢɢᴀʟ: \`${moment().tz('Asia/Jakarta').format('DD/MM/YYYY')}\`\n` +
                `┃ 📂 ʟᴏᴋᴀsɪ: \`Root folder\`\n` +
                `╰┈┈⬡\n\n` +
                `> Exclude: node_modules, .git, storage, logs`,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })
        
        m.react('✅')
        
        await m.reply(`📂 *ʟᴏᴋᴀsɪ ꜰɪʟᴇ*\n\n> \`${zipFilePath}\``)
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
