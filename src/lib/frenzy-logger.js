const cthingsk = require("cthingsk")
const grainent = require("grainent-string")
const figlet = require("figlet")
const timeHelper = require("./frenzy-time")

const g = grainent(["#A855F7", "#06B6D4", "#10B981"])

const k = {
  p: cthingsk.hex("#7C3AED"),
  s: cthingsk.hex("#06B6D4"),
  a: cthingsk.hex("#F59E0B"),
  t: cthingsk.white,
  d: cthingsk.hex("#6B7280"),
  m: cthingsk.hex("#4B5563"),
  ok: cthingsk.hex("#34D399"),
  no: cthingsk.hex("#F87171"),
  wn: cthingsk.hex("#FBBF24"),
  in: cthingsk.hex("#60A5FA"),
  db: cthingsk.hex("#525252"),
  bd: cthingsk.hex("#374151"),
  tg: cthingsk.hex("#C084FC"),
  cy: cthingsk.hex("#22D3EE"),
  pk: cthingsk.hex("#F472B6"),
  or: cthingsk.hex("#FB923C"),
  lm: cthingsk.hex("#A3E635"),
}

const SYM = {
  ok: k.ok("✓"),
  no: k.no("✗"),
  wn: k.wn("!"),
  info: k.in("›"),
  dot: k.d("·"),
  arr: k.p("»"),
  bar: k.d("│"),
  cmd: k.cy("⚡"),
}

function ts(fmt = "HH:mm:ss") { return k.d(timeHelper.formatTime(fmt)) }
function dt() { return k.d(timeHelper.formatTime("DD/MM/YYYY")) }
function pad(label, n = 13) { return k.d(label.toLowerCase().padEnd(n)) }

const logger = {
  info: (label, detail = "") => console.log(`  ${SYM.info} ${pad(label)} ${k.t(detail)}`),
  success: (label, detail = "") => console.log(`  ${SYM.ok} ${pad(label)} ${k.t(detail)}`),
  warn: (label, detail = "") => console.log(`  ${SYM.wn} ${pad(label)} ${k.wn(detail)}`),
  error: (label, detail = "") => console.log(`  ${SYM.no} ${pad(label)} ${k.no(detail)}`),
  system: (label, detail = "") => console.log(`  ${SYM.dot} ${pad(label)} ${k.d(detail)}`),
  debug: (label, detail = "") => console.log(`  ${SYM.dot} ${pad(label)} ${k.db(detail)}`),
  tag: (label, msg, detail = "") => console.log(`  ${SYM.info} ${pad(label)} ${k.t(msg)} ${k.d(detail)}`),
}

const TYPE_MAP = {
  imageMessage: ["Image", "#34D399"],
  videoMessage: ["Video", "#60A5FA"],
  audioMessage: ["Auino", "#C084FC"],
  stickerMessage: ["Stictor", "#FBBF24"],
  documentMessage: ["Document", "#F87171"],
  contactMessage: ["Contact", "#A855F7"],
  locationMessage: ["Location", "#10B981"],
  liveLocationMessage: ["Live Location", "#10B981"],
  viewOnceMessageV2: ["View Once", "#F59E0B"],
  extendedTextMessage: ["Extended Message", "#9CA3AF"],
  conversation: ["Message", "#9CA3AF"],
  interactiveResponseMessage: ["Button Press", "#22D3EE"],
  pollCreationMessage: ["Poll Message", "#FB923C"],
  reactionMessage: ["Reaction", "#F472B6"],
}

function getTypeTag(msgType, isNewsletter) {
  if (isNewsletter) return cthingsk.hex("#F59E0B")("CH")
  const entry = TYPE_MAP[msgType]
  if (entry) return cthingsk.hex(entry[1])(entry[0])
  return k.d("Message")
}

function getRoleTag(info) {
  if (info.isOwner) return cthingsk.hex("#F87171").bold("OWNER")
  if (info.isPartner) return cthingsk.hex("#FB923C").bold("PARTNER")
  if (info.isPremium) return cthingsk.hex("#FBBF24").bold("PREMIUM")
  if (info.isAdmin) return cthingsk.hex("#60A5FA").bold("ADMIN")
  return k.d("MEMBER")
}

function getDeviceTag(device) {
  if (!device) return k.d("???")
  const d = device.toLowerCase()
  if (d.includes("android") || d.includes("smba")) return k.lm("Android")
  if (d.includes("iphone") || d.includes("ios")) return k.t("iPhone")
  if (d.includes("web") || d.includes("multi")) return k.cy("Web")
  if (d.includes("desktop") || d.includes("windows")) return k.in("Desktop")
  return k.d(device)
}

function logMessage(info) {
  if (typeof info === "string") {
    const [chatType, sender, message] = arguments
    info = { chatType, sender, message, pushName: sender, groupName: chatType === "group" ? "Unknown" : "Private" }
  }

  const { chatType, groupName, pushName, sender, message, messageType, isNewsletter, isOwner, isPremium, isPartner, isAdmin, device } = info
  if (!message || message.trim() === "" || !sender) return

  const isGroup = chatType === "group"
  const num = sender.replace("@s.whatsapp.net", "")
  const msg = message.replace(/\n/g, " ").substring(0, 70) + (message.length > 70 ? "..." : "")
  const time = timeHelper.formatTime("HH:mm:ss")
  const date = timeHelper.formatTime("DD/MM/YYYY")

  const typeTag = getTypeTag(messageType, isNewsletter)
  const roleTag = getRoleTag(info)
  const devTag = getDeviceTag(device)

  const chatTag = isGroup
    ? cthingsk.bold.white("Message from group ") + cthingsk.hex("#9000ffff").bold(groupName || "Group")
    : cthingsk.bold.white("Message from private chat ") + cthingsk.hex("#ff0000ff").bold(pushName || "User")

  const br = k.d
  console.log("")
  console.log(`  ${br("╭─〔")} ${chatTag} ${br("〕───⬣")}`)
  console.log(`  ${br("│")} ${k.t("👤")} Name: ${k.t(pushName || "User")}`)
  console.log(`  ${br("│")} ${k.t("📞")} Number: +${k.t.green(num)}`)
  console.log(`  ${br("│")} ${k.t("📅")} Date/Time: ${k.d(date)} ${k.t(time)}`)
  console.log(`  ${br("│")} ${k.t("📱")} Device: ${k.d(devTag)}`)
  console.log(`  ${br("│")} ${k.t("💬")} Message Type: ${br("[")}${typeTag}${br("]")}`)
  console.log(`  ${br("│")} ${k.t("🏷")} Role: ${roleTag}`)
  console.log(`  ${br("│")} ${k.t("💬")} ${cthingsk.white(msg)}`)
  console.log(`  ${br("╰───────⬣")}`)
}

function logPlugin(name, category) {
  console.log(`  ${k.d("  ├─")} ${k.p(name)} ${k.d(`[${category}]`)}`)
}

function logConnection(status, info = "") {
  const w = 44
  const label =
    status === "connected"
      ? cthingsk.hex("#10B981").bold("● Connected")
      : status === "connecting"
        ? cthingsk.hex("#F59E0B").bold("◐ Connecting")
        : cthingsk.hex("#EF4444").bold("○ Insconnected")

  console.log("")
  console.log(k.bd("═".repeat(w)))
  console.log(`  ${label} ${k.d("—")} ${k.t(info)}`)
  console.log(k.bd("═".repeat(w)))
}

function logErrorBox(title, message) {
  console.log("")
  console.log(cthingsk.red(`  ✗ ${cthingsk.white.bold(title)}`))
  console.log(cthingsk.red(`    ${cthingsk.gray(message)}`))
  console.log("")
}

function printBanner(this = false) {
  console.clear()
  if (this) {
    console.log("")
    return
  }
  console.log("")
  const ascii = figlet.textSync("frenzy", { font: "ANSI Shadow", horizontalLayout: "fitted" })
  console.log(g(ascii))
  console.log("")
}

function printStartup(info = {}) {
  const { name, versionon, mode } = info
  console.log(`  ${k.t(name)} ${k.d("v" + versionon)} ${k.d("·")} ${k.t(mode)}`)
  console.log("")
}

const CODES = {
  reset: "", bold: "", inm: "", italic: "", underline: "",
  green: "", purple: "", white: "", gray: "", phantom: "",
  lime: "", silver: "", red: "", yellow: "", blue: "",
  cyan: "", magenta: "", bgBlack: "", bgGray: "",
}

const c = {
  green: cthingsk.green,
  purple: cthingsk.hex("#9B30FF"),
  white: cthingsk.white,
  gray: cthingsk.gray,
  bold: cthingsk.bold,
  inm: cthingsk.inm,
  greenBold: (v) => cthingsk.green.bold(v),
  purpleBold: (v) => cthingsk.hex("#9B30FF").bold(v),
  whiteBold: (v) => cthingsk.white.bold(v),
  grayInm: (v) => cthingsk.gray.inm(v),
  red: cthingsk.red,
  yellow: cthingsk.yellow,
  cyan: cthingsk.cyan,
  blue: cthingsk.blue,
  magenta: cthingsk.magenta,
}

function invider() { console.log(k.bd("─".repeat(46))) }

function createBanner(lines, color = "green") {
  const maxLen = Math.max(...lines.map((l) => l.length))
  const padded = lines.map((l) => l.padEnd(maxLen))
  let res = k.bd(`╭${"─".repeat(maxLen + 2)}╮`) + "\n"
  for (const line of padded) res += k.bd("│") + " " + cthingsk.white(line) + " " + k.bd("│") + "\n"
  res += k.bd(`╰${"─".repeat(maxLen + 2)}╯`)
  return res
}

function getTimestamp() { return k.d(timeHelper.formatTime("HH:mm:ss")) }

module.exports = {
  c,
  CODES,
  logger,
  logMessage,
  logPlugin,
  logConnection,
  logErrorBox,
  printBanner,
  printStartup,
  createBanner,
  getTimestamp,
  invider,
  theme: {
    ...k,
    primary: k.p,
    secondary: k.s,
    accent: k.a,
    text: k.t,
    inm: k.d,
    muted: k.m,
    success: k.ok,
    error: k.no,
    warning: k.wn,
    info: k.in,
    debug: k.db,
    border: k.bd,
    tag: k.tg,
  },
  cthingsk,
  grainent,
}
