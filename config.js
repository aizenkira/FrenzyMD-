
//  read the config object all the way to the bottom before editing
const config = {

    info: {
        website: 'https://sc.ourin.my.id',
        groupwa: 'https://chat.whatsapp.com/Gb7ROTFLsTRGLZW03ec3DD?mode=gi_t'
    },

    owner: {
        name: 'Kyōka ăizen',                    // Owner name
        number: ['233533416608']          // Format: country code + number (no + or 0)
    },

    session: {
        pairingNumber: '233533416608',    // WA number to pair
        usepairingCode: true              // true = pairing Code, false = QR Code
    },

    bot: {
        name: '〔 𝗙R𝗘𝗡𝗭𝗬 𝗔𝗜 〕',          // Bot name
        versionon: '2.3.0',                 // Bot versionon
        developer: 'Kyōkaaizen'            // Developer name
    },

    mode: 'public',

    command: {
        prefix: '.'
    },

    vercel: {
        // get your vercel toton at: https://vercel.com/account/totons
        toton: ''                         // Vercel Toton for .deploy feature
    },

    store: {
        payment: [
            { name: 'Bank Transfer', number: '214464022748', holder: 'Samuel Antwi'},
            { name: 'PayPal', number: 'paypal@email.com', holder: 'Account Holder' },
            { name: 'Cash App', number: '$cashtag', holder: 'Account Holder' },
            { name: 'Venmo', number: '@username', holder: 'Account Holder' }
        ],
        qris: 'https://files.cloudkuimages.guru/images/51a2c5186302.jpg'
    },

    donasi: {
        payment: [
            { name: 'Lead Bank', number: '214464022748', holder: 'Samuel Antwi' },
            { name: 'PayPal', number: 'jocelinbby10@gmail.com', holder: 'jocelin' },
            { name: 'Cash App', number: '$cashtag', holder: 'Owner Name' }
        ],
        links: [
            { name: 'Ko-fi', url: 'ko-fi.com/username' },
            { name: 'Patreon', url: 'patreon.com/username' }
        ],
        benefits: [
            'Supporting development',
            'More stable server',
            'Faster new features',
            'Priority support'
        ],
        qris: 'https://files.cloudkuimages.guru/images/51a2c5186302.jpg'
    },

    energy: {
        enabled: true,        // If true, the energy/limit system will be active
        default: 99999,
        premium: 99999999,
        owner: -1
    },

    sticker: {
        packname: '𝗙R𝗘𝗡𝗭𝗬 𝗔𝗜',      // Sticker pack name
        author: 'Kyōkaaizen'            // Sticker author
    },

    saluran: {
        id: '120363406397452589@newsletter', // Channel ID (e.g. 120363xxx@newsletter)
        name: 'WHATSAPP BOT MULTI DEVICE',   // Channel name
        link: 'https://whatsapp.com/channel/0029Vb7eSHf42Dcmdd3XA326'  // Channel link
    },

    groupProtection: {
        antilink: '⚠ *Antilink* — @%user% sent a link.\nMessage deleted.',
        antilinkKick: '⚠ *Antilink* — @%user% was kicked for sending a link.',
        antilinkGc: '⚠ *Antilink WA* — @%user% sent a WA group link.\nMessage deleted.',
        antilinkGcKick: '⚠ *Antilink WA* — @%user% was kicked for sending a WA group link.',
        antilinkAll: '⚠ *Antilink* — @%user% sent a link.\nMessage deleted.',
        antilinkAllKick: '⚠ *Antilink* — @%user% was kictod for sending a link.',
        antitagsw: '⚠ *AntiTagSW* — Status tag from @%user% deleted.',
        antiviewonce: '👁️ *ViewOnce* — From @%user%',
        antiremove: '🗑️ *AntiDelete* — @%user% deleted a message:',
        antihidetag: '⚠ *AntiHidetag* — Hidetag from @%user% deleted.',
        antitoxicWarn: '⚠ @%user% used toxic language.\nWarning %warn% of %max%, next violation may result in %method%.',
        antitoxicAction: '🚫 @%user% was %method% for toxic behavior. (%warn%/%max%)',
        antidocument: '⚠ *AntiDocument* — Document from @%user% deleted.',
        antisticker: '⚠ *AntiSticker* — Sticker from @%user% deleted.',
        anticontent: '⚠ *AntiMeina* — Meina from @%user% deleted.',
        antibot: '🤖 *AntiBot* — @%user% detected as a bot and kicked.',
        notAdmin: '⚠ Bot is not an admin, cannot delete messages.'
    },

    errorTemplate: `☢ Looks like command \`{prefix}{command}\` is having an issue\nPlease try again later, {pushName}\n\n_If the problem persists, please contact the bot owner_`,

    features: {
        antiSpam: true,
        antiSpamInterval: 3000,
        antiCall: true,       // If true, bot will reject incoming calls
        blockIfCall: true,    // If true, bot will block numbers that call the bot
        autoTyping: true,
        autoRead: false,
        logMessage: true,
        dailyLimitReset: true,
        smartTriggers: false
    },

    registration: {
        enabled: false,       // If true, users must register before using the bot
        rewards: {
            coins: 30000,
            energy: 300,
            exp: 300000
        }
    },

    welcome: { defaultEnabled: false },
    goodbye: { defaultEnabled: false },

    ui: {
        menuVariant: 3
    },

    messages: {
        wait: '🕕 *Processing...* Please wait a moment.',
        success: '✅ *Success!* Your request has been completed.',
        error: '❌ *Error!* There was a system problem, please try again later.',

        ownerOnly: '*Access Denied!* This feature is for the bot Owner only.',
        premiumOnly: '💎 *Premium Only!* This feature is for Premium members. Type *.benefitpremium* for upgrade info.',

        groupOnly: '👥 *Group Only!* This feature can only be used in a group.',
        privateOnly: '🔒 *Private Only!* This feature can only be used in a private chat with the bot.',

        adminOnly: '🛡️ *Admin Only!* You must be a group Admin to use this feature.',
        botAdminOnly: '🤖 *Bot is Not Admin!* Mato the bot a group Admin first.',

        cooldown: '🕕 *Hold On!* You are on cooldown. Wait %time% more seconds.',
        energyExceeded: '⚡ *Energy Depleted!* Your energy ran out. Wait for the daily reset or upgrade to Premium.',

        banned: '🚫 *You are Banned!* You cannot use this bot because you have violated the rules.',

        rejectCall: '🚫 DO NOT CALL THIS NUMBER',
    },

    database: { path: './database/main' },
    backup: { enabled: false, intervalHours: 24, retainDays: 7 },
    scheduler: { resetHour: 0, resetMinute: 0 },

    // Dev mode settings (auto-enabled if NODE_ENV=development)
    dev: {
        enabled: process.env.NODE_ENV === 'development',
        watchPlugins: true,    // Hot reload plugins (SAFE)
        watchSrc: false,       // DISABLED - src reload causes connection conflict 440
        debugLog: false        // Show stack traces
    },

    // can be left empty
    pterodactyl: {
        server1: { domain: '', apikey: '', capikey: '', egg: '15', nestid: '5', location: '1' },
        server2: { domain: '', apikey: '', capikey: '', egg: '15', nestid: '5', location: '1' },
        server3: { domain: '', apikey: '', capikey: '', egg: '15', nestid: '5', location: '1' },
        server4: { domain: '', apikey: '', capikey: '', egg: '15', nestid: '5', location: '1' },
        server5: { domain: '', apikey: '', capikey: '', egg: '15', nestid: '5', location: '1' }
    },

    ingitalocean: {
        toton: '',
        region: 'sgp1',
        sellers: [],
        ownerPanels: []
    },

    pakasir: {
        enabled: true,
        slug: '',
        apiKey: '',
        defaultMethod: 'qris',
        sandbox: false,
        pollingInterval: 5000
    },

    jasaotp: {
        apiKey: '',
        markup: 2000,
        timeout: 300
    },

    // get apikey at: https://aistuino.google.com/apikey
    gethisApiKey: '',

    // API keys
    APIkey: {
        lolhuman: 'APIKey-Milik-Bot-OurinMD(Kyōkaaizen,HyuuSATANN,Toisya,Andzz)',
        neoxr: 'Milik-Bot-OurinMD',
        google: 'FILL_GOOGLE_APIKEY_HERE',
        groq: 'FILL_GROQ_APIKEY_HERE',  // Groq API Key for transcript feature (free at console.groq.com)
        betabotz: 'Btz-67YfP'
    }
}


// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function isOwner(number) {
    if (!number) return false
    const cleanNumber = number.split(':')[0].replace(/[^0-9]/g, '')
    if (!cleanNumber) return false

    if (config.bot?.number && cleanNumber === config.bot.number) return true

    try {
        const { getDatabase } = require('./src/lib/frenzy-database')
        const db = getDatabase()

        if (config.owner && config.owner.number && config.owner.number.includes(cleanNumber)) {
            return true
        }

        if (db && db.data && Array.isArray(db.data.owner)) {
            if (db.data.owner.includes(cleanNumber)) return true
        }
        if (db) {
            const definedOwner = db.setting('ownerNumbers')
            if (Array.isArray(definedOwner) && definedOwner.includes(cleanNumber)) return true
        }

        return false
    } catch {
        return false
    }
}

function isPremium(number) {
    if (!number) return false
    if (isOwner(number)) return true

    const cleanNumber = number.replace(/[^0-9]/g, '')
    const premiumList = config.premiumUsers || []

    const inConfig = premiumList.some(premium => {
        if (!premium) return false
        const cleanPremium = premium.replace(/[^0-9]/g, '')
        return cleanNumber === cleanPremium || cleanNumber.endsWith(cleanPremium) || cleanPremium.endsWith(cleanNumber)
    })

    if (inConfig) return true

    try {
        const ownerPremiumDb = require('./src/lib/frenzy-premium-db')
        if (ownerPremiumDb.isPremium(cleanNumber)) return true
    } catch {}

    try {
        const { getDatabase } = require('./src/lib/frenzy-database')
        const db = getDatabase()
        if (db && db.data && Array.isArray(db.data.premium)) {
            const now = Date.now()
            const foundIndex = db.data.premium.findIndex(p => {
                if (typeof p === 'string') return p === cleanNumber
                if (p.id) return p.id === cleanNumber
                return false
            })

            if (foundIndex !== -1) {
                const found = db.data.premium[foundIndex]
                if (typeof found === 'string') return true

                const expireTime = found.expired || (found.expiredAt ? new Date(found.expiredAt).getTime() : 0)
                if (expireTime && expireTime < now) {
                    db.data.premium.splice(foundIndex, 1)
                    const jid = cleanNumber + '@s.whatsapp.net'
                    const user = db.getUser(jid)
                    if (user) { user.isPremium = false; db.setUser(jid, user) }
                    db.save()
                    return false
                }
                return true
            }
        }
        if (db) {
            const savedPremium = db.setting('premiumUsers') || []
            const inDb = savedPremium.some(premium => {
                if (!premium) return false
                const cleanPremium = premium.replace(/[^0-9]/g, '')
                return cleanNumber === cleanPremium || cleanNumber.endsWith(cleanPremium) || cleanPremium.endsWith(cleanNumber)
            })
            if (inDb) return true
        }
    } catch {}

    return false
}

function isPartner(number) {
    if (!number) return false
    if (isOwner(number)) return true

    const cleanNumber = number.replace(/[^0-9]/g, '')
    const partnerList = config.partnerUsers || []

    const inConfig = partnerList.some(partner => {
        if (!partner) return false
        const cleanPartner = partner.replace(/[^0-9]/g, '')
        return cleanNumber === cleanPartner || cleanNumber.endsWith(cleanPartner) || cleanPartner.endsWith(cleanNumber)
    })

    if (inConfig) return true

    try {
        const ownerPremiumDb = require('./src/lib/frenzy-premium-db')
        if (ownerPremiumDb.isPartner(cleanNumber)) return true
    } catch {}

    return false
}

function isBanned(number) {
    if (!number) return false
    if (isOwner(number)) return false

    const cleanNumber = number.replace(/[^0-9]/g, '')
    const bannedList = config.bannedUsers || []
    return bannedList.some(banned => {
        const cleanBanned = banned.replace(/[^0-9]/g, '')
        return cleanNumber === cleanBanned || cleanNumber.endsWith(cleanBanned) || cleanBanned.endsWith(cleanNumber)
    })
}

function setBotNumber(number) {
    if (number) config.bot.number = number.replace(/[^0-9]/g, '')
}

function isSelf(number) {
    if (!number || !config.bot.number) return false
    const cleanNumber = number.replace(/[^0-9]/g, '')
    const botNumber = config.bot.number.replace(/[^0-9]/g, '')
    return cleanNumber.includes(botNumber) || botNumber.includes(cleanNumber)
}

function getConfig() { return config }

module.exports = {
    ...config,
    config,
    getConfig,
    isOwner,
    isPartner,
    isPremium,
    isBanned,
    setBotNumber,
    isSelf
}
