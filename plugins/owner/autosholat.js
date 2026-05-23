const { getDatabase } = require('../../src/lib/frenzy-database');
const config = require('../../config');
const { getTodaySchedule, extractPrayerTimes, searchCity } = require('../../src/lib/frenzy-sholat-api');
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'autoprayer',
    alias: ['prayer', 'autoadzan'],
    category: 'owner',
    description: 'Toggle pengingat time prayer otodeads with audio adzan and close the group',
    usage: '.autoprayer on/off/status/kota <name>',
    example: '.autoprayer on',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
};

const AUDIO_ADZAN = 'https://content.vocaroo.com/mp3/1ofLT2YUJAjQ';

async function handler(m, { sock, db }) {
    const args = m.args[0]?.toLowerCase();
    const database = getDatabase();

    if (!args || args === 'status') {
        const status = database.setting('autoPrayer') ? '✅ Active' : '❌ Nonactive';
        const closeGroup = database.setting('autoPrayerCloseGroup') ? '✅ Yes' : '❌ No';
        const duration = database.setting('autoPrayerDuration') || 5;
        const kotaSetting = database.setting('autoPrayerCity') || { id: '1301', name: 'KOTA JAKARTA' };

        let scheduleText = '';
        try {
            const scheduleData = await getTodaySchedule(kotaSetting.id);
            const times = extractPrayerTimes(scheduleData);
            for (const [name, time] of Object.entries(times)) {
                scheduleText += `┃ ${name.charAt(0).toUpperCase() + name.slice(1)}: \`${time}\`\n`;
            }
        } catch {
            scheduleText = '┃ _Failed memuat schedule_\n';
        }

        return m.reply(
            `🕌 *ᴀᴜᴛᴏ sʜᴏʟᴀᴛ*\n\n` +
            `╭┈┈⬡「 📋 *sᴛᴀᴛᴜs* 」\n` +
            `┃ 🔔 ᴀᴜᴛᴏ sʜᴏʟᴀᴛ: ${status}\n` +
            `┃ 🔒 ᴛᴜᴛᴜᴘ ɢʀᴜᴘ: ${closeGroup}\n` +
            `┃ ⏱️ ᴅᴜʀᴀsɪ: \`${duration}\` minute\n` +
            `┃ 📍 ᴋᴏᴛᴀ: \`${kotaSetting.name}\`\n` +
            `╰┈┈⬡\n\n` +
            `╭┈┈⬡「 🕐 *ᴊᴀᴅᴡᴀʟ ʜᴀʀɪ ɪɴɪ* 」\n` +
            scheduleText +
            `╰┈┈⬡\n\n` +
            `> *Usage:*\n` +
            `> \`${m.prefix}autoprayer on\` - Activekan\n` +
            `> \`${m.prefix}autoprayer off\` - Nonactivekan\n` +
            `> \`${m.prefix}autoprayer close on/off\` - Toggle close the group\n` +
            `> \`${m.prefix}autoprayer duration <minute>\` - Set durasi tutup\n` +
            `> \`${m.prefix}autoprayer kota <name>\` - Set lokasi\n\n` +
            `> _Sumber: myquran.com (real-time)_`
        );
    }

    if (args === 'on') {
        database.setting('autoPrayer', true);
        m.react('✅');
        const kota = database.setting('autoPrayerCity') || { name: 'KOTA JAKARTA' };
        return m.reply(
            `✅ *ᴀᴜᴛᴏ sʜᴏʟᴀᴛ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ*\n\n` +
            `> Pengingat time prayer active\n` +
            `> Auino adzan will sent to all group\n` +
            `> Location: ${kota.name} (real-time)`
        );
    }

    if (args === 'off') {
        database.setting('autoPrayer', false);
        m.react('❌');
        return m.reply(`❌ *ᴀᴜᴛᴏ sʜᴏʟᴀᴛ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ*`);
    }

    if (args === 'close') {
        const subArg = m.args[1]?.toLowerCase();
        if (subArg === 'on') {
            database.setting('autoPrayerCloseGroup', true);
            m.react('🔒');
            return m.reply(`🔒 *GROUP CLOSE ENABLED*\n\n> Group will closed at prayer time`);
        }
        if (subArg === 'off') {
            database.setting('autoPrayerCloseGroup', false);
            m.react('🔓');
            return m.reply(`🔓 *GROUP CLOSE DISABLED*\n\n> Group no will closed at prayer time`);
        }
        return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Usage: \`${m.prefix}autoprayer close on/off\``);
    }

    if (args === 'duration') {
        const duration = parseInt(m.args[1]);
        if (isNaN(duration) || duration < 1 || duration > 60) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Durasi must between 1-60 minute`);
        }
        database.setting('autoPrayerDuration', duration);
        m.react('⏱️');
        return m.reply(`⏱️ *DURATION SET*\n\n> Group will closed \`${duration}\` minute at prayer time`);
    }

    if (args === 'kota') {
        const kotaName = m.args.slice(1).join(' ').trim();
        if (!kotaName) {
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> Usage: \`${m.prefix}autoprayer kota Jakarta\``);
        }

        m.react('🔍');
        try {
            const result = await searchCity(kotaName);
            if (!result) {
                return m.reply(`❌ City "${kotaName}" not found`);
            }

            database.setting('autoPrayerCity', {
                id: result.id,
                name: result.lokasi
            });

            m.react('📍');
            return m.reply(
                `📍 *ʟᴏᴋᴀsɪ ᴅɪsᴇᴛ*\n\n` +
                `> City: *${result.lokasi}*\n\n` +
                `> Prayer schedule will mengikuti lokasi this`
            );
        } catch (e) {
            m.reply(te(m.prefix, m.command, m.pushName));
        }
    }

    return m.reply(`❌ *ᴀᴄᴛɪᴏɴ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ*\n\n> Usage: \`on\`, \`off\`, \`close on/off\`, \`duration <minute>\`, \`kota <name>\``);
}

async function runAutoPrayer(sock) {
    const db = getDatabase();

    if (!db.setting('autoPrayer')) return;

    const kotaSetting = db.setting('autoPrayerCity') || { id: '1301', name: 'KOTA JAKARTA' };

    let times;
    try {
        const scheduleData = await getTodaySchedule(kotaSetting.id);
        times = extractPrayerTimes(scheduleData);
    } catch {
        return;
    }

    const JADWAL = {
        subuh: times.subuh,
        dzuhur: times.dzuhur,
        ashar: times.ashar,
        maghrib: times.maghrib,
        isya: times.isya
    };

    const timeHelper = require('../../src/lib/frenzy-time');
    const timeNow = timeHelper.getCurrentTimeString();

    if (!global.autoPrayerLock) global.autoPrayerLock = {};

    for (const [prayer, time] of Object.entries(JADWAL)) {
        if (time === '-') continue;
        if (timeNow === time && !global.autoPrayerLock[prayer]) {
            global.autoPrayerLock[prayer] = true;
            try {
                global.isFetchingGroups = true;
                const groupsObj = await sock.groupFetchAllParticipating();
                global.isFetchingGroups = false;
                const groupList = Object.keys(groupsObj);

                const saluranId = config.saluran?.id || '120363208449943317@newsletter';
                const saluranName = config.saluran?.name || config.bot?.name || 'frenzy-AI';

                const closeGroup = db.setting('autoPrayerCloseGroup') || false;
                const duration = db.setting('autoPrayerDuration') || 5;

                const ImageSuathere = {
                    subuh: 'https://files.cloudkuimages.guru/images/61c43a618c30.jpg',
                    dzuhur: 'https://files.cloudkuimages.guru/images/57b4f4639bc3.jpg',
                    ashar: 'https://files.cloudkuimages.guru/images/e6c4e032aa53.webp',
                    maghrib: 'https://files.cloudkuimages.guru/imagetoa65b383dea6.webp',
                    isya: 'https://files.cloudkuimages.guru/images/e35488beb40c.jpg'
                };

                const contextInfo = {
                    forwardingScore: 9999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: saluranId,
                        newsletterName: saluranName,
                        serverMessageId: 127
                    }
                };

                for (const jid of groupList) {
                    const groupData = db.data?.groups?.[jid] || {};
                    if (groupData.notifPrayer === false) continue;

                    try {
                        const caption = `🕌 *ᴡᴀᴋᴛᴜ sʜᴏʟᴀᴛ ${prayer.toUpperCase()}*\n\n` +
                            `> Time: \`${time}\`\n` +
                            `> Location: \`${kotaSetting.name}\`\n` +
                            `> Ayo tulevel upan prayer! 🤲\n\n` +
                            (closeGroup ? `> _Group closed ${duration} minute_` : '');

                        await sock.sendMessage(jid, {
                            audio: { url: AUDIO_ADZAN },
                            mimetype: 'audio/mpeg',
                            ptt: false,
                            contextInfo: {
                                externalAdReply: {
                                    title: `🕌 Time ${prayer.toUpperCase()}`,
                                    body: caption.replace(/[*_`]/g, '').substring(0, 100),
                                    thumbnailUrl: ImageSuathere[prayer],
                                    sourceUrl: config.saluran?.link || 'https://timenya.ibthere ish',
                                    contentType: 2,
                                    renderLargerThumbnail: true
                                },
                                ...contextInfo
                            }
                        });

                        if (closeGroup) {
                            await sock.groupSettingUpdate(jid, 'announcement');
                        }

                        await new Promise(res => setTimeout(res, 500));
                    } catch (e) {
                        console.log(`[AutoPrayer] Failed send to ${jid}:`, e.message);
                    }
                }

                if (closeGroup) {
                    setTimeout(async () => {
                        for (const jid of groupList) {
                            try {
                                await sock.groupSettingUpdate(jid, 'not_announcement');
                                await sock.sendMessage(jid, {
                                    text: `✅ Group opened again after prayer ${prayer}.`,
                                    contextInfo
                                });
                                await new Promise(res => setTimeout(res, 600));
                            } catch (e) {
                                console.log(`[AutoPrayer] Failed open the group ${jid}:`, e.message);
                            }
                        }
                        console.log(`[AutoPrayer] All group opened again`);
                    }, duration * 60 * 1000);
                }

                console.log(`[AutoPrayer] Pengingat ${prayer} sent to ${groupList.length} group`);

            } catch (error) {
                global.isFetchingGroups = false;
                console.error('[AutoPrayer] Error:', error.message);
            }

            setTimeout(() => {
                delete global.autoPrayerLock[prayer];
            }, 2 * 60 * 1000);
        }
    }
}

module.exports = {
    config: pluginConfig,
    handler,
    runAutoPrayer,
    AUDIO_ADZAN
};
