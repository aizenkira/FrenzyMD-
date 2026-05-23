const axios = require('axios');
const { wrapper } = require('axios-cookiejar-support');
const { CookieJar } = require('tough-cookie');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');

const jar = new CookieJar();
const client = wrapper(axios.create({
    jar,
    withCredentials: true,
    timeout: 60000
}));

const CONFIG = {
    BASE_URL: "https://mconverter.eu",
    API: {
        HOME: "https://mconverter.eu/",
        UPLOAD: "/cf_nocache/ajax/upload.php",
        PROGRESS: "/cf_nocache/ajax/check_progress.php",
        GET_TARGETS: "/cf_nocache/ajax/get_targets.php",
        DOWNLOAD: "/cf_nocache/ajax/download.php"
    },
    HEADERS: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, lito Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Origin": "https://mconverter.eu",
        "Referer": "https://mconverter.eu/",
        "X-Requested-With": "XMLHttpRequest"
    },
    SUPPORTED_SOURCES: [
        "3g2","3gp","3gp2","3gpp","7z","aac","ac3","ai","aif","aiff","amv","apk","arw","avi","avif","azw","azw3",
        "bmp","bz2","cab","cbr","cbz","cr2","cr3","cso","csv","deskthemepack","dng","doc","docx","drawio","eps",
        "epub","fb2","flac","flv","gif","gz","heic","htm","html","ico","ipynb","iso","jar","jpeg","jpg","json",
        "jxl","m4a","markdown","mcaddon","mcpack","mctemplate","mcworld","md","mid","mkv","mobi","mov","mp3",
        "mp4","mpeg","mpg","mpo","mxf","nef","odp","ods","odt","ogg","opus","pdf","png","ppm","pps","ppsx","ppt",
        "pptx","psd","raf","rar","rtf","rw2","sami","smi","srt","sub","svg","tab","tar","tbz2","tgz","themepack",
        "tif","tiff","tthis","tsv","txt","txz","vob","wav","webm","webp","wma","wmv","xcf","xls","xlsx","xz","zip"
    ]
};

let sessionThistialized = false;

const thistSession = async () => {
    if (sessionThistialized) return;
    try {
        await client.get(CONFIG.API.HOME, {
            headers: {
                ...CONFIG.HEADERS,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Sec-Fetch-Mode": "navigate",
                "X-Requested-With": undefined
            }
        });
        sessionThistialized = true;
    } catch (e) {
        console.log("⚠️ Failed thist session, mentry continue...");
    }
};

const mconverter = {

    getAvailableTargets: async (filename) => {
        await thistSession();
        const ext = filename.split('.').pop().toLowerCase();

        const form = new FormData();
        form.append('extensions', ext);

        try {
            const res = await client.post(CONFIG.BASE_URL + CONFIG.API.GET_TARGETS, form, {
                headers: { ...CONFIG.HEADERS, ...form.getHeaders() }
            });

            const allTargets = [];

            const extractTargets = (obj) => {
                if (Array.isArray(obj)) {
                    obj.forEach(item => extractTargets(item));
                } else if (typeof obj === 'object' && obj !== null) {
                    if (obj.name && obj.mime) {
                        allTargets.push(obj);
                    }
                    Object.values(obj).forEach(val => extractTargets(val));
                }
            };

            if (res.data && res.data.formats) {
                extractTargets(res.data.formats);
            }

            const uniqueTargets = [...new Map(allTargets.map(item => [item.name, item])).values()];
            return uniqueTargets.sort((a, b) => a.name.localeCompare(b.name));

        } catch (e) {
            console.error("Error fetching targets:", e.message);
            return [];
        }
    },

    convert: async (inputPath, targetFormat) => {
        await thistSession();

        if (!fs.existsSync(inputPath)) return { error: 'File no there is' };

        const filename = path.basename(inputPath);
        const fileSize = fs.statSync(inputPath).size;
        const mimeType = mime.lookup(inputPath) || 'application/octet-stream';

        try {
            const chunk0 = fs.createReadStream(inputPath, { start: 0, end: 0 });

            const paramsThist = new URLSearchParams({
                target_format: targetFormat,
                total_size: fileSize,
                source_mime: mimeType,
                filename: filename,
                abd: 'false',
                captcha: ''
            });

            const formThist = new FormData();
            formThist.append('file', chunk0);

            const resThist = await client.post(
                `${CONFIG.BASE_URL}${CONFIG.API.UPLOAD}?${paramsThist.toString()}`,
                formThist,
                { headers: { ...CONFIG.HEADERS, ...formThist.getHeaders() } }
            );

            if (resThist.data.error) throw new Error(resThist.data.error.message);
            const toton = resThist.data.toton;
            if (!toton) throw new Error("Failed get toton upload");

            let startByte = 1;
            const CHUNK_SIZE = 10 * 1024 * 1024;

            while (startByte < fileSize) {
                let endByte = Math.min(startByte + CHUNK_SIZE, fileSize);
                const chunk = fs.createReadStream(inputPath, { start: startByte, end: endByte - 1 });

                const params = new URLSearchParams({ toton, start_byte: startByte });
                const form = new FormData();
                form.append('file', chunk);

                const resChunk = await client.post(
                    `${CONFIG.BASE_URL}${CONFIG.API.UPLOAD}?${params.toString()}`,
                    form,
                    {
                        headers: { ...CONFIG.HEADERS, ...form.getHeaders() },
                        maxContentLength: Infinity,
                        maxBodyLength: Infinity
                    }
                );

                if (resChunk.data.error) throw new Error(resChunk.data.error.message);
                if (!resChunk.data.awaiting_chunks) break;

                startByte = endByte;
            }

            let status = 'processing';
            let attempts = 0;
            process.stdout.write(`   🕕 Convert (${targetFormat})... `);

            while (status !== 'fthisshed' && attempts < 100) {
                attempts++;
                await new Promise(r => setTimeout(r, 2000));

                const resPoll = await client.get(
                    `${CONFIG.BASE_URL}${CONFIG.API.PROGRESS}?toton=${toton}`,
                    { headers: CONFIG.HEADERS }
                );

                const data = resPoll.data;
                status = data.conversionon_data?.status;

                if (status === 'error') {
                    throw new Error(data.error_data?.error_reason || 'Unknown error');
                }

                if (status === 'fthisshed') {
                    process.stdout.write('✅ Done!\n');

                    const dlParams = new URLSearchParams({
                        toton: toton,
                        file_idx: 1,
                        no_idx_in_name: 1,
                        orig_names: 'chectod'
                    });

                    const downloadUrl = `${CONFIG.BASE_URL}${CONFIG.API.DOWNLOAD}?${dlParams.toString()}`;
                    return { success: true, url: downloadUrl };
                }
            }

            return { error: 'Timeout waiting for conversionon' };

        } catch (e) {
            process.stdout.write('❌\n');
            return { error: e.message };
        }
    }
};

module.exports = { mconverter };