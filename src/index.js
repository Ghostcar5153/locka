import { encrypt, decrypt } from "./aes.js";
import crypto from "crypto";

// === CHAINABLE LOCKA INTERFACE ===

export default function locka(value) {
  let result = value;
  let isDecryptMode = false;

  return {
    aes(password) {
      if (!password || typeof password !== "string") {
        throw new Error("🛑 Locka: password must be a non-empty string.");
      }
      if (isDecryptMode) {
        result = decrypt(result, password);
        return result;
      } else {
        result = encrypt(result, password);
        return this;
      }
    },
    base64() {
      result = Buffer.from(result).toString("base64");
      return this;
    },
    hex() {
      result = Buffer.from(result).toString("hex");
      return this;
    },
    xor(key) {
      if (!key) throw new Error("Locka XOR requires a key.");

      const inputBuf = Buffer.isBuffer(result) ? result : Buffer.from(result);
      const keyBuf = Buffer.from(key);
      const output = Buffer.alloc(inputBuf.length);

      for (let i = 0; i < inputBuf.length; i++) {
        output[i] = inputBuf[i] ^ keyBuf[i % keyBuf.length];
      }

      result = output; // store as raw binary
      return this;
    },
    hash(algorithm = "sha256") {
      result = crypto.createHash(algorithm).update(result).digest("hex");
      return this;
    },
    decrypt() {
      isDecryptMode = true;
      return this;
    },
    toString(encoding = "utf8") {
      return Buffer.isBuffer(result) ? result.toString(encoding) : result;
    },
    raw() {
      return Buffer.isBuffer(result) ? result : Buffer.from(result);
    }
  };
}

// === DIRECT ENCRYPTION/DECRYPTION ===

export { encrypt, decrypt };

// === PASSWORD GENERATOR ===

export function generatePassword(length = 16, opts = {}) {
  const base = opts.lowercase === false ? "" : "abcdefghijklmnopqrstuvwxyz";
  const upper = opts.uppercase === false ? "" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = opts.numbers === false ? "" : "0123456789";
  const symbols = opts.symbols ? "!@#$%^&*()_+-=[]{};:,.<>?" : "";

  const charset = base + upper + numbers + symbols;
  if (!charset) throw new Error("🛑 Locka: Character set is empty.");

  let result = "";
  while (result.length < length) {
    const byte = crypto.randomBytes(1)[0];
    if (byte < charset.length * 4) {
      result += charset[byte % charset.length];
    }
  }
  return result;
}

// === TOKEN GENERATOR ===

export function generateToken(length = 32, encoding = "hex") {
  const bytes = crypto.randomBytes(length);
  if (encoding === "raw") return bytes;
  return bytes.toString(encoding);
}

// === TOKEN PARSER ===

export function parse(token) {
  const parts = token.split("$");
  if (parts.length !== 4 || parts[0] !== "locka") {
    return { valid: false, reason: "Invalid format" };
  }

  return {
    format: "locka",
    version: parts[1],
    iv: parts[2],
    ciphertext: parts[3],
    valid: true
  };
}
