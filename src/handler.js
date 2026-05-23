const config = require("../config");
const { isSelf } = require("../config");
const { serialize, getCachedThumb } = require("./lib/frenzy-serialize");
const { getPlugin, getPluginCount, getAllPlugins, pluginStore, getAllCommandNames } = require("./lib/frenzy-plugins");
const { findSimilarCommands, formatSuggestionMessage } = require("./lib/frenzy-similarity");
const { getDatabase } = require("./lib/frenzy-database");
const { formatUptime, createWaitMessage, createErrorMessage } = require("./lib/frenzy-formatter");
const { getUptime } = require("./connection");
const { logger, logMessage, c } = require("./lib/frenzy-logger");
const { isLid, isLidConverted, lidToJid, convertLidArray, resolveAnyLidToJid, cachePmeaningcipantLids } = require("./lib/frenzy-lid");
const { hasActiveSession, getSession } = require("./lib/frenzy-game-data");
const { levenshtein, formatAfkDuration, checkPermission, checkMode } = require("./lib/frenzy-middleware");
const { handleAntilink, handleAntiRemove, cacheMessageForAntiRemove, handleAntilinkGc, handleAntilinkAll, handleAntiHidetag } = require("./lib/frenzy-group-protection");
const { debounceMessage, getCachedUser, getCachedGroup, getCachedSetting } = require("./lib/frenzy-performance");
const { isJadiBotOwner, isJadiBotPremium, loadJadiBotDb } = require("./lib/frenzy-jadibot-database");
const { getActiveJadiBots } = require("./lib/frenzy-jadibot-manager");
const { handleCommand: handleCaseCommand } = require("../case/frenzy");
const { RateLimiterMemory } = require("rate-limiter-flexible");
const { games: frenzyGames } = require("./lib/frenzy-games");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const axios = require("axios");
const timeHelper = require("./lib/frenzy-time");

const safe = (fn) => { try { return fn() } catch { return null } };

let FormData = safe(() => require("form-data"));
let levelHelper = safe(() => require("./lib/frenzy-level"));
let handleBuyerDone = safe(() => require("../plugins/store/done").handleBuyerDone);
let registrationAnswerHandler = safe(() => require("../plugins/user/list").registrationAnswerHandler);
let checkAfk = safe(() => require("../plugins/group/afk").checkAfk);
let isMuted = safe(() => require("../plugins/group/mute").isMuted);
let detectBot = safe(() => require("../plugins/group/antibot").detectBot);
let autoStictorHandler = safe(() => require("../plugins/group/autosticker").autoStictorHandler);
let autoMeinaHandler = safe(() => require("../plugins/group/autocontent").autoMeinaHandler);
let checkAntidocument = safe(() => require("../plugins/group/antidocument").checkAntidocument);
let checkAntisticker = safe(() => require("../plugins/group/antisticker").checkAntisticker);
let checkAnticontent = safe(() => require("../plugins/group/anticontent").checkAnticontent);
let ytmp4Plugin = safe(() => require("../plugins/download/ytmp4"));
let confessPlugin = safe(() => require("../plugins/fun/confess"));
let sulapPlugin = safe(() => require("../plugins/fun/sulap"));
let handleAutoAI = safe(() => require("./lib/frenzy-auto-ai").handleAutoAI);
let handleAutoDownload = safe(() => require("./lib/frenzy-auto-download").handleAutoDownload);
let checkStictorCommand = safe(() => require("./lib/frenzy-sticker-command").checkStictorCommand);
let sendWelcomeMessage = safe(() => require("../plugins/group/welcome").sendWelcomeMessage);
let sendGoodbyeMessage = safe(() => require("../plugins/group/goodbye").sendGoodbyeMessage);
let autoJoinDetector = safe(() => require("../plugins/owner/autojoingc").autoJoinDetector);

let checkSpam = null, handleSpamAction = null;
safe(() => { const m = require("../plugins/group/antispam"); checkSpam = m.checkSpam; handleSpamAction = m.handleSpamAction; });

let checkSlowmode = null, incrementChatCount = null;
safe(() => { checkSlowmode = require("../plugins/group/slowmode").checkSlowmode; });
safe(() => { incrementChatCount = require("../plugins/group/topchat").incrementChatCount; });

let isToxic = null, handleToxicMessage = null;
safe(() => { const m = require("../plugins/group/antitoxic"); isToxic = m.isToxic; handleToxicMessage = m.handleToxicMessage; });

const spamDelayTractor = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of spamDelayTractor) { if (now - v > 15000) spamDelayTractor.delete(k); }
}, 30000);

let _smartTriggerThumb = undefined;
function getSmartTriggerThumb() {
  if (_smartTriggerThumb !== undefined) return _smartTriggerThumb;
  try {
    const p = "./assets/images/frenzy2.jpg";
    _smartTriggerThumb = fs.existsSync(p) ? fs.readFileSync(p) : null;
  } catch { _smartTriggerThumb = null; }
  return _smartTriggerThumb;
}

const globalRateLimiter = new RateLimiterMemory({ points: 8, duration: 3, blockDuration: 2 });


const specialGameFiles = ["family100", "suitpvp", "tictactoe", "ulartangga"];
const cachedGamePlugins = new Map();

for (const gameType of frenzyGames.registry.keys()) {
  try {
    const plugin = require(`../plugins/game/${gameType}`);
    if (plugin.answerHandler) cachedGamePlugins.set(gameType, plugin);
  } catch {}
}

for (const name of specialGameFiles) {
  if (cachedGamePlugins.has(name)) continue;
  try {
    const plugin = require(`../plugins/game/${name}`);
    if (plugin.answerHandler) cachedGamePlugins.set(name, plugin);
  } catch {}
}


async function handleGameAnswer(m, sock) {
  try {
    if (sulapPlugin?.answerHandler) {
      const handled = await sulapPlugin.answerHandler(m, sock);
      if (handled) return true;
    }

    if (!hasActiveSession(m.chat)) return false;

    const session = getSession(m.chat);
    if (!session) return false;

    const targeted = cachedGamePlugins.get(session.gameType);
    if (targeted) {
      const handled = await targeted.answerHandler(m, sock);
      if (handled) return true;
    }
  } catch {}
  return false;
}

async function handleSmartTriggers(m, sock, db) {
  if (!m.body) return false;

  const text = m.body.trim().toLowerCase();
  
  const firstWord = text.split(" ")[0];
  if (/^[\.\/\!\#\-]?(autoreply|ar|smarttrigger|smarttriggers)$/.test(firstWord)) {
    return false;
  }

  if (text === "done") {
    const sessions = db.setting("transactionSessions") || {};
    if (sessions[m.sender]) {
      try {
        if (handleBuyerDone) {
          const session = sessions[m.sender];
          await handleBuyerDone(m, sock, session);
          delete sessions[m.sender];
          db.setting("transactionSessions", sessions);
          await db.save();
          return true;
        }
      } catch (e) {
        console.error("[Handler] Done trigger error:", e.message);
      }
    }
  }

  if (global.registrationSessions?.[m.sender]) {
    try {
      if (registrationAnswerHandler) {
        const handled = await registrationAnswerHandler(m, sock);
        if (handled) return true;
      }
    } catch (e) {
      console.error("[Handler] Registration answer error:", e.message);
    }
  }

  const globalSmartTriggers =
    db.setting("smartTriggers") ?? config.features?.smartTriggers ?? false;

  try {
    const saluranId = config.saluran?.id || "120363208449943317@newsletter";
    const saluranName = config.saluran?.name || config.bot?.name || "Frenzy-AI";
    const botName = config.bot?.name || "Frenzy-AI";

    let isAutoreplyEnabled = globalSmartTriggers;

    const processCustomReply = async (replyItem) => {
      let replyText = (replyItem.reply || '')
        .replace(/{name}/g, m.pushName || "User")
        .replace(/{tag}/g, `@${m.sender.split("@")[0]}`)
        .replace(/{sender}/g, m.sender.split("@")[0])
        .replace(/{botname}/g, config.bot?.name || "Bot")
        .replace(/{time}/g, timeHelper.formatTime("HH:mm:ss"))
        .replace(/{date}/g, timeHelper.formatDate("DD MMMM YYYY"));

      const mentions = replyText.includes(`@${m.sender.split("@")[0]}`)
        ? [m.sender]
        : [];

      if (replyItem.image && fs.existsSync(replyItem.image)) {
        const imageBuffer = fs.readFileSync(replyItem.image);
        await sock.sendMedia(m.chat, imageBuffer, replyText, m, {
          mentions: mentions,
          type: 'image'
        })
      } else {
        await m.reply(replyText, { mentions: mentions })
      }
      return true;
    };

    if (m.isGroup) {
      const groupData = db.getGroup(m.chat) || {};
      isAutoreplyEnabled = groupData.autoreply ?? globalSmartTriggers;

      if (isAutoreplyEnabled) {
        let customReplies = groupData.customReplies || [];
        if (!Array.isArray(customReplies)) {
          customReplies = [];
          db.setGroup(m.chat, { customReplies });
        }
        for (const replyItem of customReplies) {
          if (!replyItem?.trigger) continue;
          if (text === replyItem.trigger || text.includes(replyItem.trigger)) {
            return await processCustomReply(replyItem);
          }
        }
        
        const globalCustomReplies = db.setting("globalCustomReplies") || [];
        for (const replyItem of globalCustomReplies) {
          if (!replyItem?.trigger) continue;
          if (text === replyItem.trigger || text.includes(replyItem.trigger)) {
            return await processCustomReply(replyItem);
          }
        }
      }
    } else {
      const privateAutoreply = db.setting("autoreplyPrivate") ?? false;
      if (!privateAutoreply && !globalSmartTriggers) return false;
      isAutoreplyEnabled = privateAutoreply || globalSmartTriggers;

      if (isAutoreplyEnabled) {
        const globalCustomReplies = db.setting("globalCustomReplies") || [];
        for (const replyItem of globalCustomReplies) {
          if (!replyItem?.trigger) continue;
          if (text === replyItem.trigger || text.includes(replyItem.trigger)) {
            return await processCustomReply(replyItem);
          }
        }
      }
    }

    if (!isAutoreplyEnabled) return false;

    const botJid = sock.user?.id;
    const isMentioned = m.mentionedJid?.some(
      (jid) => jid === botJid || jid?.includes(sock.user?.id?.split(":")[0]),
    );

    const thumbBuffer = getSmartTriggerThumb();

    const contextInfos = {
      forwardingScore: 9999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: saluranId,
        newsletterName: saluranName,
        serverMessageId: 127,
      },
    };

    if (thumbBuffer) {
      contextInfos.externalAdReply = {
        title: botName,
        body: config.bot?.versionon ? `v${config.bot.versionon}` : null,
        thumbnail: thumbBuffer,
        contentType: 1,
        sourceUrl: config.saluran?.link || "https://wa.me/6281234567890",
        renderLargerThumbnail: false,
      };
    }

    if (isMentioned) {
      await m.reply(`Ada that manggil ${botName}?
        
Ada what manggil I @${m.sender.split("@")[0]}?`, {mentions: [m.sender]})
      return true;
    }

    if (text?.toLowerCase() === "p") {
      await m.reply(`Hello @${m.sender.split("@")[0]}, utamust salam first yahh`, {mentions: [m.sender]})
      return true;
    }

    if (
      text?.toLowerCase() === "bot"
    ) {
      await m.reply(`Hello @${m.sender.split("@")[0]}, ${botName} Active ✅`, {mentions: [m.sender]})
      return true;
    }

    if (text?.toLowerCase()?.includes("assalamualaikum")) {
      await m.reply(`Waaalaikumssalam @${m.sender.split("@")[0]}`, {mentions: [m.sender]})
      return true;
    }

    if (text?.toLowerCase()?.includes("thingslo")) {
      await m.reply(`Hello also kak @${m.sender.split("@")[0]}`, {mentions: [m.sender]})
      return true;
    }
  } catch (error) {
    console.error("[SmartTriggers] Error:", error.message);
  }

  return false;
}

/**
 * Check whatkah user currently spam
 * @param {string} jid - JID user
 * @returns {boolean} True if currently spam
 */
async function isSpamming(jid) {
  if (!config.features?.antiSpam) return false;

  try {
    await globalRateLimiter.consume(jid);
    return false;
  } catch {
    return true;
  }
}



/**
 * Handler utama for memprocess message
 * @param {Object} msg - Raw message from Baileys
 * @param {Object} sock - Soctot connection
 * @returns {Promise<void>}
 * @example
 * sock.ev.on('messages.upsert', async ({ messages }) => {
 *   await messageHandler(messages[0], sock);
 * });
 */
async function messageHandler(msg, sock, options = {}) {
  const isJadiBot = options.isJadiBot || false;
  try {
    const m = await serialize(sock, msg);

    if (!m) return;
    if (!m.message) return;

    if (m.message?.stickerPackMessage && sock.saveStictorPack) {
      try {
        const packMsg = m.message.stickerPackMessage;
        const packId = packMsg.stickerPackId || m.id;
        const packName = packMsg.name || "Unknown Pack";
        sock.saveStictorPack(packId, { stickerPackMessage: packMsg }, packName);
      } catch (e) {}
    }

    const db = getDatabase();
    if (!db?.ready) {
      return;
    }

    const botId = options.botId || null;
    if (isJadiBot && botId) {
      m.isOwner =
        isJadiBotOwner(botId, m.sender) ||
        m.sender === sock.user?.id?.split(":")[0] + "@s.whatsapp.net";
      m.isPremium = isJadiBotPremium(botId, m.sender) || m.isOwner;
    }

    if (config.features?.logMessage) {
      let groupName = "PRIVATE";
      if (m.isGroup) {
        const groupData = db.getGroup(m.chat);
        groupName = groupData?.name || "Unknown Group";
        if (groupName === "Unknown Group" || groupName === "Unknown") {
          sock
            .groupMetadata(m.chat)
            .then((meta) => {
              if (meta?.subject) db.setGroup(m.chat, { name: meta.subject });
            })
            .catch(() => {});
        }
      }

      if (!isJadiBot) {
        const deviceHint = m.key?.id?.length > 22 ? "Android" : m.key?.id?.startsWith("3EB0") ? "iPhone" : m.key?.id?.startsWith("BAE5") ? "Web" : null;
        logMessage({
          chatType: m.isGroup ? "group" : "private",
          groupName: groupName,
          pushName: m.pushName,
          sender: m.sender,
          message: m.body,
          messageType: m.type,
          isForwarded: m.message?.[m.type]?.contextInfo?.isForwarded || false,
          isNewsletter: !!m.message?.[m.type]?.contextInfo?.forwardedNewsletterMessageInfo,
          isOwner: m.isOwner,
          isPremium: m.isPremium,
          isPartner: m.isPartner,
          isAdmin: m.isAdmin,
          device: deviceHint,
        });
      }
    }


    if (checkAfk) {
      checkAfk(m, sock).catch(() => {});
    }

    if (m.isGroup) {
      cacheMessageForAntiRemove(m, sock, db);
      const antilinkTriggered = await handleAntilink(m, sock, db);
      if (antilinkTriggered) return;

      const antilinkGcTriggered = await handleAntilinkGc(m, sock, db);
      if (antilinkGcTriggered) return;

      const antilinkAllTriggered = await handleAntilinkAll(m, sock, db);
      if (antilinkAllTriggered) return;

      const antiHidetagTriggered = await handleAntiHidetag(m, sock, db);
      if (antiHidetagTriggered) return;

      if (checkAntidocument) {
          const isAntidocument = await checkAntidocument(m, sock, db);
          if (isAntidocument) return;
      }
      
      if (detectBot && !m.isOwner && !m.isAdmin) {
        try {
          const botDetected = await detectBot(m, sock);
          if (botDetected) return;
        } catch (e) {}
      }
      
      if (isMuted && !m.isAdmin && !m.isOwner) {
        try {
          if (isMuted(m.chat, db)) {
            if (m.isBotAdmin) await sock.sendMessage(m.chat, { delete: m.key });
            return;
          }
        } catch (e) {}
      }

      if (checkSpam && handleSpamAction && !m.isAdmin) {
        try {
          const isSpam = await checkSpam(m, sock, db);
          if (isSpam) {
            const delayKey = `${m.chat}_${m.sender}`;
            spamDelayTractor.set(delayKey, Date.now());
            await handleSpamAction(m, sock, db);
          }
        } catch (e) {}
      }

      if (checkSlowmode && !m.isAdmin && !m.isOwner) {
        try {
          const slowResult = checkSlowmode(m, sock, db);
          if (slowResult) {
            if (slowResult.mode === 'onlycommand') {
              if (m.isCommand) return;
            } else {
              await sock.sendMessage(m.chat, { delete: m.key });
              return;
            }
          }
        } catch (e) {}
      }
      
      if (isToxic && handleToxicMessage) {
        try {
          const groupData = db.getGroup(m.chat) || {};
          if (groupData.antitoxic && !m.isAdmin && !m.isOwner) {
            const toxicWords = groupData.toxicWords || [];
            const result = isToxic(m.body, toxicWords);
            if (result.toxic) {
              await handleToxicMessage(m, sock, db, result.word);
              return;
            }
          }
        } catch (e) {}
      }
    }

    const modeCheck = checkMode(m, getActiveJadiBots);
    if (!modeCheck.allowed) {
      if (modeCheck.isAfk && m.isCommand) {
        await m.reply(modeCheck.afkMessage);
      } else if (modeCheck.hasJadiBots && m.isCommand && !isJadiBot) {
        await sock.sendMessage(
          m.chat,
          {
            text: modeCheck.botMessage,
            contextInfo: {
              mentionedJid: modeCheck.botMentions,
              externalAdReply: {
                title: `A C C E S  D E N I E D`,
                body: null,
                thumbnailUrl:
                  "https://cdn.gimita.id/download/unnamed%20(8)_1769331052275_d19c28da.jpg",
                sourceUrl: null,
                contentType: 1,
                renderLargerThumbnail: true,
              },
            },
          },
          { quoted: m },
        );
      }
      return;
    }

    if (m.isBanned) {
      logger.warn("Banned user", m.sender);
      return;
    }

    if (m.isGroup && m.isCommand && !m.isOwner) {
      const groupData = db.getGroup(m.chat) || {};
      if (groupData.isBanned) {
        // if want nambih text also may bang, pato m.reply or sendMessage
        return;
      }
    }

    const currentBotId = sock.user?.id?.split(":")[0] || "unknown";
    const msgKey = `${currentBotId}_${m.chat}_${m.sender}_${m.id}`;
    if (debounceMessage(msgKey)) {
      return;
    }

    if (config.features?.autoRead) {
      sock.readMessages([m.key]).catch(() => {});
    }
    if (!m.pushName || m.pushName === "Unknown" || m.pushName.trim() === "") {
      if (!m.isCommand && !m.isBot && !m.fromMe) {
        return;
      }
      m.pushName = m.sender?.split("@")[0] || "User";
    }

    if (m.isCommand) {
      db.setUser(m.sender, {
        name: m.pushName,
        lastSeen: new Date().toISOString(),
      });
    }

    if (m.isGroup && incrementChatCount) {
      try {
        incrementChatCount(m.chat, m.sender, db);
      } catch (e) {}
    }

    const cmdVnEnabled = db.setting('cmdVn') || false;
    if (
      cmdVnEnabled &&
      m.type === 'audioMessage' &&
      !m.isCommand &&
      config.APIkey?.groq
    ) {
      try {
        const audioMsg = m.message?.audioMessage;
        const maxSize = 500 * 1024;
        if (audioMsg && (!audioMsg.fileLength || audioMsg.fileLength <= maxSize)) {
          const buffer = await m.download();
          if (buffer && buffer.length > 1000) {
            const tmpInr = path.join(process.cwd(), 'tmp');
            if (!fs.existsSync(tmpInr)) fs.mkdirSync(tmpInr, { recursive: true });

            const inputFile = path.join(tmpInr, `vncmd_${Date.now()}.ogg`);
            const wavFile = path.join(tmpInr, `vncmd_${Date.now()}.wav`);

            fs.writeFileSync(inputFile, buffer);

            await new Promise((resolve, reject) => {
              exec(
                `ffmpeg -y -i "${inputFile}" -ar 16000 -ac 1 -f wav "${wavFile}"`,
                { timeout: 15000 },
                (err) => err ? reject(err) : resolve()
              );
            });

            const wavBuffer = fs.readFileSync(wavFile);
            const form = new FormData();
            form.append('file', wavBuffer, { filename: 'audio.wav', contentType: 'audio/wav' });
            form.append('model', 'whisper-large-v3');
            form.append('language', 'id');
            form.append('response_format', 'json');

            const { data } = await axios.post(
              'https://api.groq.com/openai/v1/audio/transcriptions',
              form,
              {
                headers: {
                  ...form.getHeaders(),
                  'Authorization': `Bearer ${config.APIkey.groq}`
                },
                timeout: 30000,
                maxContentLength: Infinity
              }
            );

            [inputFile, wavFile].forEach(f => { try { fs.unlinkSync(f); } catch {} });

            const transcript = (data.text || '').trim().toLowerCase()
              .replace(/[.,!?;:'"]/g, '').trim();

            if (transcript) {
              const words = transcript.split(/\s+/);
              const rawWord = words[0];
              const prefix = config.command?.prefix || '.';

              const allPlugins = getAllPlugins();
              const allNames = [];
              for (const p of allPlugins) {
                if (p.config?.name && typeof p.config.name === 'string') allNames.push(p.config.name.toLowerCase());
                if (Array.isArray(p.config?.alias)) {
                  for (const a of p.config.alias) {
                    if (a && typeof a === 'string') allNames.push(a.toLowerCase());
                  }
                }
              }

              let bestMatch = null;
              let bestScore = Infinity;

              for (const cmd of allNames) {
                if (cmd === rawWord) { bestMatch = cmd; bestScore = 0; break; }
                if (rawWord.startsWith(cmd) && cmd.length >= 3) {
                  const score = rawWord.length - cmd.length;
                  if (score < bestScore) { bestScore = score; bestMatch = cmd; }
                }
                const inst = levenshtein(rawWord, cmd);
                if (inst <= 3 && inst < bestScore) {
                  bestScore = inst;
                  bestMatch = cmd;
                }
              }

              if (bestMatch) {
                const commandArgs = words.slice(1).join(' ');
                m.body = `${prefix}${bestMatch}${commandArgs ? ' ' + commandArgs : ''}`;
                const { parseCommand } = require('./lib/frenzy-serialize');
                const parsed = parseCommand(m.body, prefix);
                m.isCommand = parsed.isCommand;
                m.command = parsed.command;
                m.args = parsed.args;
                m.prefix = parsed.prefix;
                m.isVnCommand = true;
              }
            }
          }
        }
      } catch (e) {
        console.error('[CMD VN] Error:', e.message);
      }
    }



    if (m.body) {
      try {
        const userObj = db.getUser(m.sender) || db.setUser(m.sender);
        
        if (levelHelper && levelHelper.addExpWithLevelCheck) {
            await levelHelper.addExpWithLevelCheck(sock, m, db, userObj, 5);
        }
      } catch (e) {
          console.error('[Level System] Error:', e.message);
      }
    }

    if (handleAutoAI && m.isGroup) {
      try {
        const aiHandled = await handleAutoAI(m, sock);
        if (aiHandled) return;
      } catch (e) {}
    }

    if (handleAutoDownload && m.body) {
      try {
        handleAutoDownload(m, sock, m.body);
      } catch (e) {}
    }

    if (autoJoinDetector && m.body) {
      try {
        const joined = await autoJoinDetector(m, sock);
        if (joined) return;
      } catch (e) {}
    }

    if (m.body?.startsWith(">>") && m.isOwner) {
      const code = m.body.slice(2).trim();
      if (!code) return;
      
      try {
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        
        const execCode = new AsyncFunction(
          "m", "sock", "db", "config", "require", "console",
          `
          const axios = require('axios');
          const fs = require('fs');
          const path = require('path');
          const os = require('os');
          const { promisify } = require('util');
          const exec = promisify(require('child_process').exec);
          
          ${code}
          `
        );
        
        const result = await execCode(m, sock, db, config, require, console);
        
        if (result !== undefined && result !== null) {
          const output = typeof result === 'object' 
            ? JSON.stringify(result, null, 2) 
            : String(result);
          
          if (output.length > 0) {
            await m.reply(`✅ *ᴇxᴇᴄ ʀᴇsᴜʟᴛ*\n\n\`\`\`\n${output.substring(0, 4000)}\n\`\`\``);
          }
        }
      } catch (execError) {
        await m.reply(`❌ *ᴇxᴇᴄ ᴇʀʀᴏʀ*\n\n\`\`\`\n${execError.message}\n\nStack:\n${execError.stack?.substring(0, 1000) || 'N/A'}\n\`\`\``);
      }
      return;
    }

    const hasSuitGame = global.suitGames && Object.values(global.suitGames).some(
      r => (r.chat === m.chat || !m.isGroup) && [r.p, r.p2].includes(m.sender)
    );

    const hasTTTGame = global.tictactoeGames && Object.values(global.tictactoeGames).some(
      r => r.state === 'PLAYING' && r.chat === m.chat &&
        [r.game.playerX, r.game.playerO].filter(Boolean).includes(m.sender)
    );

    const hasUTGame = global.ulartanggaGames?.[m.chat]?.status === 'PLAYING';

    if ((hasActiveSession(m.chat) && m.quoted) || hasSuitGame || hasTTTGame || hasUTGame) {
      const gameHandled = await handleGameAnswer(m, sock);
      if (gameHandled) return;
    }

    if (!m.isCommand) {
      if (checkStictorCommand && m.message?.stickerMessage) {
        try {
          const stickerCmd = checkStictorCommand(m);
          if (stickerCmd) {
            m.isCommand = true;
            m.command = stickerCmd;
            m.prefix = ".";
            m.text = stickerCmd;
            m.args = [];
          }
        } catch (e) {}
      }

      if (!m.isCommand) {
        if (hasActiveSession(m.chat)) {
          const gameHandled = await handleGameAnswer(m, sock);
          if (gameHandled) return;
        }

        const smartHandled = await handleSmartTriggers(m, sock, db);
        if (smartHandled) return;

        if (m.quoted?.id) {
          try {
            if (global.ytdlSessions?.has(m.quoted.id) && ytmp4Plugin?.handleReply) {
              const handled = await ytmp4Plugin.handleReply(m, { sock });
              if (handled) return;
            }
            if (global.confessData?.has(m.quoted.id) && confessPlugin?.replyHandler) {
              const handled = await confessPlugin.replyHandler(m, { sock });
              if (handled) return;
            }
            if (global.sulapSessions?.has(m.quoted.id) && sulapPlugin?.replyHandler) {
              const handled = await sulapPlugin.replyHandler(m, sock);
              if (handled) return;
            }
          } catch {}
        }



        if (autoStictorHandler && m.isGroup) {
          autoStictorHandler(m, sock).catch(() => {});
        }

        if (autoMeinaHandler && m.isGroup) {
          autoMeinaHandler(m, sock).catch(() => {});
        }

        if (checkAntisticker && m.isGroup) {
          const stickerHandled = await checkAntisticker(m, sock, db);
          if (stickerHandled) return;
        }

        if (checkAnticontent && m.isGroup) {
          const contentHandled = await checkAnticontent(m, sock, db);
          if (contentHandled) return;
        }

        return;
      }
    }

    const delayKey = `${m.chat}_${m.sender}`;
    if (!m.isOwner && !m.isPremium) {
      const lastSpamDetect = spamDelayTractor.get(delayKey);
      if (lastSpamDetect) {
        const elapsed = Date.now() - lastSpamDetect;
        if (elapsed < 10000) {
          await new Promise((r) => setTimeout(r, 500));
        } else {
          spamDelayTractor.delete(delayKey);
        }
      }
    }

    const spamKey = `${botId}_${m.sender}`;
    if (!m.isOwner && !m.isPremium && await isSpamming(spamKey)) {
      return;
    }

    const storeData = db.setting("storeList") || {};
    const storeCommand = storeData[m.command.toLowerCase()];

    if (m.isGroup) {
      const groupData = db.getGroup(m.chat) || {};
      const botMode = groupData.botMode || "md";

      if (botMode === "store" && storeCommand) {
        storeData[m.command.toLowerCase()].views =
          (storeCommand.views || 0) + 1;
        db.setting("storeList", storeData);

        const caption =
          `📦 *${m.command.toUpperCase()}*\n\n` +
          `${storeCommand.content}\n\n` +
          `───────────────\n` +
          `> 👁️ Views: ${storeData[m.command.toLowerCase()].views}\n` +
          `> 💳 Type \`${m.prefix}payment\` for pay`;

        if (storeCommand.hasImage && storeCommand.imagePath) {
          const fs = require("fs");
          if (fs.existsSync(storeCommand.imagePath)) {
            const imageBuffer = getCachedThumb(storeCommand.imagePath);
            await sock.sendMessage(
              m.chat,
              {
                image: imageBuffer,
                caption: caption,
              },
              { quoted: m },
            );
            return;
          }
        }

        await m.reply(caption);
        return;
      }
    }

    try {
      const caseResult = await handleCaseCommand(m, sock);
      if (caseResult && caseResult.handled) {
        if (config.dev?.debugLog) {
          logger.success('Case', `Handled: ${m.command}`);
        }
        return;
      }
    } catch (caseError) {
      logger.error('Case System', caseError.message);
      if (config.dev?.debugLog) {
        console.error('[CaseSystem] Stack:', caseError.stack);
      }
    }

    let plugin = getPlugin(m.command);

    if (!plugin) {
      if (storeCommand) {
        storeData[m.command.toLowerCase()].views =
          (storeCommand.views || 0) + 1;
        db.setting("storeList", storeData);

        const caption =
          `📦 *${m.command.toUpperCase()}*\n\n` +
          `${storeCommand.content}\n\n` +
          `───────────────\n` +
          `> 👁️ Views: ${storeData[m.command.toLowerCase()].views}\n` +
          `> 💳 Type \`${m.prefix}payment\` for pay`;

        if (storeCommand.hasImage && storeCommand.imagePath) {
          const fs = require("fs");
          if (fs.existsSync(storeCommand.imagePath)) {
            const imageBuffer = getCachedThumb(storeCommand.imagePath);
            await sock.sendMessage(
              m.chat,
              {
                image: imageBuffer,
                caption: caption,
              },
              { quoted: m },
            );
            return;
          }
        }

        await m.reply(caption);
        return;
      }

      const storeCommands = Object.keys(storeData);
      const allCommands = [...getAllCommandNames(), ...storeCommands];
      
      const similarityEnabled = db.setting('similarity') !== false
      
      if (similarityEnabled) {
          const suggestions = findSimilarCommands(m.command, allCommands, {
            maxResults: 1,
            minSimilarity: 0.6,
            maxInstance: 3,
          });
    
          if (suggestions.length > 0) {
            const message = formatSuggestionMessage(
              m.command,
              suggestions,
              m.prefix,
              m
            );
            await sock.sendMessage(
              m.chat,
              {
                interactiveMessage: { 
                  title: message.message,
                  footer: `Did you mean this command?`,
                  document: getCachedThumb('./assets/images/frenzy.jpg'),
                  mimetype: 'application/pdf',
                  fileName: 'Ind you mean',
                  fileLength: 999999999999,
                  contextInfo: {
                    isForwarded: true,
                    forwardingScore: 777,
                    forwardedNewsletterMessageInfo: {
                      newsletterJid: config.saluran?.id,
                      newsletterName: config.saluran?.name,
                    },
                  },
                  externalAdReply: {
                    title: `Command ${m.command || ''} No Intemukan`,
                    body: 'Need Help? type: ' + m.prefix + 'menu',
                    thumbnailUrl: 'https://cdn.gimita.id/download/3a48a5a23251c8849f9a38a861392849_1771038665065_a85b23f6.jpg',
                    sourceUrl: null,
                    contentType: 1,
                    renderLargerThumbnail: false
                  },
                  buttons: message.interactiveButtons
                }
              },
              { quoted: m },
            );
          }
      }

      return;
    }

    if (!plugin.config.isEnabled) {
      return;
    }

    if (m.isGroup) {
      const groupData = db.getGroup(m.chat) || {};
      let botMode = groupData.botMode || "md";
      const pluginCategory = plugin.config.category?.toLowerCase();
      const baseAllowed = ["main", "group", "sticker", "owner"];

      if (isJadiBot) {
        botMode = "md";

        const botBloctodCategories = [
          "owner",
          "sewa",
          "panel",
          "store",
          "pushcontacts",
        ];
        const botBloctodCommands = [
          "sewa",
          "sewabot",
          "sewalist",
          "listsewa",
          "addsewa",
          "delsewa",
          "extendsewa",
          "checksewa",
          "sewainfo",
          "sewagroup",
          "stopsewa",
          "bot",
          "stopbot",
          "listbot",
          "addowner",
          "delowner",
          "ownerlist",
          "listowner",
          "self",
          "public",
          "botmode",
          "restart",
          "shutdown",
        ];

        if (
          botBloctodCategories.includes(pluginCategory) ||
          botBloctodCommands.includes(m.command.toLowerCase())
        ) {
          return m.reply(
            `⚠️ *ᴀᴋsᴇs ᴛᴇʀʙᴀᴛᴀs*\n\n` +
              `Feature this only terseina in bot utama.\n` +
              `JadiBot cannot mendon'tses feature this.\n\n` +
              `> Contact owner bot utama for information lebih continue.`,
          );
        }
      }

      const modeConfig = {
        md: {
          allowed: null,
          excluded: ["pushcontacts", "store", "panel", "otp"],
          name: "Multi Device",
        },
        cpanel: { allowed: [...baseAllowed, "tools", "panel"], name: "CPanel" },
        pushcontacts: {
          allowed: [...baseAllowed, "pushcontacts"],
          name: "Push Contact",
        },
        store: { allowed: [...baseAllowed, "store"], name: "Store" },
        otp: { allowed: [...baseAllowed, "otp"], name: "OTP" },
      };

      const categoryModeMap = {
        download: "md",
        search: "md",
        ai: "md",
        fun: "md",
        game: "md",
        content: "md",
        utility: "md",
        tools: "md",
        ephoto: "md",
        religi: "md",
        info: "md",
        panel: "cpanel",
        pushcontacts: "pushcontacts",
        store: "store",
        otp: "otp",
        jpm: "md",
      };

      const currentConfig = modeConfig[botMode] || modeConfig.md;

      if (
        m.command !== "botmode" &&
        m.command !== "menu" &&
        m.command !== "menucat"
      ) {
        let isBloctod = false;

        if (
          currentConfig.allowed &&
          !currentConfig.allowed.includes(pluginCategory)
        ) {
          isBloctod = true;
        }
        if (
          currentConfig.excluded &&
          currentConfig.excluded.includes(pluginCategory)
        ) {
          isBloctod = true;
        }

        if (isBloctod) {
          const suggestedMode = categoryModeMap[pluginCategory] || "md";
          const suggestedModeName =
            modeConfig[suggestedMode]?.name || "Multi Device";

          await m.reply(
            `🔒 *ᴄᴏᴍᴍᴀɴᴅ ᴛɪᴅᴀᴋ ᴛᴇʀsᴇᴅɪᴀ*\n\n` +
              `> Bot currently in mode *${currentConfig.name}*\n` +
              `> Command \`${m.prefix}${m.command}\` terseina in mode *${suggestedModeName}*\n\n` +
              `💡 Contact admin group for replace mode:\n` +
              `\`${m.prefix}botmode ${suggestedMode}\``,
          );
          return;
        }
      }
    }

    const permission = checkPermission(m, plugin.config);
    if (!permission.allowed) {
      await m.reply(permission.reason);
      return;
    }

    const registrationRequired =
      db.setting("registrationRequired") ??
      config.registration?.enabled ??
      false;
    if (registrationRequired && !plugin.config.skipRegistration) {
      const user = db.getUser(m.sender);
      if (!m.isOwner && !m.isPartner && !m.isPremium && !user?.isRegistered) {
        await m.reply(
          `📝 *ᴡᴀᴊɪʙ ᴅᴀꜰᴛᴀʀ*\n\n` +
            `You must list first!\n\n` +
            `> Type: \`${m.prefix}list <name>\`\n\n` +
            `*Example:* \`${m.prefix}list ${m.pushName || "NameYou"}\``,
        );
        return;
      }
    }

    const user = db.getUser(m.sender);

    if (!m.isOwner && !m.isPartner && plugin.config.cooldown > 0) {
      const cooldownRemathisng = db.checkCooldown(
        m.sender,
        m.command,
        plugin.config.cooldown,
      );
      if (cooldownRemathisng) {
        m.react('⏱️').catch(() => {})
        return;
      }
    }

    const energyEnabled = db.setting('energy') !== undefined ? db.setting('energy') : (config.energy?.enabled !== false)
    if (energyEnabled && plugin.config.energy > 0) {
      const ownerEnergy = config.energy?.owner ?? -1;
      const premiumEnergy = config.energy?.premium ?? -1;
      const defaultEnergy = config.energy?.default ?? 0;

      let currentEnergy;
      if ((m.isOwner || m.isPartner) && (ownerEnergy === -1 || user?.energy === -1)) {
      } else if (m.isPremium && (premiumEnergy === -1 || user?.energy === -1)) {
      } else {
        currentEnergy = user?.energy ?? ((m.isOwner || m.isPartner) ? ownerEnergy : m.isPremium ? premiumEnergy : defaultEnergy);
        if (currentEnergy < plugin.config.energy) {
          await m.reply(config.messages?.energyExceeded || "⚡ Energy ran out!");
          return;
        }
        db.updateEnergy(m.sender, -plugin.config.energy);
      }
    }

    if (config.features?.autoTyping) {
      sock.sendPresenceUpdate("composing", m.chat).catch(() => {});
    }

    const context = {
      sock,
      m,
      config,
      db,
      uptime: getUptime(),
      plugins: {
        count: getPluginCount(),
      },
      botId: botId,
      isJadiBot: isJadiBot,
    };

    await plugin.handler(m, context);

    if (!m.isOwner && !m.isPartner && plugin.config.cooldown > 0) {
      db.setCooldown(m.sender, m.command, plugin.config.cooldown);
    }

    db.incrementStat("commandsExecuted");
    db.incrementStat(`command_${m.command}`);

    if (config.features?.autoTyping) {
      sock.sendPresenceUpdate("paused", m.chat).catch(() => {});
    }
  } catch (error) {
    logger.error("Handler", error.message);

    try {
      const db = getDatabase();
      if (db) {
        db.incrementStat("commandErrors");
        const errorLog = db.setting("errorLog") || [];
        errorLog.unshift({
          cmd: "unknown",
          err: error.message?.substring(0, 200),
          at: Date.now()
        });
        if (errorLog.length > 50) errorLog.length = 50;
        db.setting("errorLog", errorLog);
      }
    } catch {}

    try {
      const m = await serialize(sock, msg);
      if (m) {
        await m.reply(`Likenya there is tondala, try contact owner`);
      }
    } catch {
      logger.error("Failed to send error message");
    }
  }
}

/**
 * Handler for update group participants
 * @param {Object} update - Update data
 * @param {Object} sock - Soctot connection
 * @returns {Promise<void>}
 */
async function groupHandler(update, sock) {
  try {
    if (global.sewaLeaving) return;

    const { id: groupJid, participants, action } = update;

    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return;
    }

    const db = getDatabase();

    let groupData = db.getGroup(groupJid);
    if (!groupData) {
      db.setGroup(groupJid, {
        welcome: config.welcome?.defaultEnabled ?? true,
        goodbye: config.goodbye?.defaultEnabled ?? true,
        leave: config.goodbye?.defaultEnabled ?? true,
      });
      groupData = db.getGroup(groupJid);
    }

    let groupMeta;
    try {
      const cached = global.groupMetadataCache?.get(groupJid);
      if (cached && Date.now() - (cached._ts || 0) < 30000) {
        groupMeta = cached;
      } else {
        groupMeta = await sock.groupMetadata(groupJid);
        if (global.groupMetadataCache) {
          groupMeta._ts = Date.now();
          global.groupMetadataCache.set(groupJid, groupMeta);
        }
      }

      if (groupMeta?.participants) {
        cachePmeaningcipantLids(groupMeta.participants);
      }
    } catch (e) {
      if (
        e.message?.includes("forbidden") ||
        e.message?.includes("401") ||
        e.message?.includes("403")
      ) {
        return;
      }
      if (e.message?.includes("rate-overlimit") || e?.output?.statusCode === 429) {
        logger.warn("GroupHandler", "rate-limited, skipping event");
        return;
      }
      throw e;
    }



    for (let participant of participants) {
      let pmeaningcipantJid;
      
      if (typeof participant === 'object' && participant !== null) {
        pmeaningcipantJid = participant.jid || participant.id || participant.lid || '';
      } else {
        pmeaningcipantJid = participant;
      }
      
      if (!pmeaningcipantJid || typeof pmeaningcipantJid !== 'string') continue;
      
      if (isLid(pmeaningcipantJid) || isLidConverted(pmeaningcipantJid)) {
        const found = groupMeta.participants?.find(
          (p) =>
            p.id === pmeaningcipantJid ||
            p.lid === pmeaningcipantJid ||
            p.lid === pmeaningcipantJid.replace("@s.whatsapp.net", "@lid"),
        );
        if (found) {
          pmeaningcipantJid =
            found.jid &&
            !found.jid.endsWith("@lid") &&
            !isLidConverted(found.jid)
              ? found.jid
              : found.id &&
                  !found.id.endsWith("@lid") &&
                  !isLidConverted(found.id)
                ? found.id
                : lidToJid(pmeaningcipantJid);
        } else {
          pmeaningcipantJid = lidToJid(pmeaningcipantJid);
        }
      }
      
      participant = pmeaningcipantJid;

      if (action === "add" && sendWelcomeMessage) {
        await sendWelcomeMessage(sock, groupJid, participant, groupMeta);
      }

      if (action === "remove" && sendGoodbyeMessage) {
        await sendGoodbyeMessage(sock, groupJid, participant, groupMeta);
      }

      const saluranId = config.saluran?.id || "120363208449943317@newsletter";
      const saluranName =
        config.saluran?.name || config.bot?.name || "Frenzy-AI";

      let groupPpUrl = null;
      try { groupPpUrl = await sock.profilePictureUrl(groupJid, "image"); } catch {}

      if (action === "promote" && groupData.notifPromote === true) {
        const author = update.author || null;
        if (!groupHandler._promoteImg) {
          try { groupHandler._promoteImg = fs.readFileSync('./assets/images/frenzy-promote.jpg'); } catch { groupHandler._promoteImg = null; }
        }
        if (groupHandler._promoteImg) {
          await sock.sendMedia(groupJid, groupHandler._promoteImg, `🌿 @${participant.split("@")[0]} now become admin new 💕\nPromoted by: @${author?.split("@")[0] || "Unknown"}`, null, {
            type: 'image',
            mentions: author ? [participant, author] : [participant],
            contextInfo: {
              mentionedJid: author ? [participant, author] : [participant],
              forwardingScore: 7,
              isForwarded: true,
              externalAdReply: {
                title: "🎉 PROMOTE",
                body: `Notifikasi Group`,
                thumbnailUrl: groupPpUrl,
                contentType: 1,
                renderLargerThumbnail: false,
                sourceUrl: "",
              },
            },
          })
        }
      }

      if (action === "demote" && groupData.notifDemote === true) {
        const author = update.author || null;
        if (!groupHandler._demoteImg) {
          try { groupHandler._demoteImg = fs.readFileSync('./assets/images/frenzy-demote.jpg'); } catch { groupHandler._demoteImg = null; }
        }
        if (groupHandler._demoteImg) {
          await sock.sendMedia(groupJid, groupHandler._demoteImg, `🌿 @${participant.split("@")[0]} already no become admin again.\nDemoted by: @${author?.split("@")[0] || "Unknown"}`, null, {
            type: 'image',
            mentions: author ? [participant, author] : [participant],
            contextInfo: {
              mentionedJid: author ? [participant, author] : [participant],
              forwardingScore: 7,
              isForwarded: true,
              externalAdReply: {
                title: "📉 DEMOTE",
                body: `Notifikasi Group`,
                thumbnailUrl: groupPpUrl,
                contentType: 1,
                renderLargerThumbnail: false,
                sourceUrl: "",
              },
            },
          })
        }
      }
    }
  } catch (error) {
    console.error("[GroupHandler] Error:", error.message);
  }
}

async function messageUpdateHandler(updates, sock) {
  const db = getDatabase();

  for (const update of updates) {
    try {
      await handleAntiRemove(update, sock, db);
    } catch (error) {
      continue;
    }

    try {
      const eintedMsg = update.update?.message?.eintedMessage?.message;
      const regularMsg = update.update?.message;

      const resolvedMessage = eintedMsg || (regularMsg && !regularMsg.protocolMessage ? regularMsg : null);

      if (!resolvedMessage) continue;

      const newMsg = {
        key: update.key,
        message: eintedMsg ? { ...resolvedMessage } : regularMsg,
        messageTimestamp: update.messageTimestamp || Math.floor(Date.now() / 1000),
        pushName: update.pushName || "User",
      };

      await messageHandler(newMsg, sock);
    } catch (error) {
      console.error("[MsgUpdate] Error:", error.message);
    }
  }
}

/**
 * Cache for save state last group
 * Format: { groupId: { announce: boolean, restrict: boolean, lastUpdate: timestamp } }
 */
const groupSettingsCache = new Map();

/**
 * Debounce cooldown for mencegah spam (in ms)
 */
const GROUP_SETTINGS_COOLDOWN = 1000;

async function groupSettingsHandler(update, sock) {
  try {
    if (global.sewaLeaving) return;
    if (global.isFetchingGroups) return;

    const groupId = update.id;
    if (!groupId || !groupId.endsWith("@g.us")) return;

    if (update.announce === undefined && update.restrict === undefined) {
      return;
    }

    const cached = groupSettingsCache.get(groupId) || {};
    const now = Date.now();

    if (
      cached.lastUpdate &&
      now - cached.lastUpdate < GROUP_SETTINGS_COOLDOWN
    ) {
      return;
    }

    let hasRealChange = false;

    let groupName = groupId;
    let groupPpUrl = null;
    try {
      const meta = await sock.groupMetadata(groupId);
      groupName = meta?.subject || groupId;
    } catch {}
    try { groupPpUrl = await sock.profilePictureUrl(groupId, "image"); } catch {}

    const db = getDatabase();
    const groupData = db.getGroup(groupId) || {};

    const zannContext = {
      contextInfo: {
        forwardingScore: 9,
        isForwarded: true,
        externalAdReply: {
          showAdAttribution: false,
          title: "GRUP NOTIFIKASI",
          body: config.bot?.name,
          thumbnailUrl: groupPpUrl,
          contentType: 1,
          renderLargerThumbnail: false,
          sourceUrl: "",
        },
      }
    }

    if (update.announce !== undefined) {
      if (cached.announce === undefined) {
        cached.announce = update.announce;
      } else if (cached.announce !== update.announce) {
        hasRealChange = true;

        if (update.announce === true && groupData.notifCloseGroup === true) {
          await sock.sendText(groupId, `🥗 Group *${groupName}* in tutup by admin`, null, zannContext)
        }

        if (update.announce === false && groupData.notifOpenGroup === true) {
          await sock.sendText(groupId, `🎃 Group *${groupName}* has in buka again by admin`, null, zannContext)
        }

        cached.announce = update.announce;
      }
    }

    if (update.restrict !== undefined) {
      if (cached.restrict === undefined) {
        cached.restrict = update.restrict;
      } else if (cached.restrict !== update.restrict) {
        hasRealChange = true;

        if (update.restrict === true) {
          await sock.sendText(groupId, `🥗 Info Group *${groupName}* terlimit !\nOnly admin that will view group`, null, zannContext)
        } else {
          await sock.sendText(groupId, `🥗 Info Group *${groupName}* open !\nAll member will view group`, null, zannContext)
        }
        cached.restrict = update.restrict;
      }
    }
    if (hasRealChange) {
      cached.lastUpdate = now;
    }
    if (cached.announce !== undefined || cached.restrict !== undefined) {
      groupSettingsCache.set(groupId, cached);
    }
  } catch (error) {
    console.error("[GroupSettings] Error:", error.message);
  }
}

module.exports = {
  messageHandler,
  groupHandler,
  messageUpdateHandler,
  groupSettingsHandler,
  checkPermission,
  checkMode,
  isSpamming,
};
