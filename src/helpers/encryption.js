const crypto = require('crypto');

const algorithm = 'aes-256-cbc';

const aesEncrypt = (text, secret) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, secret, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return `${iv.toString('hex')}|${encrypted.toString('hex')}`;
};

const aesDecrypt = (text, secret) => {
  const [iv, encryptedData] = text.split('|');
  const ivBuffer = Buffer.from(iv, 'hex');
  const encryptedText = Buffer.from(encryptedData, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, secret, ivBuffer);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

module.exports = {
  aesEncrypt,
  aesDecrypt
};
