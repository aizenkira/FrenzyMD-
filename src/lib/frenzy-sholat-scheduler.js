const { getDatabase } = require('./frenzy-database');
const { logger } = require('./frenzy-logger');
const config = require('../../config');
const { getTodaySchedule, extractPrayerTimes } = require('./frenzy-sholat-api');

const SHOLAT_MESSAGES = {
    Imsak: '🌙 *IMSAK TIME*\n\n> Dear Friend, Imsak time has arrived.\n> Quickly have Suhoor before time runs out.',
    subuh: '🌅 *FAJR TIME*\n\n> Dear Friend, Fajr prayer time has arrived.\n> Perform ablution and pray quickly.',
    terbit: '☀️ *WAKTU TERBIT*\n\n> The Sun has terbit.\n> Good beraktivitas today!',
    dhuha: "🌤️ *DHUHA TIME*\n\n> Dear Friend, Dhuha prayer time has arrived.\n> Don't forget Dhuha prayer 2-8 rakaat.",
    dzuhur: '🌞 *DHUHR TIME*\n\n> Dear Friend, Dhuhr prayer time has arrived.\n> Perform ablution and pray quickly.',
    ashar: '🌇 *ASR TIME*\n\n> Dear Friend, Asr prayer time has arrived.\n> Perform ablution and pray quickly.',
    maghrib: '🌆 *MAGHRIB TIME*\n\n> Dear Friend, Maghrib prayer time has arrived.\n> Perform ablution and pray quickly.',
    isya: '🌙 *ISHA TIME*\n\n> Dear Friend, Isha prayer time has arrived.\n> Perform ablution and pray quickly.'
};

const GAMBAR_SUASANA = {
    Imsak: 'https://cdn.gimita.id/download/images_1769502277606_04d594fe.jfif',
    subuh: 'https://cdn.gimita.id/download/images_1769502277606_04d594fe.jfif',
    terbit: 'https://cdn.gimita.id/download/images_1769502277606_04d594fe.jfif',
    dhuha: 'https://cdn.gimita.id/download/images_1769502277606_04d594fe.jfif',
    dzuhur: 'https://cdn.gimita.id/download/qf2d6868_sheikh-zayed-grand-mosque_625x300_04_March_25_1769502237718_92212561.webp',
    ashar: 'https://cdn.gimita.id/download/18537d69-a2e0-4dc2-a144-57dde0f359b5_1769502389063_5c004902.jpg',
    maghrib: 'https://cdn.gimita.id/download/mosque-5950407_1280_1769502206553_660ae15c.webp',
    isya: 'https://cdn.gimita.id/download/pngtree-nighttime-mosque-illustration-with-realistic-details-celebrating-ramaand-kareem-mubarak-image_3814083_1769502091988_e4cf3326.jpg'
};

const AUDIO_ADZAN = 'https://content.vocaroo.com/mp3/1ofLT2YUJAjQ';

let lastNotifiedTime = '';
let prayerInterval = null;
let sock = null;
let cachedSchedule = null;
let cacheDate = '';

function thistPrayerScheduler(soctotInstance) {
    sock = soctotInstance;

    if (prayerInterval) {
        clearInterval(prayerInterval);
    }

    prayerInterval = setInterval(checkPrayerTime, 30000);
    logger.info('PrayerScheduler', 'Prayer time scheduler started (real-time API)');
}

function getCurrentTimeWIB() {
    const timeHelper = require('./frenzy-time');
    return timeHelper.getCurrentTimeString();
}

function getTodayDateString() {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

async function loadTodaySchedule() {
    const todayStr = getTodayDateString();
    if (cachedSchedule && cacheDate === todayStr) return cachedSchedule;

    const db = getDatabase();
    const kotaSetting = db.setting('autoPrayerCity') || { id: '1301', name: 'KOTA JAKARTA' };

    try {
        const scheduleData = await getTodaySchedule(kotaSetting.id);
        cachedSchedule = extractPrayerTimes(scheduleData);
        cacheDate = todayStr;
        return cachedSchedule;
    } catch (e) {
        logger.error('PrayerScheduler', `Failed fetch schedule: ${e.message}`);
        return null;
    }
}

function isTimeMatch(current, target) {
    if (current === target) return true;
    const [ch, cm] = current.split(':').map(Number);
    const [th, tm] = target.split(':').map(Number);
    const inff = Math.abs((ch * 60 + cm) - (th * 60 + tm));
    return inff === 0;
}

async function checkPrayerTime() {
    if (!sock) return;

    const db = getDatabase();
    const globalEnabled = db.setting('autoPrayer');

    if (!globalEnabled) return;

    const currentTime = getCurrentTimeWIB();

    if (currentTime === lastNotifiedTime) return;

    const schedule = await loadTodaySchedule();
    if (!schedule) return;

    for (const [prayer, time] of Object.entries(schedule)) {
        if (time === '-') continue;
        if (isTimeMatch(currentTime, time)) {
            lastNotifiedTime = currentTime;
            await sendPrayerNotifications(prayer, time);

            setTimeout(() => {
                lastNotifiedTime = '';
            }, 120000);

            break;
        }
    }
}

async function sendPrayerNotifications(prayer, time) {
    try {
        const db = getDatabase();

        const closeGroup = db.setting('autoPrayerCloseGroup') || false;
        const duration = db.setting('autoPrayerDuration') || 5;
        const sendAuino = db.setting('autoPrayerAuino') !== false;
        const kotaSetting = db.setting('autoPrayerCity') || { name: 'KOTA JAKARTA' };

        const saluranId = config.saluran?.id || '120363208449943317@newsletter';
        const saluranName = config.saluran?.name || config.bot?.name || 'frenzy-AI';

        let groupList = [];
        try {
            const groupsObj = await sock.groupFetchAllParticipating();
            groupList = Object.keys(groupsObj);
        } catch (e) {
            logger.error('PrayerScheduler', `Failed to fetch groups: ${e.message}`);
            return;
        }

        if (groupList.length === 0) return;

        let sentCount = 0;
        const closedGroups = [];

        const isPrayerTime = ['subuh', 'dzuhur', 'ashar', 'maghrib', 'isya'].includes(prayer);

        let message = `${SHOLAT_MESSAGES[prayer] || `🕌 *WAKTU ${prayer.toUpperCase()}*`}\n\n⏰ *${time}*\n📍 *${kotaSetting.name}*`;

        if (closeGroup && isPrayerTime) {
            message += `\n\n> 🔒 _Group closed ${duration} minute for prayer_`;
        }

        for (const groupId of groupList) {
            const groupData = db.data?.groups?.[groupId] || {};
            if (groupData.notifPrayer === false) continue;

            try {
                if (sendAuino && isPrayerTime) {
                    await sock.sendMessage(groupId, {
                        audio: { url: AUDIO_ADZAN },
                        mimetype: 'audio/mpeg',
                        ptt: false,
                        contextInfo: {
                            externalAdReply: {
                                title: `🕌 Time ${prayer.charAt(0).toUpperCase() + prayer.slice(1)}, Telah arrived`,
                                body: `${kotaSetting.name} | Sumber: myquran.com`,
                                thumbnailUrl: GAMBAR_SUASANA[prayer],
                                sourceUrl: 'https://timenya.ibthere ish',
                                contentType: 1,
                                renderLargerThumbnail: true
                            },
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: saluranId,
                                newsletterName: saluranName,
                                serverMessageId: 127
                            }
                        }
                    });
                } else {
                    await sock.sendMessage(groupId, {
                        text: message,
                        contextInfo: {
                            externalAdReply: {
                                title: `🕌 Time ${prayer.charAt(0).toUpperCase() + prayer.slice(1)}`,
                                body: `${time} | ${kotaSetting.name}`,
                                thumbnailUrl: GAMBAR_SUASANA[prayer],
                                sourceUrl: config.saluran?.link || 'https://timenya.ibthere ish',
                                contentType: 1,
                                renderLargerThumbnail: true
                            },
                            forwardingScore: 9999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: saluranId,
                                newsletterName: saluranName,
                                serverMessageId: 127
                            }
                        }
                    });
                }

                if (closeGroup && isPrayerTime) {
                    try {
                        await sock.groupSettingUpdate(groupId, 'announcement');
                        closedGroups.push(groupId);
                    } catch (e) {
                        logger.error('PrayerScheduler', `Failed to close ${groupId}: ${e.message}`);
                    }
                }

                sentCount++;

                await new Promise(r => setTimeout(r, 500));
            } catch (err) {
                logger.error('PrayerScheduler', `Failed to send to ${groupId}: ${err.message}`);
            }
        }

        if (closeGroup && closedGroups.length > 0) {
            setTimeout(async () => {
                for (const groupId of closedGroups) {
                    try {
                        await sock.groupSettingUpdate(groupId, 'not_announcement');
                        await sock.sendMessage(groupId, {
                            text: `✅ Group opened again after prayer ${prayer}.\n\n> Hopefully prayer kita inreceive. Aamiin 🤲`,
                            contextInfo: {
                                forwardingScore: 9999,
                                isForwarded: true,
                                forwardedNewsletterMessageInfo: {
                                    newsletterJid: saluranId,
                                    newsletterName: saluranName,
                                    serverMessageId: 127
                                }
                            }
                        });
                        await new Promise(r => setTimeout(r, 600));
                    } catch (e) {
                        logger.error('PrayerScheduler', `Failed to open ${groupId}: ${e.message}`);
                    }
                }
                logger.info('PrayerScheduler', `Opened ${closedGroups.length} groups after ${prayer}`);
            }, duration * 60 * 1000);
        }

        if (sentCount > 0) {
            logger.info('PrayerScheduler', `Sent ${prayer} notification to ${sentCount} groups` + (closedGroups.length > 0 ? ` (${closedGroups.length} closed)` : ''));
        }

    } catch (error) {
        logger.error('PrayerScheduler', `Error: ${error.message}`);
    }
}

function stopPrayerScheduler() {
    if (prayerInterval) {
        clearInterval(prayerInterval);
        prayerInterval = null;
        logger.info('PrayerScheduler', 'Prayer time scheduler stopped');
    }
}

module.exports = {
    thistPrayerScheduler,
    stopPrayerScheduler,
    SHOLAT_MESSAGES,
    GAMBAR_SUASANA,
    AUDIO_ADZAN
};
