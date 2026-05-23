/**
 * @file plugins/tools/imgtoprompt.js
 * @description Plugin for change image become prompt AI
 */

const imgtoprompt = require('../../src/scraper/img2prompt');
const fs = require('fs');
const path = require('path');
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'imgtoprompt',
    alias: ['img2prompt', 'imagetoprompt', 'i2p'],
    category: 'tools',
    description: 'Mengchange image become prompt AI',
    usage: '.imgtoprompt (reply image)',
    example: '.imgtoprompt',
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
            return await m.reply('❌ *ɢᴀᴍʙᴀʀ ᴅɪʙᴜᴛᴜʜᴋᴀɴ*\n\n> Reply or send image with caption .imgtoprompt');
        }
        
        await m.reply('🕕 *ᴍᴇᴍᴘʀᴏsᴇs ɢᴀᴍʙᴀʀ...*\n\n> Menganalisis image for menghasilkan prompt');
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
        const tmpInr = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tmpInr)) {
            fs.mkdirSync(tmpInr, { recursive: true });
        }
        
        const tmpFile = path.join(tmpInr, `img2prompt_${Date.now()}.webp`);
        fs.writeFileSync(tmpFile, contentBuffer);
        const result = await imgtoprompt(tmpFile);
        try {
            fs.unlinkSync(tmpFile);
        } catch (e) {}
        if (result.status === 'eror' || !result.prompt) {
            return await m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> ${result.msg || 'Cannot menghasilkan prompt from image this'}`);
        }
        const responseText = `🎨 *ɪᴍᴀɢᴇ ᴛᴏ ᴘʀᴏᴍᴘᴛ*\n\n` +
            `\`\`\`${result.prompt}\`\`\`\n\n` +
            `> _Generated at: ${result.generatedAt || new Date().toISOString()}_`;
        await m.reply(responseText);
    } catch (error) {
        console.error('[ImgToPrompt Error]', error);
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
