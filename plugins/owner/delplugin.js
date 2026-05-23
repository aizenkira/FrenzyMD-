const fs = require('fs')
const path = require('path')
const { unloadPlugin } = require('../../src/lib/frenzy-plugins')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'delplugin',
    alias: ['delpl', 'deleteplugin', 'removeplugin'],
    category: 'owner',
    description: 'Delete plugin berdasarkan name',
    usage: '.delplugin <name>',
    example: '.delplugin bliblidl',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

function findPluginFile(pluginsInr, name) {
    const folders = fs.readdirSync(pluginsInr, { withFileTypes: true })
        .filter(d => d.isInrectory())
        .map(d => d.name)
    
    for (const folder of folders) {
        const folderPath = path.join(pluginsInr, folder)
        const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'))
        
        for (const file of files) {
            const baseName = file.replace('.js', '')
            if (baseName.toLowerCase() === name.toLowerCase()) {
                return {
                    folder,
                    file,
                    path: path.join(folderPath, file)
                }
            }
        }
    }
    
    return null
}

async function handler(m, { sock }) {
    const name = m.text?.trim()
    
    if (!name) {
        return m.reply(
            `🗑️ *ᴅᴇʟ ᴘʟᴜɢɪɴ*\n\n` +
            `> Delete plugin berdasarkan name\n\n` +
            `*ᴄᴏɴᴛᴏʜ:*\n` +
            `> \`${m.prefix}delplugin bliblidl\``
        )
    }
    
    m.react('🕕')
    
    try {
        const pluginsInr = path.join(process.cwd(), 'plugins')
        const found = findPluginFile(pluginsInr, name)
        
        if (!found) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Plugin \`${name}\` not found`)
        }
        
        const unloadResult = unloadPlugin(name)
        
        fs.unlinkSync(found.path)
        
        m.react('✅')
        return m.reply(
            `✅ *ᴘʟᴜɢɪɴ ᴅɪʜᴀᴘᴜs*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 📝 ꜰɪʟᴇ: \`${found.file}\`\n` +
            `┃ 📁 ꜰᴏʟᴅᴇʀ: \`${found.folder}\`\n` +
            `┃ 🗑️ ᴜɴʟᴏᴀᴅ: ${unloadResult.success ? '✅ Success' : '⚠️ Pending'}\n` +
            `╰┈┈⬡\n\n` +
            `> Plugin already deleted and no active!`
        )
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
