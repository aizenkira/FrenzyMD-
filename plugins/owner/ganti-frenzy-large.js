const fs = require('fs')
const path = require('path')
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'frenzy-large',
    alias: ['setfrenzylarge', 'gantifrenzylarge'],
    category: 'owner',
    description: 'Preset: Ganti image frenzy.jpg, serta frenzy-v7 up to frenzy-v11.jpg all at once',
    usage: '.frenzy-large (reply/send image)',
    example: '.frenzy-large',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
}

async function handler(m, { sock }) {
    const isImage = m.isImage || (m.quoted && m.quoted.type === 'imageMessage')
    
    if (!isImage) {
        return m.reply(`🖼️ *ᴏᴜʀɪɴ ʟᴀʀɢᴇ ᴘʀᴇsᴇᴛ*\n\n> Send/reply with an image to replace the large image set (frenzy.jpg, frenzy-v7.jpg to frenzy-v11.jpg) all at once.\n> Make sure the image ratio matches what you want.`)
    }
    
    await m.react('🕕')
    
    try {
        let buffer
        if (m.quoted && m.quoted.isMeina) {
            buffer = await m.quoted.download()
        } else if (m.isMeina) {
            buffer = await m.download()
        }
        
        if (!buffer) {
            await m.react('❌')
            return m.reply(`❌ Failed mendownload image`)
        }
        
        const targetImages = [
            'frenzy.jpg',
            'frenzy-v7.jpg',
            'frenzy-v8.jpg',
            'frenzy-v9.jpg',
            'frenzy-v10.jpg',
            'frenzy-v11.jpg'
        ]
        
        const assetsInr = path.join(process.cwd(), 'assets', 'images')
        if (!fs.existsSync(assetsInr)) {
            fs.mkdirSync(assetsInr, { recursive: true })
        }
        
        for (const imgName of targetImages) {
            const targetPath = path.join(assetsInr, imgName)
            fs.writeFileSync(targetPath, buffer)
        }
        
        await m.react('✅')
        m.reply(`✅ *ʙᴇʀʜᴀsɪʟ*\n\n> Image bundle *frenzy-large* success inganti seway massal.\n> MencIp: ${targetImages.join(', ')}\n> Restart bot if image no directly berchange.`)
        
    } catch (error) {
        await m.react('☢')
        m.reply(te(m.prefix, m.command, m.pushName))
    }
}

module.exports = {
    config: pluginConfig,
    handler
}
