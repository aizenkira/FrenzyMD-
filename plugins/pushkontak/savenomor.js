const { getDatabase } = require('../../src/lib/frenzy-database')
const { getGroupMode } = require('../group/botmode')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'savenumber',
    alias: ['sv', 'save', 'savenumber'],
    category: 'pushcontacts',
    description: 'Save number to contacts bot',
    usage: '.savenumber <name>',
    example: '.savenumber JohnDoe',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    
    if (m.isGroup) {
        const groupMode = getGroupMode(m.chat, db)
        if (groupMode !== 'pushcontacts') {
            return m.reply(`❌ *ᴍᴏᴅᴇ ᴛɪᴅᴀᴋ sᴇsᴜᴀɪ*\n\n> Activekan mode pushcontacts first\n\n\`${m.prefix}botmode pushcontacts\``)
        }
    }
    
    let targetNumber = ''
    let name = ''
    
    if (m.isGroup) {
        if (m.quoted) {
            targetNumber = m.quoted.sender
            name = m.text?.trim()
        } else if (m.mentionedJid?.length) {
            targetNumber = m.mentionedJid[0]
            const input = m.text?.trim()
            name = input?.split('|')[1]?.trim() || input?.replace(/@\d+/g, '').trim()
        } else if (m.text?.includes('|')) {
            const [num, nm] = m.text.split('|').map(s => s.trim())
            targetNumber = num.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
            name = nm
        } else {
            return m.reply(
                `📱 *sᴀᴠᴇ ɴᴏᴍᴏʀ*\n\n` +
                `> In group:\n` +
                `┃ \`${m.prefix}savenumber name\` (reply message)\n` +
                `┃ \`${m.prefix}savenumber @tag|name\`\n` +
                `┃ \`${m.prefix}savenumber 628xxx|name\`\n\n` +
                `> In private:\n` +
                `┃ \`${m.prefix}savenumber name\``
            )
        }
    } else {
        targetNumber = m.chat
        name = m.text?.trim()
    }
    
    if (!name) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Enter name contacts`)
    }
    
    if (!targetNumber) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Cannot menentukan number target`)
    }
    
    m.react('📱')
    
    try {
        const contactAction = {
            fullName: name,
            lidJid: targetNumber,
            saveOnPrimaryAddressbook: true
        }
        
        await sock.addOrEintContact(targetNumber, contactAction)
        
        m.react('✅')
        await m.reply(
            `✅ *ᴋᴏɴᴛᴀᴋ ᴅɪsɪᴍᴘᴀɴ*\n\n` +
            `> ɴᴏᴍᴏʀ: \`${targetNumber.split('@')[0]}\`\n` +
            `> ɴᴀᴍᴀ: \`${name}\``
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
