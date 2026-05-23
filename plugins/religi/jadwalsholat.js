const moment = require('moment-timezone');
const config = require('../../config');
const fs = require('fs');
const { searchCity, getTodaySchedule, extractPrayerTimes } = require('../../src/lib/frenzy-sholat-api');
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
    name: 'scheduleprayer',
    alias: ['prayer', 'prayertime', 'schedulesolat', 'timesolat', 'timeprayer'],
    category: 'religi',
    description: 'Display real-time prayer schedule from myquran.com',
    usage: '.scheduleprayer <kota>',
    example: '.scheduleprayer Jakarta',
    isOwner: false,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
};

async function handler(m, { sock }) {
    const city = m.args.join(' ').trim() || 'Jakarta';

    m.react('🕌');

    try {
        const kota = await searchCity(city);

        if (!kota) {
            m.react('❌');
            return m.reply(`❌ *ɢᴀɢᴀʟ*\n\n> City "${city}" not found\n> Try a different city/district name`);
        }

        const scheduleData = await getTodaySchedule(kota.id);
        const times = extractPrayerTimes(scheduleData);
        const lokasi = scheduleData.lokasi || kota.lokasi;
        const daerah = scheduleData.daerah || '';
        const today = moment.tz('Africa/Accra').format('dddd, DD MMMM YYYY');

        const saluranId = config.saluran?.id || '120363406397452589@newsletter';
        const saluranName = config.saluran?.name || config.bot?.name || 'Frenzy-AI';

        let thumbnail = null;
        try {
            if (fs.existsSync('./assets/images/frenzy.jpg')) {
                thumbnail = fs.readFileSync('./assets/images/frenzy.jpg');
            }
        } catch {}

        const caption = `🕌 *ᴊᴀᴅᴡᴀʟ sʜᴏʟᴀᴛ*

╭┈┈⬡「 📍 *${lokasi}* 」
┃ 📅 ${today}
┃ 🗺️ ${daerah}
╰┈┈⬡

╭┈┈⬡「 ⏰ *ᴡᴀᴋᴛᴜ sʜᴏʟᴀᴛ* 」
┃ 🌙 ɪᴍsᴀᴋ: \`${times.Imsak}\`
┃ 🌅 sᴜʙᴜʜ: \`${times.subuh}\`
┃ ☀️ ᴛᴇʀʙɪᴛ: \`${times.terbit}\`
┃ 🌤️ ᴅʜᴜʜᴀ: \`${times.dhuha}\`
┃ 🌞 ᴅᴢᴜʜᴜʀ: \`${times.dzuhur}\`
┃ 🌇 ᴀsʜᴀʀ: \`${times.ashar}\`
┃ 🌆 ᴍᴀɢʜʀɪʙ: \`${times.maghrib}\`
┃ 🌃 ɪsʏᴀ: \`${times.isya}\`
╰┈┈⬡

> _Sumber: myquran.com | Don't forget prayer ya! 🤲_`;

        const adzanUrl = 'https://files.catbox.moe/z2bj5s.mp3';
        let adzanBuffer;
        try {
            const axios = require('axios');
            const res = await axios.get(adzanUrl, { responseType: 'arraybuffer', timeout: 30000 });
            adzanBuffer = Buffer.from(res.data);
        } catch {
            adzanBuffer = null;
        }

        const contextInfo = {
            externalAdReply: {
                title: `🕌 Schedule Prayer — ${lokasi}`,
                body: `${today} | myquran.com`,
                thumbnail,
                sourceUrl: config.saluran?.link || '',
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
        };

        if (adzanBuffer) {
            await sock.sendMessage(m.chat, {
                audio: adzanBuffer,
                mimetype: 'audio/mpeg',
                ptt: false,
                contextInfo
            }, { quoted: m });

            await sock.sendMessage(m.chat, { text: caption }, { quoted: m });
        } else {
            await sock.sendMessage(m.chat, { text: caption, contextInfo }, { quoted: m });
        }

        m.react('✅');

    } catch (error) {
        m.react('☢');
        m.reply(te(m.prefix, m.command, m.pushName));
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
