const fs = require('fs')
const path = require('path')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'ganti-namedev',
    alias: ['setnamedev', 'setnamedev', 'gantideveloper'],
    category: 'owner',
    description: 'Ganti name developer in config.js',
    usage: '.ganti-namedev <new name>',
    example: '.ganti-namedev Lucky Archz',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock, config }) {
    const newName = m.args.join(' ')
    
    if (!newName) {
        return m.reply(`👨‍💻 *CHANGE DEVELOPER NAME*\n\n> Name currently: *${config.bot?.developer || '-'}*\n\n*Usage:*\n\`${m.prefix}ganti-namedev <new name>\``)
    }
    
    try {
        const configPath = path.join(process.cwd(), 'config.js')
        let configContent = fs.readFileSync(configPath, 'utf8')
        
        configContent = configContent.replace(
            /developer:\s*['"]([^'"]*)['"]/,
            `developer: '${newName}'`
        )
        
        fs.writeFileSync(configPath, configContent)
        
        config.bot.developer = newName
        
        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Name developer inganti to: *${newName}*`)
        
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
