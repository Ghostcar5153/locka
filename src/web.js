// === Locka Web – Browser AES-GCM Encryption ===

export async function encryptWeb(plaintext, password) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await crypto.subtle.importKey(
    "raw",
    await deriveKey(password),
    { name: "AES-GCM", iv },
    false,
    ["encrypt"]
  );

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(plaintext)
  );

  return `locka$web$${btoa(String.fromCharCode(...iv))}$${btoa(String.fromCharCode(...new Uint8Array(encrypted)))}`;
}

export async function decryptWeb(token, password) {
  const parts = token.split("$");
  if (parts.length !== 4 || parts[0] !== "locka" || parts[1] !== "web") {
    throw new Error("Invalid Locka Web token format");
  }

  const iv = Uint8Array.from(atob(parts[2]), c => c.charCodeAt(0));
  const data = Uint8Array.from(atob(parts[3]), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "raw",
    await deriveKey(password),
    { name: "AES-GCM", iv },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(decrypted);
}

async function deriveKey(password) {
  const enc = new TextEncoder();
  return await crypto.subtle.digest("SHA-256", enc.encode(password));
}
