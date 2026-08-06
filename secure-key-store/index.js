/**
 * @dottedice/secure-key-store
 * Secure IndexedDB storage and PBKDF2/AES-GCM encryption utilities for Web Cryptography keys.
 */

// IndexedDB Helper
function getDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DottedIceKeyStore', 1);
    
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('keys')) {
        db.createObjectStore('keys', { keyPath: 'alias' });
      }
    };
    
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Derives a cryptographic key from a password.
 */
async function deriveKey(password, salt, iterations = 100000) {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: iterations,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts and stores a CryptoKey in IndexedDB.
 */
export async function storeEncryptedKey(alias, cryptoKey, password) {
  const format = cryptoKey.type === 'private' ? 'pkcs8' : 'spki';
  const exported = await crypto.subtle.exportKey(format, cryptoKey);
  
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const masterKey = await deriveKey(password, salt);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    masterKey,
    exported
  );
  
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('keys', 'readwrite');
    const store = tx.objectStore('keys');
    
    const request = store.put({
      alias,
      type: cryptoKey.type,
      algorithm: cryptoKey.algorithm.name,
      usages: cryptoKey.usages,
      ciphertext: new Uint8Array(ciphertextBuffer),
      salt,
      iv
    });
    
    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Decrypts and retrieves a CryptoKey from IndexedDB.
 */
export async function retrieveDecryptedKey(alias, password) {
  const db = await getDB();
  const entry = await new Promise((resolve, reject) => {
    const tx = db.transaction('keys', 'readonly');
    const store = tx.objectStore('keys');
    const request = store.get(alias);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
  
  if (!entry) {
    throw new Error(`Key alias "${alias}" not found.`);
  }
  
  const masterKey = await deriveKey(password, entry.salt);
  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: entry.iv },
    masterKey,
    entry.ciphertext
  );
  
  const format = entry.type === 'private' ? 'pkcs8' : 'spki';
  
  // Reconstruct import parameters based on algorithm name
  const algorithmParams = entry.algorithm === 'RSASSA-PKCS1-v1_5'
    ? { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }
    : { name: 'ECDSA', namedCurve: 'P-256' };

  return await crypto.subtle.importKey(
    format,
    decryptedBuffer,
    algorithmParams,
    true,
    entry.usages
  );
}

/**
 * Stores a non-extractable CryptoKey directly in IndexedDB (no password required).
 */
export async function storeRawKey(alias, cryptoKey) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('keys', 'readwrite');
    const store = tx.objectStore('keys');
    
    const request = store.put({
      alias,
      rawKey: cryptoKey // Browser clones this automatically using structured clone
    });
    
    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Retrieves a raw CryptoKey directly from IndexedDB.
 */
export async function retrieveRawKey(alias) {
  const db = await getDB();
  const entry = await new Promise((resolve, reject) => {
    const tx = db.transaction('keys', 'readonly');
    const store = tx.objectStore('keys');
    const request = store.get(alias);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
  
  if (!entry) return null;
  return entry.rawKey;
}

/**
 * Deletes a key by alias.
 */
export async function deleteKey(alias) {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('keys', 'readwrite');
    const store = tx.objectStore('keys');
    const request = store.delete(alias);
    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Lists all key aliases in storage.
 */
export async function listKeys() {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('keys', 'readonly');
    const store = tx.objectStore('keys');
    const request = store.getAllKeys();
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}
