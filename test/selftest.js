//Run node test/selftest.js to run OR npm test
import locka, { generatePassword, generateToken, parse } from "../src/index.js";

let passed = 0;
let failed = 0;
const failedTests = [];

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (err) {
    console.error(`❌ ${name} failed:\n   → ${err.message}`);
    failed++;
    failedTests.push(name);
  }
}

console.log("\n🔍 Running Locka Full Self-Test Suite\n===================================\n");

// === Core AES ===
test("AES encryption and decryption roundtrip", () => {
  const password = "testpass";
  const original = "my secret message";
  const token = locka(original).aes(password).toString();
  const decrypted = locka(token).decrypt().aes(password);
  if (decrypted !== original) throw new Error("Decryption mismatch");
});

// === Token Parser ===
test("Valid token should parse correctly", () => {
  const token = locka("hello").aes("123").toString();
  const parsed = parse(token);
  if (!parsed.valid) throw new Error("Expected token to be valid");
});

test("Invalid token prefix should be rejected", () => {
  const parsed = parse("lokka$1$iv$abc");
  if (parsed.valid) throw new Error("Should be invalid prefix");
});

test("Malformed token should be rejected", () => {
  const parsed = parse("locka$1$only2parts");
  if (parsed.valid) throw new Error("Should be invalid structure");
});

// === Password Generator ===
test("Password with symbols has correct length", () => {
  const pwd = generatePassword(20, { symbols: true });
  if (pwd.length !== 20) throw new Error("Incorrect password length");
});

test("Password with only lowercase", () => {
  const pwd = generatePassword(16, { uppercase: false, numbers: false, symbols: false });
  if (!/^[a-z]+$/.test(pwd)) throw new Error("Password should contain only lowercase letters");
});

test("Empty charset throws error", () => {
  try {
    generatePassword(10, {
      uppercase: false,
      numbers: false,
      symbols: false,
      lowercase: false
    });
  } catch {
    return;
  }
  throw new Error("Should throw on empty charset");
});

// === Token Generator ===
test("Hex token generation returns string", () => {
  const tok = generateToken(32);
  if (typeof tok !== "string" || tok.length < 32) throw new Error("Token invalid");
});

test("Raw token returns Buffer", () => {
  const tok = generateToken(16, "raw");
  if (!Buffer.isBuffer(tok)) throw new Error("Expected Buffer");
});

// === XOR Logic ===
test("XOR reversibility", () => {
  const secret = "locka rules";
  const key = "cipher";

  const encryptedBuffer = locka(secret).xor(key).raw();
  const decrypted = locka(encryptedBuffer).xor(key).toString();

  if (decrypted !== secret) throw new Error("XOR roundtrip failed");
});




// === Hash ===
test("SHA-256 hash outputs valid string", () => {
  const hashed = locka("hello").hash("sha256").toString();
  if (!/^[a-f0-9]{64}$/.test(hashed)) throw new Error("Invalid SHA-256 output");
});

test("Unsupported hash algorithm throws", () => {
  try {
    locka("boom").hash("nonsense");
  } catch {
    return;
  }
  throw new Error("Should throw on invalid hash algorithm");
});

console.log("\n🧪 Summary:");
console.log(`   Passed: ${passed}`);
console.log(`   Failed: ${failed}`);
if (failed > 0) {
  console.log("\n❌ Failed Tests:");
  failedTests.forEach(name => console.log(`   - ${name}`));
  process.exit(1);
} else {
  console.log("\n🎉 All Locka extended tests passed!\n");
}
