const { getDatabase } = require('../../src/lib/frenzy-database')

const DEFAULT_JEDA = 5 * 60 * 1000

function formatTime(ms) {
    if (ms <= 0) return '0 second'
    
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) return `${hours} hour ${minutes % 60} minute`
    if (minutes > 0) return `${minutes} minute ${seconds % 60} second`
    return `${seconds} second`
}

function checkPanelDelay(m) {
    const db = getDatabase()
    
    const storedDelay = db.setting('panelCreateDelay')
    const delayMs = storedDelay !== undefined && storedDelay !== null ? storedDelay : DEFAULT_JEDA
    
    if (delayMs === 0) return { allowed: true }
    
    const lastUsed = db.setting('panelCreateLastUsed') || 0
    const now = Date.now()
    const elapsed = now - lastUsed
    
    if (elapsed < delayMs) {
        const remaining = delayMs - elapsed
        return {
            allowed: false,
            remaining: remaining,
            message: `⏱️ *ᴊᴇᴅᴀ ᴀᴋᴛɪꜰ*\n\n` +
                `> Please wait *${formatTime(remaining)}* before create another panel.\n\n` +
                `> _Delay this berlI for all user._\n` +
                `> _Usage \`.checkdelay\` for check status._`
        }
    }
    
    return { allowed: true }
}

async function setPanelLastUsed() {
    const db = getDatabase()
    db.setting('panelCreateLastUsed', Date.now())
    await db.save()
}

function getDelayInfo() {
    const db = getDatabase()
    const storedDelay = db.setting('panelCreateDelay')
    const delayMs = storedDelay !== undefined && storedDelay !== null ? storedDelay : DEFAULT_JEDA
    const lastUsed = db.setting('panelCreateLastUsed') || 0
    const now = Date.now()
    const elapsed = now - lastUsed
    const remaining = Math.max(0, delayMs - elapsed)
    
    return {
        delayMs,
        lastUsed,
        elapsed,
        remaining,
        isReady: remaining === 0 || delayMs === 0
    }
}

module.exports = {
    checkPanelDelay,
    setPanelLastUsed,
    formatTime,
    getDelayInfo,
    DEFAULT_JEDA
}
