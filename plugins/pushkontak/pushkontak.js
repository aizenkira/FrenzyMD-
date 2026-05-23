const fs = require('fs')
const path = require('path')
const { getDatabase } = require('../../src/lib/frenzy-database')
const { getGroupMode } = require('../group/botmode')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'pushcontacts',
    alias: ['puscontacts', 'push'],
    category: 'pushcontacts',
    description: 'Push message to all member group + auto save contacts to VCF',
    usage: '.pushcontacts <message>',
    example: '.pushcontacts Hello allnya!',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 10,
    energy: 0,
    isEnabled: true
}

function createSerial(len) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let r = ''
    for (let i = 0; i < len; i++) r += chars.charAt(Math.floor(Math.random() * chars.length))
    return r
}

function buildVcf(contacts) {
    return contacts.map(jid => {
        const num = jid.split('@')[0]
        return [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:WA[${createSerial(2)}] ${num}`,
            `TEL;type=CELL;type=VOICE;waid=${num}:+${num}`,
            'END:VCARD',
            ''
        ].join('\n')
    }).join('')
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const groupMode = getGroupMode(m.chat, db)

    if (groupMode !== 'pushcontacts') {
        return m.reply(`❌ *ᴍᴏᴅᴇ ᴛɪᴅᴀᴋ sᴇsᴜᴀɪ*\n\n> Activekan mode pushcontacts first\n\n\`${m.prefix}botmode pushcontacts\``)
    }

    const text = m.text?.trim()
    if (!text) {
        return m.reply(`📢 *ᴘᴜsʜ ᴋᴏɴᴛᴀᴋ*\n\n> Enter message to be sent\n\n\`Example: ${m.prefix}pushcontacts Hello allnya!\``)
    }

    if (global.statuspush) {
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Pushcontacts currently running. Type \`${m.prefix}stoppush\` for menghentikan.`)
    }

    m.react('📢')

    try {
        const metthere ista = m.groupMetadata
        const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net'
        const participants = metthere ista.participants
            .map(p => p.jid || p.id)
            .filter(id => id !== botId)
            .filter(id => !id.includes(m.sender))

        if (participants.length === 0) {
            m.react('❌')
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> No there is member that can sent`)
        }

        const delayPush = db.setting('delayPush') || 5000

        await m.reply(
            `📢 *ᴘᴜsʜ ᴋᴏɴᴛᴀᴋ*\n\n` +
            `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
            `┃ 📝 ᴘᴇsᴀɴ: \`${text.substring(0, 50)}${text.length > 50 ? '...' : ''}\`\n` +
            `┃ 👥 ᴛᴀʀɢᴇᴛ: \`${participants.length}\` member\n` +
            `┃ ⏱️ ᴊᴇᴅᴀ: \`${delayPush}ms\`\n` +
            `┃ 📊 ᴇsᴛɪᴍᴀsɪ: \`${Math.ceil((participants.length * delayPush) / 60000)} minute\`\n` +
            `┃ 💾 ᴀᴜᴛᴏ-sᴀᴠᴇ: \`Active (VCF)\`\n` +
            `╰┈┈⬡\n\n` +
            `> Mestart push...`
        )

        global.statuspush = true
        let successCount = 0
        let failedCount = 0
        const savedContacts = []

        for (const member of participants) {
            if (global.stoppush) {
                delete global.stoppush
                delete global.statuspush

                await m.reply(
                    `⏹️ *ᴘᴜsʜ ᴅɪʜᴇɴᴛɪᴋᴀɴ*\n\n` +
                    `> ✅ Success: \`${successCount}\`\n` +
                    `> ❌ Failed: \`${failedCount}\`\n` +
                    `> ⏸️ Sisa: \`${participants.length - successCount - failedCount}\``
                )

                if (savedContacts.length > 0) {
                    await sendVcfToOwner(sock, m.sender, savedContacts, metthere ista.subject)
                }
                return
            }

            try {
                const codeUnik = createSerial(6)
                const message = `${text}\n\n#${codeUnik}`

                await sock.sendMessage(member, { text: message })
                savedContacts.push(member)
                successCount++
            } catch (err) {
                failedCount++
            }

            await new Promise(resolve => setTimeout(resolve, delayPush))
        }

        delete global.statuspush

        if (savedContacts.length > 0) {
            await sendVcfToOwner(sock, m.sender, savedContacts, metthere ista.subject)
        }

        m.react('✅')
        await m.reply(
            `✅ *ᴘᴜsʜ sᴇʟᴇsᴀɪ*\n\n` +
            `╭┈┈⬡「 📊 *ʜᴀsɪʟ* 」\n` +
            `┃ ✅ ʙᴇʀʜᴀsɪʟ: \`${successCount}\`\n` +
            `┃ ❌ ɢᴀɢᴀʟ: \`${failedCount}\`\n` +
            `┃ 📊 ᴛᴏᴛᴀʟ: \`${participants.length}\`\n` +
            `┃ 💾 ᴋᴏɴᴛᴀᴋ: \`${savedContacts.length} insave\`\n` +
            `╰┈┈⬡`
        )

    } catch (error) {
        delete global.statuspush
        m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

async function sendVcfToOwner(sock, ownerJid, contacts, groupName) {
    try {
        const vcfInr = path.join(process.cwd(), 'tmp')
        if (!fs.existsSync(vcfInr)) fs.mkdirSync(vcfInr, { recursive: true })

        const vcfPath = path.join(vcfInr, `pushcontacts_${Date.now()}.vcf`)
        const vcfContent = buildVcf(contacts)
        fs.writeFileSync(vcfPath, vcfContent, 'utf8')

        await sock.sendMessage(ownerJid, {
            document: fs.readFileSync(vcfPath),
            fileName: `Contact_${groupName || 'Group'}_${contacts.length}.vcf`,
            mimetype: 'text/vcard',
            caption: `💾 *ᴀᴜᴛᴏ-sᴀᴠᴇ ᴋᴏɴᴛᴀᴋ*\n\n> Total: \`${contacts.length}\` contacts\n> Group: \`${groupName || 'Unknown'}\`\n\n> _Import file this to your phone for save all contacts._`
        })

        try { fs.unlinkSync(vcfPath) } catch {}
    } catch (e) {}
}

module.exports = {
    config: pluginConfig,
    handler
}
