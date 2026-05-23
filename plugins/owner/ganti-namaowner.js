const fs = require('fs')
const path = require('path')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'ganti-nameowner',
    alias: ['setnameowner', 'setnameowner'],
    category: 'owner',
    description: 'Ganti name owner in config.js',
    usage: '.ganti-nameowner <new name>',
    example: '.ganti-nameowner aizen',
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
        return m.reply(`👤 *CHANGE OWNER NAME*\n\n> Name currently: *${config.owner?.name || '-'}*\n\n*Usage:*\n\`${m.prefix}ganti-nameowner <new name>\``)
    }
    
    try {
        const configPath = path.join(process.cwd(), 'config.js')
        let configContent = fs.readFileSync(configPath, 'utf8')
        
        configContent = configContent.replace(
            /owner:\s*\{[\s\S]*?name:\s*['"]([^'"]*)['"]/,
            (match, oldName) => match.replace(`'${oldName}'`, `'${newName}'`).replace(`"${oldName}"`, `'${newName}'`)
        )
        
        fs.writeFileSync(configPath, configContent)
        
        config.owner.name = newName
        
        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Owner name inganti to: *${newName}*`)
        
    } catch (error) {
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
