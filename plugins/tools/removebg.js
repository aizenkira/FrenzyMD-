const { pixa } = require('../../src/scraper/removebackground');
const fs = require('fs');
const path = require('path');
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'removebg',
    alias: ['rmbg', 'nobg', 'deletebg'],
    category: 'tools',
    description: 'Mengdelete background image',
    usage: '.removebg (reply image)',
    example: '.removebg',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 10,
    energy: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    try {
        const isImage = m.isImage || (m.quoted && m.quoted.isImage);
        if (!isImage) {
            return await m.reply('❌ *ɢᴀᴍʙᴀʀ ᴅɪʙᴜᴛᴜʜᴋᴀɴ*\n\n> Reply or send image with caption .removebg');
        }
        
        await m.react('🕕')
        
        let contentBuffer;
        if (m.isImage && m.download) {
            contentBuffer = await m.download();
        } else if (m.quoted && m.quoted.isImage && m.quoted.download) {
            contentBuffer = await m.quoted.download();
        } else {
            return await m.reply('❌ Failed download image');
        }
        
        if (!contentBuffer || !Buffer.isBuffer(contentBuffer)) {
            return await m.reply('❌ Buffer image no valid');
        }
        const pathnya = path.join(process.cwd(), 'temp', `rmbg_${Date.now()}.jpg`);
        fs.writeFileSync(pathnya, contentBuffer);
        const result = await pixa(pathnya);
        
        await sock.sendMessage(m.chat, {
            image: result,
            caption: `✅ *ʙᴀᴄᴋɢʀᴏᴜɴᴅ ᴅɪʜᴀᴘᴜs*\n\n> Background image success deleted`
        }, { quoted: m });
        try {
            fs.unlinkSync(pathnya);
        } catch (e) {}
    } catch (error) {
        console.error('[RemoveBG Error]', error);
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
