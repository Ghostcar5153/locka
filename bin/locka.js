#!/usr/bin/env node
import locka, { generatePassword, generateToken } from "../src/index.js";
import { readTextFile, deleteFile, writeTextFile } from "../src/files.js";

// === Terminal Colors ===
const colors = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  green: "\x1b[32m", yellow: "\x1b[33m", cyan: "\x1b[36m",
  red: "\x1b[31m", magenta: "\x1b[35m"
};

const color = (text, c) => `${colors[c] || ""}${text}${colors.reset}`;
const [,, cmd, ...args] = process.argv;
const parseArg = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : null;

const usage = () => console.log(color(`
🔐 ${colors.bold}Locka CLI – Pretty Encryption for Humans${colors.reset}

${color("Usage:", "cyan")}
  locka encrypt "message" --password <pass>
  locka decrypt "token"   --password <pass>
  locka encrypt-file <file> --password <pass> [--output <file>] [--keep]
  locka decrypt-file <file.lck> --password <pass> [--output <file>] [--keep]
  locka gen password [--length N] [--symbols] [--no-uppercase] [--no-numbers]
  locka gen token [--length N] [--base64|--raw]

${color("Examples:", "yellow")}
  locka encrypt "hello" --password swordfish
  locka decrypt "locka$1$..." --password swordfish

${color("No dependencies. No nonsense. Just secrets. 🗝️", "dim")}
`, "reset"));

const exitWithUsage = () => { usage(); process.exit(1); };

if (cmd === "encrypt") {
  const text = args[0];
  const password = parseArg("--password");
  if (!text || !password) exitWithUsage();
  console.log(color("\n🔒 Locka Encrypted:\n", "cyan") + locka(text).aes(password).toString() + "\n");

} else if (cmd === "decrypt") {
  const token = args[0];
  const password = parseArg("--password");
  if (!token || !password) exitWithUsage();
  try {
    const decrypted = locka(token).decrypt().aes(password);
    console.log(color("\n🔓 Locka Decrypted:\n", "green") + decrypted + "\n");
  } catch (err) {
    console.error(color("❌ Decryption failed:", "red"), err.message);
  }

} else if (cmd === "gen" && args[0] === "password") {
  const length = parseInt(parseArg("--length")) || 16;
  const includeSymbols = args.includes("--symbols");
  const noUpper = args.includes("--no-uppercase");
  const noNumbers = args.includes("--no-numbers");

  const pwd = generatePassword(length, {
    symbols: includeSymbols,
    uppercase: !noUpper,
    numbers: !noNumbers,
  });

  console.log(color("🔑 Generated Password:\n", "yellow") + pwd + "\n");

} else if (cmd === "encrypt-file") {
  const file = args[0];
  const password = parseArg("--password");
  const output = parseArg("--output") || `${file}.lck`;
  const keepOriginal = args.includes("--keep");
  if (!file || !password) exitWithUsage();

  try {
    const content = await readTextFile(file);
    const encrypted = locka(content).aes(password).toString();
    await writeTextFile(output, encrypted);
    console.log(color(`🔐 File encrypted → ${output}`, "cyan"));
    if (!keepOriginal) {
      await deleteFile(file);
      console.log(color(`🗑️  Deleted original: ${file}`, "dim"));
    } else {
      console.log(color("📂 Original file kept.\n", "dim"));
    }
  } catch (err) {
    console.error(color("❌ File encryption failed:", "red"), err.message);
  }

} else if (cmd === "decrypt-file") {
  const file = args[0];
  const password = parseArg("--password");
  const output = parseArg("--output") || file.replace(/\.lck$/, "");
  const keepOriginal = args.includes("--keep");
  if (!file || !password) exitWithUsage();

  try {
    const encrypted = await readTextFile(file);
    const decrypted = locka(encrypted).decrypt().aes(password);
    await writeTextFile(output, decrypted);
    console.log(color(`🔓 File decrypted → ${output}`, "green"));
    if (!keepOriginal) {
      await deleteFile(file);
      console.log(color(`🗑️  Deleted encrypted file: ${file}`, "dim"));
    } else {
      console.log(color("📂 Encrypted file kept.\n", "dim"));
    }
  } catch (err) {
    console.error(color("❌ File decryption failed:", "red"), err.message);
  }

} else if (cmd === "gen" && args[0] === "token") {
  const length = parseInt(parseArg("--length")) || 32;
  const encoding = args.includes("--base64") ? "base64"
                  : args.includes("--raw") ? "raw"
                  : "hex";
  const token = generateToken(length, encoding);
  console.log(color(`🎟️  Generated Token (${encoding}):\n`, "magenta") + token + "\n");

} else {
  usage();
}
