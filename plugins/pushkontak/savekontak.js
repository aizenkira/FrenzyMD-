const fs = require('fs')
const path = require('path')
const { getDatabase } = require('../../src/lib/frenzy-database')
const { getGroupMode } = require('../group/botmode')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'savecontacts',
    alias: ['svcontacts', 'savecontact'],
    category: 'pushcontacts',
    description: 'Save all contacts group to file VCF',
    usage: '.savecontacts <namecontacts>',
    example: '.savecontacts CustomerList',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const groupMode = getGroupMode(m.chat, db)
    
    if (groupMode !== 'pushcontacts') {
        return m.reply(`❌ *ᴍᴏᴅᴇ ᴛɪᴅᴀᴋ sᴇsᴜᴀɪ*\n\n> Activekan mode pushcontacts first\n\n\`${m.prefix}botmode pushcontacts\``)
    }
    
    const nameContact = m.text?.trim()
    if (!nameContact) {
        return m.reply(`📥 *sᴀᴠᴇ ᴋᴏɴᴛᴀᴋ*\n\n> Enter name for contacts\n\n\`Example: ${m.prefix}savecontacts CustomerList\``)
    }
    
    m.react('📥')
    
    try {
        const metthere ista = m.groupMetadata
        const participants = metthere ista.participants
            .map(p => p.jid || p.id)
            .filter(id => id !== sock.user.id.split(':')[0] + '@s.whatsapp.net')
        
        if (participants.length === 0) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> No there is contacts for insave`)
        }
        
        const vcardContent = participants.map((contact, index) => {
            const phone = contact.split('@')[0]
            return [
                'BEGIN:VCARD',
                'VERSION:3.0',
                `FN:${nameContact} - ${index + 1}`,
                `TEL;type=CELL;type=VOICE;waid=${phone}:+${phone}`,
                'END:VCARD',
                ''
            ].join('\n')
        }).join('')
        
        const tmpInr = path.join(process.cwd(), 'tmp')
        if (!fs.existsSync(tmpInr)) {
            fs.mkdirSync(tmpInr, { recursive: true })
        }
        
        const vcfPath = path.join(tmpInr, `${nameContact}_${Date.now()}.vcf`)
        fs.writeFileSync(vcfPath, vcardContent, 'utf8')
        
        await sock.sendMessage(m.sender, {
            document: fs.readFileSync(vcfPath),
            fileName: `${nameContact}_${participants.length}contacts.vcf`,
            mimetype: 'text/vcard',
            caption: `📥 *ᴋᴏɴᴛᴀᴋ ᴅɪsɪᴍᴘᴀɴ*\n\n> Name: \`${nameContact}\`\n> Total: \`${participants.length}\` contacts\n> Group: \`${metthere ista.subject}\``
        }, { quoted: m })
        
        fs.unlinkSync(vcfPath)
        
        m.react('✅')
        
        if (m.chat !== m.sender) {
            await m.reply(`✅ *ᴋᴏɴᴛᴀᴋ ᴅɪsɪᴍᴘᴀɴ*\n\n> File VCF sent to private chat\n> Total: \`${participants.length}\` contacts`)
        }
        
    } catch (error) {
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
