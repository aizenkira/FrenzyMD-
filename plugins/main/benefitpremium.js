const { getAllPlugins } = require('../../src/lib/frenzy-plugins')
const config = require('../../config')

const pluginConfig = {
    name: 'benefitpremium',
    alias: ['premiumbenefits', 'premiumfeature', 'benefitprem'],
    category: 'main',
    description: 'View penclearan and list feature khusus Premium',
    usage: '.benefitpremium',
    isOwner: false,
    isGroup: false,
    isEnabled: true
}

async function handler(m, { sock }) {
    const plugins = getAllPlugins()
    const premiumCommands = plugins.filter(p => p.config.isPremium && p.config.isEnabled)
    
    const seen = new Set()
    const commandList = []
    for (const p of premiumCommands) {
        const names = Array.isArray(p.config.name) ? p.config.name : [p.config.name]
        for (const name of names) {
            if (!name || seen.has(name)) continue
            seen.add(name)
            commandList.push(`• *${config.command?.prefix || '.'}${name}*`)
        }
    }
    commandList.sort()
    
    const totalCommands = commandList.length
    const defaultLimit = config.limits?.default || 25
    const premiumLimit = config.limits?.premium || 100
    
    const message = 
        `⭐ *ᴀᴘᴀ ɪᴛᴜ ᴘʀᴇᴍɪᴜᴍ?*\n\n` +
        `Premium is the *user paid* that earn access to feature eksklusif and tountungan lebih.\n\n` +
        `╭┈┈⬡「 💎 *ᴋᴇᴜɴᴛᴜɴɢᴀɴ ᴘʀᴇᴍɪᴜᴍ* 」\n` +
        `┃ ✦ \`\`\`Limit daily: ${premiumLimit}x (vs ${defaultLimit}x user regular)\`\`\`\n` +
        `┃ ✦ \`\`\`Cooldown lebih low\`\`\`\n` +
        `┃ ✦ \`\`\`Akses feature eksklusif\`\`\`\n` +
        `┃ ✦ \`\`\`Prioritas response\`\`\`\n` +
        `┃ ✦ \`\`\`No watermark in a few feature\`\`\`\n` +
        `┃ ✦ \`\`\`Support prioritas\`\`\`\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `╭┈┈⬡「 ⚙️ *ᴄᴀʀᴀ ᴍᴇɴᴅᴀᴘᴀᴛᴋᴀɴ* 」\n` +
        `┃ \`Premium inwillkan melalui:\`\n` +
        `┃ • Contact owner bot\n` +
        `┃ • \`\`\`${config.command?.prefix || '.'}addprem <number> <durasi>\`\`\`\n` +
        `┃ • Example: .addprem 628xxx 30d\n` +
        `╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴀꜰᴛᴀʀ ᴄᴏᴍᴍᴀɴᴅ ᴘʀᴇᴍɪᴜᴍ* 」\n` +
        `┃ \`Total: ${totalCommands} command\`\n` +
        `┃\n` +
        (totalCommands > 0 
            ? commandList.map(cmd => `┃ ${cmd}`).join('\n')
            : `┃ All command can inaccess user regular`) +
        `\n╰┈┈┈┈┈┈┈┈⬡\n\n` +
        `Want Upgrade? please contact owner bot\n${config.owner.number.map(num => `- wa.me/${num}`).join('\n') }`
    
    await m.reply(message)
}

module.exports = {
    config: pluginConfig,
    handler
}
