const { getDatabase } = require('../../src/lib/frenzy-database')
const pakasir = require('../../src/lib/frenzy-pakasir')
const orderPoller = require('../../src/lib/frenzy-order-poller')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'simulatepay',
    alias: ['simpay', 'testpay', 'fatopay'],
    category: 'store',
    description: 'Simulasi payment (sandbox only)',
    usage: '.simulatepay <order_id>',
    example: '.simulatepay ORD20260111ABC123',
    isOwner: true,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const groupData = db.getGroup(m.chat) || {}
    
    if (groupData.botMode !== 'store') {
        return m.reply(`❌ Feature this only terseina in mode *STORE*!`)
    }
    
    const config = require('../../config')
    if (!config.pakasir?.sandbox) {
        return m.reply(`❌ Simulasi only terseina in *sandbox mode*!\n\n> Set \`sandbox: true\` in config.js`)
    }
    
    const orderId = m.text?.trim().toUpperCase()
    
    if (!orderId) {
        const peninngOrders = orderPoller.getOrdersByGroup(m.chat)
            .filter(o => o.status === 'pending')
            .slice(0, 5)
        
        if (peninngOrders.length === 0) {
            return m.reply(`❌ There are no pending orders to simulate!`)
        }
        
        let txt = `⚠️ *sɪᴍᴜʟᴀsɪ ᴘᴇᴍʙᴀʏᴀʀᴀɴ*\n\n`
        txt += `> Choose order for to simulate:\n\n`
        
        peninngOrders.forEach(order => {
            txt += `> \`${m.prefix}simulatepay ${order.orderId}\`\n`
            txt += `   💰 Rp ${order.total.toLocaleString('id-ID')}\n\n`
        })
        
        return m.reply(txt)
    }
    
    const order = orderPoller.getOrder(orderId)
    
    if (!order) {
        m.react('❌')
        return m.reply(`❌ Order not found: \`${orderId}\`\n\n> Check order ID in \`${m.prefix}myorder\``)
    }
    
    if (order.status !== 'pending') {
        m.react('❌')
        return m.reply(`❌ Order status: *${order.status}*\n\n> Only *pending* orders that can to simulate`)
    }
    
    await m.reply(`🕕 *ᴍᴇɴsɪᴍᴜʟᴀsɪ ᴘᴇᴍʙᴀʏᴀʀᴀɴ...*`)
    
    try {
        await pakasir.simulatePayment(orderId, order.total)
    } catch (e) {
        console.log('[SimulatePay] Pakasir simulation:', e.message)
    }
    
    const updated = orderPoller.updateOrder(orderId, {
        status: 'paid',
        completedAt: new Date().toISOString(),
        paymentMethod: order.paymentMethod || 'qris'
    })
    
    if (!updated) {
        m.react('❌')
        return m.reply(`❌ Failed update order: \`${orderId}\``)
    }
    
    const items = order.items?.map(it => `${it.name} x${it.qty}`).join(', ') || '-'
    
    m.react('✅')
    
    await sock.sendMessage(m.chat, {
        text: `✅ *ᴘᴇᴍʙᴀʏᴀʀᴀɴ ʙᴇʀʜᴀsɪʟ*\n\n` +
              `> Order ID: \`${orderId}\`\n` +
              `> Item: ${items}\n` +
              `> Total: *Rp ${order.total.toLocaleString('id-ID')}*\n` +
              `> Metode: *${order.paymentMethod?.toUpperCase() || 'QRIS'}*\n\n` +
              `@${order.buyerJid.split('@')[0]} detail product sent via chat pribain! 🎉`,
        mentions: [order.buyerJid]
    }, { quoted: m })
    
    let deliveredDetail = null
    
    if (order.items?.[0]?.id) {
        try {
            const currentGroupData = db.getGroup(order.groupId || m.chat)
            const product = currentGroupData?.storeConfig?.products?.find(p => p.id === order.items[0].id)
            
            if (product?.stockItems?.length > 0) {
                const stockItem = product.stockItems.shift()
                product.stock = product.stockItems.length
                db.setGroup(order.groupId || m.chat, currentGroupData)
                db.save()
                deliveredDetail = stockItem.detail
                console.log('[SimulatePay] Took stock item, remaining:', product.stockItems.length)
            }
        } catch (e) {
            console.error('[SimulatePay] Failed to get stock item:', e.message)
        }
    }
    
    const detailToSend = deliveredDetail || order.productDetail
    
    if (detailToSend) {
        try {
            let detailMsg = `🎁 *ᴅᴇᴛᴀɪʟ ᴘᴇsᴀɴᴀɴ*\n\n`
            detailMsg += `> Order ID: \`${orderId}\`\n`
            detailMsg += `> Item: ${items}\n`
            detailMsg += `━━━━━━━━━━━━━━━\n\n`
            if (order.productDescription) {
                detailMsg += `📝 *Description:*\n${order.productDescription}\n\n`
            }
            detailMsg += `🔐 *Detail Product:*\n${detailToSend}\n\n`
            detailMsg += `━━━━━━━━━━━━━━━\n`
            detailMsg += `> Thank you already berbelanja! 🙏`
            
            await sock.sendMessage(order.buyerJid, {
                text: detailMsg
            })
            
            console.log('[SimulatePay] Sent detail to:', order.buyerJid)
        } catch (e) {
            console.error('[SimulatePay] Failed to send detail:', e.message)
            m.reply(te(m.prefix, m.command, m.pushName))
        }
    } else {
        await m.reply(`⚠️ No there is stock items for product this!`)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
