const axios = require('axios')
const config = require('../../config')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'invoicemator',
    alias: ['invoice', 'faktur', 'nota'],
    category: 'tools',
    description: 'Create invoice/nota pensellan',
    usage: '.invoicemator <toko>|<invoice>|<date>|<status>|<items>|<total>',
    example: '.invoicemator TokoKu|INV001|15/01/2026|paid|Nasi Goreng:1x:15000,Es Teh:2x:6000|21000',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 15,
    energy: 2,
    isEnabled: true
}

const NEOXR_APIKEY = config.APItoy?.neoxr || 'Milik-Bot-frenzyMD'

async function handler(m, { sock }) {
    const args = m.args || []
    const text = args.join(' ')
    
    if (!text || !text.includes('|')) {
        return m.reply(
            `🧾 *ɪɴᴠᴏɪᴄᴇ ᴍᴀᴋᴇʀ*\n\n` +
            `╭┈┈⬡「 📋 *ꜰᴏʀᴍᴀᴛ* 」\n` +
            `┃ \`${m.prefix}invoicemator <toko>|<invoice>|<date>|<status>|<items>|<total>\`\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 📝 *ᴘᴀʀᴀᴍᴇᴛᴇʀ* 」\n` +
            `┃ • toko: Name toko\n` +
            `┃ • invoice: Number invoice\n` +
            `┃ • date: Format DD/MM/YYYY\n` +
            `┃ • status: paid/unpaid\n` +
            `┃ • items: Name:unit:price (pisah koma)\n` +
            `┃ • total: Total price\n` +
            `╰┈┈⬡\n\n` +
            `> Example:\n` +
            `\`${m.prefix}invoicemator TokoKu|INV001|15/01/2026|paid|Nasi Goreng:1x:15000,Es Teh:2x:6000|21000\``
        )
    }
    
    const parts = text.split('|').map(p => p.trim())
    
    if (parts.length < 6) {
        return m.reply(`❌ Format no complete! Need 6 palivelyter (toko|invoice|date|status|items|total)`)
    }
    
    const [store, invoice, date, status, itemsRaw, totalRaw] = parts
    
    if (!['paid', 'unpaid'].includes(status.toLowerCase())) {
        return m.reply(`❌ Status must 'paid' or 'unpaid'!`)
    }
    
    const itemsArr = itemsRaw.split(',').map(item => {
        const [name, unit, price] = item.split(':').map(i => i.trim())
        return {
            name: name || 'Item',
            unit: unit || '1x',
            price: parseInt(price) || 0
        }
    })
    
    if (itemsArr.length === 0 || itemsArr.some(i => !i.name)) {
        return m.reply(`❌ Format items wrong! Usage: Name:unit:price (pisah koma for multiple)`)
    }
    
    const total = parseInt(totalRaw) || itemsArr.reduce((sum, i) => sum + i.price, 0)
    
    m.react('🧾')
    
    try {
        const qrImage = 'https://i.ibb.co.com/kt5fyrg/qr.jpg'
        
        const url = `https://api.neoxr.eu/api/invoice-mator?` +
            `store=${encodeURIComponent(store)}` +
            `&invoice=${encodeURIComponent(invoice)}` +
            `&date=${encodeURIComponent(date)}` +
            `&status=${status.toLowerCase()}` +
            `&image=${encodeURIComponent(qrImage)}` +
            `&items=${encodeURIComponent(JSON.stringify(itemsArr))}` +
            `&total=${total}` +
            `&apikey=${NEOXR_APIKEY}`
        
        const response = await axios.get(url, { timeout: 60000 })
        
        if (!response.data?.status || !response.data?.data?.image?.url) {
            throw new Error('API no mengembackan data that is valid')
        }
        
        const imageUrl = response.data.data.image.url
        const data = response.data.data
        
        const saluranId = config.saluran?.id || '120363406397452589@newsletter'
        const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI'
        
        let caption = `🧾 *ɪɴᴠᴏɪᴄᴇ ɢᴇɴᴇʀᴀᴛᴇᴅ*\n\n`
        caption += `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n`
        caption += `┃ 🏪 Toko: *${data.store}*\n`
        caption += `┃ 🔢 Invoice: *${data.invoice}*\n`
        caption += `┃ 📅 Date: *${data.date}*\n`
        caption += `┃ 📌 Status: *${data.status === 'paid' ? '✅ LUNAS' : '❌ BELUM LUNAS'}*\n`
        caption += `╰┈┈⬡\n\n`
        
        caption += `╭┈┈⬡「 🛒 *ɪᴛᴇᴍs* 」\n`
        data.items.forEach((item, i) => {
            caption += `┃ ${i + 1}. ${item.name} (${item.unit}) - Rp${item.price.toLocaleString('id-ID')}\n`
        })
        caption += `╰┈┈⬡\n\n`
        
        caption += `> 💰 Total: *Rp${data.total.toLocaleString('id-ID')}*`
        
        await sock.sendMessage(m.chat, {
            image: { url: imageUrl },
            caption,
            contextInfo: {
                forwardingScore: 9999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: saluranId,
                    newsletterName: saluranName,
                    serverMessageId: 127
                }
            }
        }, { quoted: m })
        
        m.react('✅')
        
    } catch (err) {
        m.react('☢')
        return m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
