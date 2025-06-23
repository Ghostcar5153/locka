# 🔐 Locka

[![npm version](https://img.shields.io/npm/v/locka.svg)](https://www.npmjs.com/package/locka)

**Locka** is a sleek encryption toolkit and CLI for managing secrets, encrypting files, and generating secure passwords and tokens — with zero dependencies and maximum vibes.

Where the hell have you been loca 🐺.

---

## ⚡ Install

```bash
npm install -g locka       # CLI + importable API
# or
npx locka                  # use without install
```

---

## 🛠️ CLI Usage

### 🔐 Encrypt a message

```bash
locka encrypt "top secret" --password swordfish
```

### 🔓 Decrypt a message

```bash
locka decrypt "locka$1$...$..." --password swordfish
```

### 🔐 Encrypt a file

```bash
locka encrypt-file secret.txt --password swordfish
```

### 🔓 Decrypt a file

```bash
locka decrypt-file secret.txt.lck --password swordfish
```

Add `--output` to rename the output file, and `--keep` to preserve the original:

```bash
locka encrypt-file note.txt --password mango --output vault.lck --keep
```

---

## 🔑 Generate a password

```bash
locka gen password --length 24 --symbols
```

Options:

* `--symbols`: include special characters
* `--no-uppercase`: exclude A-Z
* `--no-numbers`: exclude 0-9

---

## 🎟️ Generate a token

```bash
locka gen token --length 64 --base64
```

Options:

* `--base64`: base64 output
* `--raw`: return raw Buffer
* default: hex string

---

## 📦 Programmatic API

```js
import locka, {
  generatePassword,
  generateToken,
  parse
} from "locka";

// Encrypt and decrypt
const token = locka("top secret").aes("key").toString();
const plain = locka(token).decrypt().aes("key");

// Encode to base64 or hex
const hex = locka("data").hex().toString();
const b64 = locka("data").base64().toString();

// XOR reversible encoding
const encoded = locka("hidden").xor("key").raw();
const decoded = locka(encoded).xor("key").toString();

// Hash
const hash = locka("msg").hash("sha256").toString();

// Passwords & Tokens
const pwd = generatePassword(32, { symbols: true });
const token64 = generateToken(64, "base64");

// Parse tokens
const meta = parse(token);
```

---

## 🌐 Browser Support

Locka provides a secure AES-GCM `encryptWeb()` and `decryptWeb()` API for client-side encryption:

```js
import { encryptWeb, decryptWeb } from "locka/web";

const token = await encryptWeb("text", "password");
const plain = await decryptWeb(token, "password");
```

---

## ✅ Testing

```bash
npm test
```

Runs a full test suite on AES, token parsing, password generation, hashing, and XOR logic with a summary report.

---

## 🤖 Requirements

* Node.js 18+
* Works in CLI, ESM projects, and the browser (via `src/web.js`)

---

## 🪪 License

This project is licensed under the **MIT License**. See [LICENSE](LICENSE) for details.
