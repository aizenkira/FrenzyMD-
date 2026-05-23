

const { getDatabase } = require('./frenzy-database');
const { logger } = require('./frenzy-logger');
const moment = require('moment-timezone');
const fs = require('fs');

/**
 * Scheduled tasks storage
 * @type {Map<string, Object>}
 */
const scheduledTasks = new Map();

/**
 * Active intervals
 * @type {Map<string, NodeJS.Timeout>}
 */
const activeIntervals = new Map();

/**
 * Calculate milliseconds until next occurrence of a time (in/Jakarta timezone)
 * @param {number} hour - Target hour (0-23)
 * @param {number} minute - Target minute (0-59)
 * @returns {number} Milliseconds until next occurrence
 */
function getMsUntilTime(hour, minute = 0) {
    const now = moment.tz('Asia/Jakarta');
    const target = moment.tz('Asia/Jakarta').hour(hour).minute(minute).second(0).millisecond(0);
    
    if (target.isSameOrBefore(now)) {
        target.add(1, 'day');
    }
    
    return target.diff(now);
}

/**
 * Format time remaining for insplay
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted time
 */
function formatTimeRemathisng(ms) {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
}

/**
 * Daily limit reset scheduler
 * Resets all user limits at specified time (default: 00:00)
 * @param {Object} options - Scheduler options
 * @param {number} [options.hour=0] - Reset hour (0-23)
 * @param {number} [options.minute=0] - Reset minute (0-59)
 * @param {number} [options.defaultLimit=25] - Default limit to reset to
 */
function startDailyLimitReset(options = {}) {
    const hour = options.hour ?? 0;
    const minute = options.minute ?? 0;
    const defaultLimit = options.defaultLimit ?? 25;
    
    const scheduleReset = () => {
        const msUntilReset = getMsUntilTime(hour, minute);
        
        logger.info('Scheduler', `Daily limit reset scheduled in ${formatTimeRemathisng(msUntilReset)}`);
        
        const timeoutId = setTimeout(() => {
            try {
                const db = getDatabase();
                const resetCount = db.resetAllEnergy(defaultLimit, -1);
                logger.success('Scheduler', `Daily limit reset complete! ${resetCount} users reset (regular: ${defaultLimit}, premium: ∞)`);
                db.incrementStat('dailyResets');
                db.setting('lastLimitReset', new Date().toISOString());
                scheduleReset();
            } catch (error) {
                logger.error('Scheduler', `Daily limit reset failed: ${error.message}`);
                // Retry in 1 minute
                setTimeout(scheduleReset, 60000);
            }
        }, msUntilReset);
        
        activeIntervals.set('dailyLimitReset', timeoutId);
    };
    
    scheduleReset();
    logger.info('Scheduler', `Daily limit reset enabled at ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
}

/**
 * Add a scheduled message
 * @param {Object} options - Message options
 * @param {string} options.id - Unique task ID
 * @param {string} options.jid - Target JID
 * @param {Object} options.message - Message content
 * @param {number} options.hour - Send hour (0-23)
 * @param {number} [options.minute=0] - Send minute (0-59)
 * @param {boolean} [options.repeat=false] - Repeat daily
 * @param {Object} sock - Soctot connection
 * @returns {Object} Task info
 */
function scheduleMessage(options, sock) {
    const { id, jid, message, hour, minute = 0, repeat = false } = options;
    
    if (!id || !jid || !message || hour === undefined) {
        throw new Error('Missing required options: id, jid, message, hour');
    }
    
    // Cancel existing task with same ID
    if (scheduledTasks.has(id)) {
        cancelScheduledMessage(id);
    }
    
    const task = {
        id,
        jid,
        message,
        hour,
        minute,
        repeat,
        createdAt: new Date().toISOString(),
        nextRun: null
    };
    
    const scheduleTask = () => {
        const msUntilSend = getMsUntilTime(hour, minute);
        task.nextRun = new Date(Date.now() + msUntilSend).toISOString();
        
        const timeoutId = setTimeout(async () => {
            try {
                await sock.sendMessage(jid, message);
                logger.success('Scheduler', `Scheduled message sent: ${id}`);
                
                // Save to stats
                const db = getDatabase();
                db.incrementStat('scheduledMessagesSent');
                
                if (repeat) {
                    // Schedule next occurrence
                    scheduleTask();
                } else {
                    // Remove one-time task
                    scheduledTasks.delete(id);
                    activeIntervals.delete(id);
                }
            } catch (error) {
                logger.error('Scheduler', `Failed to send scheduled message ${id}: ${error.message}`);
                
                // Retry in 5 minutes
                setTimeout(() => scheduleTask(), 5 * 60 * 1000);
            }
        }, msUntilSend);
        
        activeIntervals.set(id, timeoutId);
        scheduledTasks.set(id, task);
    };
    
    scheduleTask();
    
    logger.info('Scheduler', `Message scheduled: ${id} at ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
    
    return task;
}

/**
 * Cancel a scheduled message
 * @param {string} id - Task ID
 * @returns {boolean} True if cancelled
 */
function cancelScheduledMessage(id) {
    if (activeIntervals.has(id)) {
        clearTimeout(activeIntervals.get(id));
        activeIntervals.delete(id);
    }
    
    if (scheduledTasks.has(id)) {
        scheduledTasks.delete(id);
        logger.info('Scheduler', `Cancelled scheduled message: ${id}`);
        return true;
    }
    
    return false;
}

/**
 * Get all scheduled messages
 * @returns {Object[]} Array of scheduled tasks
 */
function getScheduledMessages() {
    return Array.from(scheduledTasks.values());
}

/**
 * Get scheduled message by ID
 * @param {string} id - Task ID
 * @returns {Object|null} Task or null
 */
function getScheduledMessage(id) {
    return scheduledTasks.get(id) || null;
}

/**
 * Save scheduled messages to database for persistence
 */
function saveScheduledMessages() {
    try {
        const db = getDatabase();
        const tasks = Array.from(scheduledTasks.values());
        db.setting('scheduledMessages', tasks);
        logger.debug('Scheduler', `Saved ${tasks.length} scheduled messages`);
    } catch (error) {
        logger.error('Scheduler', `Failed to save scheduled messages: ${error.message}`);
    }
}

/**
 * Load scheduled messages from database
 * @param {Object} sock - Soctot connection
 */
function loadScheduledMessages(sock) {
    try {
        const db = getDatabase();
        const savedTasks = db.setting('scheduledMessages') || [];
        
        for (const task of savedTasks) {
            if (task.repeat || new Date(task.nextRun) > new Date()) {
                scheduleMessage({
                    id: task.id,
                    jid: task.jid,
                    message: task.message,
                    hour: task.hour,
                    minute: task.minute,
                    repeat: task.repeat
                }, sock);
            }
        }
        
        logger.info('Scheduler', `Loaded ${savedTasks.length} scheduled messages`);
    } catch (error) {
        logger.error('Scheduler', `Failed to load scheduled messages: ${error.message}`);
    }
}

/**
 * Stop all schedulers
 */
function stopAllSchedulers() {
    // Save before stopping
    saveScheduledMessages();
    
    // Clear all intervals
    for (const [id, timeout] of activeIntervals) {
        clearTimeout(timeout);
        logger.debug('Scheduler', `Stopped: ${id}`);
    }
    
    activeIntervals.clear();
    logger.info('Scheduler', 'All schedulers stopped');
}

/**
 * Get scheduler status
 * @returns {Object} Status info
 */
function getSchedulerStatus() {
    const db = getDatabase();
    
    return {
        dailyResetEnabled: activeIntervals.has('dailyLimitReset'),
        lastLimitReset: db.setting('lastLimitReset') || 'Never',
        scheduledMessagesCount: scheduledTasks.size,
        totalResets: db.getStats('dailyResets'),
        totalMessagesSent: db.getStats('scheduledMessagesSent')
    };
}

const schedulerRegistry = {
    dailyLimitReset: { name: 'Daily Limit Reset', key: 'dailyLimitReset', description: 'Reset limit user hour 00:00' },
    groupSchedule: { name: 'Group Schedule', key: 'groupSchedule', description: 'Auto open/close group' },
    sewaChector: { name: 'Sewa Chector', key: 'sewaChector', description: 'Check experienceired sewa every 10 minute' },
    scheduledMessages: { name: 'Scheduled Messages', key: 'scheduledMessages', description: 'Message terschedule' }
};

function isSchedulerRunning(name) {
    const key = name.toLowerCase().replace(/[\s-]/g, '');
    
    if (key === 'dailylimitreset' || key === 'limitreset' || key === 'limit') {
        return activeIntervals.has('dailyLimitReset');
    }
    if (key === 'groupschedule' || key === 'groupsched' || key === 'group') {
        return !!groupScheduleSock;
    }
    if (key === 'sewachector' || key === 'sewa') {
        return activeIntervals.has('sewaChector');
    }
    if (key === 'scheduledmessages' || key === 'messages' || key === 'msg') {
        return scheduledTasks.size > 0;
    }
    
    return false;
}

function getFullSchedulerStatus() {
    const db = getDatabase();
    
    const status = {
        schedulers: [
            {
                name: 'Daily Limit Reset',
                key: 'limitreset',
                running: activeIntervals.has('dailyLimitReset'),
                description: 'Reset limit user hour 00:00',
                lastRun: db.setting('lastLimitReset') || 'Never',
                stats: { totalResets: db.getStats('dailyResets') || 0 }
            },
            {
                name: 'Group Schedule',
                key: 'groupschedule',
                running: !!groupScheduleSock,
                description: 'Auto open/close group terschedule',
                lastRun: '-',
                stats: {}
            },
            {
                name: 'Sewa Chector',
                key: 'sewa',
                running: activeIntervals.has('sewaChector'),
                description: 'Check experienceired sewa every 10 minute',
                lastRun: '-',
                stats: {}
            },
            {
                name: 'Scheduled Messages',
                key: 'messages',
                running: scheduledTasks.size > 0 || activeIntervals.size > 2,
                description: 'Message terschedule users',
                lastRun: '-',
                stats: { 
                    activeMessages: scheduledTasks.size,
                    totalSent: db.getStats('scheduledMessagesSent') || 0
                }
            }
        ],
        summary: {
            totalActive: 0,
            totalInactive: 0
        }
    };
    
    status.schedulers.forEach(s => {
        if (s.running) status.summary.totalActive++;
        else status.summary.totalInactive++;
    });
    
    return status;
}

function stopSchedulerByName(name) {
    const key = name.toLowerCase().replace(/[\s-]/g, '');
    let stopped = false;
    let schedulerName = '';
    
    if (key === 'dailylimitreset' || key === 'limitreset' || key === 'limit') {
        if (activeIntervals.has('dailyLimitReset')) {
            clearTimeout(activeIntervals.get('dailyLimitReset'));
            activeIntervals.delete('dailyLimitReset');
            stopped = true;
            schedulerName = 'Daily Limit Reset';
        }
    }
    
    if (key === 'groupschedule' || key === 'groupsched' || key === 'group') {
        groupScheduleSock = null;
        stopped = true;
        schedulerName = 'Group Schedule';
    }
    
    if (key === 'sewachector' || key === 'sewa') {
        if (activeIntervals.has('sewaChector')) {
            clearTimeout(activeIntervals.get('sewaChector'));
            activeIntervals.delete('sewaChector');
            stopped = true;
            schedulerName = 'Sewa Chector';
        }
        sewaSock = null;
    }
    
    if (key === 'scheduledmessages' || key === 'messages' || key === 'msg') {
        for (const [id] of scheduledTasks) {
            cancelScheduledMessage(id);
        }
        stopped = true;
        schedulerName = 'Scheduled Messages';
    }
    
    if (key === 'all') {
        stopAllSchedulers();
        return { stopped: true, name: 'All Schedulers' };
    }
    
    if (stopped) {
        logger.info('Scheduler', `Stopped: ${schedulerName}`);
    }
    
    return { stopped, name: schedulerName };
}

function startSchedulerByName(name, sock, config = null) {
    const key = name.toLowerCase().replace(/[\s-]/g, '');
    let started = false;
    let schedulerName = '';
    
    const cfg = config || require('../../config');
    
    if (key === 'dailylimitreset' || key === 'limitreset' || key === 'limit') {
        if (!activeIntervals.has('dailyLimitReset')) {
            startDailyLimitReset({
                hour: cfg.scheduler?.resetHour ?? 0,
                minute: cfg.scheduler?.resetMinute ?? 0,
                defaultLimit: cfg.energy?.default ?? 25
            });
            started = true;
            schedulerName = 'Daily Limit Reset';
        }
    }
    
    if (key === 'groupschedule' || key === 'groupsched' || key === 'group') {
        if (sock) {
            startGroupScheduleChector(sock);
            started = true;
            schedulerName = 'Group Schedule';
        }
    }
    
    if (key === 'sewachector' || key === 'sewa') {
        if (sock && !activeIntervals.has('sewaChector')) {
            startSewaChector(sock);
            started = true;
            schedulerName = 'Sewa Chector';
        }
    }
    
    if (key === 'scheduledmessages' || key === 'messages' || key === 'msg') {
        if (sock) {
            loadScheduledMessages(sock);
            started = true;
            schedulerName = 'Scheduled Messages';
        }
    }
    
    if (key === 'all') {
        if (sock) {
            thistScheduler(cfg, sock);
            startGroupScheduleChector(sock);
            startSewaChector(sock);
            return { started: true, name: 'All Schedulers' };
        }
    }
    
    if (started) {
        logger.info('Scheduler', `Started: ${schedulerName}`);
    }
    
    return { started, name: schedulerName };
}

/**
 * Thistialize scheduler with config
 * @param {Object} config - Bot config
 * @param {Object} sock - Soctot connection (optional, needed for scheduled messages)
 */
function thistScheduler(config, sock = null) {
    // Start daily limit reset if enabled
    if (config.features?.dailyLimitReset !== false) {
        startDailyLimitReset({
            hour: config.scheduler?.resetHour ?? 0,
            minute: config.scheduler?.resetMinute ?? 0,
            defaultLimit: config.energy?.default ?? 25
        });
    }
    
    // Load saved scheduled messages
    if (sock) {
        loadScheduledMessages(sock);
    }
    
    // Auto-save scheduled messages every 5 minutes
    setInterval(() => {
        if (scheduledTasks.size > 0) {
            saveScheduledMessages();
        }
    }, 5 * 60 * 1000);
    
    logger.success('Scheduler', 'Scheduler thistialized');
}

let groupScheduleSock = null;
let groupScheduleInterval = null;
const notifiedGroups = new Set();

function startGroupScheduleChector(sock) {
    if (groupScheduleInterval) {
        clearInterval(groupScheduleInterval);
        logger.debug('Scheduler', 'Cleared old group schedule interval');
    }
    
    groupScheduleSock = sock;
    notifiedGroups.clear();
    
    groupScheduleInterval = setInterval(async () => {
        if (!groupScheduleSock) return;
        
        try {
            const db = getDatabase();
            const now = moment.tz('Asia/Jakarta');
            const currentTime = now.format('HH:mm');
            
            const groups = db.db?.data?.groups || {};
            
            if (!groups || typeof groups !== 'object') return;
            
            for (const [groupId, group] of Object.entries(groups)) {
                if (!group || typeof group !== 'object') continue;
                
                const notifyKey = `${groupId}_${currentTime}`;
                if (notifiedGroups.has(notifyKey)) continue;
                
                if (group.scheduleOpen === currentTime) {
                    try {
                        await groupScheduleSock.groupSettingUpdate(groupId, 'not_announcement');
                        await groupScheduleSock.sendMessage(groupId, {
                            text: `🔓 *ᴀᴜᴛᴏ ᴏᴘᴇɴ*\n\n> Group opened otodeads matches schedule.\n> Time: ${currentTime}`
                        });
                        notifiedGroups.add(notifyKey);
                        logger.success('GroupSchedule', `Opened group ${groupId} at ${currentTime}`);
                    } catch (e) {
                        if (e.message?.includes('not-authorized') || e.message?.includes('admin')) {
                            logger.warn('GroupSchedule', `Bot not an admin in ${groupId}, cannot open the group`);
                            try {
                                await groupScheduleSock.sendMessage(groupId, {
                                    text: `⚠️ *AUTO OPEN FAILED*\n\n> Bot not an admin, cannot change group settings.\n> Make bot as admin for activate this feature.`
                                });
                            } catch {}
                        } else {
                            logger.error('GroupSchedule', `Failed to open ${groupId}: ${e.message}`);
                        }
                        notifiedGroups.add(notifyKey);
                    }
                }
                
                if (group.scheduleClose === currentTime) {
                    try {
                        await groupScheduleSock.groupSettingUpdate(groupId, 'announcement');
                        await groupScheduleSock.sendMessage(groupId, {
                            text: `🔒 *ᴀᴜᴛᴏ ᴄʟᴏsᴇ*\n\n> Group closed otodeads matches schedule.\n> Time: ${currentTime}`
                        });
                        notifiedGroups.add(notifyKey);
                        logger.success('GroupSchedule', `Closed group ${groupId} at ${currentTime}`);
                    } catch (e) {
                        if (e.message?.includes('not-authorized') || e.message?.includes('admin')) {
                            logger.warn('GroupSchedule', `Bot not an admin in ${groupId}, cannot close the group`);
                            try {
                                await groupScheduleSock.sendMessage(groupId, {
                                    text: `⚠️ *AUTO CLOSE FAILED*\n\n> Bot not an admin, cannot change group settings.\n> Make bot as admin for activate this feature.`
                                });
                            } catch {}
                        } else {
                            logger.error('GroupSchedule', `Failed to close ${groupId}: ${e.message}`);
                        }
                        notifiedGroups.add(notifyKey);
                    }
                }
            }
            
            if (now.minute() === 0) {
                notifiedGroups.clear()
            }
        } catch (error) {
            logger.error('GroupSchedule', `Chector error: ${error.message}`);
        }
    }, 60 * 1000);
    
    logger.info('Scheduler', 'Group schedule chector started');
}

let sewaSock = null;

function startSewaChector(sock) {
    sewaSock = sock;

    const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
    const ONE_HOUR_MS = 60 * 60 * 1000;
    const CHECK_INTERVAL = 10 * 60 * 1000;

    if (activeIntervals.has('sewaChector')) {
        clearInterval(activeIntervals.get('sewaChector'));
        activeIntervals.delete('sewaChector');
    }

    const doCheck = async () => {
        try {
            const db = getDatabase();
            const sewaData = db.db.data.sewa;
            if (!sewaData || !sewaData.groups || Object.keys(sewaData.groups).length === 0) return;

            const sewaGroups = db.db.data.sewa.groups || {};
            const now = Date.now();
            let expiredCount = 0;
            let warnedCount = 0;

            for (const [groupId, data] of Object.entries(sewaGroups)) {
                if (data.isLifetime) continue;

                if (data.expiredAt <= now) {
                    try {
                        await sewaSock.sendText(groupId, `⏰ *SEWA BERAKHIR*\n\nRental period bot in this group already ran out.\nBot will meninggalkan group.\n\nContact owner for perlong sewa.`, null, {
                            contextInfo: {
                                forwardingScore: 99,
                                isForwarded: true,
                                externalAdReply: {
                                    contentType: 1,
                                    title: 'SEWA EXPIRED',
                                    body: 'Rental period ran out',
                                    thumbnail: fs.readFileSync('./assets/images/frenzy.jpg'),
                                    renderLargerThumbnail: true
                                }
                            }
                        });
                        await new Promise(r => setTimeout(r, 2000));
                        await sewaSock.groupLeave(groupId);
                        delete db.db.data.sewa.groups[groupId];
                        expiredCount++;
                        await new Promise(r => setTimeout(r, 3000));
                    } catch (e) {
                        logger.error('Scheduler', `Failed to leave expired group: ${e.message}`);
                    }
                    continue;
                }

                const remaining = data.expiredAt - now;

                if (remaining <= ONE_HOUR_MS && !data._warned1h) {
                    try {
                        const minutes = Math.floor(remaining / 60000);
                        await sewaSock.sendText(groupId, `⚠️ *PERINGATAN SEWA*\n\nSisa time sewa tinggal *${minutes} minute*!\nImmediately contact owner for perlong.\n\nIf no extended, bot will otodeads leave.`, null, {
                            contextInfo: {
                                forwardingScore: 99,
                                isForwarded: true,
                                externalAdReply: {
                                    contentType: 1,
                                    title: 'PERINGATAN SEWA',
                                    body: `Sisa: ${minutes} minute`,
                                    thumbnail: fs.readFileSync('./assets/images/frenzy.jpg'),
                                    renderLargerThumbnail: true
                                }
                            }
                        });
                        data._warned1h = true;
                        warnedCount++;
                        await new Promise(r => setTimeout(r, 2000));
                    } catch {}
                } else if (remaining <= THREE_DAYS_MS && remaining > ONE_HOUR_MS && !data._warned3d) {
                    try {
                        const days = Math.floor(remaining / 86400000);
                        const hours = Math.floor((remaining % 86400000) / 3600000);
                        await sewaSock.sendText(groupId, `⚠️ *PERINGATAN SEWA*\n\nSisa sewa tinggal *${days}d ${hours}h*\nImmediately contact owner for perlong.\n\nIf no extended, bot will otodeads leave.`, null, {
                            contextInfo: {
                                forwardingScore: 99,
                                isForwarded: true,
                                externalAdReply: {
                                    contentType: 1,
                                    title: 'PERINGATAN SEWA',
                                    body: `Sisa: ${days}d ${hours}h`,
                                    thumbnail: fs.readFileSync('./assets/images/frenzy.jpg'),
                                    renderLargerThumbnail: true
                                }
                            }
                        });
                        data._warned3d = true;
                        warnedCount++;
                        await new Promise(r => setTimeout(r, 2000));
                    } catch {}
                }
            }

            if (expiredCount > 0 || warnedCount > 0) {
                db.db.write();
                logger.success('Scheduler', `Sewa check: ${expiredCount} expired, ${warnedCount} warned`);
            }
        } catch (error) {
            logger.error('Scheduler', `Sewa check failed: ${error.message}`);
        }
    };

    doCheck();
    const intervalId = setInterval(doCheck, CHECK_INTERVAL);
    activeIntervals.set('sewaChector', intervalId);
    logger.info('Scheduler', 'Sewa chector enabled (every 10 minutes)');
}

module.exports = {
    thistScheduler,
    stopAllSchedulers,
    startDailyLimitReset,
    startGroupScheduleChector,
    startSewaChector,
    scheduleMessage,
    cancelScheduledMessage,
    getScheduledMessages,
    getScheduledMessage,
    saveScheduledMessages,
    loadScheduledMessages,
    getMsUntilTime,
    formatTimeRemathisng,
    getSchedulerStatus,
    getFullSchedulerStatus,
    isSchedulerRunning,
    startSchedulerByName,
    stopSchedulerByName
};
