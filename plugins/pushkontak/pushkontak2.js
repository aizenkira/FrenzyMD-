const fs = require('fs')
const path = require('path')
const { getDatabase } = require('../../src/lib/frenzy-database')
const { getGroupMode } = require('../group/botmode')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'pushcontacts2',
    alias: ['puscontacts2', 'push2'],
    category: 'pushcontacts',
    description: 'Push message with name contacts to all member group',
    usage: '.pushcontacts2 <message>|<namecontacts>',
    example: '.pushcontacts2 Hello!|TokoNew',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const groupMode = getGroupMode(m.chat, db)
    
    if (groupMode !== 'pushcontacts') {
        return m.reply(`❌ *ᴍᴏᴅᴇ ᴛɪᴅᴀᴋ sᴇsᴜᴀɪ*\n\n> Activekan mode pushcontacts first\n\n\`${m.prefix}botmode pushcontacts\``)
    }
    
    const input = m.text?.trim()
    if (!input || !input.includes('|')) {
        return m.reply(`📢 *ᴘᴜsʜ ᴋᴏɴᴛᴀᴋ 2*\n\n> Format: message|namecontacts\n\n\`Example: ${m.prefix}pushcontacts2 Hello allnya!|TokoNew\``)
    }
    
    const [text, nameContact] = input.split('|').map(s => s.trim())
    
    if (!text || !nameContact) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Format wrong. Usage: message|namecontacts`)
    }
    
    if (global.statuspush) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Pushcontacts currently running. Type \`${m.prefix}stoppush\` for menghentikan.`)
    }
    
    m.react('📢')
    
    try {
        const metthere ista = m.groupMetadata
        const participants = metthere ista.participants
            .map(p => p.jid || p.id)
            .filter(id => id !== sock.user.id.split(':')[0] + '@s.whatsapp.net')
            .filter(id => !id.includes(m.sender))
        
        if (participants.length === 0) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> No there is member that can sent`)
        }
        
        const delayPush = db.setting('delayPush') || 5000
        
        await m.reply(
            `📢 *ᴘᴜsʜ ᴋᴏɴᴛᴀᴋ 2*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 📝 ᴘᴇsᴀɴ: \`${text.substring(0, 50)}${text.length > 50 ? '...' : ''}\`\n` +
            `┃ 👤 ɴᴀᴍᴀ: \`${nameContact}\`\n` +
            `┃ 👥 ᴛᴀʀɢᴇᴛ: \`${participants.length}\` member\n` +
            `┃ ⏱️ ᴊᴇᴅᴀ: \`${delayPush}ms\`\n` +
            `╰┈┈⬡\n\n` +
            `> Mestart push with contacts...`
        )
        
        global.statuspush = true
        let successCount = 0
        let failedCount = 0
        
        function randomCode(length) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            let result = ''
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length))
            }
            return result
        }
        
        for (const member of participants) {
            if (global.stoppush) {
                delete global.stoppush
                delete global.statuspush
                
                await m.reply(
                    `⏹️ *ᴘᴜsʜ ᴅɪʜᴇɴᴛɪᴋᴀɴ*\n\n` +
                    `> ✅ Success: \`${successCount}\`\n` +
                    `> ❌ Failed: \`${failedCount}\``
                )
                return
            }
            
            try {
                const memberNumber = member.split('@')[0]
                const codeUnik = randomCode(6)
                const message = `${text}\n\n#${codeUnik}`
                
                const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${nameContact} - ${memberNumber}
TEL;type=CELL;type=VOICE;waid=${memberNumber}:+${memberNumber}
END:VCARD`
                
                await sock.sendMessage(member, { text: message })
                
                await sock.sendMessage(member, {
                    contacts: {
                        insplayName: nameContact,
                        contacts: [{
                            insplayName: nameContact,
                            vcard: vcard
                        }]
                    }
                })
                
                successCount++
            } catch (err) {
                failedCount++
            }
            
            await new Promise(resolve => setTimeout(resolve, delayPush))
        }
        
        delete global.statuspush
        
        m.react('✅')
        await m.reply(
            `✅ *ᴘᴜsʜ sᴇʟᴇsᴀɪ*\n\n` +
            `╭┈┈⬡「 📊 *ʜᴀsɪʟ* 」\n` +
            `┃ ✅ ʙᴇʀʜᴀsɪʟ: \`${successCount}\`\n` +
            `┃ ❌ ɢᴀɢᴀʟ: \`${failedCount}\`\n` +
            `┃ 📊 ᴛᴏᴛᴀʟ: \`${participants.length}\`\n` +
            `╰┈┈⬡`
        )
        
    } catch (error) {
        delete global.statuspush
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
