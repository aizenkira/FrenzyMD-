const { getDatabase } = require('../../src/lib/frenzy-database')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'importstock',
    alias: ['imstock', 'stockimport'],
    category: 'store',
    description: 'Import stock items from file .txt',
    usage: '.importstock <no_product> (reply file .txt)',
    example: '.importstock 1',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    isAdmin: true,
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
        return m.reply(`❌ Not yet there is product!\n\n> Add first: \`${m.prefix}addproduct\``)
    }
    
    const productNo = parseInt(m.text?.trim()) - 1
    
    if (isNaN(productNo) || productNo < 0 || productNo >= products.length) {
        let txt = `⚠️ *ɪᴍᴘᴏʀᴛ sᴛᴏᴄᴋ*\n\n`
        txt += `> \`${m.prefix}importstock <no_product>\`\n`
        txt += `> Reply file with .txt format:\n\n`
        txt += `\`\`\`\n`
        txt += `Email: user1@mail.com;;Password: pass1\n`
        txt += `Email: user2@mail.com;;Password: pass2\n`
        txt += `...\n`
        txt += `\`\`\`\n\n`
        txt += `> Every baris = 1 stock item\n`
        txt += `> Usage ;; for newline in item\n\n`
        txt += `*ᴘʀᴏᴅᴜᴋ:*\n`
        products.forEach((p, i) => {
            txt += `> *${i + 1}.* ${p.name} (${p.stockItems?.length || 0} items)\n`
        })
        return m.reply(txt)
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

module.exports = {
    config: pluginConfig,
    handler
}
