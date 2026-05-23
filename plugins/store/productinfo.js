const { getDatabase } = require('../../src/lib/frenzy-database')

const pluginConfig = {
    name: 'productinfo',
    alias: ['infoproduct', 'detailproduct'],
    category: 'store',
    description: 'View detail product',
    usage: '.productinfo <number>',
    example: '.productinfo 1',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const groupData = db.getGroup(m.chat) || {}
    
    if (groupData.botMode !== 'store') {
        return m.reply(`❌ Feature this only terseina in mode *STORE*!`)
    }
    
    const products = groupData.storeConfig?.products || []
    
    if (products.length === 0) {
        return m.reply(`❌ Not yet there is product!`)
    }
    
    const idx = parseInt(m.text?.trim()) - 1
    
    if (isNaN(idx) || idx < 0 || idx >= products.length) {
        return m.reply(`❌ Number product no valid!\n\n> View: \`${m.prefix}products\``)
    }
    
    const p = products[idx]
    const stock = p.stock === -1 ? '∞' : p.stock
    
    let txt = `📦 *ᴅᴇᴛᴀɪʟ ᴘʀᴏᴅᴜᴋ*\n\n`
    txt += `> *Name:* ${p.name}\n`
    txt += `> *Price:* Rp ${p.price.toLocaleString('id-ID')}\n`
    txt += `> *Stock:* ${stock}\n`
    if (p.description) txt += `\n📝 *Description:*\n${p.description}\n`
    txt += `\n━━━━━━━━━━━━━━━\n`
    txt += `> \`${m.prefix}order ${idx + 1}\` for message`
    
    if (p.image) {
        await sock.sendMessage(m.chat, {
            image: { url: p.image },
            caption: txt
        }, { quoted: m })
    } else if (p.video) {
        await sock.sendMessage(m.chat, {
            video: { url: p.video },
            caption: txt
        }, { quoted: m })
    } else {
        await m.reply(txt)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
