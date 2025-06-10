import fs from "fs/promises";

// === Optional Logger (disabled via env flag) ===
function log(msg, type = "info") {
  const icons = { info: "📂", error: "❌", success: "✅" };
  if (process.env.LOCKA_SILENT !== "true") {
    console.log(`${icons[type] || ""} ${msg}`);
  }
}

// === File Utilities ===

// 📖 Read file as UTF-8 string
export async function readTextFile(path) {
  try {
    const data = await fs.readFile(path, "utf8");
    log(`Read file: ${path}`, "info");
    return data;
  } catch {
    throw new Error(`❌ Failed to read: ${path}`);
  }
}

// 🗑️ Delete file at path
export async function deleteFile(path) {
  try {
    await fs.unlink(path);
    log(`Deleted file: ${path}`, "success");
  } catch {
    throw new Error(`❌ Failed to delete: ${path}`);
  }
}

// 💾 Write string to file
export async function writeTextFile(path, content) {
  try {
    await fs.writeFile(path, content, "utf8");
    log(`Wrote to file: ${path}`, "success");
  } catch {
    throw new Error(`❌ Failed to write: ${path}`);
  }
}
