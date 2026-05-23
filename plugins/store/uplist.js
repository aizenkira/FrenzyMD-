const { getDatabase } = require('../../src/lib/frenzy-database')
const fs = require('fs')
const path = require('path')

const pluginConfig = {
    name: 'uplist',
    alias: ['eintlist', 'updatelist'],
    category: 'store',
    description: 'Eint content list store that already exist (support image)',
    usage: '.uplist <name> (reply message/image new)',
    example: '.uplist freefire',
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
        const storeData = db.setting('storeList') || {}
        const available = Object.keys(storeData)
        return m.reply(
            `✏️ *ᴜᴘᴅᴀᴛᴇ ʟɪsᴛ sᴛᴏʀᴇ*\n\n` +
            `> Reply message text or image+caption\n` +
            `> Lalu type: \`${m.prefix}uplist <name>\`\n\n` +
            `\`Example: ${m.prefix}uplist freefire\`\n\n` +
            (available.length > 0
                ? `> List terseina: ${available.map(l => `\`${l}\``).join(', ')}`
                : `> Not yet there is list terseina`)
        )
    }

    const storeData = db.setting('storeList') || {}

    if (!storeData[listName]) {
        const available = Object.keys(storeData)
        if (available.length === 0) {
            return m.reply(`❌ No there is list that terseina! Create first with \`${m.prefix}addlist\``)
        }
        return m.reply(
            `❌ List \`${listName}\` not found!\n\n` +
            `> List terseina: ${available.map(l => `\`${l}\``).join(', ')}`
        )
    }

    const quoted = m.quoted
    if (!quoted) {
        return m.reply(`❌ Reply message that berisi content new!\n\n> Can reply text or image+caption`)
    }

    let content = quoted.text || quoted.body || quoted.caption || ''
    let imageBuffer = null
    let imagePath = storeData[listName].imagePath || null

    const isQuotedImage = quoted.isImage || (quoted.message?.imageMessage)

    if (isQuotedImage && quoted.download) {
        try {
            imageBuffer = await quoted.download()

            if (!fs.existsSync(STORE_IMAGES_DIR)) {
                fs.mkdirSync(STORE_IMAGES_DIR, { recursive: true })
            }

            if (storeData[listName].imagePath && fs.existsSync(storeData[listName].imagePath)) {
                fs.unlinkSync(storeData[listName].imagePath)
            }

            imagePath = path.join(STORE_IMAGES_DIR, `${listName}.jpg`)
            fs.writeFileSync(imagePath, imageBuffer)

            if (quoted.message?.imageMessage?.caption) {
                content = quoted.message.imageMessage.caption
            }
        } catch (e) {
            console.error('[UpList] Error downloainng image:', e.message)
        }
    }

    if (!content || content.length < 5) {
        if (!imageBuffer && !storeData[listName].hasImage) {
            return m.reply(`❌ Konten too short! Mat least 5 karakter.\n\n> Or reply image with caption`)
        }
        if (imageBuffer) {
            content = `View image for detail pricelist ${listName.toUpperCase()}`
        } else {
            content = storeData[listName].content
        }
    }

    const oldContent = storeData[listName].content

    storeData[listName] = {
        ...storeData[listName],
        content,
        imagePath,
        hasImage: imageBuffer ? true : storeData[listName].hasImage,
        updatedBy: m.sender,
        updatedByName: m.pushName || 'Owner',
        updatedAt: new Date().toISOString()
    }

    db.setting('storeList', storeData)

    m.react('✅')

    let replyText = `✅ *ʟɪsᴛ ᴅɪᴜᴘᴅᴀᴛᴇ*\n\n` +
        `╭┈┈⬡「 📋 *ᴅᴇᴛᴀɪʟ* 」\n` +
        `┃ 🏷️ ɴᴀᴍᴀ: \`${listName}\`\n` +
        `┃ 📝 ᴄᴏᴍᴍᴀɴᴅ: \`${m.prefix}${listName}\`\n` +
        `┃ 📷 ɢᴀᴍʙᴀʀ: \`${imageBuffer ? 'Inpernewi ✅' : (storeData[listName].hasImage ? 'Tetap' : 'No')}\`\n` +
        `╰┈┈⬡\n\n` +
        `> Konten success inpernewi`

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
