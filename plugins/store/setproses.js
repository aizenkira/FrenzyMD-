const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'setprocess',
    alias: ['processconfig', 'configprocess'],
    category: 'store',
    description: 'Set template for .process',
    usage: '.setprocess template <full text>',
    example: '.setprocess template 「 *TRANSAKSI DIPROSES* 」\\n\\n👤 Buyer: @{buyer_number}',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

const defaultTemplate = `「 *TRANSAKSI DIPROSES* 」

⌚️ JAM     : {hour}
✨ STATUS  : Inprocess

*👤 Buyer:*
@{buyer_number} ({buyer})

Please wait ya, order being processed🙏`

async function handler(m, { sock }) {
    const db = getDatabase()
    const text = m.text?.trim() || ''
    const args = text.split(' ')
    const option = args[0]?.toLowerCase()
    
    const current = db.setting('processTemplate') || {}
    
    if (!option) {
        let info = `⚙️ *sᴇᴛ ᴘʀᴏsᴇs ᴛᴇᴍᴘʟᴀᴛᴇ*\n\n`
        info += `╭┈┈⬡「 📋 *ᴄᴜʀʀᴇɴᴛ sᴇᴛᴛɪɴɢs* 」\n`
        info += `┃ ▧ Template: ${current.template ? '✅ Custom' : '❌ Default'}\n`
        info += `╰┈┈┈┈┈┈┈┈⬡\n\n`
        info += `*ᴜsᴀɢᴇ:*\n\n`
        info += `1️⃣ *Set Template:*\n`
        info += `\`${m.prefix}setprocess template <text>\`\n\n`
        info += `2️⃣ *Example:*\n`
        info += `\`\`\`\n${m.prefix}setprocess template 「 *TRANSAKSI DIPROSES* 」\n\n⌚️ JAM : {hour}\n✨ STATUS : Inprocess\n\n👤 Buyer: @{buyer_number}\n\nPlease wait ya🙏\n\`\`\`\n\n`
        info += `*ᴘʟᴀᴄᴇʜᴏʟᴅᴇʀs:*\n`
        info += `> {buyer} = Name buyer\n`
        info += `> {buyer_number} = Number buyer\n`
        info += `> {hour} / {time} = Jam (HH.MM.SS)\n`
        info += `> {date} = Date (DD-MM-YYYY)\n\n`
        info += `3️⃣ *Reset to Default:*\n`
        info += `\`${m.prefix}setprocess reset\`\n\n`
        info += `4️⃣ *Preview Template:*\n`
        info += `\`${m.prefix}setprocess preview\``
        
        return m.reply(info)
    }
    
    if (option === 'reset') {
        db.setting('processTemplate', {})
        await db.save()
        return m.reply(`✅ Template .process inreset to default!`)
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
        
        return m.reply(`📋 *ᴘʀᴇᴠɪᴇᴡ ᴛᴇᴍᴘʟᴀᴛᴇ:*\n\n${previewText}`)
    }
    
    if (option === 'template') {
        const templateText = m.fullArgs.slice(9).trim()
        
        if (!templateText) {
            return m.reply(`❌ Template no may empty!\n\n> Usage \`${m.prefix}setprocess\` for view example`)
        }
        
        current.template = templateText
        db.setting('processTemplate', current)
        await db.save()
        
        return m.reply(`✅ *ᴛᴇᴍᴘʟᴀᴛᴇ ᴅɪsɪᴍᴘᴀɴ!*\n\n> Usage \`${m.prefix}setprocess preview\` for view hasil`)
    }
    
    return m.reply(`❌ Option no valid!\n\n> Usage: \`template\`, \`preview\`, or \`reset\``)
}

module.exports = {
    config: pluginConfig,
    handler
}
