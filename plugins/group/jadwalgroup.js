const { getDatabase } = require('../../src/lib/frenzy-database');

const pluginConfig = {
    name: 'schedulegroup',
    alias: ['schedulegroup', 'jdwlgroup', 'autoopenclose'],
    category: 'group',
    description: 'Schedule buka/close the group otodeads',
    usage: '.schedulegroup <open/close> <HH:MM>',
    example: '.schedulegroup open 06:00',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true,
    isAdmin: true,
    isBotAdmin: true
};

function parseTime(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    
    const cleaned = timeStr.trim().replace(/\s+/g, '');
    const match = cleaned.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    
    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
    
    return { hours, minutes };
}

function formatTime(hours, minutes) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

async function handler(m, { sock, db }) {
    const args = m.args || []
    const action = args[0]?.toLowerCase();
    
    let time = args[1];
    if (args.length >= 4 && args[2] === ':') {
        time = `${args[1]}:${args[3]}`;
    } else if (args.length >= 2) {
        time = args.slice(1).join('').replace(/\s+/g, '');
    }
    
    if (!action) {
        const group = db.getGroup(m.chat) || {};
        const openTime = group.scheduleOpen || null;
        const closeTime = group.scheduleClose || null;
        
        let scheduleInfo = `⏰ *ᴊᴀᴅᴡᴀʟ ɢʀᴜᴘ*

「 📋 *sᴛᴀᴛᴜs* 」
🔓 ᴏᴘᴇɴ: *${openTime || 'No active'}*
🔒 ᴄʟᴏsᴇ: *${closeTime || 'No active'}*

*Cara Usage:*
\`.schedulegroup open 06:00\`
\`.schedulegroup close 22:00\`
\`.schedulegroup delete open\`
\`.schedulegroup delete close\``;
        
        await m.reply(scheduleInfo);
        return;
    }
    
    if (action === 'delete' || action === 'delete' || action === 'remove') {
        const type = args[1]?.toLowerCase();
        
        if (type !== 'open' && type !== 'close') {
            await m.reply(
                `⚠️ *ᴠᴀʟɪᴅᴀsɪ ɢᴀɢᴀʟ*\n\n` +
                `> Usage: \`.schedulegroup delete open\`\n` +
                `> or: \`.schedulegroup delete close\``
            );
            return;
        }
        
        const group = db.getGroup(m.chat) || {};
        
        if (type === 'open') {
            delete group.scheduleOpen;
            db.setGroup(m.chat, group);
            
            await m.reply(
                `✅ *ʙᴇʀʜᴀsɪʟ*\n\n` +
                `> Schedule *open the group* otodeads has deleted.`
            );
        } else {
            delete group.scheduleClose;
            db.setGroup(m.chat, group);
            
            await m.reply(
                `✅ *ʙᴇʀʜᴀsɪʟ*\n\n` +
                `> Schedule *close the group* otodeads has deleted.`
            );
        }
        return;
    }
    
    if (action !== 'open' && action !== 'close') {
        await m.reply(
            `⚠️ *ᴠᴀʟɪᴅᴀsɪ ɢᴀɢᴀʟ*\n\n` +
            `> Action must \`open\` or \`close\`!\n\n` +
            `> *Example:*\n` +
            `> \`.schedulegroup open 06:00\`\n` +
            `> \`.schedulegroup close 22:00\``
        );
        return;
    }
    
    if (!time) {
        await m.reply(
            `⚠️ *ᴠᴀʟɪᴅᴀsɪ ɢᴀɢᴀʟ*\n\n` +
            `> Time must thissi!\n\n` +
            `> *Format:* \`HH:MM\` (24 hour)\n` +
            `> *Example:* \`.schedulegroup ${action} 08:00\``
        );
        return;
    }
    
    const parsed = parseTime(time);
    if (!parsed) {
        await m.reply(
            `⚠️ *ᴠᴀʟɪᴅᴀsɪ ɢᴀɢᴀʟ*\n\n` +
            `> Format time no valid!\n\n` +
            `> *Format:* \`HH:MM\` (24 hour)\n` +
            `> *Example:* \`06:00\`, \`22:30\`, \`08:15\``
        );
        return;
    }
    
    const group = db.getGroup(m.chat) || {};
    const formattedTime = formatTime(parsed.hours, parsed.minutes);
    
    if (action === 'open') {
        group.scheduleOpen = formattedTime;
    } else {
        group.scheduleClose = formattedTime;
    }
    
    db.setGroup(m.chat, group);
    
    const actionText = action === 'open' ? 'BUKA' : 'TUTUP';
    const emoji = action === 'open' ? '🔓' : '🔒';
    
    const successMsg = `✅ *ᴊᴀᴅᴡᴀʟ ᴅɪsɪᴍᴘᴀɴ*

╭┈┈⬡「 ⏰ *sᴇᴛᴛɪɴɢ* 」
┃ ㊗ ${emoji} ᴀᴋsɪ: *${actionText}*
┃ ㊗ ⏱️ ᴡᴀᴋᴛᴜ: *${formattedTime}*
┃ ㊗ 📡 sᴛᴀᴛᴜs: *🟢 Active*
╰┈┈⬡

> _Group will otodeads ${action === 'open' ? 'opened' : 'closed'}_
> _every day at *${formattedTime}*._`;
    
    await m.reply(successMsg);
}

module.exports = {
    config: pluginConfig,
    handler
};
