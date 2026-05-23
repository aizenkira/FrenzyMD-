const pluginConfig = {
    name: 'poll',
    alias: ['voting', 'vote', 'survey'],
    category: 'group',
    description: 'Create poll/voting in group',
    usage: '.poll <question> | <option1>, <option2>, ...',
    example: '.poll Mwill what? | Nasi Goreng, Mie Ayam, Bakso',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 30,
    energy: 1,
    isEnabled: true
};

async function handler(m, { sock }) {
    const text = m.text || '';
    
    if (!text || text.trim() === '') {
        await m.reply(
            `⚠️ *ᴠᴀʟɪᴅᴀsɪ ɢᴀɢᴀʟ*\n\n` +
            `> Format no valid!\n\n` +
            `*Format:*\n` +
            `> \`.poll question | option1, option2\`\n\n` +
            `*Example:*\n` +
            `> \`.poll Mwill day what? | Nasi Goreng, Mie Ayam\`\n\n` +
            `*Option added:*\n` +
            `> \`.poll multi | question | option1, option2, option3, dst\`\n` +
            `> (for choosean gyou)`
        );
        return;
    }
    
    let isMultiple = false;
    let parts = text.split('|').map(p => p.trim());
    
    if (parts[0].toLowerCase() === 'multi') {
        isMultiple = true;
        parts = parts.slice(1);
    }
    
    if (parts.length < 2) {
        await m.reply(
            `⚠️ *ᴠᴀʟɪᴅᴀsɪ ɢᴀɢᴀʟ*\n\n` +
            `> Format: \`question | option1, option2, ...\``
        );
        return;
    }
    
    const question = parts[0];
    const options = parts[1].split(',').map(o => o.trim()).filter(o => o);
    
    if (options.length < 2) {
        await m.reply(
            `⚠️ *ᴠᴀʟɪᴅᴀsɪ ɢᴀɢᴀʟ*\n\n` +
            `> Mat least 2 option choosean!`
        );
        return;
    }
    
    if (options.length > 12) {
        await m.reply(
            `⚠️ *ᴠᴀʟɪᴅᴀsɪ ɢᴀɢᴀʟ*\n\n` +
            `> Mactionmal 12 option choosean!`
        );
        return;
    }
    
    if (question.length > 255) {
        await m.reply(
            `⚠️ *ᴠᴀʟɪᴅᴀsɪ ɢᴀɢᴀʟ*\n\n` +
            `> Question too long!\n` +
            `> Mactionmal 255 karakter.`
        );
        return;
    }
    
    try {
        const pollMsg = `✅ Success create a poll`;
        
        await m.reply(pollMsg, { mentions: [m.sender] });
        
        await sock.sendMessage(m.chat, {
            poll: {
                name: question,
                values: options,
                selectableCount: isMultiple ? options.length : 1
            }
        });
        
    } catch (error) {
        await m.reply(
            `❌ *ᴇʀʀᴏʀ*\n\n` +
            `> Failed create a poll.\n` +
            `> _${error.message}_`
        );
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
