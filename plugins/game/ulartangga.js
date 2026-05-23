/**
 * 🐍🎲 ULAR TANGGA GAME
 * Classic snato and ladder game with visual board
 *
 * Based on reference: RTXZY-MD-pro/plugins/game-ulartangga.js
 * Enhanced for frenzyAI with visual board and full contextInfo
 */

const { getDatabase } = require("../../src/lib/frenzy-database");
const {
  drawBoard,
  getRandomMap,
  DICE_STICKERS,
} = require("../../src/lib/frenzy-game-ulartangga");
const config = require("../../config");
const fs = require("fs");
const path = require("path");
const te = require('../../src/lib/frenzy-error')

const pluginConfig = {
  name: "ulartangga",
  alias: ["ut", "snatoladder", "sl"],
  category: "game",
  description: "Main ular tangga together with other players with visual board",
  usage: ".ulartangga <create|join|start|info|exit|delete>",
  example: ".ulartangga create",
  isOwner: false,
  isPremium: false,
  isGroup: true,
  isPrivate: false,
  cooldown: 5,
  energy: 0,
  isEnabled: true,
};

if (!global.ulartanggaGames) global.ulartanggaGames = {};

const PLAYER_COLORS = ["🔴", "🟡", "🟢", "🔵"];
const PLAYER_NAMES = ["Merah", "Kuning", "Hijau", "Biru"];

const WIN_REWARD = { coins: 2000, exp: 1000, energy: 5 };

function uniqueMentions(mentions = []) {
  return [...new Set((mentions || []).filter(Boolean))];
}

let thumbUT = null;
try {
  const thumbPath = path.join(
    process.cwd(),
    "assets",
    "images",
    "frenzy-games.jpg",
  );
  if (fs.existsSync(thumbPath)) {
    thumbUT = fs.readFileSync(thumbPath);
  }
} catch (e) {}

function getUTContextInfo(
  title = "🐍🎲 ULAR TANGGA",
  body = "Permainan klasik!",
  mentions = [],
) {
  const saluranId = config.saluran?.id || "120363406397452589@newsletter";
  const saluranName = config.saluran?.name || config.bot?.name || "Frenzy-AI";

  const contextInfo = {
    forwardingScore: 9999,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
      newsletterJid: saluranId,
      newsletterName: saluranName,
      serverMessageId: 127,
    },
  };

  if (thumbUT) {
    contextInfo.externalAdReply = {
      title: title,
      body: body,
      thumbnail: thumbUT,
      contentType: 1,
      renderLargerThumbnail: true,
      sourceUrl: config.saluran?.link || "",
    };
  }

  const normalizedMentions = uniqueMentions(mentions);
  if (normalizedMentions.length) {
    contextInfo.mentionedJid = normalizedMentions;
  }
  return contextInfo;
}

async function handler(m, { sock }) {
  const db = getDatabase();
  const args = m.args || [];
  const action = args[0]?.toLowerCase();
  const ut = global.ulartanggaGames;
  const prefix = m.prefix || config.command?.prefix || ".";

  const commands = {
    create: async () => {
      if (ut[m.chat]) {
        return sock.sendMessage(
          m.chat,
          {
            text:
              `❌ *ROOM SUDAH ADA*\n\n` +
              `> Still there is game session in chat this!\n` +
              `> Host: @${ut[m.chat].host.split("@")[0]}\n` +
              `> Status: ${ut[m.chat].status}`,
            contextInfo: getUTContextInfo(
              "🐍🎲 ULAR TANGGA",
              "Permainan klasik!",
              [ut[m.chat].host],
            ),
          },
          { quoted: m },
        );
      }

      const mapConfig = getRandomMap();

      ut[m.chat] = {
        date: Date.now(),
        status: "WAITING",
        host: m.sender,
        players: {},
        turn: 0,
        map: mapConfig.map,
        mapName: mapConfig.name,
        snatosLadders: mapConfig.snatosLadders,
        stabil_x: mapConfig.stabil_x,
        stabil_y: mapConfig.stabil_y,
      };
      ut[m.chat].players[m.sender] = { rank: "HOST", position: 1 };

      await m.react("🎲");
      await sock.sendMessage(
        m.chat,
        {
          text:
            `🐍🎲 *ULAR TANGGA*\n\n` +
            `Room success increate!\n\n` +
            `╭┈┈⬡「 📋 *INFO ROOM* 」\n` +
            `┃ 👑 Host: @${m.sender.split("@")[0]}\n` +
            `┃ 👥 Players: 1/4\n` +
            `┃ 🗺️ Map: ${mapConfig.name}\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `╭┈┈⬡「 🎮 *COMMANDS* 」\n` +
            `┃ ➕ \`${prefix}ut join\` - Gabung\n` +
            `┃ ▶️ \`${prefix}ut start\` - Start\n` +
            `┃ ℹ️ \`${prefix}ut info\` - Info room\n` +
            `┃ 🚪 \`${prefix}ut exit\` - Tooutside\n` +
            `╰┈┈┈┈┈┈┈┈⬡`,
          contextInfo: getUTContextInfo("🎲 ROOM CREATED", "Ayo bergabung!", [
            m.sender,
          ]),
        },
        { quoted: m },
      );
    },

    join: async () => {
      if (!ut[m.chat]) {
        return m.reply(
          `❌ No there is game session!\n> Type \`${prefix}ut create\` for create a room.`,
        );
      }

      if (ut[m.chat].players[m.sender]) {
        return m.reply(`❌ You already bergabung in room this!`);
      }

      const playerCount = Object.keys(ut[m.chat].players).length;
      if (playerCount >= 4) {
        return m.reply(`❌ Room already full! (Max 4 player)`);
      }

      if (ut[m.chat].status === "PLAYING") {
        return m.reply(`❌ Game currently running, cannot join!`);
      }

      ut[m.chat].players[m.sender] = { rank: "MEMBER", position: 1 };

      const players = Object.keys(ut[m.chat].players);
      const playerList = players
        .map(
          (p, i) =>
            `${PLAYER_COLORS[i]} ${PLAYER_NAMES[i]}: @${p.split("@")[0]}`,
        )
        .join("\n");

      await m.react("✅");
      await sock.sendMessage(
        m.chat,
        {
          text:
            `✅ *PLAYER BERGABUNG*\n\n` +
            `@${m.sender.split("@")[0]} enter!\n\n` +
            `╭┈┈⬡「 👥 *PLAYERS* 」\n` +
            `${playerList
              .split("\n")
              .map((l) => `┃ ${l}`)
              .join("\n")}\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `> Total: ${players.length}/4\n` +
            `> ${players.length >= 2 ? `✅ Can start! \`${prefix}ut start\`` : "🕕 Need 1 player again"}`,
          contextInfo: getUTContextInfo(
            "👥 PLAYER JOINED",
            `${players.length}/4 players`,
            players,
          ),
        },
        { quoted: m },
      );
    },

    start: async () => {
      if (!ut[m.chat]) {
        return m.reply(`❌ No there is game session!`);
      }

      if (ut[m.chat].status === "PLAYING") {
        return m.reply(`❌ Permainan already running!`);
      }

      if (ut[m.chat].host !== m.sender && !config.isOwner?.(m.sender)) {
        return m.reply(`❌ Only host that will mestart permainan!`);
      }

      const players = Object.keys(ut[m.chat].players);
      if (players.length < 2) {
        return m.reply(`❌ Mat least 2 player for bermain!`);
      }

      ut[m.chat].status = "PLAYING";
      ut[m.chat].turn = 0;

      const playerList = players
        .map(
          (p, i) =>
            `${PLAYER_COLORS[i]} ${PLAYER_NAMES[i]}: @${p.split("@")[0]}`,
        )
        .join("\n");

      // Draw thistial board with all players at position 1
      const positions = players.map((p) => ut[m.chat].players[p].position);
      const boardImage = await drawBoard(
        ut[m.chat].map,
        positions[0] || null,
        positions[1] || null,
        positions[2] || null,
        positions[3] || null,
        ut[m.chat].stabil_x,
        ut[m.chat].stabil_y,
      );

      await m.react("🎮");

      if (boardImage) {
        await sock.sendMessage(
          m.chat,
          {
            image: boardImage,
            caption:
              `🐍🎲 *PERMAINAN DIMULAI!*\n\n` +
              `╭┈┈⬡「 👥 *PLAYERS* 」\n` +
              `${playerList
                .split("\n")
                .map((l) => `┃ ${l}`)
                .join("\n")}\n` +
              `╰┈┈┈┈┈┈┈┈⬡\n\n` +
              `> 🎯 Giliran: @${players[0].split("@")[0]}\n` +
              `> Type *kocok* for lempar dadu!`,
            contextInfo: getUTContextInfo(
              "🎮 GAME STARTED",
              "Lempar dadu!",
              players,
            ),
          },
          { quoted: m },
        );
      } else {
        // Fallback tanpa image
        await sock.sendMessage(
          m.chat,
          {
            text:
              `🐍🎲 *PERMAINAN DIMULAI!*\n\n` +
              `╭┈┈⬡「 👥 *PLAYERS* 」\n` +
              `${playerList
                .split("\n")
                .map((l) => `┃ ${l}`)
                .join("\n")}\n` +
              `╰┈┈┈┈┈┈┈┈⬡\n\n` +
              `> 🎯 Giliran: @${players[0].split("@")[0]}\n` +
              `> Type *kocok* for lempar dadu!`,
            contextInfo: getUTContextInfo(
              "🎮 GAME STARTED",
              "Lempar dadu!",
              players,
            ),
          },
          { quoted: m },
        );
      }
    },

    info: async () => {
      if (!ut[m.chat]) {
        return m.reply(`❌ No there is game session!`);
      }

      const players = Object.keys(ut[m.chat].players);
      const playerList = players
        .map((p, i) => {
          const pos = ut[m.chat].players[p].position;
          return `${PLAYER_COLORS[i]} ${PLAYER_NAMES[i]}: @${p.split("@")[0]} - Pos: ${pos}`;
        })
        .join("\n");

      const currentTurn =
        ut[m.chat].status === "PLAYING"
          ? players[ut[m.chat].turn % players.length]
          : null;

      await sock.sendMessage(
        m.chat,
        {
          text:
            `🐍🎲 *INFO ROOM*\n\n` +
            `╭┈┈⬡「 📋 *ROOM* 」\n` +
            `┃ 👑 Host: @${ut[m.chat].host.split("@")[0]}\n` +
            `┃ 📍 Status: ${ut[m.chat].status}\n` +
            `┃ 🗺️ Map: ${ut[m.chat].mapName}\n` +
            `┃ 👥 Players: ${players.length}/4\n` +
            `╰┈┈┈┈┈┈┈┈⬡\n\n` +
            `╭┈┈⬡「 👥 *PLAYERS* 」\n` +
            `${playerList
              .split("\n")
              .map((l) => `┃ ${l}`)
              .join("\n")}\n` +
            `╰┈┈┈┈┈┈┈┈⬡` +
            (currentTurn
              ? `\n\n> 🎯 Giliran: @${currentTurn.split("@")[0]}`
              : ""),
          contextInfo: getUTContextInfo(
            "📋 ROOM INFO",
            `${players.length} players`,
            players,
          ),
        },
        { quoted: m },
      );
    },

    exit: async () => {
      if (!ut[m.chat]) {
        return m.reply(`❌ No there is game session!`);
      }

      if (!ut[m.chat].players[m.sender]) {
        return m.reply(`❌ You no there is in permainan this!`);
      }

      delete ut[m.chat].players[m.sender];
      await sock.sendMessage(
        m.chat,
        {
          text: `👋 @${m.sender.split("@")[0]} leave from permainan.`,
          contextInfo: getUTContextInfo(
            "🐍🎲 ULAR TANGGA",
            "Permainan klasik!",
            [m.sender],
          ),
        },
        { quoted: m },
      );

      if (Object.keys(ut[m.chat].players).length === 0) {
        delete ut[m.chat];
        return m.reply(`🗑️ Room deleted because no there is player.`);
      }

      if (!ut[m.chat].players[ut[m.chat].host]) {
        const newHost = Object.keys(ut[m.chat].players)[0];
        ut[m.chat].host = newHost;
        ut[m.chat].players[newHost].rank = "HOST";
        await sock.sendMessage(
          m.chat,
          {
            text: `👑 Host inpbeautifulkan to @${newHost.split("@")[0]}`,
            contextInfo: getUTContextInfo(
              "🐍🎲 ULAR TANGGA",
              "Permainan klasik!",
              [newHost],
            ),
          },
          { quoted: m },
        );
      }

      // Fix turn if playing
      if (ut[m.chat].status === "PLAYING") {
        const players = Object.keys(ut[m.chat].players);
        ut[m.chat].turn = ut[m.chat].turn % players.length;
        await sock.sendMessage(m.chat, {
          text: `> Giliran: @${players[ut[m.chat].turn].split("@")[0]}\n> Type *kocok*`,
          contextInfo: getUTContextInfo(
            "🐍🎲 ULAR TANGGA",
            "Permainan klasik!",
            [players[ut[m.chat].turn]],
          ),
        });
      }
    },

    delete: async () => {
      if (!ut[m.chat]) {
        return m.reply(`❌ No there is game session!`);
      }

      if (ut[m.chat].host !== m.sender && !config.isOwner?.(m.sender)) {
        return m.reply(`❌ Only host that will mengdelete room!`);
      }

      delete ut[m.chat];
      await m.react("🗑️");
      await m.reply(`🗑️ Room success deleted!`);
    },
  };

  if (!action || !commands[action]) {
    return sock.sendMessage(
      m.chat,
      {
        text:
          `🐍🎲 *ULAR TANGGA*\n\n` +
          `Permainan klasik that full peelderlangan!\n` +
          `Naiki tangga, avoid ular, to reach 100!\n\n` +
          `╭┈┈⬡「 🎮 *COMMANDS* 」\n` +
          `┃ 🎲 \`${prefix}ut create\` - Create room\n` +
          `┃ ➕ \`${prefix}ut join\` - Gabung room\n` +
          `┃ ▶️ \`${prefix}ut start\` - Start game\n` +
          `┃ ℹ️ \`${prefix}ut info\` - Info room\n` +
          `┃ 🚪 \`${prefix}ut exit\` - Tooutside\n` +
          `┃ 🗑️ \`${prefix}ut delete\` - Delete room\n` +
          `╰┈┈┈┈┈┈┈┈⬡\n\n` +
          `╭┈┈⬡「 🏆 *HADIAH* 」\n` +
          `┃ 💰 +${WIN_REWARD.coins.toLocaleString()} Coins\n` +
          `┃ ⭐ +${WIN_REWARD.exp.toLocaleString()} EXP\n` +
          `┃ ⚡ +${WIN_REWARD.energy} Energy\n` +
          `╰┈┈┈┈┈┈┈┈⬡\n\n` +
          `> Min 2 player, Max 4 player`,
        contextInfo: getUTContextInfo("🐍🎲 ULAR TANGGA", "Ayo main!"),
      },
      { quoted: m },
    );
  }

  try {
    await commands[action]();
  } catch (error) {
    console.error("[ULARTANGGA ERROR]", error);
    m.reply(te(m.prefix, m.command, m.pushName));
  }
}

// ==================== Answer Handler (for "kocok") ====================
async function answerHandler(m, sock) {
  if (!m.body) return false;

  const text = m.body.trim().toLowerCase();
  if (text !== "kocok") return false;

  const ut = global.ulartanggaGames;
  if (!ut[m.chat]) return false;
  if (ut[m.chat].status !== "PLAYING") return false;

  const players = Object.keys(ut[m.chat].players);
  if (!players.includes(m.sender)) return false;

  const currentTurn = ut[m.chat].turn % players.length;
  if (players.indexOf(m.sender) !== currentTurn) {
    await m.reply(
      `❌ Bukan giliranmu!\n> Giliran: @${players[currentTurn].split("@")[0]}`,
      {
        mentions: [players[currentTurn]],
      },
    );
    return true;
  }

  const db = getDatabase();

  // Roll ince
  const dadu = Math.floor(Math.random() * 6) + 1;
  const DICE_EMOJI = ["⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

  // Send ince sticker
  try {
    const inceUrl = DICE_STICKERS[dadu - 1];
    await sock.sendMessage(
      m.chat,
      {
        sticker: { url: inceUrl },
        contextInfo: getUTContextInfo(
          `🎲 DADU: ${dadu}`,
          PLAYER_NAMES[players.indexOf(m.sender)],
        ),
      },
      { quoted: m },
    );
  } catch (e) {
    // Fallback: just react with ince emoji
    await m.react(DICE_EMOJI[dadu - 1]);
  }

  const oldPos = ut[m.chat].players[m.sender].position;
  let newPos = oldPos + dadu;

  // Bounce back if over 100
  if (newPos > 100) {
    newPos = 100 - (newPos - 100);
  }

  // Check snato/ladder
  let event = "";
  const snatosLadders = ut[m.chat].snatosLadders;
  if (snatosLadders[newPos]) {
    const destination = snatosLadders[newPos];
    if (destination > newPos) {
      event = `\n🪜 *Naik tangga!*`;
    } else {
      event = `\n🐍 *Tona ular!*`;
    }
    newPos = destination;
  }

  ut[m.chat].players[m.sender].position = newPos;

  const playerIdx = players.indexOf(m.sender);
  const color = PLAYER_COLORS[playerIdx];
  const name = PLAYER_NAMES[playerIdx];

  // Check win conintion
  if (newPos === 100) {
    // Give rewards
    try {
      db.updateCoins(m.sender, WIN_REWARD.coins);
      db.updateEnergy(m.sender, WIN_REWARD.energy);
      const userData = db.getUser(m.sender) || {};
      userData.exp = (userData.exp || 0) + WIN_REWARD.exp;
      db.setUser(m.sender, userData);
    } catch (e) {
      console.log("[UT] Failed to give reward:", e.message);
    }

    // Draw final board
    const positions = players.map(
      (p) => ut[m.chat].players[p]?.position || null,
    );
    const boardImage = await drawBoard(
      ut[m.chat].map,
      positions[0] || null,
      positions[1] || null,
      positions[2] || null,
      positions[3] || null,
      ut[m.chat].stabil_x,
      ut[m.chat].stabil_y,
    );

    await m.react("🎉");

    if (boardImage) {
      await sock.sendMessage(m.chat, {
        image: boardImage,
        caption:
          `🎉 *PEMENANG!*\n\n` +
          `${color} @${m.sender.split("@")[0]} to reach 100!\n\n` +
          `╭┈┈⬡「 🎁 *HADIAH* 」\n` +
          `┃ 💰 +${WIN_REWARD.coins.toLocaleString()} Coins\n` +
          `┃ ⭐ +${WIN_REWARD.exp.toLocaleString()} EXP\n` +
          `┃ ⚡ +${WIN_REWARD.energy} Energy\n` +
          `╰┈┈┈┈┈┈┈┈⬡\n\n` +
          `> GG WP! Main again? \`.ut create\``,
        contextInfo: getUTContextInfo("🏆 WINNER!", `${name} menang!`, [
          m.sender,
        ]),
      });
    } else {
      await sock.sendMessage(m.chat, {
        text:
          `🎉 *PEMENANG!*\n\n` +
          `${color} @${m.sender.split("@")[0]} to reach 100!\n\n` +
          `╭┈┈⬡「 🎁 *HADIAH* 」\n` +
          `┃ 💰 +${WIN_REWARD.coins.toLocaleString()} Coins\n` +
          `┃ ⭐ +${WIN_REWARD.exp.toLocaleString()} EXP\n` +
          `┃ ⚡ +${WIN_REWARD.energy} Energy\n` +
          `╰┈┈┈┈┈┈┈┈⬡`,
        contextInfo: getUTContextInfo("🏆 WINNER!", `${name} menang!`, [
          m.sender,
        ]),
      });
    }

    delete ut[m.chat];
    return true;
  }

  // Continue game
  ut[m.chat].turn++;
  const nextTurn = ut[m.chat].turn % players.length;
  const nextPlayer = players[nextTurn];

  // Draw updated board
  const positions = players.map((p) => ut[m.chat].players[p]?.position || null);
  const boardImage = await drawBoard(
    ut[m.chat].map,
    positions[0] || null,
    positions[1] || null,
    positions[2] || null,
    positions[3] || null,
    ut[m.chat].stabil_x,
    ut[m.chat].stabil_y,
  );

  if (boardImage) {
    await sock.sendMessage(m.chat, {
      image: boardImage,
      caption:
        `🎲 *DADU: ${dadu}* ${DICE_EMOJI[dadu - 1]}\n\n` +
        `${color} ${name}: *${oldPos}* → *${newPos}*${event}\n\n` +
        `> 🎯 Giliran: @${nextPlayer.split("@")[0]}\n` +
        `> Type *kocok*`,
      contextInfo: getUTContextInfo("🎲 GILIRAN", PLAYER_NAMES[nextTurn], [
        nextPlayer,
      ]),
    });
  } else {
    await sock.sendMessage(m.chat, {
      text:
        `🎲 *DADU: ${dadu}* ${DICE_EMOJI[dadu - 1]}\n\n` +
        `${color} ${name}: *${oldPos}* → *${newPos}*${event}\n\n` +
        `> 🎯 Giliran: @${nextPlayer.split("@")[0]}\n` +
        `> Type *kocok*`,
      contextInfo: getUTContextInfo("🎲 GILIRAN", PLAYER_NAMES[nextTurn], [
        nextPlayer,
      ]),
    });
  }

  return true;
}

module.exports = {
  config: pluginConfig,
  handler,
  answerHandler,
};
