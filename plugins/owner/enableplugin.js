const fs = require('fs')
const path = require('path')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'enableplugin',
    alias: ['eplugin', 'pluginenable', 'onplugin'],
    category: 'owner',
    description: 'Mengactivekan again plugin that innonactivekan',
    usage: '.enableplugin <name_plugin>',
    example: '.enableplugin sticker',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
}

function findPluginFile(pluginName) {
    const pluginsDir = path.join(process.cwd(), 'plugins')
    const categories = fs.readdirSync(pluginsDir).filter(f => {
        return fs.statSync(path.join(pluginsDir, f)).isDirectory()
    })
    
    for (const category of categories) {
        const categoryPath = path.join(pluginsDir, category)
        const files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'))
        
        for (const file of files) {
            try {
                const filePath = path.join(categoryPath, file)
                const plugin = require(filePath)
                
                if (!plugin.config) continue
                
                const name = Array.isArray(plugin.config.name) 
                    ? plugin.config.name[0] 
                    : plugin.config.name
                    
                const aliases = plugin.config.alias || []
                
                if (name === pluginName || aliases.includes(pluginName)) {
                    return { filePath, plugin, category, file }
                }
            } catch {}
        }
    }
    
    return null
}

async function handler(m, { sock }) {
    const args = m.args || []
    const pluginName = args[0]?.toLowerCase()
    
    if (!pluginName) {
        return m.reply(
            `🔌 *ᴇɴᴀʙʟᴇ ᴘʟᴜɢɪɴ*\n\n` +
            `> Enter name plugin to be inactivekan\n\n` +
            `*Example:*\n` +
            `> \`${m.prefix}enableplugin sticker\`\n` +
            `> \`${m.prefix}enableplugin tiktok\``
        )
    }
    
    const found = findPluginFile(pluginName)
    
    if (!found) {
        return m.reply(`❌ Plugin *${pluginName}* not found!`)
    }
    
    const { filePath, plugin, category, file } = found
    
    if (plugin.config.isEnabled !== false) {
        return m.reply(`⚠️ Plugin *${pluginName}* already active!`)
    }
    
    try {
        let content = fs.readFileSync(filePath, 'utf-8')
        
        content = content.replace(
            /isEnabled:\s*false/i,
            'isEnabled: true'
        )
        
        fs.writeFileSync(filePath, content)
        
        delete require.cache[require.resolve(filePath)]
        
        await m.reply(
            `✅ *ᴘʟᴜɢɪɴ ᴇɴᴀʙʟᴇᴅ*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 📦 Plugin: *${plugin.config.name}*\n` +
            `┃ 📁 Category: *${category}*\n` +
            `┃ 📄 File: *${file}*\n` +
            `┃ 🟢 Status: *Enabled*\n` +
            `╰┈┈⬡\n\n` +
            `> Restart bot or usage hot reload for apply.`
        )
        
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
