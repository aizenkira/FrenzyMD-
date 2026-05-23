const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'setdone',
    alias: ['doneconfig', 'configdone'],
    category: 'store',
    description: 'Set template for .done',
    usage: '.setdone template <full text>',
    example: '.setdone template 「 *TRANSAKSI BERHASIL* 」\\n\\n⌚️ JAM : {hour}',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

const defaultTemplate = `「 *TRANSAKSI BERHASIL* 」

⌚️ JAM     : {hour}
✨ STATUS  : Success
*📝 Messagean:*
{order}

*📝 Note :*
{note}

Receivekasih @{buyer_number}, Next Order ya🙏`

async function handler(m, { sock }) {
    const db = getDatabase()
    const text = m.text?.trim() || ''
    const args = text.split(' ')
    const option = args[0]?.toLowerCase()
    
    const current = db.setting('doneTemplate') || {}
    
    if (!option) {
        let info = `⚙️ *sᴇᴛ ᴅᴏɴᴇ ᴛᴇᴍᴘʟᴀᴛᴇ*\n\n`
        info += `╭┈┈⬡「 📋 *ᴄᴜʀʀᴇɴᴛ sᴇᴛᴛɪɴɢs* 」\n`
        info += `┃ ▧ Template: ${current.template ? '✅ Custom' : '❌ Default'}\n`
        info += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        info += `*ᴜsᴀɢᴇ:*\n\n`
        info += `1️⃣ *Set Template:*\n`
        info += `\`${m.prefix}setdone template <text>\`\n\n`
        info += `2️⃣ *Example:*\n`
        info += `\`\`\`\n${m.prefix}setdone template 「 *TRANSAKSI BERHASIL* 」\n\n⌚️ JAM : {hour}\n✨ STATUS : Success\n📝 Messagean: {order}\n📝 Note: {note}\n\nReceivekasih @{buyer_number}!\n\`\`\`\n\n`
        info += `*ᴘʟᴀᴄᴇʜᴏʟᴅᴇʀs:*\n`
        info += `> {buyer} = Name buyer\n`
        info += `> {buyer_number} = Number buyer\n`
        info += `> {hour} / {time} = Jam (HH.MM.SS)\n`
        info += `> {date} = Date (DD-MM-YYYY)\n`
        info += `> {order} / {title} / {product} = Messagean\n`
        info += `> {note} = Catatan\n\n`
        info += `3️⃣ *Reset to Default:*\n`
        info += `\`${m.prefix}setdone reset\`\n\n`
        info += `4️⃣ *Preview Template:*\n`
        info += `\`${m.prefix}setdone preview\``
        
        return m.reply(info)
    }
    
    if (option === 'reset') {
        db.setting('doneTemplate', {})
        await db.save()
        return m.reply(`✅ Template .done inreset to default!`)
    }
    
    if (option === 'preview') {
        const template = current.template || defaultTemplate
        
        const now = new Date()
        const hour = `${now.getHours().toString().padStart(2, '0')}.${now.getMinutes().toString().padStart(2, '0')}.${now.getSeconds().toString().padStart(2, '0')}`
        const date = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`
        
        const previewText = template
            .replace(/{buyer}/gi, 'Zann')
            .replace(/{buyer_number}/gi, '6281234567890')
            .replace(/{hour}/gi, hour)
            .replace(/{time}/gi, hour)
            .replace(/{date}/gi, date)
            .replace(/{order}/gi, 'Canva Pro 1 Month')
            .replace(/{title}/gi, 'Canva Pro 1 Month')
            .replace(/{product}/gi, 'Canva Pro 1 Month')
            .replace(/{note}/gi, 'In sent via chat')
        
        return m.reply(`📋 *ᴘʀᴇᴠɪᴇᴡ ᴛᴇᴍᴘʟᴀᴛᴇ:*\n\n${previewText}`)
    }
    
    if (option === 'template') {
        const templateText = m.fullArgs.slice(9).trim()
        
        if (!templateText) {
            return m.reply(`❌ Template no may empty!\n\n> Usage \`${m.prefix}setdone\` for view example`)
        }
        
        current.template = templateText
        db.setting('doneTemplate', current)
        await db.save()
        
        return m.reply(`✅ *ᴛᴇᴍᴘʟᴀᴛᴇ ᴅɪsɪᴍᴘᴀɴ!*\n\n> Usage \`${m.prefix}setdone preview\` for view hasil`)
    }
    
    return m.reply(`❌ Option no valid!\n\n> Usage: \`template\`, \`preview\`, or \`reset\``)
}

module.exports = {
    config: pluginConfig,
    handler
}
