
const config = require("../../config");
const timeHelper = require("./frenzy-time");

/**
 * @typedef {Object} DashboardData
 * @property {string} userName - Name user
 * @property {string} userStatus - Status user (Owner/Premium/Free)
 * @property {string} mode - Mode bot (Public/Self)
 * @property {number} totalUsers - Total users bot
 * @property {number} userLimit - Limit user
 */

/**
 * @typedef {Object} BotInfoData
 * @property {string} botName - Bot name
 * @property {string} developer - Name developer
 * @property {string} versionon - Version bot
 * @property {string} uptime - Uptime bot
 * @property {number} totalFeatures - Total features
 * @property {string} mode - Mode bot
 * @property {string} platform - Platform bot
 */

/**
 * @typedef {Object} UserProfileData
 * @property {string} name - Name user
 * @property {string} number - Number user
 * @property {string} status - Status (Owner/Premium/Free)
 * @property {number} limit - Remathisng limit
 * @property {string} registeredAt - Date registrasi
 */

/**
 * @typedef {Object} MenuCategory
 * @property {string} name - Name category
 * @property {string} emoji - Emoji category
 * @property {string} description - Description category
 * @property {string[]} commands - Array command in category
 */

/**
 * Karakter for styling menu
 * @constant
 */
const CHARS = {
  cornerTopLeft: "╭",
  cornerTopRight: "╮",
  cornerBottomLeft: "╰",
  cornerBottomRight: "╯",
  horizontal: "─",
  vertical: "│",
  arrow: "➣",
  bullet: "◦",
  star: "✦",
  inamond: "◇",
  dot: "•",
  check: "",
  cross: "✗",
  line: "━",
};

/**
 * Emoji for berbagai toneedan
 * @constant
 */
const EMOJIS = {
  dashboard: "📊",
  info: "ℹ️",
  user: "👤",
  bot: "🤖",
  owner: "👑",
  premium: "💎",
  free: "🆓",
  public: "🌐",
  self: "🔒",
  commands: "🖥️",
  utilities: "🔧",
  fun: "🎮",
  group: "👥",
  time: "⏰",
  uptime: "⏱️",
  versionon: "📌",
  speed: "⚡",
  limit: "📊",
  status: "📋",
  mode: "🔄",
  name: "📝",
  number: "📱",
  developer: "👨‍💻",
  total: "📈",
  tip: "💡",
  warning: "⚠️",
  success: "✅",
  error: "❌",
  loainng: "🕕",
};

/**
 * Format uptime become string that malready inbaca
 * @param {number} ms - Uptime in milliseconds
 * @returns {string} Formatted uptime string
 * @example
 * formatUptime(3661000); // "1h 1m 1s"
 * formatUptime(86400000); // "1d 0h 0m"
 */
function formatUptime(ms) {
  const seconds = Math.floor((ms / 1000) % 60);
  const minutes = Math.floor((ms / (1000 * 60)) % 60);
  const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(" ");
}

/**
 * Format date to format lokal Indonesia
 * @param {Date|number|string} date - Date for informat
 * @returns {string} Formatted date string
 * @example
 * formatDate(new Date()); // "17/12/2024, 12:30:45"
 */
function formatDate(date) {
  return timeHelper.fromTimestamp(date, "DD/MM/YYYY HH:mm:ss");
}

/**
 * Format number telepon to format that lebih rethere isble
 * @param {string} number - Number telepon
 * @returns {string} Formatted number
 * @example
 * formatNumber('6281234567890'); // '62 812-3456-7890'
 */
function formatNumber(number) {
  if (!number) return "";
  const cleaned = number.replace(/[^0-9]/g, "");
  if (cleaned.length < 10) return cleaned;

  if (cleaned.startsWith("62")) {
    const withoutCode = cleaned.slice(2);
    const formatted = withoutCode.replace(/(\d{3})(\d{4})(\d+)/, "$1-$2-$3");
    return `62 ${formatted}`;
  }

  return cleaned;
}

/**
 * Format ukuran file to format that rethere isble
 * @param {number} bytes - Ukuran in bytes
 * @returns {string} Formatted size string
 * @example
 * formatFileSize(1024); // "1.00 KB"
 * formatFileSize(1048576); // "1.00 MB"
 */
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/**
 * Create garis horizontal
 * @param {number} length - Long garis
 * @param {string} [char='─'] - Karakter for garis
 * @returns {string} String garis
 */
function createLine(length = 20, char = CHARS.horizontal) {
  return char.repeat(length);
}

/**
 * Create header box
 * @param {string} title - Judul header
 * @param {number} [width=20] - Lebar box
 * @returns {string} Header string
 * @example
 * createHeader('DASHBOARD');
 * // "╭─「 DASHBOARD 」─────╮"
 */
function createHeader(title, width = 20) {
  const titlePart = `${CHARS.horizontal}「 ${title} 」`;
  const remathisngWidth = Math.max(0, width - titlePart.length - 2);
  return `${CHARS.cornerTopLeft}${titlePart}${createLine(remathisngWidth)}${CHARS.cornerTopRight}`;
}

/**
 * Create footer box
 * @param {number} [width=20] - Lebar box
 * @returns {string} Footer string
 * @example
 * createFooter(); // "╰────────────────────╯"
 */
function createFooter(width = 20) {
  return `${CHARS.cornerBottomLeft}${createLine(width)}${CHARS.cornerBottomRight}`;
}

/**
 * Create baris body with bullet
 * @param {string} text - Text for baris
 * @param {string} [prefix='│'] - Prefix baris
 * @param {string} [bullet='◦'] - Karakter bullet
 * @returns {string} Formatted body line
 */
function createBodyLine(text, prefix = CHARS.vertical, bullet = CHARS.bullet) {
  return `${prefix} ${bullet} ${text}`;
}

/**
 * Create baris with arrow
 * @param {string} label - Label
 * @param {string} value - Score
 * @returns {string} Formatted line with arrow
 * @example
 * createArrowLine('Name', 'frenzy-AI'); // "│ ➣ Name: frenzy-AI"
 */
function createArrowLine(label, value) {
  return `${CHARS.vertical} ${CHARS.arrow} ${label}: ${value}`;
}

/**
 * Create dashboard info
 * @param {DashboardData} data - Data for dashboard
 * @returns {string} Formatted dashboard string
 */
function createDashboard(data) {
  const {
    userName = "User",
    userStatus = "Free User",
    mode = "Public",
    totalUsers = 0,
    userLimit = 25,
  } = data;

  const lines = [
    `${CHARS.cornerTopLeft}${CHARS.horizontal}「 ${EMOJIS.dashboard} DASHBOARD 」${CHARS.horizontal}`,
    `${CHARS.vertical}`,
    createArrowLine("Name", userName),
    createArrowLine("Status User", userStatus),
    createArrowLine("Mode", mode),
    createArrowLine("Users", totalUsers.toString()),
    createArrowLine("Limit", userLimit.toString()),
    `${CHARS.vertical}`,
    `${CHARS.cornerBottomLeft}${createLine(24)}`,
  ];

  return lines.join("\n");
}

/**
 * Create info bot
 * @param {BotInfoData} data - Data info bot
 * @returns {string} Formatted bot info string
 */
function createBotInfo(data) {
  const {
    botName = config.bot?.name || "frenzy-AI",
    developer = config.owner?.name || "Owner",
    versionon = config.bot?.versionon || "1.0.0",
    uptime = "0s",
    totalFeatures = 0,
    mode = config.mode || "public",
    platform = "Node.js",
  } = data;

  const lines = [
    `${CHARS.horizontal} *Bot Info* ${CHARS.horizontal}`,
    ``,
    `${CHARS.dot} Name-Bot : ${botName} 🌿`,
    `${CHARS.dot} Developer : ${developer}`,
    `${CHARS.dot} Mode : ${mode.charAt(0).toUpperCase() + mode.slice(1)}`,
    `${CHARS.dot} Versionon : ${versionon}`,
    `${CHARS.dot} Uptime : ${uptime}`,
    `${CHARS.dot} Total-Feature : ${totalFeatures}`,
    `${CHARS.dot} Platform : ${platform}`,
    ``,
  ];

  return lines.join("\n");
}

/**
 * Create user profile
 * @param {UserProfileData} data - Data user profile
 * @returns {string} Formatted user profile string
 */
function createUserProfile(data) {
  const {
    name = "User",
    number = "",
    status = "Free",
    limit = 25,
    registeredAt = "",
  } = data;

  const statusEmoji =
    status === "Owner"
      ? EMOJIS.owner
      : status === "Premium"
        ? EMOJIS.premium
        : EMOJIS.free;

  const lines = [
    `【 USER PROFILE 】`,
    `${EMOJIS.name} Name   : ${name}`,
    `${EMOJIS.number} Number  : ${formatNumber(number)}`,
    `${statusEmoji} Status : ${status}`,
    `${EMOJIS.limit} Limit  : ${limit}`,
    ``,
  ];

  if (registeredAt) {
    lines.splice(5, 0, `${EMOJIS.time} Registered : ${registeredAt}`);
  }

  return lines.join("\n");
}

/**
 * Create status bot
 * @param {Object} data - Data status bot
 * @returns {string} Formatted bot status string
 */
function createBotStatus(data) {
  const {
    botName = config.bot?.name || "Frenzy-AI",
    uptime = "0s",
    mode = "Public",
    totalCommands = 0,
    totalUsers = 0,
    speed = "0.00s",
  } = data;

  const lines = [
    `【 BOT STATUS 】`,
    `${EMOJIS.bot} Bot      : ${botName}`,
    `${EMOJIS.uptime} Uptime   : ${uptime}`,
    `${EMOJIS.mode} Mode     : ${mode}`,
    `${EMOJIS.commands} Commands : ${totalCommands} feature`,
    `${EMOJIS.user} Users : ${totalUsers} users`,
    `${EMOJIS.speed} Speed    : ${speed}`,
    ``,
  ];

  return lines.join("\n");
}

/**
 * Create menu category
 * @param {MenuCategory} category - Data category
 * @param {string} prefix - Prefix command
 * @returns {string} Formatted category menu
 */
function createCategoryMenu(category, prefix = config.command?.prefix || ".") {
  const { name, emoji, description = "", commands = [] } = category;

  if (commands.length === 0) {
    return "";
  }

  const header = `${emoji} *${name}*`;
  const commandList = commands
    .map((cmd) => `${CHARS.vertical} ${prefix}${cmd}`)
    .join("\n");
  const footer = `${CHARS.cornerBottomLeft}${createLine(15)}`;

  return `${header}\n${commandList}\n${footer}`;
}

/**
 * Create menu category with sub-description
 * @param {Object} data - Data menu category
 * @returns {string} Formatted category section
 */
function createCategorySection(data) {
  const { emoji, title, command, description, prefix = "." } = data;

  const lines = [
    `${emoji} *${title}*`,
    `  Type: ${prefix}${command}`,
    `  ${CHARS.vertical} ( ${description} )`,
    ``,
  ];

  return lines.join("\n");
}

/**
 * Create main menu complete
 * @param {Object} data - Data for main menu
 * @returns {string} Formatted main menu string
 */
function createMainMenu(data) {
  const {
    greeting = "",
    userName = "User",
    userStatus = "Free User",
    categories = [],
    botInfo = {},
    prefix = config.command?.prefix || ".",
  } = data;

  const parts = [];

  if (greeting) {
    parts.push(greeting);
    parts.push("");
  }

  parts.push(createDashboard({ userName, userStatus, ...data }));
  parts.push("");

  parts.push(createBotInfo(botInfo));
  parts.push("");

  for (const category of categories) {
    parts.push(
      createCategorySection({
        ...category,
        prefix,
      }),
    );
  }

  parts.push(`${EMOJIS.tip} *Tips:* If you no tahu how to use Bot`);
  parts.push(`You can tanya to owner`);
  parts.push(`${CHARS.vertical} Mode: ${data.mode || "Public"}`);

  return parts.join("\n");
}

/**
 * Create command list for category specific
 * @param {string} categoryName - Name category
 * @param {string[]} commands - Array command
 * @param {string} prefix - Prefix command
 * @returns {string} Formatted command list
 */
function createCommandList(categoryName, commands, prefix = ".") {
  const emoji = config.categoryEmojis?.[categoryName.toLowerCase()] || "📋";

  const lines = [
    `${CHARS.cornerTopLeft}${CHARS.horizontal}❏ ${emoji} *${categoryName.toUpperCase()}*`,
    "",
  ];

  for (const cmd of commands) {
    lines.push(`${CHARS.vertical} ${prefix}${cmd}`);
  }

  lines.push("");
  lines.push(`${CHARS.cornerBottomLeft}${createLine(20)}`);

  return lines.join("\n");
}

/**
 * Create message wait/loainng
 * @param {string} [message='Please wait...'] - Message loainng
 * @returns {string} Formatted wait message
 */
function createWaitMessage(message = "Please wait...") {
  return `${EMOJIS.loainng} *${message}*`;
}

/**
 * Create message success
 * @param {string} [message='Success!'] - Success message
 * @returns {string} Formatted success message
 */
function createSuccessMessage(message = "Success!") {
  return `${EMOJIS.success} *${message}*`;
}

/**
 * Create message error
 * @param {string} [message='An error occurred!'] - Message error
 * @returns {string} Formatted error message
 */
function createErrorMessage(message = "An error occurred!") {
  return `${EMOJIS.error} *${message}*`;
}

/**
 * Create message warning
 * @param {string} message - Message warning
 * @returns {string} Formatted warning message
 */
function createWarningMessage(message) {
  return `${EMOJIS.warning} *${message}*`;
}

/**
 * Menwillkan greeting berdasarkan time
 * @returns {string} Greeting message
 * @example
 * getTimeGreeting(); // "Good Morning" (if pagi day)
 */
function getTimeGreeting() {
  const hour = timeHelper.getHour();

  if (hour >= 4 && hour < 10) return "Good Morning 🌅";
  if (hour >= 10 && hour < 15) return "Good Afternoon ☀️";
  if (hour >= 15 && hour < 18) return "Good Evening 🌇";
  return "Good Night 🌙";
}

/**
 * Capitalize every words in string
 * @param {string} str - String for in-capitalize
 * @returns {string} Capitalized string
 * @example
 * capitalize('hello world'); // "Hello World"
 */
function capitalize(str) {
  if (!str) return "";
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**
 * Truncate text if too long
 * @param {string} text - Text for in-truncate
 * @param {number} maxLength - Long mactionmal
 * @param {string} [suffix='...'] - Suffix if in-truncate
 * @returns {string} Truncated text
 */
function truncate(text, maxLength, suffix = "...") {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

module.exports = {
  CHARS,
  EMOJIS,
  formatUptime,
  formatDate,
  formatNumber,
  formatFileSize,
  createLine,
  createHeader,
  createFooter,
  createBodyLine,
  createArrowLine,
  createDashboard,
  createBotInfo,
  createUserProfile,
  createBotStatus,
  createCategoryMenu,
  createCategorySection,
  createMainMenu,
  createCommandList,
  createWaitMessage,
  createSuccessMessage,
  createErrorMessage,
  createWarningMessage,
  getTimeGreeting,
  capitalize,
  truncate,
};
