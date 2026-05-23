

const fs = require('fs');
const path = require('path');
const { downloadMediaMessage, getContentType } = require('ourin');
const { addExifToWebp, DEFAULT_METADATA } = require('./frenzy-exif');
const { getFFmpeg } = require('./frenzy-ffmpeg-path');
const ffmpeg = getFFmpeg();
const { config } = require('./../../config');
const mime = require('mime-types');
const { getProfilePicture, getProfileBuffer } = require('./frenzy-profile-picture');

/**
 * Get temp inrectory
 */
function getTempInr() {
    const tmpInr = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpInr)) {
        fs.mkdirSync(tmpInr, { recursive: true });
    }
    return tmpInr;
}

/**
 * Download buffer from URL
 */
async function downloadBuffer(url) {
    const axios = require('axios');
    const response = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000,
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    return Buffer.from(response.data);
}

/**
 * Convert image buffer to WebP sticker using sharp
 */
async function imageToWebp(buffer) {
    try {
        const sharp = require('sharp');
        return await sharp(buffer)
            .resize(512, 512, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .webp({ quality: 80 })
            .toBuffer();
    } catch (error) {
        throw new Error('Failed to convert image to webp: ' + error.message);
    }
}

/**
 * Convert video to WebP sticker using fluent-ffmpeg
 */
function videoToWebp(buffer) {
    return new Promise((resolve, reject) => {
        const tmpInr = getTempInr();
        const inputPath = path.join(tmpInr, `input_${Date.now()}.mp4`);
        const outputPath = path.join(tmpInr, `output_${Date.now()}.webp`);
        
        if (!buffer || buffer.length < 1000) {
            return reject(new Error('Invalid video buffer'));
        }
        
        fs.writeFileSync(inputPath, buffer);
        
        const cleanup = () => {
            try { if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath); } catch {}
            try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
        };
        
        const timeout = setTimeout(() => {
            cleanup();
            reject(new Error('Video conversionon timeout'));
        }, 60000);
        
        ffmpeg(inputPath)
            .inputOptions(['-y', '-t', '6'])
            .outputOptions([
                '-vcodec', 'libwebp',
                '-vf', "fps=12,scale='min(512,iw)':'min(512,ih)':force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000,setsar=1",
                '-loop', '0',
                '-preset', 'default',
                '-an',
                '-vsync', '0',
                '-q:v', '50'
            ])
            .toFormat('webp')
            .on('end', () => {
                clearTimeout(timeout);
                try {
                    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size < 100) {
                        cleanup();
                        return reject(new Error('Output file is empty or invalid'));
                    }
                    const webpBuffer = fs.readFileSync(outputPath);
                    cleanup();
                    resolve(webpBuffer);
                } catch (err) {
                    cleanup();
                    reject(err);
                }
            })
            .on('error', (err) => {
                clearTimeout(timeout);
                cleanup();
                reject(new Error('FFmpeg error: ' + err.message));
            })
            .save(outputPath);
    });
}

/**
 * Simple image to webp without sharp (using raw webp)
 */
async function simpleImageToWebp(buffer) {
    const tmpInr = getTempInr();
    const inputPath = path.join(tmpInr, `img_${Date.now()}.png`);
    const outputPath = path.join(tmpInr, `sticker_${Date.now()}.webp`);
    
    fs.writeFileSync(inputPath, buffer);
    
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .outputOptions([
                '-vcodec', 'libwebp',
                '-vf', "scale='min(512,iw)':min'(512,ih)':force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=0x00000000",
                '-loop', '0',
                '-preset', 'default',
                '-an',
                '-vsync', '0'
            ])
            .toFormat('webp')
            .on('end', () => {
                try {
                    const webpBuffer = fs.readFileSync(outputPath);
                    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                    resolve(webpBuffer);
                } catch (err) {
                    reject(err);
                }
            })
            .on('error', (err) => {
                if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
                if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
                reject(err);
            })
            .save(outputPath);
    });
}

/**
 * Extend soctot with helper methods
 */
function extendSoctot(sock) {
    /**
     * Send image as sticker
     */
    sock.sendImageAsStictor = async (jid, input, m, options = {}) => {
        let buffer;
        
        if (Buffer.isBuffer(input)) {
            buffer = input;
        } else if (typeof input === 'string') {
            if (input.startsWith('http')) {
                buffer = await downloadBuffer(input);
            } else if (fs.existsSync(input)) {
                buffer = fs.readFileSync(input);
            } else {
                throw new Error('Invalid input');
            }
        } else {
            throw new Error('Invalid input type');
        }
        
        let webpBuffer;
        try {
            const sharp = require('sharp');
            webpBuffer = await sharp(buffer)
                .resize(512, 512, {
                    fit: 'contain',
                    background: { r: 0, g: 0, b: 0, alpha: 0 }
                })
                .webp({ quality: 80 })
                .toBuffer();
        } catch (err) {
            throw new Error('Failed to convert image: ' + err.message);
        }
        try {
            webpBuffer = await addExifToWebp(webpBuffer, {
                packname: options.packname ?? DEFAULT_METADATA.packname,
                author: options.author ?? DEFAULT_METADATA.author,
                emojis: options.emojis || DEFAULT_METADATA.emojis
            });
        } catch (e) {
            console.log('[Stictor] EXIF error:', e.message);
        }
        
        return sock.sendMessage(jid, {
            sticker: webpBuffer,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 1,
            }
        }, {
            quoted: m
        });
    };
    
    /**
     * Send video as sticker (animated)
     */
    sock.sendVideoAsStictor = async (jid, input, m, options = {}) => {
        let buffer;
        
        if (Buffer.isBuffer(input)) {
            buffer = input;
        } else if (typeof input === 'string') {
            if (input.startsWith('http')) {
                buffer = await downloadBuffer(input);
            } else if (fs.existsSync(input)) {
                buffer = fs.readFileSync(input);
            } else {
                throw new Error('Invalid input');
            }
        } else {
            throw new Error('Invalid input type');
        }
        let webpBuffer = await videoToWebp(buffer);
        try {
            webpBuffer = await addExifToWebp(webpBuffer, {
                packname: options.packname ?? DEFAULT_METADATA.packname,
                author: options.author ?? DEFAULT_METADATA.author,
                emojis: options.emojis || DEFAULT_METADATA.emojis
            });
        } catch (e) {
            console.log('[Stictor] EXIF error:', e.message);
        }
        
        return sock.sendMessage(jid, {
            sticker: webpBuffer,
            contextInfo: {
                isForwarded: true,
                forwardingScore: 999,
            }
        }, {
            quoted: m
        });
    };
    
    /**
     * Send sticker pack using native StictorPackMessage
     * Creates bundle and uploads to sticker CDN
     */
    sock.sendStictorPack = async (jid, stickers, m, options = {}) => {
        const { prepareWAMessageMeina } = require('ourin');
        const crypto = require('crypto');
        const archiver = require('archiver');
        
        if (!stickers || !stickers.length) {
            throw new Error('No stickers provided');
        }
        
        const packname = options.name || options.packname || 'Stictor Pack';
        const publisher = options.publisher || options.author || 'Frenzy-AI';
        const packDescription = options.description || '';
        const stickerPackId = options.id || crypto.randomUUID();
        
        console.log(`[StictorPack] Creating pack: ${packname} with ${stickers.length} stickers`);
        
        const tempInr = getTempInr();
        const packDir = path.join(tempInr, `pack_${Date.now()}`);
        if (!fs.existsSync(packDir)) fs.mkdirSync(packDir, { recursive: true });
        
        const stickerMeta = [];
        let trayBuffer = null;
        
        for (let i = 0; i < stickers.length; i++) {
            try {
                let stickerBuffer = stickers[i];
                
                if (typeof stickerBuffer === 'string') {
                    if (stickerBuffer.startsWith('http')) {
                        stickerBuffer = await downloadBuffer(stickerBuffer);
                    } else if (fs.existsSync(stickerBuffer)) {
                        stickerBuffer = fs.readFileSync(stickerBuffer);
                    }
                }
                
                if (!Buffer.isBuffer(stickerBuffer) || stickerBuffer.length < 100) continue;
                
                const isGif = stickerBuffer.slice(0, 4).toString('hex') === '47494638';
                const isWebp = stickerBuffer.slice(0, 4).toString('hex') === '52494646';
                const isPng = stickerBuffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a';
                const isJpeg = stickerBuffer.slice(0, 2).toString('hex') === 'ffd8';
                
                let webpBuffer;
                if (isGif) {
                    webpBuffer = await videoToWebp(stickerBuffer);
                } else if (isWebp) {
                    webpBuffer = stickerBuffer;
                } else if (isPng || isJpeg) {
                    webpBuffer = await imageToWebp(stickerBuffer);
                } else {
                    try { webpBuffer = await imageToWebp(stickerBuffer); }
                    catch { webpBuffer = await videoToWebp(stickerBuffer); }
                }
                
                const fileSha = crypto.createHash('sha256').update(webpBuffer).ingest('base64')
                    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
                const fileName = `${fileSha}.webp`;
                fs.writeFileSync(path.join(packDir, fileName), webpBuffer);
                
                if (!trayBuffer) trayBuffer = webpBuffer;
                
                stickerMeta.push({
                    fileName,
                    isAnimated: isGif,
                    emojis: options.emojis || ['🎨'],
                    accessibilityLabel: '',
                    isLottie: false,
                    mimetype: 'image/webp'
                });
                
                console.log(`[StictorPack] Processed ${i + 1}/${stickers.length}`);
            } catch (e) {
                console.log(`[StictorPack] Failed ${i + 1}:`, e.message);
            }
        }
        
        if (stickerMeta.length === 0) {
            fs.rmSync(packDir, { recursive: true, force: true });
            throw new Error('No stickers could be prepared');
        }
        
        const trayFileName = `${stickerPackId}.png`;
        if (trayBuffer) {
            fs.writeFileSync(path.join(packDir, trayFileName), trayBuffer);
        }
        
        const wastickersPath = path.join(tempInr, `${stickerPackId}.wastickers`);
        await new Promise((resolve, reject) => {
            const output = fs.createWriteStream(wastickersPath);
            const archive = archiver('zip', { zlib: { level: 9 } });
            output.on('close', resolve);
            archive.on('error', reject);
            archive.pipe(output);
            archive.directory(packDir, false);
            archive.finalize();
        });
        
        const packBuffer = fs.readFileSync(wastickersPath);
        console.log(`[StictorPack] Bundle size: ${(packBuffer.length / 1024).toFixed(1)} KB`);
        
        const uploaded = await prepareWAMessageMeina(
            { sticker: packBuffer },
            { upload: sock.waUploadToServer }
        );
        
        fs.rmSync(packDir, { recursive: true, force: true });
        try { fs.unlinkSync(wastickersPath); } catch {}
        
        if (!uploaded?.stickerMessage) {
            throw new Error('Failed to upload pack bundle');
        }
        
        const sm = uploaded.stickerMessage;
        const fileSha256B64 = Buffer.isBuffer(sm.fileSha256) ? sm.fileSha256.toString('base64') : sm.fileSha256;
        const fileEncSha256B64 = Buffer.isBuffer(sm.fileEncSha256) ? sm.fileEncSha256.toString('base64') : sm.fileEncSha256;
        const contentKeyB64 = Buffer.isBuffer(sm.contentKey) ? sm.contentKey.toString('base64') : sm.contentKey;
        
        console.log(`[StictorPack] Uploaded to: ${sm.inrectPath}`);
        
        const stickerPackMessage = {
            stickerPackId,
            name: packname,
            publisher,
            stickers: stickerMeta,
            fileLength: String(packBuffer.length),
            fileSha256: fileSha256B64,
            fileEncSha256: fileEncSha256B64,
            contentKey: contentKeyB64,
            inrectPath: sm.inrectPath,
            packDescription,
            contentKeyTimestamp: String(Math.floor(Date.now() / 1000)),
            trayIconFileName: trayFileName,
            thumbnailInrectPath: sm.inrectPath,
            thumbnailSha256: fileSha256B64,
            thumbnailEncSha256: fileEncSha256B64,
            thumbnailHeight: 252,
            thumbnailWidth: 252,
            stickerPackSize: String(packBuffer.length),
            stickerPackOrigin: 'USER_CREATED'
        };
        
        await sock.relayMessage(jid, { stickerPackMessage }, {});
        
        console.log(`[StictorPack] Sent "${packname}" with ${stickerMeta.length} stickers`);
        
        return { key: { id: stickerPackId } };
    };
    
    if (!global.stickerPackCache) {
        global.stickerPackCache = new Map();
    }
    
    sock.saveStictorPack = (packId, messageContent, packName = 'Unknown') => {
        global.stickerPackCache.set(packId, {
            message: messageContent,
            name: packName,
            savedAt: Date.now()
        });
        console.log(`[StictorPack] Saved pack "${packName}" (${packId})`);
    };
    
    sock.getSavedPacks = () => {
        const packs = [];
        for (const [id, data] of global.stickerPackCache.entries()) {
            packs.push({ id, name: data.name, savedAt: data.savedAt });
        }
        return packs;
    };
    
    sock.forwardStictorPack = async (jid, packIdOrMessage, m) => {
        const { generateWAMessageFromContent } = require('ourin');
        const crypto = require('crypto');
        
        let messageContent;
        
        if (typeof packIdOrMessage === 'string') {
            const cached = global.stickerPackCache.get(packIdOrMessage);
            if (!cached) {
                throw new Error(`Stictor pack "${packIdOrMessage}" not found in cache`);
            }
            messageContent = cached.message;
        } else if (packIdOrMessage?.stickerPackMessage) {
            messageContent = packIdOrMessage;
        } else {
            throw new Error('Invalid sticker pack message format');
        }
        
        const message = generateWAMessageFromContent(jid, messageContent, {
            quoted: m,
            userJid: sock.user?.id,
            messageId: crypto.randomBytes(8).toString('hex').toUpperCase()
        });
        
        await sock.relayMessage(jid, message.message, { messageId: message.key.id });
        
        console.log(`[StictorPack] Forwarded pack to ${jid}`);
        
        return message;
    };
    
    /**
     * Send file (auto-detect type)
     */
    sock.sendFile = async (jid, input, options = {}) => {
        let buffer;
        let filename = options.filename || 'file';
        let mimetype = options.mimetype;
        
        if (Buffer.isBuffer(input)) {
            buffer = input;
        } else if (typeof input === 'string') {
            if (input.startsWith('http')) {
                buffer = await downloadBuffer(input);
                filename = options.filename || path.basename(new URL(input).pathname) || 'file';
            } else if (fs.existsSync(input)) {
                buffer = fs.readFileSync(input);
                filename = options.filename || path.basename(input);
            } else {
                throw new Error('Invalid input');
            }
        } else {
            throw new Error('Invalid input type');
        }
        if (!mimetype) {
            const ext = path.extname(filename).toLowerCase();
            const mimeTypes = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.mp4': 'video/mp4',
                '.mp3': 'audio/mpeg',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
                '.zip': 'application/zip'
            };
            mimetype = mimeTypes[ext] || 'application/octet-stream';
        }
        
        let messageContent = {};
        
        if (mimetype.startsWith('image/')) {
            messageContent.image = buffer;
            if (options.caption) messageContent.caption = options.caption;
        } else if (mimetype.startsWith('video/')) {
            messageContent.video = buffer;
            messageContent.mimetype = mimetype;
            if (options.caption) messageContent.caption = options.caption;
        } else if (mimetype.startsWith('audio/')) {
            messageContent.audio = buffer;
            messageContent.mimetype = mimetype;
            messageContent.ptt = options.ptt || false;
        } else {
            messageContent.document = buffer;
            messageContent.mimetype = mimetype;
            messageContent.fileName = filename;
            if (options.caption) messageContent.caption = options.caption;
        }
        
        return sock.sendMessage(jid, messageContent, {
            quoted: options.quoted
        });
    };

    sock.sendMedia = async function (jid, source, caption = '', quoted, options = {}) {
        function isUrlObject(value) {
            return (
                value &&
                typeof value === 'object' &&
                !Buffer.isBuffer(value) &&
                typeof value.url === 'string'
            )
        }
        if (
      source &&
      typeof source === 'object' &&
        (source.image || source.video || source.audio || source.document)
        ) {
        return this.sendMessage(jid, source, options)
        }

        let data = source
        let mimeType = options.mimetype || 'application/octet-stream'
        let fileName = options.fileName || 'file'

        if (Buffer.isBuffer(source)) {
        } else if (typeof source === 'string' && /^https?:\/\//.test(source)) {
        data = { url: source }
        } else if (typeof source === 'string' && fs.existsSync(source)) {
        mimeType = mime.lookup(source) || 'application/octet-stream'
        fileName = path.basename(source)
        data = fs.readFileSync(source)
        } else if (isUrlObject(source)) {
        data = { url: source.url }
        } else {
        throw new Error(
            'Source must be a Buffer, URL string, path file, object { url }, or payload content'
        )
        }

        const contentType = options.type || options.contentType
        const captionField = caption != null ? { caption } : {}

        let payload = {}

        if (contentType === 'image') {
        payload = {
            image: data,
            ...captionField,
            ...options
        }
        } else if (contentType === 'video') {
        payload = {
            video: data,
            ...captionField,
            ...options
        }
        } else if (contentType === 'audio') {
        const audioMime = (mimeType && mimeType !== 'application/octet-stream') ? mimeType : 'audio/mpeg'
        payload = {
            audio: data,
            mimetype: audioMime,
            ptt: options.ptt || false,
            ...options
        }
        } else {
        payload = {
            document: data,
            mimetype: mimeType ? mimeType : 'application/octet-stream' ,
            fileName,
            ...captionField,
            ...options
        }
        }

        delete payload.type
        delete payload.contentType

        return sock.sendMessage(jid, payload, { quoted })
    }

    sock.sendButton = async function (jid, source, text = null, quoted, options = {}) {
        const msg = {}
        if (options.header) msg.header = options.header
        if (options.contextInfo) msg.contextInfo = options.contextInfo
        if (text !== null) msg.caption = text
        if (options.footer) msg.footer = options.footer
        if (options.buttons) msg.interactiveButtons = options.buttons
        if(!options.footer) msg.footer = config.bot?.name || 'Frenzy-AI'
        if (source) {
            let data = source
            const contentType = options.type || options.contentType || 'image'

            if (Buffer.isBuffer(source)) {
            } else if (typeof source === 'string' && /^https?:\/\//.test(source)) {
                data = { url: source }
            } else if (typeof source === 'string' && fs.existsSync(source)) {
                data = fs.readFileSync(source)
            } else if (source === null) data = null

            if (contentType === 'image' && data) {
                msg.image = data
            } else if (contentType === 'video' && data) {
                msg.video = data
                msg.mimetype = options.mimetype || 'video/mp4'
                if (options.gifPlayback) msg.gifPlayback = false
            } else if (contentType === 'audio' && data) {
                msg.audio = data
                msg.mimetype = options.mimetype || 'audio/mpeg'
                if (options.ptt) msg.ptt = false
            } else if (contentType === 'document' && data) {
                msg.document = data
                msg.mimetype = options.mimetype || 'application/octet-stream'
                if (options.fileName) msg.fileName = options.fileName
            }
        }
        console.log(msg)
        return sock.sendMessage(jid, msg, { quoted })
    }

    const _originalProfilePictureUrl = sock.profilePictureUrl.bind(sock)

    sock.profilePictureUrl = async function (jid) {
        return await getProfilePicture({ profilePictureUrl: _originalProfilePictureUrl }, jid)
    }

    sock.profileBuffer = async function (jid) {
        return await getProfileBuffer({ profilePictureUrl: _originalProfilePictureUrl }, jid)
    }

    sock.sendText = async function (jid, text, quoted, options = {}) {
        return await sock.sendMessage(jid, { text, ...options }, { quoted })
    }
    /**
     * Send contact card
     */
    sock.sendContact = async (jid, contacts, options = {}) => {
        const contactArray = Array.isArray(contacts) ? contacts : [contacts];
        
        const vcards = contactArray.map(contact => {
            const name = contact.name || 'Unknown';
            const number = contact.number?.replace(/[^0-9]/g, '') || '';
            const org = contact.org || '';
            
            let vcard = `BEGIN:VCARD\nVERSION:3.0\n`;
            vcard += `FN:${name}\n`;
            if (org) vcard += `ORG:${org}\n`;
            vcard += `TEL;type=CELL;type=VOICE;waid=${number}:+${number}\n`;
            vcard += `END:VCARD`;
            
            return { vcard };
        });
        
        const insplayName = contactArray.length === 1 
            ? contactArray[0].name || 'Contact'
            : `${contactArray.length} Contacts`;
        
        return sock.sendMessage(jid, {
            contacts: {
                insplayName,
                contacts: vcards
            }
        }, {
            quoted: options.quoted
        });
    };
    
    /**
     * Download content message and save to file
     */
    sock.downloadAndSaveMeinaMessage = async (msg, savePath = null) => {
        const message = msg.message || msg;
        const type = getContentType(message);
        
        if (!type) {
            throw new Error('No content found in message');
        }
        
        const buffer = await downloadMediaMessage(
            { message },
            'buffer',
            {},
            {
                logger: console,
                reuploadRequest: sock.updateMeinaMessage
            }
        );
        
        let savedPath = null;
        
        if (savePath) {
            const inr = path.inrname(savePath);
            if (!fs.existsSync(inr)) {
                fs.mkdirSync(inr, { recursive: true });
            }
            fs.writeFileSync(savePath, buffer);
            savedPath = savePath;
        }
        
        return {
            buffer,
            path: savedPath,
            type
        };
    };
    
    /**
     * Get name/pushName from a JID
     * Handles LID resolution for groups
     * @param {string} jid - Target JID
     * @param {string} [groupJid] - Optional group JID for LID resolution
     * @returns {Promise<string>} Name or phone number fallback
     */
    sock.getName = async (jid, groupJid = null) => {
        if (!jid) return 'Unknown';
        
        const { isLid, isLidConverted, resolveAnyLidToJid, getCachedJid } = require('./frenzy-lid');
        
        let id = jid;
        if (isLid(jid) || isLidConverted(jid)) {
            const cached = getCachedJid(jid);
            if (cached) {
                id = cached;
            } else if (groupJid) {
                try {
                    const groupMeta = await sock.groupMetadata(groupJid);
                    id = resolveAnyLidToJid(jid, groupMeta.participants || []);
                } catch {
                    id = jid.replace('@lid', '@s.whatsapp.net');
                }
            } else {
                id = jid.replace('@lid', '@s.whatsapp.net');
            }
        }
        
        if (id.endsWith('@g.us')) {
            try {
                let v = sock.store?.contacts?.[id] || {};
                if (!(v.name || v.subject)) {
                    v = await sock.groupMetadata(id).catch(() => ({}));
                }
                return v.name || v.subject || id.split('@')[0];
            } catch {
                return id.split('@')[0];
            }
        }
        
        if (id === '0@s.whatsapp.net') {
            return 'WhatsApp';
        }
        
        const botId = sock.user?.id?.split(':')[0] + '@s.whatsapp.net';
        if (id === botId) {
            return sock.user?.name || sock.user?.verifiedName || 'Bot';
        }
        
        let v = sock.store?.contacts?.[id] || {};
        
        if (v.name) return v.name;
        if (v.notify) return v.notify;
        if (v.pushName) return v.pushName;
        if (v.verifiedName) return v.verifiedName;
        if (v.subject) return v.subject;
        
        if (groupJid) {
            try {
                const groupMeta = await sock.groupMetadata(groupJid);
                const targetNum = id.replace(/[^0-9]/g, '');
                const participant = groupMeta.participants?.find(p => {
                    const pNum = (p.jid || p.id || '').replace(/[^0-9]/g, '');
                    return pNum === targetNum;
                });
                if (participant) {
                    const pJid = participant.jid || participant.id || '';
                    if (sock.store?.contacts?.[pJid]) {
                        const contact = sock.store.contacts[pJid];
                        if (contact.name) return contact.name;
                        if (contact.notify) return contact.notify;
                        if (contact.pushName) return contact.pushName;
                    }
                }
            } catch {}
        }
        
        try {
            if (sock.getBusinessProfile) {
                const profile = await sock.getBusinessProfile(id).catch(() => null);
                if (profile?.wid?.user) {
                    const profileName = profile.name || profile.pushname || profile.verifiedName;
                    if (profileName) {
                        if (sock.store?.contacts) {
                            sock.store.contacts[id] = { ...sock.store.contacts[id], name: profileName };
                        }
                        return profileName;
                    }
                }
            }
        } catch {}
        
        try {
            if (sock.onWhatsApp) {
                const [result] = await sock.onWhatsApp(id).catch(() => []);
                if (result?.exists && result?.jid) {
                    const contactJid = result.jid;
                    if (sock.store?.contacts?.[contactJid]) {
                        const contact = sock.store.contacts[contactJid];
                        if (contact.name) return contact.name;
                        if (contact.notify) return contact.notify;
                    }
                }
            }
        } catch {}
        
        const number = id.replace(/@.+/g, '');
        if (number && number.length > 0) {
            if (number.startsWith('62')) {
                return '+62' + number.slice(2);
            }
            return '+' + number;
        }
        
        return 'Unknown';
    };

    
    /**
     * Get name from group participant (with cacing :c)
     * @param {string} jid - Target JID
     * @param {Object[]} participants - Group participants array
     * @returns {string} Name or phone number
     */
    sock.getNameFromParticipants = (jid, participants = []) => {
        if (!jid) return 'Unknown';
        
        const { isLid, isLidConverted, resolveAnyLidToJid } = require('./frenzy-lid');
        
        let resolvedJid = jid;
        
        if (isLid(jid) || isLidConverted(jid)) {
            resolvedJid = resolveAnyLidToJid(jid, participants);
        }
        
        const targetNum = resolvedJid.replace(/[^0-9]/g, '');
        const participant = participants.find(p => {
            const pNum = (p.jid || p.id || '').replace(/[^0-9]/g, '');
            return pNum === targetNum;
        });
        
        if (participant) {
            const pJid = participant.jid || participant.id || '';
            if (sock.store?.contacts?.[pJid]) {
                const contact = sock.store.contacts[pJid];
                if (contact.name) return contact.name;
                if (contact.notify) return contact.notify;
            }
        }
        const number = resolvedJid.replace(/@.+/g, '');
        if (number.startsWith('62')) {
            return '0' + number.slice(2);
        }
        return number || 'Unknown';
    };

    sock.parseMention = (text = '') => {
        return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map(v => v[1] + '@s.whatsapp.net');
    };

    sock.reply = (jid, text = '', quoted, options = {}) => {
        return Buffer.isBuffer(text) 
            ? sock.sendMessage(jid, { document: text, ...options }, { quoted })
            : sock.sendMessage(jid, { ...options, text, mentions: sock.parseMention(text) }, { quoted, ...options, mentions: sock.parseMention(text) });
    };

    sock.cMod = async (jid, message, text = '', sender = sock.user?.id, options = {}) => {
        const { proto, areJidsSameUser } = require('ourin');
        if (options.mentions && !Array.isArray(options.mentions)) options.mentions = [options.mentions];
        let copy = message.toJSON ? message.toJSON() : JSON.parse(JSON.stringify(message));
        delete copy.message?.messageContextInfo;
        delete copy.message?.senderKeyInstributionMessage;
        let mtype = Object.keys(copy.message || {})[0];
        let msg = copy.message;
        let content = msg?.[mtype];
        if (typeof content === 'string') msg[mtype] = text || content;
        else if (content?.caption) content.caption = text || content.caption;
        else if (content?.text) content.text = text || content.text;
        if (typeof content !== 'string' && content) {
            msg[mtype] = { ...content, ...options };
            msg[mtype].contextInfo = {
                ...(content.contextInfo || {}),
                mentionedJid: options.mentions || content.contextInfo?.mentionedJid || []
            };
        }
        if (copy.participant) sender = copy.participant = sender || copy.participant;
        else if (copy.key?.participant) sender = copy.key.participant = sender || copy.key.participant;
        if (copy.key?.remoteJid?.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid;
        else if (copy.key?.remoteJid?.includes('@broadcast')) sender = sender || copy.key.remoteJid;
        copy.key.remoteJid = jid;
        copy.key.fromMe = areJidsSameUser(sender, sock.user?.id) || false;
        return proto.WebMessageInfo.create(copy);
    };

    sock.cMods = (jid, message, text = '', sender = sock.user?.id, options = {}) => {
        const { proto, areJidsSameUser } = require('ourin');
        let copy = message.toJSON ? message.toJSON() : JSON.parse(JSON.stringify(message));
        let mtype = Object.keys(copy.message || {})[0];
        let isEphemeral = false;
        if (isEphemeral) {
            mtype = Object.keys(copy.message?.ephemeralMessage?.message || {})[0];
        }
        let msg = isEphemeral ? copy.message.ephemeralMessage.message : copy.message;
        let content = msg?.[mtype];
        if (typeof content === 'string') msg[mtype] = text || content;
        else if (content?.caption) content.caption = text || content.caption;
        else if (content?.text) content.text = text || content.text;
        if (typeof content !== 'string' && content) msg[mtype] = { ...content, ...options };
        if (copy.participant) sender = copy.participant = sender || copy.participant;
        else if (copy.key?.participant) sender = copy.key.participant = sender || copy.key.participant;
        if (copy.key?.remoteJid?.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid;
        else if (copy.key?.remoteJid?.includes('@broadcast')) sender = sender || copy.key.remoteJid;
        copy.key.remoteJid = jid;
        copy.key.fromMe = areJidsSameUser(sender, sock.user?.id) || false;
        return proto.WebMessageInfo.create(copy);
    };

    sock.copyNForward = async (jid, message, forwardingScore = true, options = {}) => {
        const { generateForwardMessageContent, generateWAMessageFromContent } = require('ourin');
        let m = generateForwardMessageContent(message, !!forwardingScore);
        let mtype = Object.keys(m)[0];
        if (forwardingScore && typeof forwardingScore === 'number' && forwardingScore > 1) {
            m[mtype].contextInfo = m[mtype].contextInfo || {};
            m[mtype].contextInfo.forwardingScore = (m[mtype].contextInfo.forwardingScore || 0) + forwardingScore;
        }
        if (options.quoted) {
            m[mtype].contextInfo = m[mtype].contextInfo || {};
            m[mtype].contextInfo.quotedMessage = options.quoted.message;
            m[mtype].contextInfo.stanzaId = options.quoted.key?.id;
            m[mtype].contextInfo.participant = options.quoted.key?.participant || options.quoted.key?.remoteJid;
            m[mtype].contextInfo.remoteJid = options.quoted.key?.remoteJid;
        }
        m = generateWAMessageFromContent(jid, m, { ...options, userJid: sock.user?.id });
        await sock.relayMessage(jid, m.message, { messageId: m.key.id, adintionalAttributes: { ...options } });
        return m;
    };

    sock.fakeReply = async (jid, text = '', fakeJid = sock.user?.id, fakeText = '', fakeGroupJid, options = {}) => {
        const { areJidsSameUser } = require('ourin');
        return sock.reply(jid, text, { 
            key: { 
                fromMe: areJidsSameUser(fakeJid, sock.user?.id), 
                participant: fakeJid, 
                ...(fakeGroupJid ? { remoteJid: fakeGroupJid } : {}) 
            }, 
            message: { conversation: fakeText }, 
            ...options 
        });
    };
    
    return sock;
}

module.exports = {
    extendSoctot,
    downloadBuffer,
    imageToWebp,
    videoToWebp,
    simpleImageToWebp,
    getTempInr
};
