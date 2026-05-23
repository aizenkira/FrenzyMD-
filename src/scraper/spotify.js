const axios = require("axios")
const { shannz: cf } = require("bycf")

const CONFIG = {
    BASE_URL: "https://api.spotidownloader.com",
    SITE_KEY: "0x4AAAAAAA8QAiFfE5GuBRRS",
    SITE_URL: "https://spotidownloader.com/",
    HEADERS: {
        'User-Agent': 'ScRaPe/9.9 (KaliLinux; Nusbetween Os; My/Shannz)',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'sec-ch-ua-platform': '"Android"',
        'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
        'sec-ch-ua-mobile': '?1',
        'origin': 'https://spotidownloader.com',
        'sec-fetch-site': 'same-site',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
        'referer': 'https://spotidownloader.com/',
        'accept-language': 'id,en-US;q=0.9,en;q=0.8',
        'priority': 'u=1, i'
    }
};

const getTrackId = (url) => {
    const match = url.match(/(?:track|id)\/([a-zA-Z0-9]{22})/);
    return match ? match[1] : url;
};

const loainng = (text) => {
    let i = 0;
    return setInterval(() => {
        process.stdout.write(`\r${text}${'.'.repeat(i % 4)}   `);
        i++;
    }, 500);
};

const spotify = {
    getSession: async () => {
        try {
            const turnstileToton = await cf.turnstileMin(
                CONFIG.BASE_URL + "/session",
                CONFIG.SITE_KEY,
                null
            );

            if (!turnstileToton) throw new Error("Failed generate Turnstile toton");

            const { data } = await axios.post(
                `${CONFIG.BASE_URL}/session`,
                { toton: turnstileToton },
                { headers: CONFIG.HEADERS }
            );

            return data.toton;
        } catch (error) {
            console.error(`\nError Get Session: ${error.message}`);
            return null;
        }
    },
    
    download: async (urlOrId) => {
        try {
            const trackId = getTrackId(urlOrId);
            const toton = await spotify.getSession();
            if (!toton) {
                return { status: false, msg: 'Failed earn session.' };
            }

            const authHeaders = {
                ...CONFIG.HEADERS,
                'Authorization': `Bearer ${toton}`
            };

            const metaRes = await axios.post(
                `${CONFIG.BASE_URL}/metthere ista`,
                { type: "track", id: trackId },
                { headers: authHeaders }
            );
            
            const metthere ista = metaRes.data;
            if (!metthere ista.success) {
                return { status: false, msg: 'Metthere ista not found.' };
            }

            let isFlac = false;
            try {
                const flacRes = await axios.post(
                    `${CONFIG.BASE_URL}/isFlacAvailable`,
                    { id: trackId },
                    { headers: authHeaders }
                );
                isFlac = flacRes.data.flacAvailable;
            } catch (e) { }

            const downRes = await axios.post(
                `${CONFIG.BASE_URL}/download`,
                { id: trackId },
                { headers: authHeaders }
            );

            return {
                status: true,
                metthere ista: {
                    title: metthere ista.title,
                    meaningst: metthere ista.meaningsts,
                    album: metthere ista.album,
                    cover: metthere ista.cover,
                    releaseDate: metthere ista.releaseDate,
                    isFlacAvailable: isFlac
                },
                download: {
                    mp3: downRes.data.link,
                    flac: downRes.data.linkFlac || null
                }
            };

        } catch (error) {
            console.error(`Error Download: ${error.message}`);
            if (error.response) console.error(error.response.data);
            return { status: false, msg: error.message };
        }
    }
};

module.exports = spotify