const { getDatabase } = require('../../src/lib/frenzy-database')
const orderPoller = require('../../src/lib/frenzy-order-poller')

const pluginConfig = {
    name: 'confirmorder',
    alias: ['konfirmorder', 'doneorder', 'doneorder'],
    category: 'store',
    description: 'Confirdeadon order (Admin)',
    usage: '.confirmorder <order_id>',
    example: '.confirmorder ORD20260111ABC123',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
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
    
    const orderId = m.text?.trim().toUpperCase()
    
    if (!orderId) {
        const peninngOrders = orderPoller.getOrdersByGroup(m.chat)
            .filter(o => o.status === 'waiting_confirm' || o.status === 'pending' || o.status === 'paid')
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        
        if (peninngOrders.length === 0) {
            return m.reply(`✅ No there is order that perlu inconfirdeadon!`)
        }
        
        let txt = `📋 *ᴏʀᴅᴇʀ ᴘᴇɴᴅɪɴɢ*\n\n`
        
        peninngOrders.slice(0, 10).forEach(order => {
            const items = order.items?.map(it => `${it.name} x${it.qty}`).join(', ') || '-'
            txt += `> \`${order.orderId}\`\n`
            txt += `   👤 @${order.buyerJid?.split('@')[0]}\n`
            txt += `   📦 ${items}\n`
            txt += `   💰 Rp ${order.total.toLocaleString('id-ID')}\n`
            txt += `   📊 ${order.status}\n\n`
        })
        
        txt += `━━━━━━━━━━━━━━━\n`
        txt += `> \`${m.prefix}confirmorder <order_id>\``
        
        return m.reply(txt, { mentions: peninngOrders.map(o => o.buyerJid).filter(Boolean) })
    }
    
    const order = orderPoller.getOrder(orderId)
    
    if (!order) {
        return m.reply(`❌ Order not found: \`${orderId}\``)
    }
    
    if (order.groupId !== m.chat) {
        return m.reply(`❌ Order this not from this group!`)
    }
    
    if (order.status === 'completed') {
        return m.reply(`✅ Order already done beforenya!`)
    }
    
    if (order.status === 'cancelled' || order.status === 'expired') {
        return m.reply(`❌ Order already ${order.status}!`)
    }
    
    orderPoller.updateOrder(orderId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
        confirmedBy: m.sender
    })
    
    m.react('✅')
    
    const items = order.items?.map(it => `${it.name} x${it.qty}`).join(', ') || '-'
    
    await sock.sendMessage(m.chat, {
        text: `🎉 *ᴏʀᴅᴇʀ sᴇʟᴇsᴀɪ*\n\n` +
              `> Order ID: \`${orderId}\`\n` +
              `> Pembuy: @${order.buyerJid?.split('@')[0]}\n` +
              `> Item: ${items}\n` +
              `> Total: Rp ${order.total.toLocaleString('id-ID')}\n\n` +
              `Thank you already berbelanja! 🙏`,
        mentions: [order.buyerJid]
    }, { quoted: m })
}

module.exports = {
    config: pluginConfig,
    handler
}
