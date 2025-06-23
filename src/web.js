// === Locka Web – Browser AES-GCM Encryption ===

const SALT = new TextEncoder().encode("locka_salt");
const PBKDF2_OPTS = { name: "PBKDF2", salt: SALT, iterations: 100_000, hash: "SHA-256" };
const GCM_ALGO = "AES-GCM";
const IV_LENGTH = 12;

async function getKeyMaterial(password) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    PBKDF2_OPTS,
    false,
    ["deriveKey"]
  );
}

async function deriveKey(password) {
  if (!crypto?.subtle) throw new Error("🛑 SubtleCrypto not available");
  const keyMat = await getKeyMaterial(password);
  return crypto.subtle.deriveKey(
    { ...PBKDF2_OPTS, name: "PBKDF2" },
    keyMat,
    { name: GCM_ALGO, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptWeb(plaintext, password) {
  try {
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const key = await deriveKey(password);
    const ct = await crypto.subtle.encrypt(
      { name: GCM_ALGO, iv },
      key,
      new TextEncoder().encode(plaintext)
    );
    const iv64   = btoa(String.fromCharCode(...iv));
    const data64 = btoa(String.fromCharCode(...new Uint8Array(ct)));
    return `locka$webv1$${iv64}$${data64}`;
  } catch (e) {
    throw new Error("❌ encryptWeb failed: " + e.message);
  }
}

export async function decryptWeb(token, password) {
  try {
    const parts = token.split("$");
    if (parts[0] !== "locka" || !parts[1].startsWith("web") || parts.length !== 4) {
      throw new Error("Invalid Locka Web token");
    }
    const iv   = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0));
    const data = Uint8Array.from(atob(parts[3]), c => c.charCodeAt(0));
    const key  = await deriveKey(password);
    const pt   = await crypto.subtle.decrypt({ name: GCM_ALGO, iv }, key, data);
    return new TextDecoder().decode(pt);
  } catch (e) {
    throw new Error("❌ decryptWeb failed: " + e.message);
  }
}

export function generatePassword(length = 16, opts = {}) {
  const base    = opts.lowercase === false ? "" : "abcdefghijklmnopqrstuvwxyz";
  const upper   = opts.uppercase === false ? "" : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = opts.numbers   === false ? "" : "0123456789";
  const symbols = opts.symbols    ? "!@#$%^&*()_+-=[]{};:,.<>?" : "";
  const charset = base + upper + numbers + symbols;
  if (!charset) throw new Error("🛑 Locka: charset empty.");
  let res = "";
  const rnd = () => crypto.getRandomValues(new Uint8Array(1))[0];
  while (res.length < length) {
    const b = rnd();
    if (b < charset.length * 4) res += charset[b % charset.length];
  }
  return res;
}

export function generateToken(length = 32, encoding = "hex") {
  const buf = crypto.getRandomValues(new Uint8Array(length));
  if (encoding === "raw") return buf;
  if (encoding === "base64") {
    return btoa(String.fromCharCode(...buf));
  }
  return Array.from(buf).map(b=>b.toString(16).padStart(2,"0")).join("");
}

export function parse(token) {
  const parts = token.split("$");
  if (parts[0] !== "locka" || parts.length < 4) {
    return { valid: false, reason: "Invalid format" };
  }
  return {
    format: parts[1].startsWith("web") ? "web" : "node",
    version: parts[1],
    iv: parts[2],
    ciphertext: parts.slice(3).join("$"),
    valid: true
  };
}

// === Chainable Browser Interface ===

export default function locka(value) {
  let result = value;
  let isDecrypt = false;

  return {
    async aes(password) {
      if (!password || typeof password !== "string") {
        throw new Error("🛑 Locka: password must be non-empty string.");
      }
      result = isDecrypt
        ? await decryptWeb(result, password)
        : await encryptWeb(result, password);
      isDecrypt = false;
      return this;
    },
    decrypt() {
      isDecrypt = true;
      return this;
    },
    base64() {
      const bytes = new TextEncoder().encode(result);
      result = btoa(String.fromCharCode(...bytes));
      return this;
    },
    hex() {
      const bytes = new TextEncoder().encode(result);
      result = Array.from(bytes).map(b=>b.toString(16).padStart(2,"0")).join("");
      return this;
    },
    xor(key) {
      if (!key) throw new Error("🛑 Locka XOR requires a key.");
      const data = typeof result === "string"
        ? new TextEncoder().encode(result)
        : result;
      const keyBuf = new TextEncoder().encode(key);
      const out = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        out[i] = data[i] ^ keyBuf[i % keyBuf.length];
      }
      // keep raw binary
      result = out;
      return this;
    },
    async hash(algorithm = "SHA-256") {
      if (!crypto?.subtle) throw new Error("🛑 SubtleCrypto not available");
      const buf = new TextEncoder().encode(result);
      const hashBuf = await crypto.subtle.digest(algorithm, buf);
      result = Array.from(new Uint8Array(hashBuf))
        .map(b => b.toString(16).padStart(2,"0"))
        .join("");
      return this;
    },
    toString(encoding = "utf8") {
      if (result instanceof Uint8Array) {
        if (encoding === "utf8") {
          return new TextDecoder().decode(result);
        } else if (encoding === "base64") {
          return btoa(String.fromCharCode(...result));
        } else if (encoding === "hex") {
          return Array.from(result).map(b=>b.toString(16).padStart(2,"0")).join("");
        }
      }
      return result;
    },
    raw() {
      return result instanceof Uint8Array
        ? result
        : new TextEncoder().encode(result);
    }
  };
}