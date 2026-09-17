// Durable extension-owned storage for P0 recovery. Only meeting metadata and caption
// events are stored here; credentials and request headers never enter this database.
const LOCAL_STORE_DB = "codeoutfitters-meeting-capture";
const LOCAL_STORE_VERSION = 1;
const MAX_EVENTS = 20_000;
const MAX_EVENT_BYTES = 8 * 1024 * 1024;
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

function eventKey(sessionId, sequence) { return `${sessionId}:${sequence}`; }
function eventBytes(event) { return JSON.stringify(event).length; }

function createMemoryCaptureStore() {
  const sessions = new Map();
  const events = new Map();
  return {
    async saveSession(session) { sessions.set(session.id, { ...session, updatedAt: new Date().toISOString() }); return sessions.get(session.id); },
    async getSession(id) { return sessions.get(id) ?? null; },
    async listRecoverableSessions() { return [...sessions.values()].filter((s) => s.status !== "complete"); },
    async enqueueEvent(sessionId, event) {
      const key = eventKey(sessionId, event.sequence);
      if (!events.has(key)) events.set(key, { ...event, id: key, sessionId, syncState: "pending" });
      const all = [...events.values()];
      if (all.length > MAX_EVENTS || all.reduce((total, item) => total + eventBytes(item), 0) > MAX_EVENT_BYTES) {
        events.delete(key);
        throw new Error("local-storage-limit");
      }
      return events.get(key);
    },
    async listPendingEvents(sessionId, limit = 200) {
      return [...events.values()].filter((e) => e.sessionId === sessionId && e.syncState === "pending").sort((a, b) => a.sequence - b.sequence).slice(0, limit);
    },
    async markSynced(sessionId, sequences) { const set = new Set(sequences); for (const event of events.values()) if (event.sessionId === sessionId && set.has(event.sequence)) event.syncState = "synced"; },
    async listEvents(sessionId) { return [...events.values()].filter((e) => e.sessionId === sessionId).sort((a, b) => a.sequence - b.sequence); },
    async removeSession(sessionId) { sessions.delete(sessionId); for (const key of [...events.keys()]) if (key.startsWith(`${sessionId}:`)) events.delete(key); },
    async cleanup(now = Date.now()) { for (const [id, session] of sessions) if (Date.parse(session.updatedAt || session.createdAt) + RETENTION_MS < now) await this.removeSession(id); },
  };
}

function createIndexedDbCaptureStore(indexedDBFactory = globalThis.indexedDB) {
  if (!indexedDBFactory) throw new Error("indexeddb-unavailable");
  let dbPromise;
  function db() {
    if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
      const request = indexedDBFactory.open(LOCAL_STORE_DB, LOCAL_STORE_VERSION);
      request.onerror = () => reject(request.error || new Error("indexeddb-open-failed"));
      request.onupgradeneeded = () => {
        const database = request.result;
        const sessions = database.createObjectStore("sessions", { keyPath: "id" });
        sessions.createIndex("status", "status", { unique: false });
        const events = database.createObjectStore("events", { keyPath: "id" });
        events.createIndex("sessionId", "sessionId", { unique: false });
        events.createIndex("sessionState", ["sessionId", "syncState"], { unique: false });
        events.createIndex("sessionSequence", ["sessionId", "sequence"], { unique: true });
      };
      request.onsuccess = () => resolve(request.result);
    });
    return dbPromise;
  }
  function transaction(stores, mode, work) {
    return db().then((database) => new Promise((resolve, reject) => {
      const tx = database.transaction(stores, mode);
      let result;
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error || new Error("indexeddb-transaction-failed"));
      result = work(tx);
    }));
  }
  return {
    async saveSession(session) { return transaction(["sessions"], "readwrite", (tx) => tx.objectStore("sessions").put({ ...session, updatedAt: new Date().toISOString() })); },
    async getSession(id) { return transaction(["sessions"], "readonly", (tx) => new Promise((resolve) => { const r = tx.objectStore("sessions").get(id); r.onsuccess = () => resolve(r.result || null); })); },
    async listRecoverableSessions() { return transaction(["sessions"], "readonly", (tx) => new Promise((resolve) => { const out = []; const r = tx.objectStore("sessions").openCursor(); r.onsuccess = () => { if (r.result) { if (r.result.value.status !== "complete") out.push(r.result.value); r.result.continue(); } else resolve(out); }; })); },
    async enqueueEvent(sessionId, event) {
      const record = { ...event, id: eventKey(sessionId, event.sequence), sessionId, syncState: "pending" };
      return transaction(["events"], "readwrite", (tx) => new Promise((resolve, reject) => { const store = tx.objectStore("events"); const get = store.get(record.id); get.onsuccess = () => { if (get.result) return resolve(get.result); const all = store.getAll(); all.onsuccess = () => { const rows = all.result || []; const bytes = rows.reduce((total, item) => total + eventBytes(item), 0); if (rows.length >= MAX_EVENTS || bytes + eventBytes(record) > MAX_EVENT_BYTES) return reject(new Error("local-storage-limit")); const put = store.put(record); put.onsuccess = () => resolve(record); put.onerror = () => reject(put.error); }; all.onerror = () => reject(all.error); }; get.onerror = () => reject(get.error); }));
    },
    async listPendingEvents(sessionId, limit = 200) { return transaction(["events"], "readonly", (tx) => new Promise((resolve) => { const out = []; const r = tx.objectStore("events").index("sessionId").openCursor(IDBKeyRange.only(sessionId)); r.onsuccess = () => { if (r.result && out.length < limit) { if (r.result.value.syncState === "pending") out.push(r.result.value); r.result.continue(); } else resolve(out.sort((a, b) => a.sequence - b.sequence)); }; })); },
    async markSynced(sessionId, sequences) { const wanted = new Set(sequences); return transaction(["events"], "readwrite", (tx) => { const r = tx.objectStore("events").index("sessionId").openCursor(IDBKeyRange.only(sessionId)); r.onsuccess = () => { if (!r.result) return; if (wanted.has(r.result.value.sequence)) r.result.update({ ...r.result.value, syncState: "synced" }); r.result.continue(); }; }); },
    async listEvents(sessionId) { return transaction(["events"], "readonly", (tx) => new Promise((resolve) => { const out = []; const r = tx.objectStore("events").index("sessionId").openCursor(IDBKeyRange.only(sessionId)); r.onsuccess = () => { if (r.result) { out.push(r.result.value); r.result.continue(); } else resolve(out.sort((a, b) => a.sequence - b.sequence)); }; })); },
    async removeSession(sessionId) { return transaction(["sessions", "events"], "readwrite", (tx) => { tx.objectStore("sessions").delete(sessionId); const r = tx.objectStore("events").index("sessionId").openCursor(IDBKeyRange.only(sessionId)); r.onsuccess = () => { if (r.result) { r.result.delete(); r.result.continue(); } }; }); },
    async cleanup(now = Date.now()) { const stale = await transaction(["sessions"], "readonly", (tx) => new Promise((resolve) => { const out = []; const r = tx.objectStore("sessions").openCursor(); r.onsuccess = () => { if (r.result) { if (Date.parse(r.result.value.updatedAt || r.result.value.createdAt) + RETENTION_MS < now) out.push(r.result.value.id); r.result.continue(); } else resolve(out); }; })); for (const id of stale) await this.removeSession(id); },
  };
}

if (typeof globalThis !== "undefined") globalThis.CodeOutfittersLocalStore = { createMemoryCaptureStore, createIndexedDbCaptureStore, MAX_EVENTS, MAX_EVENT_BYTES, RETENTION_MS };
