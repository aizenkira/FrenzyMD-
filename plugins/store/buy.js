const { getDatabase } = require('../../src/lib/frenzy-database')
const orderPoller = require('../../src/lib/frenzy-order-poller')
const path = require('path')
const fs = require('fs')

const pluginConfig = {
    name: 'buyproduct',
    alias: ['buyproduct', 'buybalance', 'buywithcoins', 'orderbalance'],
    category: 'store',
    description: 'Buy product with balance/coins',
    usage: '.buyproduct [number_product] [amount]',
    example: '.buyproduct 1',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: false,
    cooldown: 10,
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
        return m.reply(`❌ Not yet there is product!\n\n> Contact admin group.`)
    }
    
    const cleanJid = m.sender.split('@')[0]
    if (!db.db.data.users[cleanJid]) {
        db.setUser(m.sender)
    }
    const userCoins = db.db.data.users[cleanJid].coins || 0
    
    const args = m.text?.trim().split(/\s+/) || []
    const productIdx = parseInt(args[0]) - 1
    const qty = parseInt(args[1]) || 1
    
    if (isNaN(productIdx) || productIdx < 0 || productIdx >= products.length) {
        const storeImage = path.join(process.cwd(), 'assets', 'images', 'frenzy-store.jpg')
        
        let txt = `💳 *ʙᴇʟɪ ᴅᴇɴɢᴀɴ sᴀʟᴅᴏ*\n\n`
        txt += `> Pay product use *Coins* in-game!\n`
        txt += `> Balance you: *Rp ${userCoins.toLocaleString('id-ID')}*\n`
        txt += `━━━━━━━━━━━━━━━\n\n`
        
        products.forEach((p, i) => {
            const stock = p.stock === -1 ? '∞' : (p.stockItems?.length || p.stock || 0)
            const hasMeina = p.image || p.video ? '📷' : ''
            const affordable = userCoins >= p.price ? '✅' : '❌'
            txt += `*${i + 1}.* ${hasMeina} ${p.name}\n`
            txt += `   💰 Rp ${p.price.toLocaleString('id-ID')} ${affordable}\n`
            txt += `   📦 Stock: ${stock}\n`
            if (p.description) txt += `   📝 ${p.description.substring(0, 30)}${p.description.length > 30 ? '...' : ''}\n`
            txt += `\n`
        })
        
        txt += `━━━━━━━━━━━━━━━\n`
        txt += `> ✅ = Balance sufficient | ❌ = Balance insufficient\n`
        txt += `> Choose product below for buy`
        
        const productRows = products.map((p, i) => ({
            title: `${i + 1}. ${p.name}`,
            description: `Rp ${p.price.toLocaleString('id-ID')} | Stock: ${p.stockItems?.length || p.stock || 0}`,
            id: `${m.prefix}buyproduct ${i + 1}`
        }))
        
        const interactiveButtons = [
            {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '💳 ᴘɪʟɪʜ ᴘʀᴏᴅᴜᴋ',
                    sections: [{
                        title: 'ʙᴇʟɪ ᴅᴇɴɢᴀɴ sᴀʟᴅᴏ',
                        rows: productRows
                    }]
                })
            },
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    insplay_text: '💰 ᴄᴇᴋ sᴀʟᴅᴏ',
                    id: `${m.prefix}me`
                })
            }
        ]
        
        let thumbnail = null
        if (fs.existsSync(storeImage)) {
            thumbnail = fs.readFileSync(storeImage)
        }
        
        return sock.sendMessage(m.chat, {
            text: txt,
            contextInfo: thumbnail ? {
                externalAdReply: {
                    title: '💳 Buy with Balance',
                    body: `Balance: Rp ${userCoins.toLocaleString('id-ID')}`,
                    thumbnail,
                    contentType: 1,
                    renderLargerThumbnail: true
                }
            } : undefined,
            interactiveButtons
        }, { quoted: m })
    }
    
    const product = products[productIdx]
    const acelderlStock = product.stockItems?.length || product.stock || 0
    
    if (product.stock !== -1 && acelderlStock < qty) {
        return m.reply(`❌ Not enough stock!\n\n> Available: ${acelderlStock}`)
    }
    
    const total = product.price * qty
    
    if (userCoins < total) {
        return m.reply(
            `❌ *sᴀʟᴅᴏ ᴛɪᴅᴀᴋ ᴄᴜᴋᴜᴘ*\n\n` +
            `> Coins you: Rp ${userCoins.toLocaleString('id-ID')}\n` +
            `> Price: Rp ${total.toLocaleString('id-ID')}\n` +
            `> Low on: Rp ${(total - userCoins).toLocaleString('id-ID')}\n\n` +
            `> Kumpulkan Coins from game RPG!`
        )
    }
    
    const orderId = `BAL${Date.now().toString(36).toUpperCase()}`
    
    db.db.data.users[cleanJid].coins = userCoins - total
    
    if (product.stock !== -1) {
        products[productIdx].stock = (products[productIdx].stock || 0) - qty
    }
    
    let stockItemsToSend = []
    if (product.stockItems?.length > 0 && qty <= product.stockItems.length) {
        stockItemsToSend = product.stockItems.splice(0, qty)
        products[productIdx].stockItems = product.stockItems
    }
    
    groupData.storeConfig.products = products
    db.setGroup(m.chat, groupData)
    await db.save()
    
    const orderData = {
        orderId,
        groupId: m.chat,
        buyerJid: m.sender,
        buyerName: m.pushName || m.sender.split('@')[0],
        items: [{ 
            id: product.id,
            name: product.name, 
            qty, 
            price: product.price 
        }],
        total,
        status: 'completed',
        paymentMethod: 'balance',
        productDetail: product.detail || null,
        productImage: product.image || null,
        productDescription: product.description || null,
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString()
    }
    
    orderPoller.createOrder(orderId, orderData)
    
    let successTxt = `✅ *ᴘᴇᴍʙᴇʟɪᴀɴ ʙᴇʀʜᴀsɪʟ!*\n\n`
    successTxt += `> Order ID: \`${orderId}\`\n`
    successTxt += `> Pembuy: @${m.sender.split('@')[0]}\n`
    successTxt += `━━━━━━━━━━━━━━━\n\n`
    successTxt += `📦 *ɪᴛᴇᴍ:*\n`
    successTxt += `> ${product.name} x${qty}\n\n`
    successTxt += `💰 *ᴛᴏᴛᴀʟ:* Rp ${total.toLocaleString('id-ID')}\n`
    successTxt += `💳 *ᴍᴇᴛᴏᴅᴇ:* Balance Coins\n`
    successTxt += `💵 *sɪsᴀ sᴀʟᴅᴏ:* Rp ${(userCoins - total).toLocaleString('id-ID')}\n\n`
    successTxt += `━━━━━━━━━━━━━━━`
    
    await m.reply(successTxt, { mentions: [m.sender] })
    m.react('✅')
    
    if (product.detail || stockItemsToSend.length > 0) {
        let detailTxt = `📦 *ᴅᴇᴛᴀɪʟ ᴘʀᴏᴅᴜᴋ*\n\n`
        detailTxt += `> Order ID: \`${orderId}\`\n`
        detailTxt += `> Product: *${product.name}*\n\n`
        
        if (stockItemsToSend.length > 0) {
            detailTxt += `📋 *ᴅᴀᴛᴀ ᴀᴋᴜɴ:*\n`
            stockItemsToSend.forEach((item, idx) => {
                detailTxt += `\n*[${idx + 1}]*\n${item}\n`
            })
        } else if (product.detail) {
            detailTxt += `📋 *ɪɴꜰᴏ:*\n${product.detail}\n`
        }
        
        detailTxt += `\n━━━━━━━━━━━━━━━\n`
        detailTxt += `> Thank you has berbelanja! ❤️`
        
        try {
            await sock.sendMessage(m.sender, { text: detailTxt })
        } catch (e) {
            await m.reply(detailTxt)
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
