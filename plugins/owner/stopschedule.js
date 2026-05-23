const { stopSchedulerByName, getFullSchedulerStatus } = require('../../src/lib/frenzy-scheduler');
const { stopPrayerScheduler } = require('../../src/lib/frenzy-sholat-scheduler');
const { getDatabase } = require('../../src/lib/frenzy-database');
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'stopschedule',
    alias: ['stopscheduler', 'schedstop', 'pauseschedule'],
    category: 'owner',
    description: 'Menghentikan scheduler specific or all',
    usage: '.stopschedule <name|all>',
    example: '.stopschedule prayer',
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
            const helpText = `🛑 *sᴛᴏᴘ sᴄʜᴇᴅᴜʟᴇʀ*

*Usage:*
\`.stopschedule <name>\`

*Available schedulers:*
• \`limitreset\` - Daily Limit Reset
• \`groupschedule\` - Group Schedule
• \`sewa\` - Sewa Chector
• \`messages\` - Scheduled Messages
• \`prayer\` - Prayer Scheduler
• \`all\` - All scheduler

*Example:*
\`.stopschedule prayer\`
\`.stopschedule all\``;
            
            await m.reply(helpText);
            return;
        }
        
        if (target === 'prayer') {
            const db = getDatabase();
            const wasEnabled = db.setting('autoPrayer');
            
            if (!wasEnabled) {
                await m.reply(`ℹ️ Prayer Scheduler already in tothere isan nonactive`);
                return;
            }
            
            stopPrayerScheduler();
            db.setting('autoPrayer', false);
            
            await m.reply(`🛑 *sᴄʜᴇᴅᴜʟᴇʀ ᴅɪʜᴇɴᴛɪᴋᴀɴ*

> Scheduler: *Prayer Scheduler*
> Status: ❌ Inhentikan

_Usage \`.startschedule prayer\` for activate again_`);
            return;
        }
        
        if (target === 'all') {
            stopPrayerScheduler();
            const db = getDatabase();
            db.setting('autoPrayer', false);
        }
        
        const result = stopSchedulerByName(target);
        
        if (result.stopped) {
            await m.reply(`🛑 *sᴄʜᴇᴅᴜʟᴇʀ ᴅɪʜᴇɴᴛɪᴋᴀɴ*

> Scheduler: *${result.name}*
> Status: ❌ Inhentikan

_Usage \`.startschedule ${target}\` for activate again_`);
        } else {
            await m.reply(`❌ Scheduler not found or already nonactive

Usage \`.stopschedule\` for view list scheduler`);
        }
    } catch (error) {
        console.error('[StopSchedule Error]', error);
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
