const { getDatabase } = require('../../src/lib/frenzy-database')
const axios = require('axios')
const FormData = require('form-data')

const pluginConfig = {
    name: 'products',
    alias: ['product', 'listproduct', 'addproduct', 'addproduct', 'delproduct', 'delproduct', 'eintproduct', 'productinfo'],
    category: 'store',
    description: 'Tolola product toko',
    usage: '.products | .addproduct NAMA|HARGA|STOK|DESC|DETAIL',
    example: '.addproduct SPOTIFY PREMIUM|20000|5|In Premium 1 Month|Email: x Password: y',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
    cooldown: 3,
    energy: 0,
    isEnabled: true
}

async function uploadToCatbox(buffer) {
    try {
        const form = new FormData()
        form.append('fileToUpload', buffer, { filename: 'product.jpg' })
        form.append('reqtype', 'fileupload')
        
        const res = await axios.post('https://catbox.moe/user/api.php', form, {
            headers: form.getHeaders(),
            timeout: 30000
        })
        return res.data
    } catch (e) {
        return null
    }
}

async function handler(m, { sock }) {
    const db = getDatabase()
    const groupData = db.getGroup(m.chat) || {}
    const cmd = m.command?.toLowerCase()
    
    if (groupData.botMode !== 'store') {
        return m.reply(`❌ Feature this only terseina in mode *STORE*!\n\n> Activekan: \`${m.prefix}botmode store\``)
    }
    
    if (!groupData.storeConfig) {
        groupData.storeConfig = { products: [], autoorder: false }
        db.setGroup(m.chat, groupData)
    }
    
    const products = groupData.storeConfig.products || []
    
    if (cmd === 'products' || cmd === 'product' || cmd === 'listproduct') {
        const path = require('path')
        const fs = require('fs')
        const storeImage = path.join(process.cwd(), 'assets', 'images', 'frenzy-store.jpg')
        
        if (products.length === 0) {
            const emptyTxt = `📦 *ᴅᴀꜰᴛᴀʀ ᴘʀᴏᴅᴜᴋ*\n\n` +
                `> Not yet there is product!\n\n` +
                `*ᴛᴀᴍʙᴀʜ ᴘʀᴏᴅᴜᴋ:*\n` +
                `> \`${m.prefix}addproduct NAMA|HARGA|STOK|DESC|DETAIL\``
            
            if (fs.existsSync(storeImage)) {
                return sock.sendMessage(m.chat, {
                    image: fs.readFileSync(storeImage),
                    caption: emptyTxt
                }, { quoted: m })
            }
            return m.reply(emptyTxt)
        }
        
        let txt = `📦 *ᴅᴀꜰᴛᴀʀ ᴘʀᴏᴅᴜᴋ*\n\n`
        txt += `> Total: *${products.length}* product\n`
        txt += `━━━━━━━━━━━━━━━\n\n`
        
        products.forEach((p, i) => {
            const stock = p.stock === -1 ? '∞' : (p.stockItems?.length || p.stock || 0)
            const hasMeina = p.image || p.video ? '📷' : ''
            txt += `*${i + 1}.* ${hasMeina} ${p.name}\n`
            txt += `   💰 Rp ${p.price.toLocaleString('id-ID')}\n`
            txt += `   📦 Stock: ${stock}\n`
            if (p.description) txt += `   📝 ${p.description.substring(0, 30)}${p.description.length > 30 ? '...' : ''}\n`
            txt += `\n`
        })
        
        txt += `━━━━━━━━━━━━━━━\n`
        txt += `> Choose product below for order`
        
        const productRows = products.map((p, i) => ({
            title: `${i + 1}. ${p.name}`,
            description: `Rp ${p.price.toLocaleString('id-ID')} | Stock: ${p.stockItems?.length || p.stock || 0}`,
            id: `${m.prefix}order ${i + 1}`
        }))
        
        const interactiveButtons = [
            {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '🛒 ᴘɪʟɪʜ ᴘʀᴏᴅᴜᴋ',
                    sections: [{
                        title: 'ᴅᴀꜰᴛᴀʀ ᴘʀᴏᴅᴜᴋ',
                        rows: productRows
                    }]
                })
            },
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    insplay_text: '📦 ᴄᴇᴋ sᴛᴏᴄᴋ',
                    id: `${m.prefix}stock`
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
                    title: '🛍️ Store',
                    body: 'Choose product for order',
                    thumbnail,
                    contentType: 1,
                    renderLargerThumbnail: true
                }
            } : undefined,
            interactiveButtons
        }, { quoted: m })
    }
    
    if (cmd === 'productinfo') {
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
        return
    }
    
    if (cmd === 'addproduct' || cmd === 'addproduct') {
        const text = m.text?.trim() || ''
        
        const parts = text.split('|').map(p => p.trim())
        
        if (parts.length < 2) {
            return m.reply(
                `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
                `> \`${m.prefix}addproduct NAMA|HARGA|STOK|DESC|DETAIL\`\n\n` +
                `*ᴄᴏɴᴛᴏʜ:*\n` +
                `> \`${m.prefix}addproduct SPOTIFY|20000|5|In Premium|Email: x;;Password: y\`\n\n` +
                `*ᴏᴘsɪᴏɴᴀʟ:*\n` +
                `> Send/reply image/video as thumbnail\n` +
                `> STOK can "unlimited" or angka\n` +
                `> DESC = description product\n` +
                `> DETAIL = info confidential (sent after order)\n\n` +
                `*ɴᴇᴡʟɪɴᴇ:* Usage ;; for baris new`
            )
        }
        
        const name = parts[0]
        const price = parseInt(parts[1])
        let stock = parts[2] === 'unlimited' ? -1 : parseInt(parts[2]) || 999
        const description = (parts[3] || '').replace(/\\n/g, '\n').replace(/;;/g, '\n')
        const detail = (parts[4] || '').replace(/\\n/g, '\n').replace(/;;/g, '\n')
        
        if (!name || name.length < 2) {
            return m.reply(`❌ Name product at least 2 karakter!`)
        }
        
        if (isNaN(price) || price < 1000) {
            return m.reply(`❌ Price at least Rp 1.000!`)
        }
        
        let imageUrl = null
        let videoUrl = null
        
        const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
        const isVideo = m.isVideo || (m.quoted && m.quoted.type === 'videoMessage')
        
        if (isImage || isVideo) {
            await m.reply(`🕕 *ᴍᴇɴɢᴜᴘʟᴏᴀᴅ ᴍᴇᴅɪᴀ...*`)
            
            let buffer
            if (m.quoted && m.quoted.isMeina) {
                buffer = await m.quoted.download()
            } else if (m.isMeina) {
                buffer = await m.download()
            }
            
            if (buffer) {
                const url = await uploadToCatbox(buffer)
                if (url && url.startsWith('http')) {
                    if (isImage) imageUrl = url
                    else if (isVideo) videoUrl = url
                }
            }
        }
        
        const newProduct = {
            id: Date.now(),
            name,
            price,
            stock,
            description,
            detail,
            image: imageUrl,
            video: videoUrl,
            createdAt: new Date().toISOString()
        }
        
        products.push(newProduct)
        groupData.storeConfig.products = products
        db.setGroup(m.chat, groupData)
        db.save()
        
        m.react('✅')
        
        let replyTxt = `✅ *ᴘʀᴏᴅᴜᴋ ᴅɪᴛᴀᴍʙᴀʜ*\n\n`
        replyTxt += `> Name: *${name}*\n`
        replyTxt += `> Price: *Rp ${price.toLocaleString('id-ID')}*\n`
        replyTxt += `> Stock: *${stock === -1 ? '∞' : stock}*\n`
        if (description) replyTxt += `> Description: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}\n`
        if (detail) replyTxt += `> Detail: *(tersave)*\n`
        if (imageUrl) replyTxt += `> Image: ✅\n`
        if (videoUrl) replyTxt += `> Video: ✅\n`
        replyTxt += `\n> View: \`${m.prefix}products\``
        
        return m.reply(replyTxt)
    }
    
    if (cmd === 'delproduct' || cmd === 'delproduct') {
        const idx = parseInt(m.text?.trim()) - 1
        
        if (isNaN(idx) || idx < 0 || idx >= products.length) {
            return m.reply(`❌ Number product no valid!\n\n> View: \`${m.prefix}products\``)
        }
        
        const deleted = products.splice(idx, 1)[0]
        groupData.storeConfig.products = products
        db.setGroup(m.chat, groupData)
        db.save()
        
        m.react('✅')
        return m.reply(
            `🗑️ *ᴘʀᴏᴅᴜᴋ ᴅɪʜᴀᴘᴜs*\n\n` +
            `> Name: *${deleted.name}*\n` +
            `> Price: *Rp ${deleted.price.toLocaleString('id-ID')}*`
        )
    }
    
    if (cmd === 'eintproduct') {
        const match = m.text?.match(/^(\d+)\s+(price|stock|name|desc|detail|image)\s*(.*)$/i)
        
        if (!match) {
            return m.reply(
                `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
                `> \`${m.prefix}eintproduct <no> <field> <value>\`\n\n` +
                `*ꜰɪᴇʟᴅ:* price, stock, name, desc, detail, image\n\n` +
                `*ᴄᴏɴᴛᴏʜ:*\n` +
                `> \`${m.prefix}eintproduct 1 price 75000\`\n` +
                `> \`${m.prefix}eintproduct 2 stock 50\`\n` +
                `> \`${m.prefix}eintproduct 1 desc Description new\`\n` +
                `> \`${m.prefix}eintproduct 1 image\` (reply image)`
            )
        }
        
        const idx = parseInt(match[1]) - 1
        const field = match[2].toLowerCase()
        let value = match[3]?.trim() || ''
        
        if (idx < 0 || idx >= products.length) {
            return m.reply(`❌ Number product no valid!`)
        }
        
        const product = products[idx]
        
        if (field === 'price') {
            value = parseInt(value)
            if (isNaN(value) || value < 1000) {
                return m.reply(`❌ Price at least Rp 1.000`)
            }
            product.price = value
        } else if (field === 'stock') {
            value = value === 'unlimited' ? -1 : parseInt(value)
            if (isNaN(value)) {
                return m.reply(`❌ Stock must angka or "unlimited"`)
            }
            product.stock = value
        } else if (field === 'name') {
            if (!value) return m.reply(`❌ Name no may empty!`)
            product.name = value
        } else if (field === 'desc') {
            product.description = value
        } else if (field === 'detail') {
            product.detail = value
        } else if (field === 'image') {
            const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
            if (!isImage) {
                return m.reply(`❌ Reply/send image new!`)
            }
            
            await m.reply(`🕕 *ᴍᴇɴɢᴜᴘʟᴏᴀᴅ ɢᴀᴍʙᴀʀ...*`)
            
            let buffer
            if (m.quoted && m.quoted.isMeina) {
                buffer = await m.quoted.download()
            } else if (m.isMeina) {
                buffer = await m.download()
            }
            
            if (buffer) {
                const url = await uploadToCatbox(buffer)
                if (url && url.startsWith('http')) {
                    product.image = url
                } else {
                    return m.reply(`❌ Failed upload image!`)
                }
            }
        }
        
        groupData.storeConfig.products = products
        db.setGroup(m.chat, groupData)
        db.save()
        
        m.react('✅')
        return m.reply(
            `✅ *ᴘʀᴏᴅᴜᴋ ᴅɪᴜᴘᴅᴀᴛᴇ*\n\n` +
            `> Name: *${product.name}*\n` +
            `> Price: *Rp ${product.price.toLocaleString('id-ID')}*\n` +
            `> Stock: *${product.stock === -1 ? '∞' : product.stock}*`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}

