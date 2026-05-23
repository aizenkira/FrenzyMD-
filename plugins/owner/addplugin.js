const fs = require('fs')
const path = require('path')
const { hotReloadPlugin } = require('../../src/lib/frenzy-plugins')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'addplugin',
    alias: ['addpl', 'addplugin'],
    category: 'owner',
    description: 'Add plugin new from code that in-reply',
    usage: '.addplugin [namefile] [folder]',
    example: '.addplugin bliblidl downloader',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

function extractPluginInfo(code) {
    const info = { name: null, category: null }
    
    const nameMatch = code.match(/name:\s*['"`]([^'"`]+)['"`]/i)
    if (nameMatch) info.name = nameMatch[1]
    
    const categoryMatch = code.match(/category:\s*['"`]([^'"`]+)['"`]/i)
    if (categoryMatch) info.category = categoryMatch[1]
    
    return info
}

async function handler(m, { sock }) {
    const quoted = m.quoted
    
    if (!quoted) {
        return m.reply(
            `📦 *ᴀᴅᴅ ᴘʟᴜɢɪɴ*\n\n` +
            `> Reply code plugin with caption:\n` +
            `> \`${m.prefix}addplugin\` - Auto detect\n` +
            `> \`${m.prefix}addplugin namefile\` - Custom name\n` +
            `> \`${m.prefix}addplugin namefile folder\` - Custom name + folder`
        )
    }
    
    let code = quoted.text || quoted.body || ''
    
    if (quoted.mimetype === 'application/javascript' || quoted.filename?.endsWith('.js')) {
        try {
            code = (await quoted.download()).toString()
        } catch (e) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Failed download file`)
        }
    }
    
    if (!code || code.length < 50) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Code too short or no valid`)
    }
    
    if (!code.includes('module.exports') && !code.includes('pluginConfig')) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Code not a valid plugin format that is valid\n> Must there is \`module.exports\` and \`pluginConfig\``)
    }
    
    const extracted = extractPluginInfo(code)
    const args = m.args
    
    let fileName = args[0] || extracted.name
    let folderName = args[1] || extracted.category
    
    if (!fileName) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Cannot detect the plugin name\n> Usage \`${m.prefix}addplugin <namefile>\``)
    }
    
    if (!folderName) {
        folderName = 'other'
    }
    
    fileName = fileName.toLowerCase().replace(/[^a-z0-9]/g, '')
    folderName = folderName.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    if (!fileName) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Name file no valid`)
    }
    
    m.react('🕕')
    
    try {
        const pluginsDir = path.join(process.cwd(), 'plugins')
        const folderPath = path.join(pluginsDir, folderName)
        const filePath = path.join(folderPath, `${fileName}.js`)
        
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true })
        }
        
        if (fs.existsSync(filePath)) {
            m.react('❌')
            return m.reply(
                `❌ *ɢᴀɢᴀʟ*\n\n` +
                `> File \`${fileName}.js\` already exist in folder \`${folderName}\`\n\n` +
                `💡 *ᴛɪᴘ:* Usage \`${m.prefix}ganticode ${fileName} ${folderName}\` for replace code that already exist`
            )
        }
        
        fs.writeFileSync(filePath, code)
        
        const reloadResult = hotReloadPlugin(filePath)
        
        m.react('✅')
        return m.reply(
            `✅ *ᴘʟᴜɢɪɴ ᴅɪᴛᴀᴍʙᴀʜ*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 📝 ɴᴀᴍᴀ: \`${fileName}.js\`\n` +
            `┃ 📁 ꜰᴏʟᴅᴇʀ: \`${folderName}\`\n` +
            `┃ 📊 sɪᴢᴇ: \`${code.length} bytes\`\n` +
            `┃ 🔄 ʜᴏᴛ ʀᴇʟᴏᴀᴅ: ${reloadResult.success ? '✅ Success' : '⚠️ Pending'}\n` +
            `╰┈┈⬡\n\n` +
            `> Plugin already active and ready to use!`
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
