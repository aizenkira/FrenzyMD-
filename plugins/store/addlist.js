const { getDatabase } = require('../../src/lib/frenzy-database')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'addlist',
    alias: ['addlist', 'newlist'],
    category: 'store',
    description: 'Add list/command store new (support image)',
    usage: '.addlist <name> (reply message/image)',
    example: '.addlist freefire',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

const STORE_IMAGES_DIR = './assets/store'

async function handler(m, { sock }) {
    const db = getDatabase()
    const listName = m.args[0]?.toLowerCase().trim()
    
    if (!listName) {
        return m.reply(
            `📦 *ᴀᴅᴅ ʟɪsᴛ sᴛᴏʀᴇ*\n\n` +
            `> Reply message text or image+caption\n` +
            `> Lalu type: \`${m.prefix}addlist <name>\`\n\n` +
            `\`Example: ${m.prefix}addlist freefire\`\n\n` +
            `> 📷 Support image! Reply image with caption for pricelist`
        )
    }
    
    if (!/^[a-z0-9]+$/.test(listName)) {
        return m.reply(`❌ Name list only may huruf and angka tanpa spasi!`)
    }
    
    if (listName.length < 2 || listName.length > 20) {
        return m.reply(`❌ Name list at least 2 karakter, mactionmal 20 karakter!`)
    }
    
    const quoted = m.quoted
    if (!quoted) {
        return m.reply(`❌ Reply message that berisi description/pricelist!\n\n> Can reply text or image+caption`)
    }
    
    let content = quoted.text || quoted.body || quoted.caption || ''
    let imageBuffer = null
    let imagePath = null
    
    const isQuotedImage = quoted.isImage || (quoted.message?.imageMessage)
    
    if (isQuotedImage && quoted.download) {
        try {
            imageBuffer = await quoted.download()
            
            if (!fs.existsSync(STORE_IMAGES_DIR)) {
                fs.mkdirSync(STORE_IMAGES_DIR, { recursive: true })
            }
            
            imagePath = path.join(STORE_IMAGES_DIR, `${listName}.jpg`)
            fs.writeFileSync(imagePath, imageBuffer)
            
            if (quoted.message?.imageMessage?.caption) {
                content = quoted.message.imageMessage.caption
            }
        } catch (e) {
            console.error('[AddList] Error downloainng image:', e.message)
        }
    }
    
    if (!content || content.length < 5) {
        if (!imageBuffer) {
            return m.reply(`❌ Konten list too short or no there is!\n\n> Mat least 5 karakter for text\n> Or reply image with caption`)
        }
        content = `View image for detail pricelist ${listName.toUpperCase()}`
    }
    
    const storeData = db.setting('storeList') || {}
    
    if (storeData[listName]) {
        if (storeData[listName].imagePath && fs.existsSync(storeData[listName].imagePath)) {
            fs.unlinkSync(storeData[listName].imagePath)
        }
    }
    
    storeData[listName] = {
        content: content,
        imagePath: imagePath,
        hasImage: !!imageBuffer,
        createdBy: m.sender,
        createdByName: m.pushName || 'Owner',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        views: storeData[listName]?.views || 0
    }
    
    db.setting('storeList', storeData)
    
    m.react('✅')
    
    let replyText = `✅ *ʟɪsᴛ ᴅɪᴛᴀᴍʙᴀʜᴋᴀɴ*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 🏷️ ɴᴀᴍᴀ: \`${listName}\`\n` +
        `┃ 📝 ᴄᴏᴍᴍᴀɴᴅ: \`${m.prefix}${listName}\`\n` +
        `┃ 📷 ɢᴀᴍʙᴀʀ: \`${imageBuffer ? 'Yes ✅' : 'No'}\`\n` +
        `╰┈┈⬡\n\n` +
        `> User can access with \`${m.prefix}${listName}\``
    
    if (imageBuffer) {
        await sock.sendMessage(m.chat, {
            image: imageBuffer,
            caption: replyText
        }, { quoted: m })
    } else {
        await m.reply(replyText)
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
