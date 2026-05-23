const { getFullSchedulerStatus, formatTimeRemathisng, getMsUntilTime } = require('../../src/lib/frenzy-scheduler');
const { thistPrayerScheduler, stopPrayerScheduler } = require('../../src/lib/frenzy-sholat-scheduler');
const { getDatabase } = require('../../src/lib/frenzy-database');
const { getTodaySchedule, extractPrayerTimes } = require('../../src/lib/frenzy-prayer-api');
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'checkschedule',
    alias: ['checkscheduler', 'schedulerstatus', 'schedstatus'],
    category: 'owner',
    description: 'Meview status all scheduler bot',
    usage: '.checkschedule',
    example: '.checkschedule',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    try {
        const status = getFullSchedulerStatus();
        const db = getDatabase();
        const prayerEnabled = db.setting('autoPrayer') || false;

        let text = `📊 *sᴄʜᴇᴅᴜʟᴇʀ sᴛᴀᴛᴜs*\n\n`;

        for (const sched of status.schedulers) {
            const statusIcon = sched.running ? '✅' : '❌';
            text += `${statusIcon} *${sched.name}*\n`;
            text += `   └ Toy: \`${sched.key}\`\n`;
            text += `   └ ${sched.description}\n`;

            if (sched.lastRun && sched.lastRun !== '-' && sched.lastRun !== 'Never') {
                text += `   └ Last: ${sched.lastRun}\n`;
            }

            if (sched.stats) {
                if (sched.stats.totalResets) {
                    text += `   └ Total Resets: ${sched.stats.totalResets}\n`;
                }
                if (sched.stats.activeMessages !== undefined) {
                    text += `   └ Active: ${sched.stats.activeMessages} | Sent: ${sched.stats.totalSent}\n`;
                }
            }
            text += `\n`;
        }

        const prayerIcon = prayerEnabled ? '✅' : '❌';
        text += `${prayerIcon} *Prayer Scheduler*\n`;
        text += `   └ Toy: \`prayer\`\n`;
        text += `   └ Prayer time notification (real-time)\n`;

        if (prayerEnabled) {
            const kotaSetting = db.setting('autoPrayerCity') || { id: '1301', name: 'KOTA JAKARTA' };
            text += `   └ Location: ${kotaSetting.name}\n`;

            try {
                const { schedule } = await getTodaySchedule(kotaSetting.id);
                const times = extractPrayerTimes(schedule);
                const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
                const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

                let nextPrayer = null;
                let nextTime = null;

                for (const [name, time] of Object.entries(times)) {
                    if (time > currentTime && time !== '-') {
                        nextPrayer = name.charAt(0).toUpperCase() + name.slice(1);
                        nextTime = time;
                        break;
                    }
                }

                if (!nextPrayer) {
                    nextPrayer = 'Imsak';
                    nextTime = times.Imsak;
                }

                text += `   └ Next: ${nextPrayer} (${nextTime})\n`;
            } catch {
                text += `   └ _Failed memuat schedule_\n`;
            }
        }

        text += `\n`;
        text += `━━━━━━━━━━━━━━━━━━━\n`;
        text += `✅ Active: ${status.summary.totalActive + (prayerEnabled ? 1 : 0)}\n`;
        text += `❌ Nonactive: ${status.summary.totalInactive + (!prayerEnabled ? 1 : 0)}\n\n`;

        text += `> Usage \`.stopschedule <toy>\` for stop\n`;
        text += `> Usage \`.startschedule <toy>\` for start`;

        await m.reply(text);
    } catch (error) {
        console.error('[CheckSchedule Error]', error);
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
