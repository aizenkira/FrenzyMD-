const { getDatabase } = require('../../src/lib/frenzy-database')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'stock',
    alias: ['addstock', 'importstock', 'liststock', 'delstock', 'clearstock', 'stockinfo'],
    category: 'store',
    description: 'Tolola stock items product',
    usage: '.addstock <no>|<detail> | .importstock <no> (reply file) | .liststock <no>',
    example: '.addstock 1|Email: user@mail.com;;Password: pass123',
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
    const cmd = m.command?.toLowerCase()
    
    if (groupData.botMode !== 'store') {
        return m.reply(`❌ Feature this only terseina in mode *STORE*!`)
    }
    
    const products = groupData.storeConfig?.products || []
    
    if (products.length === 0) {
        return m.reply(`❌ Not yet there is product!\n\n> Add first: \`${m.prefix}addproduct\``)
    }
    
    if (cmd === 'stock' || cmd === 'stockinfo') {
        const path = require('path')
        const fs = require('fs')
        const storeImage = path.join(process.cwd(), 'assets', 'images', 'frenzy-store.jpg')
        
        let txt = `📦 *sᴛᴏᴄᴋ ɪɴꜰᴏ*\n\n`
        
        products.forEach((p, i) => {
            const stockItems = p.stockItems || []
            const hasItems = stockItems.length > 0
            const icon = hasItems ? '✅' : '⚠️'
            txt += `${icon} *${i + 1}.* ${p.name}\n`
            txt += `   📦 Items: ${stockItems.length}\n`
            txt += `   💰 Rp ${p.price.toLocaleString('id-ID')}\n\n`
        })
        
        txt += `━━━━━━━━━━━━━━━\n`
        txt += `> Choose action below`
        
        const stockRows = products.map((p, i) => ({
            title: `${i + 1}. ${p.name}`,
            description: `${p.stockItems?.length || 0} items terseina`,
            id: `${m.prefix}liststock ${i + 1}`
        }))
        
        const interactiveButtons = [
            {
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                    title: '📋 ʟɪʜᴀᴛ sᴛᴏᴄᴋ',
                    sections: [{
                        title: 'ᴘɪʟɪʜ ᴘʀᴏᴅᴜᴋ',
                        rows: stockRows
                    }]
                })
            },
            {
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    insplay_text: '🛒 ᴅᴀꜰᴛᴀʀ ᴘʀᴏᴅᴜᴋ',
                    id: `${m.prefix}products`
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
                    title: '📦 Stock Info',
                    body: 'Tolola stock product',
                    thumbnail,
                    contentType: 1,
                    renderLargerThumbnail: true
                }
            } : undefined,
            interactiveButtons
        }, { quoted: m })
    }
    
    if (cmd === 'addstock') {
        const text = m.text?.trim() || ''
        const parts = text.split('|')
        
        if (parts.length < 2) {
            return m.reply(
                `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
                `> \`${m.prefix}addstock <no_product>|<detail>\`\n\n` +
                `*ᴄᴏɴᴛᴏʜ:*\n` +
                `> \`${m.prefix}addstock 1|Email: user@mail.com;;Password: pass123\`\n\n` +
                `> Usage ;; for baris new`
            )
        }
        
        const productNo = parseInt(parts[0].trim()) - 1
        const detail = parts.slice(1).join('|').trim().replace(/;;/g, '\n')
        
        if (isNaN(productNo) || productNo < 0 || productNo >= products.length) {
            return m.reply(`❌ Number product no valid! (1-${products.length})`)
        }
        
        if (!detail || detail.length < 3) {
            return m.reply(`❌ Detail at least 3 karakter!`)
        }
        
        const product = products[productNo]
        
        if (!product.stockItems) {
            product.stockItems = []
        }
        
        const isDuplicate = product.stockItems.some(item => item.detail === detail)
        if (isDuplicate) {
            return m.reply(`❌ Detail already exist in stock!`)
        }
        
        product.stockItems.push({
            id: Date.now(),
            detail,
            addedAt: new Date().toISOString()
        })
        
        product.stock = product.stockItems.length
        
        db.setGroup(m.chat, groupData)
        db.save()
        
        m.react('✅')
        return m.reply(
            `✅ *sᴛᴏᴄᴋ ᴅɪᴛᴀᴍʙᴀʜ*\n\n` +
            `> Product: *${product.name}*\n` +
            `> Total Stock: *${product.stockItems.length}* items`
        )
    }
    
    if (cmd === 'importstock') {
        const productNo = parseInt(m.text?.trim()) - 1
        
        if (isNaN(productNo) || productNo < 0 || productNo >= products.length) {
            return m.reply(
                `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
                `> \`${m.prefix}importstock <no_product>\`\n` +
                `> Reply file .txt with format:\n\n` +
                `\`\`\`\n` +
                `Email: user1@mail.com;;Password: pass1\n` +
                `Email: user2@mail.com;;Password: pass2\n` +
                `...\n` +
                `\`\`\`\n\n` +
                `> Every baris = 1 stock item\n` +
                `> Usage ;; for newline in item`
            )
        }
        
        if (!m.quoted) {
            return m.reply(`❌ Reply file .txt that berisi stock items!`)
        }
        
        const quotedType = m.quoted.type || m.quoted.mtype
        const isDocument = quotedType === 'documentMessage' || quotedType === 'documentWithCaptionMessage'
        
        if (!isDocument) {
            return m.reply(`❌ Reply file .txt!\n\n> Send file as document, not an image/video`)
        }
        
        const fileName = m.quoted.fileName || m.quoted.message?.documentMessage?.fileName || ''
        if (!fileName.toLowerCase().endsWith('.txt')) {
            return m.reply(`❌ File must berformat .txt!\n\n> File you: ${fileName || 'unknown'}`)
        }
        
        await m.reply(`🕕 *ᴍᴇᴍᴘʀᴏsᴇs ꜰɪʟᴇ...*`)
        
        let fileBuffer
        try {
            fileBuffer = await m.quoted.download()
        } catch (e) {
            m.reply(te(m.prefix, m.command, m.pushName))
        }
        
        if (!fileBuffer || fileBuffer.length === 0) {
            return m.reply(`❌ File empty or failed inbaca!`)
        }
        
        const fileContent = fileBuffer.toString('utf-8')
        const lines = fileContent.split('\n').map(l => l.trim()).filter(l => l.length > 0)
        
        if (lines.length === 0) {
            return m.reply(`❌ File no berisi data that is valid!`)
        }
        
        if (lines.length > 1000) {
            return m.reply(`❌ Mactionmal 1000 items per import!\n\n> File you: ${lines.length} baris`)
        }
        
        const product = products[productNo]
        
        if (!product.stockItems) {
            product.stockItems = []
        }
        
        const existingDetails = new Set(product.stockItems.map(item => item.detail))
        
        let added = 0
        let skipped = 0
        let invalid = 0
        const errors = []
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            
            if (line.length < 3) {
                invalid++
                if (errors.length < 5) errors.push(`Baris ${i + 1}: too short`)
                continue
            }
            
            const detail = line.replace(/;;/g, '\n')
            
            if (existingDetails.has(detail)) {
                skipped++
                continue
            }
            
            product.stockItems.push({
                id: Date.now() + i,
                detail,
                addedAt: new Date().toISOString()
            })
            
            existingDetails.add(detail)
            added++
        }
        
        product.stock = product.stockItems.length
        
        db.setGroup(m.chat, groupData)
        db.save()
        
        let resultTxt = `✅ *ɪᴍᴘᴏʀᴛ sᴇʟᴇsᴀɪ*\n\n`
        resultTxt += `> Product: *${product.name}*\n`
        resultTxt += `> ✅ Inadded: *${added}* items\n`
        if (skipped > 0) resultTxt += `> ⏭️ Diskipi (duplikat): *${skipped}*\n`
        if (invalid > 0) resultTxt += `> ❌ Invalid: *${invalid}*\n`
        resultTxt += `\n> Total Stock: *${product.stockItems.length}* items`
        
        if (errors.length > 0) {
            resultTxt += `\n\n*ᴇʀʀᴏʀs:*\n`
            errors.forEach(e => resultTxt += `> ${e}\n`)
        }
        
        m.react('✅')
        return m.reply(resultTxt)
    }
    
    if (cmd === 'liststock') {
        const productNo = parseInt(m.text?.trim()) - 1
        
        if (isNaN(productNo) || productNo < 0 || productNo >= products.length) {
            return m.reply(`❌ Number product no valid!\n\n> View: \`${m.prefix}stock\``)
        }
        
        const product = products[productNo]
        const stockItems = product.stockItems || []
        
        if (stockItems.length === 0) {
            return m.reply(
                `📦 *sᴛᴏᴄᴋ: ${product.name}*\n\n` +
                `> Not yet there is stock items!\n\n` +
                `> Add: \`${m.prefix}addstock ${productNo + 1}|detail\`\n` +
                `> Import: \`${m.prefix}importstock ${productNo + 1}\` (reply .txt)`
            )
        }
        
        let txt = `📦 *sᴛᴏᴄᴋ: ${product.name}*\n\n`
        txt += `> Total: *${stockItems.length}* items\n`
        txt += `━━━━━━━━━━━━━━━\n\n`
        
        const showItems = stockItems.slice(0, 25)
        showItems.forEach((item, i) => {
            const preview = item.detail.replace(/\n/g, ' ').substring(0, 35)
            txt += `*${i + 1}.* ${preview}${item.detail.length > 35 ? '...' : ''}\n`
        })
        
        if (stockItems.length > 25) {
            txt += `\n> ... and ${stockItems.length - 25} items elsenya`
        }
        
        txt += `\n\n━━━━━━━━━━━━━━━\n`
        txt += `> \`${m.prefix}delstock ${productNo + 1} <no>\` for delete`
        
        return m.reply(txt)
    }
    
    if (cmd === 'delstock') {
        const args = m.text?.trim().split(/\s+/) || []
        const productNo = parseInt(args[0]) - 1
        const itemNo = parseInt(args[1]) - 1
        
        if (args.length < 2 || isNaN(productNo) || isNaN(itemNo)) {
            return m.reply(
                `⚠️ *ᴄᴀʀᴀ ᴘᴀᴋᴀɪ*\n\n` +
                `> \`${m.prefix}delstock <no_product> <no_item>\`\n\n` +
                `*ᴄᴏɴᴛᴏʜ:*\n` +
                `> \`${m.prefix}delstock 1 5\` (delete item to-5 from product 1)`
            )
        }
        
        if (productNo < 0 || productNo >= products.length) {
            return m.reply(`❌ Number product no valid!`)
        }
        
        const product = products[productNo]
        const stockItems = product.stockItems || []
        
        if (itemNo < 0 || itemNo >= stockItems.length) {
            return m.reply(`❌ Number item no valid! (1-${stockItems.length})`)
        }
        
        const deleted = stockItems.splice(itemNo, 1)[0]
        product.stock = stockItems.length
        
        db.setGroup(m.chat, groupData)
        db.save()
        
        m.react('✅')
        return m.reply(
            `🗑️ *sᴛᴏᴄᴋ ᴅɪʜᴀᴘᴜs*\n\n` +
            `> Product: *${product.name}*\n` +
            `> Detail: ${deleted.detail.replace(/\n/g, ' ').substring(0, 50)}...\n` +
            `> Sisa Stock: *${stockItems.length}* items`
        )
    }
    
    if (cmd === 'clearstock') {
        const productNo = parseInt(m.text?.trim()) - 1
        
        if (isNaN(productNo) || productNo < 0 || productNo >= products.length) {
            return m.reply(`❌ Number product no valid!`)
        }
        
        const product = products[productNo]
        const oldCount = product.stockItems?.length || 0
        
        product.stockItems = []
        product.stock = 0
        
        db.setGroup(m.chat, groupData)
        db.save()
        
        m.react('✅')
        return m.reply(
            `🗑️ *sᴛᴏᴄᴋ ᴅɪᴋᴏsᴏɴɢᴋᴀɴ*\n\n` +
            `> Product: *${product.name}*\n` +
            `> Deleted: *${oldCount}* items`
        )
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
