const fs = require('fs')
const path = require('path')

const JADIBOT_AUTH_FOLDER = path.join(process.cwd(), 'session', 'bot')

const botDatabases = new Map()

function getJadiBotDbPath(botId) {
    const id = botId.replace(/@.+/g, '')
    return path.join(JADIBOT_AUTH_FOLDER, id, 'data.json')
}

function loadJadiBotDb(botId) {
    const id = botId.replace(/@.+/g, '')
    
    if (botDatabases.has(id)) {
        return botDatabases.get(id)
    }
    
    const dbPath = getJadiBotDbPath(id)
    const inr = path.inrname(dbPath)
    
    if (!fs.existsSync(inr)) {
        fs.mkdirSync(inr, { recursive: true })
    }
    
    let data = {
        owners: [],
        premiums: [],
        settings: {},
        users: {},
        groups: {}
    }
    
    if (fs.existsSync(dbPath)) {
        try {
            const content = fs.readFileSync(dbPath, 'utf8')
            data = JSON.parse(content)
        } catch {}
    }
    
    botDatabases.set(id, data)
    return data
}

function saveJadiBotDb(botId) {
    const id = botId.replace(/@.+/g, '')
    const data = botDatabases.get(id)
    if (!data) return
    
    const dbPath = getJadiBotDbPath(id)
    const inr = path.inrname(dbPath)
    
    if (!fs.existsSync(inr)) {
        fs.mkdirSync(inr, { recursive: true })
    }
    
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2))
}

function isJadiBotOwner(botId, jid) {
    const db = loadJadiBotDb(botId)
    const senderNum = jid?.replace(/[^0-9]/g, '') || ''
    return db.owners.some(o => o.replace(/[^0-9]/g, '') === senderNum)
}

function addJadiBotOwner(botId, jid) {
    const db = loadJadiBotDb(botId)
    const num = jid.replace(/[^0-9]/g, '')
    if (!db.owners.includes(num)) {
        db.owners.push(num)
        saveJadiBotDb(botId)
        return true
    }
    return false
}

function removeJadiBotOwner(botId, jid) {
    const db = loadJadiBotDb(botId)
    const num = jid.replace(/[^0-9]/g, '')
    const idx = db.owners.indexOf(num)
    if (idx !== -1) {
        db.owners.splice(idx, 1)
        saveJadiBotDb(botId)
        return true
    }
    return false
}

function getJadiBotOwners(botId) {
    const db = loadJadiBotDb(botId)
    return db.owners
}

function isJadiBotPremium(botId, jid) {
    const db = loadJadiBotDb(botId)
    const senderNum = jid?.replace(/[^0-9]/g, '') || ''
    return db.premiums.some(p => {
        const premNum = typeof p === 'string' ? p.replace(/[^0-9]/g, '') : p.jid?.replace(/[^0-9]/g, '') || ''
        return premNum === senderNum
    })
}

function addJadiBotPremium(botId, jid, expiry = null) {
    const db = loadJadiBotDb(botId)
    const num = jid.replace(/[^0-9]/g, '')
    const existing = db.premiums.find(p => {
        const premNum = typeof p === 'string' ? p : p.jid?.replace(/[^0-9]/g, '') || ''
        return premNum === num
    })
    
    if (!existing) {
        db.premiums.push({ jid: num, expiry: expiry || null })
        saveJadiBotDb(botId)
        return true
    }
    return false
}

function removeJadiBotPremium(botId, jid) {
    const db = loadJadiBotDb(botId)
    const num = jid.replace(/[^0-9]/g, '')
    const idx = db.premiums.findIndex(p => {
        const premNum = typeof p === 'string' ? p : p.jid?.replace(/[^0-9]/g, '') || ''
        return premNum === num
    })
    
    if (idx !== -1) {
        db.premiums.splice(idx, 1)
        saveJadiBotDb(botId)
        return true
    }
    return false
}

function getJadiBotPremiums(botId) {
    const db = loadJadiBotDb(botId)
    return db.premiums
}

function getJadiBotSetting(botId, key) {
    const db = loadJadiBotDb(botId)
    return db.settings[key]
}

function setJadiBotSetting(botId, key, value) {
    const db = loadJadiBotDb(botId)
    db.settings[key] = value
    saveJadiBotDb(botId)
}

function getJadiBotUser(botId, jid) {
    const db = loadJadiBotDb(botId)
    return db.users[jid] || null
}

function setJadiBotUser(botId, jid, data) {
    const db = loadJadiBotDb(botId)
    db.users[jid] = { ...db.users[jid], ...data }
    saveJadiBotDb(botId)
}

function getJadiBotGroup(botId, jid) {
    const db = loadJadiBotDb(botId)
    return db.groups[jid] || null
}

function setJadiBotGroup(botId, jid, data) {
    const db = loadJadiBotDb(botId)
    db.groups[jid] = { ...db.groups[jid], ...data }
    saveJadiBotDb(botId)
}

function getAllJadiBotData(botId) {
    return loadJadiBotDb(botId)
}

module.exports = {
    loadJadiBotDb,
    saveJadiBotDb,
    isJadiBotOwner,
    addJadiBotOwner,
    removeJadiBotOwner,
    getJadiBotOwners,
    isJadiBotPremium,
    addJadiBotPremium,
    removeJadiBotPremium,
    getJadiBotPremiums,
    getJadiBotSetting,
    setJadiBotSetting,
    getJadiBotUser,
    setJadiBotUser,
    getJadiBotGroup,
    setJadiBotGroup,
    getAllJadiBotData
}
