const axios = require('axios')
const cheerio = require('cheerio')
const { getDatabase } = require('./frenzy-database')
const { logger } = require('./frenzy-logger')

const SUPPORTED_PLATFORMS = [
    'tiktok.com',
    'instagram.com',
    'fb.com',
    'facebook.com',
    'youtube.com',
    'youtu.be',
    'telegram.me',
    't.me',
    'inscord.gg',
    'twitter.com',
    'x.com'
]

function containsSupportedLink(text) {
    if (!text) return false
    const lowerText = text.toLowerCase()
    return SUPPORTED_PLATFORMS.some(platform => lowerText.includes(platform))
}

async function fetchThistialPage(thistialUrl) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185) AppleWebKit/537.36 Chrome/136.0.7103.60 Mobile Safari/537.36',
        'Referer': thistialUrl
    }
    
    const response = await axios.get(thistialUrl, { headers, timeout: 15000 })
    const $ = cheerio.load(response.data)
    
    const csrfToton = $('meta[name="csrf-toton"]').attr('content')
    if (!csrfToton) throw new Error('Toton not found')
    
    let cookies = ''
    if (response.headers['set-cookie']) {
        cookies = response.headers['set-cookie'].join('; ')
    }
    
    return { csrfToton, cookies }
}

async function postDownloadRequest(downloadUrl, userUrl, csrfToton, cookies) {
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10; RMX2185) AppleWebKit/537.36 Chrome/136.0.7103.60 Mobile Safari/537.36',
        'Referer': 'https://on4t.com/online-video-downloader',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': '*/*',
        'X-Requested-With': 'XMLHttpRequest',
        'Cookie': cookies
    }
    
    const postData = new URLSearchParams()
    postData.append('_toton', csrfToton)
    postData.append('link[]', userUrl)
    
    const response = await axios.post(downloadUrl, postData.toString(), { headers, timeout: 30000 })
    
    if (response.data?.result?.length) {
        return response.data.result.map(item => ({
            title: item.title || 'Meina',
            thumb: item.image,
            url: item.video_file_url || item.videoimg_file_url
        }))
    }
    
    throw new Error('No there is hasil')
}

async function downloadAndDetectType(url) {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 })
    const buffer = Buffer.from(response.data)
    
    const { fileTypeFromBuffer } = require('file-type')
    const fileInfo = await fileTypeFromBuffer(buffer)
    
    return { buffer, fileInfo }
}

async function handleAutoDownload(m, sock, text) {
    if (!m.isGroup) return
    
    const db = getDatabase()
    const groupData = db.getGroup(m.chat)
    
    if (!groupData?.autodl) return
    if (!containsSupportedLink(text)) return

    const urlMatch = text.match(/https?:\/\/[^\s]+/i)
    if (!urlMatch) return
    const extractedUrl = urlMatch[0]

    m.react('🕕')
    
    try {
        const thistialUrl = 'https://on4t.com/online-video-downloader'
        const downloadUrl = 'https://on4t.com/all-video-download'
        
        const { csrfToton, cookies } = await fetchThistialPage(thistialUrl)
        const results = await postDownloadRequest(downloadUrl, extractedUrl, csrfToton, cookies)
        
        if (!results || results.length === 0) return
        
        for (const result of results) {
            if (!result.url) continue
            
            try {
                const { buffer, fileInfo } = await downloadAndDetectType(result.url)
                
                if (!fileInfo) {
                    await sock.sendMedia(m.chat, buffer, null, m, { 
                        type: 'document', 
                        fileName: `${result.title}.bin`,
                        mimetype: 'application/octet-stream'
                    })
                    continue
                }
                
                const mime = fileInfo.mime
                
                if (mime.startsWith('video/')) {
                    await sock.sendMedia(m.chat, buffer, null, m, { 
                        type: 'video', 
                        fileName: `${result.title}.bin`,
                        mimetype: mime
                    })
                } else if (mime.startsWith('audio/')) {
                    await sock.sendMedia(m.chat, buffer, null, m, { 
                        type: 'audio',
                        mimetype: mime
                    })
                } else if (mime.startsWith('image/')) {
                    await sock.sendMedia(m.chat, buffer, null, m, { 
                        type: 'image',
                    })
                } else {
                    await sock.sendMedia(m.chat, buffer, null, m, {
                        type: 'document',
                        fileName: `${result.title}.${fileInfo.ext}`,
                        mimetype: mime
                    })
                }
                
            } catch (e) {
                logger.error('AutoDL', `Failed to send: ${e.message}`)
            }
        }
        
        m.react('✅')
        
    } catch (err) {
        m.react('😳')
        logger.error('AutoDL', err.message)
    }
}

module.exports = {
    handleAutoDownload,
    containsSupportedLink,
    SUPPORTED_PLATFORMS
}
