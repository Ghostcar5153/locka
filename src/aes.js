import crypto from "crypto";

// === Key & IV Helpers ===
function deriveKey(password) {
  if (!password) throw new Error("🛑 No password provided for encryption.");
  return crypto.createHash("sha256").update(password).digest();
}

function generateIV() {
  return crypto.randomBytes(16);
}

// === Encryption ===
export function encrypt(text, password) {
  try {
    const iv = generateIV();
    const key = deriveKey(password);
    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    return `locka$1$${iv.toString("base64")}$${encrypted}`;
  } catch (err) {
    throw new Error("❌ Encryption failed: " + err.message);
  }
}

// === Decryption ===
export function decrypt(token, password) {
  try {
    const [prefix, version, ivBase64, data] = token.split("$");
    if (prefix !== "locka" || version !== "1" || !ivBase64 || !data) {
      throw new Error("Malformed Locka string.");
    }

    const iv = Buffer.from(ivBase64, "base64");
    const key = deriveKey(password);
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    let decrypted = decipher.update(data, "base64", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch (err) {
    throw new Error("❌ Decryption failed: " + err.message);
  }
}
