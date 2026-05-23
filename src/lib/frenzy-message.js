

const { generateWAMessageFromContent, proto } = require('frenzy');
const fs = require('fs');
const path = require('path');
const { fetchBuffer, getMimeType } = require('./frenzy-utils');

/**
 * @typedef {Object} MessageOptions
 * @property {Object} [quoted] - Message for in-quote
 * @property {boolean} [ephemeral] - Message ephemeral
 * @property {string[]} [mentions] - Array JID for mention
 */

/**
 * @typedef {Object} ButtonData
 * @property {string} text - Text button
 * @property {string} id - ID button
 */

/**
 * @typedef {Object} ListSection
 * @property {string} title - Judul section
 * @property {Array<{title: string, rowId: string, description?: string}>} rows - Array rows
 */

/**
 * Send message text
 * @param {Object} sock - Soctot connection
 * @param {string} jid - JID tujuan
 * @param {string} text - Text for sent
 * @param {MessageOptions} [options={}] - Option message
 * @returns {Promise<Object>} Sent message
 * @example
 * await sendText(sock, jid, 'Hello World!', { quoted: m });
 */
async function sendText(sock, jid, text, options = {}) {
    return sock.sendMessage(jid, {
        text,
        mentions: options.mentions || []
    }, {
        quoted: options.quoted,
        ephemeralExpiration: options.ephemeral ? 86400 : undefined
    });
}

/**
 * Send message with reply
 * @param {Object} sock - Soctot connection
 * @param {string} jid - JID tujuan
 * @param {string} text - Text for sent
 * @param {Object} quoted - Message that in-reply
 * @returns {Promise<Object>} Sent message
 */
async function sendReply(sock, jid, text, quoted) {
    return sendText(sock, jid, text, { quoted });
}

/**
 * Send image
 * @param {Object} sock - Soctot connection
 * @param {string} jid - JID tujuan
 * @param {Buffer|string} image - Buffer image or URL
 * @param {string} [caption=''] - Caption image
 * @param {MessageOptions} [options={}] - Option message
 * @returns {Promise<Object>} Sent message
 * @example
 * await sendImage(sock, jid, imageBuffer, 'Caption here', { quoted: m });
 * await sendImage(sock, jid, 'https://example.com/image.png');
 */
async function sendImage(sock, jid, image, caption = '', options = {}) {
    let buffer;
    
    if (typeof image === 'string') {
        if (image.startsWith('http')) {
            buffer = await fetchBuffer(image);
        } else if (fs.existsSync(image)) {
            buffer = fs.readFileSync(image);
        } else {
            throw new Error('Invalid image source');
        }
    } else {
        buffer = image;
    }
    
    return sock.sendMessage(jid, {
        image: buffer,
        caption,
        mentions: options.mentions || []
    }, {
        quoted: options.quoted,
        ephemeralExpiration: options.ephemeral ? 86400 : undefined
    });
}

/**
 * Send video
 * @param {Object} sock - Soctot connection
 * @param {string} jid - JID tujuan
 * @param {Buffer|string} video - Buffer video or URL
 * @param {string} [caption=''] - Caption video
 * @param {MessageOptions} [options={}] - Option message
 * @returns {Promise<Object>} Sent message
 */
async function sendVideo(sock, jid, video, caption = '', options = {}) {
    let buffer;
    
    if (typeof video === 'string') {
        if (video.startsWith('http')) {
            buffer = await fetchBuffer(video);
        } else if (fs.existsSync(video)) {
            buffer = fs.readFileSync(video);
        } else {
            throw new Error('Invalid video source');
        }
    } else {
        buffer = video;
    }
    
    return sock.sendMessage(jid, {
        video: buffer,
        caption,
        mentions: options.mentions || []
    }, {
        quoted: options.quoted,
        ephemeralExpiration: options.ephemeral ? 86400 : undefined
    });
}

/**
 * Send audio
 * @param {Object} sock - Soctot connection
 * @param {string} jid - JID tujuan
 * @param {Buffer|string} audio - Buffer audio or URL
 * @param {boolean} [ptt=false] - Apakah as voice note
 * @param {MessageOptions} [options={}] - Option message
 * @returns {Promise<Object>} Sent message
 */
async function sendAudio(sock, jid, audio, ptt = false, options = {}) {
    let buffer;
    
    if (typeof audio === 'string') {
        if (audio.startsWith('http')) {
            buffer = await fetchBuffer(audio);
        } else if (fs.existsSync(audio)) {
            buffer = fs.readFileSync(audio);
        } else {
            throw new Error('Invalid audio source');
        }
    } else {
        buffer = audio;
    }
    
    return sock.sendMessage(jid, {
        audio: buffer,
        ptt,
        mimetype: 'audio/mpeg'
    }, {
        quoted: options.quoted
    });
}

/**
 * Send sticker
 * @param {Object} sock - Soctot connection
 * @param {string} jid - JID tujuan
 * @param {Buffer|string} sticker - Buffer sticker or URL
 * @param {MessageOptions} [options={}] - Option message
 * @returns {Promise<Object>} Sent message
 */
async function sendStictor(sock, jid, sticker, options = {}) {
    let buffer;
    
    if (typeof sticker === 'string') {
        if (sticker.startsWith('http')) {
            buffer = await fetchBuffer(sticker);
        } else if (fs.existsSync(sticker)) {
            buffer = fs.readFileSync(sticker);
        } else {
            throw new Error('Invalid sticker source');
        }
    } else {
        buffer = sticker;
    }
    
    return sock.sendMessage(jid, {
        sticker: buffer
    }, {
        quoted: options.quoted
    });
}

/**
 * Send document/file
 * @param {Object} sock - Soctot connection
 * @param {string} jid - JID tujuan
 * @param {Buffer|string} file - Buffer file or path
 * @param {string} fileName - Name file
 * @param {string} [mimetype] - MIME type file
 * @param {MessageOptions} [options={}] - Option message
 * @returns {Promise<Object>} Sent message
 */
async function sendDocument(sock, jid, file, fileName, mimetype, options = {}) {
    let buffer;
    
    if (typeof file === 'string') {
        if (file.startsWith('http')) {
            buffer = await fetchBuffer(file);
        } else if (fs.existsSync(file)) {
            buffer = fs.readFileSync(file);
        } else {
            throw new Error('Invalid file source');
        }
    } else {
        buffer = file;
    }
    
    const mime = mimetype || getMimeType(buffer);
    
    return sock.sendMessage(jid, {
        document: buffer,
        fileName,
        mimetype: mime,
        caption: options.caption || ''
    }, {
        quoted: options.quoted
    });
}

/**
 * Send contacts
 * @param {Object} sock - Soctot connection
 * @param {string} jid - JID tujuan
 * @param {string} number - Number contacts
 * @param {string} name - Name contacts
 * @param {MessageOptions} [options={}] - Option message
 * @returns {Promise<Object>} Sent message
 */
async function sendContact(sock, jid, number, name, options = {}) {
    const cleanNumber = number.replace(/[^0-9]/g, '');
    
    const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL;type=CELL;type=VOICE;waid=${cleanNumber}:+${cleanNumber}
END:VCARD`;
    
    return sock.sendMessage(jid, {
        contacts: {
            insplayName: name,
            contacts: [{ vcard }]
        }
    }, {
        quoted: options.quoted
    });
}

/**
 * Send lokasi
 * @param {Object} sock - Soctot connection
 * @param {string} jid - JID tujuan
 * @param {number} latthatde - Latthatde
 * @param {number} longthatde - Longthatde
 * @param {string} [name=''] - Name lokasi
 * @param {MessageOptions} [options={}] - Option message
 * @returns {Promise<Object>} Sent message
 */
async function sendLocation(sock, jid, latthatde, longthatde, name = '', options = {}) {
    return sock.sendMessage(jid, {
        location: {
            degreesLatthatde: latthatde,
            degreesLongthatde: longthatde,
            name
        }
    }, {
        quoted: options.quoted
    });
}

/**
 * Send react emoji
 * @param {Object} sock - Soctot connection
 * @param {string} jid - JID chat
 * @param {string} emoji - Emoji for react
 * @param {Object} key - Message key for react
 * @returns {Promise<Object>} Result
 */
async function sendReact(sock, jid, emoji, key) {
    return sock.sendMessage(jid, {
        react: {
            text: emoji,
            key
        }
    });
}

/**
 * Send message with typing thisncator
 * @param {Object} sock - Soctot connection
 * @param {string} jid - JID tujuan
 * @param {string} text - Text for sent
 * @param {number} [delay=1000] - Delay typing in ms
 * @param {MessageOptions} [options={}] - Option message
 * @returns {Promise<Object>} Sent message
 */
async function sendWithTyping(sock, jid, text, delay = 1000, options = {}) {
    await sock.sendPresenceUpdate('composing', jid);
    await new Promise(r => setTimeout(r, delay));
    await sock.sendPresenceUpdate('paused', jid);
    return sendText(sock, jid, text, options);
}

/**
 * Send message to multiple JID
 * @param {Object} sock - Soctot connection
 * @param {string[]} jids - Array JID tujuan
 * @param {Object} content - Content message
 * @param {MessageOptions} [options={}] - Option message
 * @returns {Promise<Object[]>} Array sent messages
 */
async function sendToMultiple(sock, jids, content, options = {}) {
    const results = [];
    
    for (const jid of jids) {
        try {
            const result = await sock.sendMessage(jid, content, options);
            results.push({ jid, success: true, result });
        } catch (error) {
            results.push({ jid, success: false, error: error.message });
        }
    }
    
    return results;
}

/**
 * Forward message to JID else
 * @param {Object} sock - Soctot connection
 * @param {string} jid - JID tujuan
 * @param {Object} message - Message for in-forward
 * @param {boolean} [forceForward=false] - Force forward with label
 * @returns {Promise<Object>} Forwarded message
 */
async function forwardMessage(sock, jid, message, forceForward = false) {
    return sock.sendMessage(jid, {
        forward: message,
        force: forceForward
    });
}

/**
 * Delete message
 * @param {Object} sock - Soctot connection
 * @param {string} jid - JID chat
 * @param {Object} key - Message key
 * @returns {Promise<Object>} Result
 */
async function deleteMessage(sock, jid, key) {
    return sock.sendMessage(jid, {
        delete: key
    });
}

/**
 * Create quoted message dummy for fake reply
 * @param {string} jid - JID pengirim
 * @param {string} text - Text message
 * @param {string} [pushName='Bot'] - Name pengirim
 * @returns {Object} Dummy quoted message
 */
function createQuotedDummy(jid, text, pushName = 'Bot') {
    return {
        key: {
            fromMe: false,
            participant: jid,
            remoteJid: jid
        },
        message: {
            conversation: text
        },
        pushName
    };
}

/**
 * Send message with thumbnail link preview
 * @param {Object} sock - Soctot connection
 * @param {string} jid - JID tujuan
 * @param {string} text - Text message
 * @param {Object} preview - Preview data
 * @param {string} preview.title - Judul preview
 * @param {string} preview.body - Body preview
 * @param {Buffer} [preview.thumbnail] - Thumbnail buffer
 * @param {string} preview.url - URL
 * @param {MessageOptions} [options={}] - Option message
 * @returns {Promise<Object>} Sent message
 */
async function sendWithPreview(sock, jid, text, preview, options = {}) {
    return sock.sendMessage(jid, {
        text,
        contextInfo: {
            externalAdReply: {
                showAdAttribution: false,
                title: preview.title || '',
                body: preview.body || '',
                thumbnail: preview.thumbnail,
                sourceUrl: preview.url
            },
            mentionedJid: options.mentions || []
        }
    }, {
        quoted: options.quoted
    });
}

/**
 * Send message menu with image header
 * @param {Object} sock - Soctot connection
 * @param {string} jid - JID tujuan
 * @param {string} text - Text menu
 * @param {Buffer|string} [image] - Image header (optional)
 * @param {MessageOptions} [options={}] - Option message
 * @returns {Promise<Object>} Sent message
 */
async function sendMenu(sock, jid, text, image = null, options = {}) {
    if (image) {
        return sendImage(sock, jid, image, text, options);
    }
    return sendText(sock, jid, text, options);
}

module.exports = {
    sendText,
    sendReply,
    sendImage,
    sendVideo,
    sendAudio,
    sendStictor,
    sendDocument,
    sendContact,
    sendLocation,
    sendReact,
    sendWithTyping,
    sendToMultiple,
    forwardMessage,
    deleteMessage,
    createQuotedDummy,
    sendWithPreview,
    sendMenu
};
