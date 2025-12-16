import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const SECRET = process.env.PASSWORD_ENCRYPTION_KEY;

if (!SECRET) {
  throw new Error(
    "PASSWORD_ENCRYPTION_KEY is missing in environment variables"
  );
}
const KEY = Buffer.from(SECRET, "hex");

export function generateStrongPassword() {
  return crypto.randomBytes(16).toString("hex") + "A1!";
}

export function encryptPassword(password) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(password, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptPassword(encryptedPayload) {
  const buffer = Buffer.from(encryptedPayload, "base64");
  const iv = buffer.slice(0, IV_LENGTH);
  const authTag = buffer.slice(IV_LENGTH, IV_LENGTH + 16);
  const encrypted = buffer.slice(IV_LENGTH + 16);

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString("utf8");
}