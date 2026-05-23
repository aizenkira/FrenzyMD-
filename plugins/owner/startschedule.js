const { startSchedulerByName, getFullSchedulerStatus } = require('../../src/lib/frenzy-scheduler');
const { thistPrayerScheduler } = require('../../src/lib/frenzy-sholat-scheduler');
const { getDatabase } = require('../../src/lib/frenzy-database');
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'startschedule',
    alias: ['startscheduler', 'schedstart', 'resumeschedule'],
    category: 'owner',
    description: 'Mestart again scheduler specific or all',
    usage: '.startschedule <name|all>',
    example: '.startschedule prayer',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

async function handler(m, { sock, args }) {
    try {
        const target = args[0]?.toLowerCase();
        
        if (!target) {
            const helpText = `▶️ *sᴛᴀʀᴛ sᴄʜᴇᴅᴜʟᴇʀ*

*Usage:*
\`.startschedule <name>\`

*Available schedulers:*
• \`limitreset\` - Daily Limit Reset
• \`groupschedule\` - Group Schedule
• \`sewa\` - Sewa Chector
• \`messages\` - Scheduled Messages
• \`prayer\` - Prayer Scheduler
• \`all\` - All scheduler

*Example:*
\`.startschedule prayer\`
\`.startschedule all\``;
            
            await m.reply(helpText);
            return;
        }
        
        if (target === 'prayer') {
            const db = getDatabase();
            const wasEnabled = db.setting('autoPrayer');
            
            if (wasEnabled) {
                await m.reply(`ℹ️ Prayer Scheduler already in tothere isan active`);
                return;
            }
            
            thistPrayerScheduler(sock);
            db.setting('autoPrayer', true);
            
            await m.reply(`▶️ *sᴄʜᴇᴅᴜʟᴇʀ ᴅɪᴍᴜʟᴀɪ*

> Scheduler: *Prayer Scheduler*
> Status: ✅ Active

_Prayer time notification will sent to group that activate this feature_`);
            return;
        }
        
        if (target === 'all') {
            thistPrayerScheduler(sock);
            const db = getDatabase();
            db.setting('autoPrayer', true);
        }
        
        const result = startSchedulerByName(target, sock);
        
        if (result.started) {
            await m.reply(`▶️ *sᴄʜᴇᴅᴜʟᴇʀ ᴅɪᴍᴜʟᴀɪ*

> Scheduler: *${result.name}*
> Status: ✅ Active

_Scheduler has instart again_`);
        } else {
            await m.reply(`❌ Scheduler not found or already active

Usage \`.startschedule\` for view list scheduler`);
        }
    } catch (error) {
        console.error('[StartSchedule Error]', error);
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
