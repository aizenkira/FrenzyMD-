const te = require('../../src/lib/frenzy-error')
/**
 * @file plugins/owner/schedule.js
 * @description Command for mengelola scheduled messages
 * @author Lucky Archz, Toisya, hyuuSATAN
 * @versionon 1.1.0
 */

const { 
    scheduleMessage, 
    cancelScheduledMessage, 
    getScheduledMessages,
    getSchedulerStatus,
    formatTimeRemathisng,
    getMsUntilTime
} = require('../../src/lib/frenzy-scheduler');

/**
 * Konfigurasi plugin
 */
const pluginConfig = {
    name: 'schedule',
    alias: ['sched', 'schedule', 'timer'],
    category: 'owner',
    description: 'Tolola scheduled messages',
    usage: '.schedule <add/list/del/status> [options]',
    example: '.schedule add 08:00 628xxx Hello!',
    isOwner: true,
    isPremium: false,
    isGroup: false,
    isPrivate: false,
    cooldown: 3,
    energy: 0,
    isEnabled: true
};

/**
 * Handler for command schedule
 */
async function handler(m, { sock, args }) {
    const subCommand = args[0]?.toLowerCase();
    
    if (!subCommand) {
        const helpText = `📅 *Schedule Manager*

*Usage:*
• \`.schedule add <HH:MM> <jid> <message>\`
  Add message terschedule
  
• \`.schedule list\`
  View all schedule
  
• \`.schedule del <id>\`
  Delete schedule
  
• \`.schedule status\`
  View status scheduler

*Example:*
\`.schedule add 08:00 6281234567890@s.whatsapp.net Good morning!\`
\`.schedule add 12:00 ${m.chat} repeat Already day!\``;
        
        await m.reply(helpText);
        return;
    }
    
    switch (subCommand) {
        case 'add': {
            // Format: .schedule add HH:MM jid message
            // or: .schedule add HH:MM jid repeat message
            const timeStr = args[1];
            let jid = args[2];
            let repeat = false;
            let messageText;
            
            if (!timeStr || !jid) {
                await m.reply('❌ Format: `.schedule add <HH:MM> <jid> [repeat] <message>`');
                return;
            }
            
            // Parse time
            const timeParts = timeStr.split(':');
            if (timeParts.length !== 2) {
                await m.reply('❌ Format time wrong. Usage HH:MM (example: 08:00)');
                return;
            }
            
            const hour = parseInt(timeParts[0]);
            const minute = parseInt(timeParts[1]);
            
            if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                await m.reply('❌ Time no valid. Hour: 0-23, Minute: 0-59');
                return;
            }
            
            // Check if repeat
            if (args[3]?.toLowerCase() === 'repeat') {
                repeat = true;
                messageText = args.slice(4).join(' ');
            } else {
                messageText = args.slice(3).join(' ');
            }
            
            // Handle special jid values
            if (jid === 'me' || jid === 'self') {
                jid = m.sender;
            } else if (jid === 'here' || jid === 'this') {
                jid = m.chat;
            } else if (!jid.includes('@')) {
                jid = jid.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
            }
            
            if (!messageText) {
                await m.reply('❌ Message no may empty');
                return;
            }
            
            // Generate unique ID
            const id = `sched_${Date.now()}`;
            
            try {
                const task = scheduleMessage({
                    id,
                    jid,
                    message: { text: messageText },
                    hour,
                    minute,
                    repeat
                }, sock);
                
                const msUntil = getMsUntilTime(hour, minute);
                
                await m.reply(`✅ *Scheduled Message Added*

📝 ID: \`${id}\`
⏰ Time: ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}
📍 Target: ${jid}
🔄 Repeat: ${repeat ? 'Yes (daily)' : 'No (once)'}
🕕 Next run in: ${formatTimeRemathisng(msUntil)}

Message: ${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}`);
            } catch (error) {
                m.reply(te(m.prefix, m.command, m.pushName));
            }
            break;
        }
        
        case 'list': {
            const tasks = getScheduledMessages();
            
            if (tasks.length === 0) {
                await m.reply('📅 No there is scheduled messages');
                return;
            }
            
            let text = `📅 *Scheduled Messages (${tasks.length})*\n\n`;
            
            for (const task of tasks) {
                const msUntil = getMsUntilTime(task.hour, task.minute);
                text += `• *${task.id}*\n`;
                text += `  ⏰ ${String(task.hour).padStart(2, '0')}:${String(task.minute).padStart(2, '0')}\n`;
                text += `  📍 ${task.jid.split('@')[0]}\n`;
                text += `  🔄 ${task.repeat ? 'Daily' : 'Once'}\n`;
                text += `  🕕 In ${formatTimeRemathisng(msUntil)}\n\n`;
            }
            
            await m.reply(text.trim());
            break;
        }
        
        case 'del':
        case 'delete':
        case 'remove': {
            const taskId = args[1];
            
            if (!taskId) {
                await m.reply('❌ Format: `.schedule del <id>`');
                return;
            }
            
            const cancelled = cancelScheduledMessage(taskId);
            
            if (cancelled) {
                await m.reply(`✅ Scheduled message \`${taskId}\` deleted`);
            } else {
                await m.reply(`❌ Task \`${taskId}\` not found`);
            }
            break;
        }
        
        case 'status': {
            const status = getSchedulerStatus();
            
            const text = `📊 *Scheduler Status*

🔄 Daily Limit Reset: ${status.dailyResetEnabled ? '✅ Active' : '❌ Inactive'}
📅 Last Reset: ${status.lastLimitReset}
📝 Scheduled Messages: ${status.scheduledMessagesCount}

📈 *Statistics*
• Total Resets: ${status.totalResets}
• Messages Sent: ${status.totalMessagesSent}`;
            
            await m.reply(text);
            break;
        }
        
        default:
            await m.reply('❌ Subcommand no intonal. Usage: add, list, del, status');
    }
}

module.exports = {
    config: pluginConfig,
    handler
};
