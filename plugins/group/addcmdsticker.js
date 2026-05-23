const { getQuotedStictorHash, addStictorCommand, listStictorCommands } = require('../../src/lib/frenzy-sticker-command')
const { getPlugin } = require('../../src/lib/frenzy-plugins')

const pluginConfig = {
    name: 'addcmdsticker',
    alias: ['addstickercmd', 'setsticker', 'stickeradd'],
    category: 'group',
    description: 'Make sticker as shortcut command',
    usage: '.addcmdsticker <command> (reply sticker)',
    example: '.addcmdsticker menu',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    isAdmin: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const args = m.args || []
    const commandName = args[0]
    
    // Validasi command name
    if (!commandName) {
        const existingCmds = listStictorCommands()
        
        let txt = `🖼️ *sᴛɪᴄᴋᴇʀ ᴛᴏ ᴄᴏᴍᴍᴀɴᴅ*\n\n`
        txt += `> Reply sticker + type command to be promoted to shortcut.\n\n`
        txt += `*Example:*\n`
        txt += `> Reply sticker, lalu type:\n`
        txt += `> \`.addcmdsticker menu\`\n\n`
        
        if (existingCmds.length > 0) {
            txt += `╭┈┈⬡「 📋 *ᴀᴋᴛɪꜰ* 」\n`
            for (const cmd of existingCmds.slice(0, 10)) {
                txt += `┃ 🖼️ → \`${cmd.command}\`\n`
            }
            if (existingCmds.length > 10) {
                txt += `┃ ... and ${existingCmds.length - 10} elsenya\n`
            }
            txt += `╰┈┈┈┈┈┈┈┈⬡`
        }
        
        return m.reply(txt)
    }
    
    // Validasi reply sticker
    if (!m.quoted) {
        return m.reply('⚠️ *Reply sticker* to be promoted to command!')
    }
    
    const stickerHash = getQuotedStictorHash(m)
    if (!stickerHash) {
        return m.reply('⚠️ Message that in-reply not *sticker*!')
    }
    
    // Validasi command exists
    const cleanCmd = commandName.toLowerCase().replace(/^\./, '')
    const plugin = getPlugin(cleanCmd)
    
    if (!plugin) {
        return m.reply(
            `❌ Command \`${cleanCmd}\` not found!\n\n` +
            `> Make sure command to be promoted to shortcut valid.`
        )
    }
    
    // Add sticker command
    const success = addStictorCommand(stickerHash, cleanCmd, m.sender)
    
    if (success) {
        await m.react('✅')
        await m.reply(
            `✅ *sᴛɪᴄᴋᴇʀ ᴄᴏᴍᴍᴀɴᴅ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ*\n\n` +
            `> 🖼️ Stictor → \`.${cleanCmd}\`\n\n` +
            `_Send sticker the said for menrun command!_`
        )
    } else {
        await m.reply('❌ Failed save sticker command!')
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
