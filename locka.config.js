export default {
  defaults: {
    cipher: "aes-256-cbc",
    hash: "sha256",
    encoding: "base64",
    tokenPrefix: "locka$",
    fileExtension: ".lcka"
  },

  secure: {
    minPasswordLength: 8,
    allowWeakPasswords: false
  }
};
