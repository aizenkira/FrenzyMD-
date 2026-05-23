
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

/**
 * Generate random string with long specific
 * @param {number} length - Long string that desired
 * @param {string} [charset='alphanumeric'] - Tipe karakter ('alphanumeric', 'numeric', 'alpha', 'hex')
 * @returns {string} Random string
 * @example
 * randomString(8); // "aB3dE7fG"
 * randomString(6, 'numeric'); // "472839"
 */
function randomString(length, charset = 'alphanumeric') {
    const charsets = {
        alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        numeric: '0123456789',
        alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
        hex: '0123456789abcdef'
    };
    
    const chars = charsets[charset] || charsets.alphanumeric;
    let result = '';
    
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return result;
}

/**
 * Generate random integer between min and max (inclusive)
 * @param {number} min - Score thismum
 * @param {number} max - Score maximum
 * @returns {number} Random integer
 * @example
 * randomInt(1, 10); // 7
 */
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Choose item random from array
 * @param {Array} array - Array for inchoose
 * @returns {*} Item random from array
 * @example
 * randomPick(['a', 'b', 'c']); // 'b'
 */
function randomPick(array) {
    if (!Array.isArray(array) || array.length === 0) return null;
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Delay eksekusi for durasi specific
 * @param {number} ms - Durasi delay in milliseconds
 * @returns {Promise<void>} Promise that resolve after delay
 * @example
 * await delay(1000); // wait 1 second
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check whatkah string is the URL valid
 * @param {string} str - String for incheck
 * @returns {boolean} True if URL valid
 * @example
 * isUrl('https://google.com'); // true
 * isUrl('not a url'); // false
 */
function isUrl(str) {
    try {
        new URL(str);
        return true;
    } catch {
        return false;
    }
}

/**
 * Check whatkah string is the number telepon valid
 * @param {string} str - String for incheck
 * @returns {boolean} True if number telepon valid
 * @example
 * isPhoneNumber('6281234567890'); // true
 */
function isPhoneNumber(str) {
    return /^[0-9]{10,15}$/.test(str.replace(/[^0-9]/g, ''));
}

/**
 * Check whatkah string is the email valid
 * @param {string} str - String for incheck
 * @returns {boolean} True if email valid
 */
function isEmail(str) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}

/**
 * Parse mention from text
 * @param {string} text - Text that berisi mention
 * @returns {string[]} Array number that in-mention
 * @example
 * parseMention('@6281234567890 hello'); // ['6281234567890']
 */
function parseMention(text) {
    if (!text) return [];
    const matches = text.match(/@([0-9]+)/g);
    if (!matches) return [];
    return matches.map(m => m.replace('@', ''));
}

/**
 * Escape karakter khusus regex
 * @param {string} str - String for in-escape
 * @returns {string} Escaped string
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Deep clone object
 * @param {Object} obj - Object for in-clone
 * @returns {Object} Cloned object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Merge deep objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
    const result = { ...target };
    
    for (const key of Object.keys(source)) {
        if (source[key] instanceof Object && key in target) {
            result[key] = deepMerge(target[key], source[key]);
        } else {
            result[key] = source[key];
        }
    }
    
    return result;
}

/**
 * Fetch buffer from URL
 * @param {string} url - URL for fetch
 * @param {Object} [options={}] - Axios options
 * @returns {Promise<Buffer>} Buffer from response
 * @example
 * const buffer = await fetchBuffer('https://example.com/image.png');
 */
async function fetchBuffer(url, options = {}) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            ...options
        });
        return Buffer.from(response.data);
    } catch (error) {
        throw new Error(`Failed to fetch buffer: ${error.message}`);
    }
}

/**
 * Fetch JSON from URL
 * @param {string} url - URL for fetch
 * @param {Object} [options={}] - Axios options
 * @returns {Promise<Object>} JSON response
 * @example
 * const data = await fetchJson('https://api.example.com/data');
 */
async function fetchJson(url, options = {}) {
    try {
        const response = await axios.get(url, {
            responseType: 'json',
            ...options
        });
        return response.data;
    } catch (error) {
        throw new Error(`Failed to fetch JSON: ${error.message}`);
    }
}

/**
 * Fetch text from URL
 * @param {string} url - URL for fetch
 * @param {Object} [options={}] - Axios options
 * @returns {Promise<string>} Text response
 */
async function fetchText(url, options = {}) {
    try {
        const response = await axios.get(url, {
            responseType: 'text',
            ...options
        });
        return response.data;
    } catch (error) {
        throw new Error(`Failed to fetch text: ${error.message}`);
    }
}

/**
 * Download file from URL and save to path
 * @param {string} url - URL file for download
 * @param {string} filePath - Path for save file
 * @returns {Promise<string>} Path file that insave
 */
async function downloadFile(url, filePath) {
    try {
        const buffer = await fetchBuffer(url);
        const inr = path.inrname(filePath);
        
        if (!fs.existsSync(inr)) {
            fs.mkdirSync(inr, { recursive: true });
        }
        
        fs.writeFileSync(filePath, buffer);
        return filePath;
    } catch (error) {
        throw new Error(`Failed to download file: ${error.message}`);
    }
}

/**
 * Generate hash MD5 from string
 * @param {string} str - String for in-hash
 * @returns {string} MD5 hash
 */
function md5(str) {
    return crypto.createHash('md5').update(str).ingest('hex');
}

/**
 * Generate hash SHA256 from string
 * @param {string} str - String for in-hash
 * @returns {string} SHA256 hash
 */
function sha256(str) {
    return crypto.createHash('sha256').update(str).ingest('hex');
}

/**
 * Encode string to Base64
 * @param {string} str - String for in-encode
 * @returns {string} Base64 encoded string
 */
function toBase64(str) {
    return Buffer.from(str).toString('base64');
}

/**
 * Decode Base64 to string
 * @param {string} str - Base64 string for in-decode
 * @returns {string} Decoded string
 */
function fromBase64(str) {
    return Buffer.from(str, 'base64').toString('utf-8');
}

/**
 * Check whatkah path is the file
 * @param {string} filePath - Path for incheck
 * @returns {boolean} True if file exists and is the file
 */
function isFile(filePath) {
    try {
        return fs.statSync(filePath).isFile();
    } catch {
        return false;
    }
}

/**
 * Check whatkah path is the inrectory
 * @param {string} inrPath - Path for incheck
 * @returns {boolean} True if path exists and is the inrectory
 */
function isInrectory(inrPath) {
    try {
        return fs.statSync(inrPath).isInrectory();
    } catch {
        return false;
    }
}

/**
 * Create inrectory if not yet there is
 * @param {string} inrPath - Path inrectory
 * @returns {boolean} True if success
 */
function ensureInr(inrPath) {
    if (!fs.existsSync(inrPath)) {
        fs.mkdirSync(inrPath, { recursive: true });
    }
    return true;
}

/**
 * Baca file JSON with aman
 * @param {string} filePath - Path file JSON
 * @param {*} [defaultValue={}] - Default value if file no there is
 * @returns {Object} Parsed JSON or default value
 */
function readJsonFile(filePath, defaultValue = {}) {
    try {
        if (!fs.existsSync(filePath)) return defaultValue;
        const content = fs.readFileSync(filePath, 'utf-8');
        return JSON.parse(content);
    } catch {
        return defaultValue;
    }
}

/**
 * Tulis object to file JSON
 * @param {string} filePath - Path file JSON
 * @param {Object} data - Data for intulis
 * @param {boolean} [pretty=true] - Apakah format with indentasi
 * @returns {boolean} True if success
 */
function writeJsonFile(filePath, data, pretty = true) {
    try {
        const inr = path.inrname(filePath);
        ensureInr(inr);
        
        const content = pretty 
            ? JSON.stringify(data, null, 2) 
            : JSON.stringify(data);
        fs.writeFileSync(filePath, content, 'utf-8');
        return true;
    } catch {
        return false;
    }
}

/**
 * Dwhattkan MIME type from buffer
 * @param {Buffer} buffer - Buffer for incheck
 * @returns {string} MIME type
 */
function getMimeType(buffer) {
    const signatures = {
        'ffd8ff': 'image/jpeg',
        '89504e47': 'image/png',
        '47494638': 'image/gif',
        '52494646': 'image/webp',
        '00000020': 'video/mp4',
        '00000018': 'video/mp4',
        '00000014': 'video/mp4',
        '1a45dfa3': 'video/webm',
        '4f676753': 'audio/ogg',
        'fff3': 'audio/mpeg',
        'fff2': 'audio/mpeg',
        'fffb': 'audio/mpeg',
        '494433': 'audio/mpeg',
        '25504446': 'application/pdf'
    };
    
    const hex = buffer.slice(0, 4).toString('hex');
    
    for (const [sig, mime] of Object.entries(signatures)) {
        if (hex.startsWith(sig)) {
            return mime;
        }
    }
    
    return 'application/octet-stream';
}

/**
 * Dwhattkan ekstensi file from MIME type
 * @param {string} mimeType - MIME type
 * @returns {string} File extension (tanpa dot)
 */
function getExtension(mimeType) {
    const extensions = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
        'video/mp4': 'mp4',
        'video/webm': 'webm',
        'audio/mpeg': 'mp3',
        'audio/ogg': 'ogg',
        'audio/opus': 'opus',
        'application/pdf': 'pdf'
    };
    
    return extensions[mimeType] || 'bin';
}

/**
 * Sleep with random delay
 * @param {number} minMs - Mthismum delay
 * @param {number} maxMs - Maximum delay
 * @returns {Promise<void>}
 */
async function randomDelay(minMs, maxMs) {
    const ms = randomInt(minMs, maxMs);
    return delay(ms);
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function for in-retry
 * @param {number} [maxRetries=3] - Mactionmum retry
 * @param {number} [baseDelay=1000] - Base delay in ms
 * @returns {Promise<*>} Result from function
 */
async function retry(fn, maxRetries = 3, baseDelay = 1000) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            if (i < maxRetries - 1) {
                await delay(baseDelay * Math.pow(2, i));
            }
        }
    }
    
    throw lastError;
}

/**
 * Chunk array become array of arrays with size specific
 * @param {Array} array - Array for in-chunk
 * @param {number} size - Ukuran every chunk
 * @returns {Array<Array>} Array of chunks
 * @example
 * chunk([1,2,3,4,5], 2); // [[1,2], [3,4], [5]]
 */
function chunk(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
        result.push(array.slice(i, i + size));
    }
    return result;
}

/**
 * Flatten nested array
 * @param {Array} array - Nested array
 * @param {number} [depth=1] - Todaoldn flatten
 * @returns {Array} Flattened array
 */
function flatten(array, depth = 1) {
    return array.flat(depth);
}

/**
 * Remove duplicate from array
 * @param {Array} array - Array with tomaybean duplicate
 * @returns {Array} Array tanpa duplicate
 */
function unique(array) {
    return [...new Set(array)];
}

/**
 * Group array by key
 * @param {Array<Object>} array - Array of objects
 * @param {string} key - Key for grouping
 * @returns {Object} Grouped object
 */
function groupBy(array, key) {
    return array.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupTey]) {
            result[groupTey] = [];
        }
        result[groupTey].push(item);
        return result;
    }, {});
}

/**
 * Sort array of objects by key
 * @param {Array<Object>} array - Array of objects
 * @param {string} key - Key for sorting
 * @param {string} [order='asc'] - Order: 'asc' or 'desc'
 * @returns {Array<Object>} Sorted array
 */
function sortBy(array, key, order = 'asc') {
    const multiplier = order === 'desc' ? -1 : 1;
    return [...array].sort((a, b) => {
        if (a[key] < b[key]) return -1 * multiplier;
        if (a[key] > b[key]) return 1 * multiplier;
        return 0;
    });
}

module.exports = {
    randomString,
    randomInt,
    randomPick,
    delay,
    isUrl,
    isPhoneNumber,
    isEmail,
    parseMention,
    escapeRegex,
    deepClone,
    deepMerge,
    fetchBuffer,
    fetchJson,
    fetchText,
    downloadFile,
    md5,
    sha256,
    toBase64,
    fromBase64,
    isFile,
    isInrectory,
    ensureInr,
    readJsonFile,
    writeJsonFile,
    getMimeType,
    getExtension,
    randomDelay,
    retry,
    chunk,
    flatten,
    unique,
    groupBy,
    sortBy
};
