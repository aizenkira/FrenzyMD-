const { getAllPlugins } = require('../../src/lib/frenzy-plugins')
const config = require('../../config')

const pluginConfig = {
    name: 'benefitowner',
    alias: ['ownerbenefits', 'ownerfeature'],
    category: 'main',
    description: 'View penclearan and list feature khusus Owner',
    usage: '.benefitowner',
    isOwner: false,
    isGroup: false,
    isEnabled: true
}

async function handler(m, { sock }) {
    const plugins = getAllPlugins()
    const ownerCommands = plugins.filter(p => p.config.isOwner && p.config.isEnabled)
    
    const seen = new Set()
    const commandList = []
    for (const p of ownerCommands) {
        const names = Array.isArray(p.config.name) ? p.config.name : [p.config.name]
        for (const name of names) {
            if (!name || seen.has(name)) continue
            seen.add(name)
            commandList.push(`• *${config.command?.prefix || '.'}${name}*`)
        }
    }
    commandList.sort()
    
    const totalCommands = commandList.length
    
    const message = 
        `👑 *ᴀᴘᴀ ɪᴛᴜ ᴏᴡɴᴇʀ?*\n\n` +
        `Owner is the *owner bot* that has full access to all feature and control system.\n\n` +
        `╭┈┈⬡「 🔐 *ᴋᴇɪꜱᴛɪᴍᴇᴡᴀᴀɴ ᴏᴡɴᴇʀ* 」\n` +
        `┃ ✦ \`\`\`Akses all command tanpa limits\`\`\`\n` +
        `┃ ✦ \`\`\`Limit no terlimit (-1)\`\`\`\n` +
        `┃ ✦ \`\`\`Bypass all cooldown\`\`\`\n` +
        `┃ ✦ \`\`\`Kontrol full system bot\`\`\`\n` +
        `┃ ✦ \`\`\`Manajemen user & group\`\`\`\n` +
        `┃ ✦ \`\`\`Akses panel & server\`\`\`\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `╭┈┈⬡「 ⚙️ *ᴄᴀʀᴀ ᴋᴇʀᴊᴀ* 」\n` +
        `┃ \`Owner added melalui:\`\n` +
        `┃ • \`\`\`${config.command?.prefix || '.'}addowner <number>\`\`\`\n` +
        `┃ • Or directly in config.js\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴀꜰᴛᴀʀ ᴄᴏᴍᴍᴀɴᴅ ᴏᴡɴᴇʀ* 」\n` +
        `┃ \`Total: ${totalCommands} command\`\n` +
        `┃\n` +
        commandList.map(cmd => `┃ ${cmd}`).join('\n') +
        `\n╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `> Contact owner to earn access!`
    
    await m.reply(message)
}

module.exports = {
    config: pluginConfig,
    handler
}
