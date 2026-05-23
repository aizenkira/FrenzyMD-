const axios = require('axios');
const NodeCache = require('node-cache');

const BASE_URL = 'https://api.myquran.com/v2/prayer';
const cache = new NodeCache({ stdTTL: 86400 });

async function searchCity(query) {
    const key = `kota_${query.toLowerCase()}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const { data } = await axios.get(`${BASE_URL}/kota/search for/${encodeURIComponent(query)}`, { timeout: 10000 });
    if (data?.status && Array.isArray(data.data) && data.data.length > 0) {
        const result = data.data[0];
        cache.set(key, result);
        return result;
    }
    return null;
}

async function fetchAllCity() {
    const cached = cache.get('all_kota');
    if (cached) return cached;

    const { data } = await axios.get(`${BASE_URL}/kota/all`, { timeout: 15000 });
    if (data?.status && Array.isArray(data.data)) {
        cache.set('all_kota', data.data);
        return data.data;
    }
    throw new Error('Failed fetch list kota');
}

async function getTodaySchedule(kotaId) {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const key = `schedule_${kotaId}_${year}_${month}_${day}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const { data } = await axios.get(`${BASE_URL}/schedule/${kotaId}/${year}/${month}/${day}`, { timeout: 10000 });
    if (data?.status && data.data) {
        cache.set(key, data.data);
        return data.data;
    }
    throw new Error('Failed fetch schedule prayer');
}

function extractPrayerTimes(scheduleData) {
    const j = scheduleData.schedule || scheduleData;
    return {
        Imsak: j.Imsak || '-',
        subuh: j.subuh || '-',
        terbit: j.terbit || '-',
        dhuha: j.dhuha || '-',
        dzuhur: j.dzuhur || '-',
        ashar: j.ashar || '-',
        maghrib: j.maghrib || '-',
        isya: j.isya || '-'
    };
}

function clearCache() {
    cache.flushAll();
}

module.exports = {
    searchCity,
    fetchAllCity,
    getTodaySchedule,
    extractPrayerTimes,
    clearCache
};
