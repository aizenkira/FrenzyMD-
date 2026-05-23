const { getDatabase } = require('../../src/lib/frenzy-database');

const pluginConfig = {
    name: 'notifprayer',
    alias: ['notifsolat'],
    category: 'group',
    description: 'Toggle notification prayer for this group',
    usage: '.notifprayer on/off',
    example: '.notifprayer on',
    isOwner: false,
    isPremium: false,
    isGroup: true,
    isPrivate: false,
    cooldown: 5,
    energy: 0,
    isEnabled: true
};

async function handler(m, { sock, db }) {
    if (!m.isAdmin && !m.isOwner) {
        return m.reply(`❌ Only admin group that can use feature this`);
    }

    const args = m.args[0]?.toLowerCase();
    const group = db.getGroup(m.chat) || {};
    const globalDb = getDatabase();
    const kotaSetting = globalDb.setting('autoPrayerCity') || { name: 'KOTA JAKARTA' };

    if (!['on', 'off'].includes(args)) {
        const isGlobalActive = globalDb.setting('autoPrayer') || false;
        const statusGlobal = isGlobalActive ? '✅ AKTIF' : '❌ NONAKTIF';
        const statusGroup = group.notifPrayer !== false ? '✅ AKTIF' : '❌ NONAKTIF';
        
        return m.reply(
            `🕌 *PENGINGAT WAKTU SHOLAT*\n\n` +
            `Status Global: *${statusGlobal}* (From Owner)\n` +
            `Status Group: *${statusGroup}*\n` +
            `Location: *${kotaSetting.name}*\n\n` +
            `*PENGATURAN GRUP:*\n` +
            `• *${m.prefix}notifprayer on* — Activekan notif in this group\n` +
            `• *${m.prefix}notifprayer off* — Nonactivekan notif in this group\n\n` +
            `*CARA KERJA:*\n` +
            `1. Sendingkan mp3 adzan & image schedule when prayer time arrives\n` +
            `2. Mengikuti schedule real-time from myquran.com\n` +
            `3. If Status Global NONAKTIF, group no will sent adzan even though Status Group AKTIF.\n` +
            `4. If group mefeel terganggu, admin will medeadkan khusus for this group.`
        );
    }

    if (args === 'on') {
        group.notifPrayer = true;
        db.setGroup(m.chat, group);
        return m.reply(`✅ *ɴᴏᴛɪꜰ sʜᴏʟᴀᴛ ᴅɪᴀᴋᴛɪꜰᴋᴀɴ*\n\n> Group this will receive pengingat time prayer\n> Location: ${kotaSetting.name}`);
    }

    if (args === 'off') {
        group.notifPrayer = false;
        db.setGroup(m.chat, group);
        return m.reply(`❌ *ɴᴏᴛɪꜰ sʜᴏʟᴀᴛ ᴅɪɴᴏɴᴀᴋᴛɪꜰᴋᴀɴ*`);
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
