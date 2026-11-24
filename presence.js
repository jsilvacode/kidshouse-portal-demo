import { getRecords } from "./records.js";

export const presencePrefix = "kidshouse-demo-presence:";
const tabKey = presencePrefix + crypto.randomUUID();
const heartbeatMs = 10000;
const activeForMs = 35000;
let account;

function heartbeat() {
  if (!account) return;
  try {
    localStorage.setItem(tabKey, JSON.stringify({ ...account, expires: Date.now() + activeForMs }));
  } catch {
    // The local demo still works without browser storage.
  }
}

function clearTab() {
  try { localStorage.removeItem(tabKey); } catch { /* Storage can be disabled. */ }
}

export function announcePresence(parent) {
  if (!parent) {
    if (account) clearTab();
    account = undefined;
    return;
  }
  if (account?.id === parent.id && account.version === parent.passwordVersion) return;
  account = { id: parent.id, version: parent.passwordVersion };
  heartbeat();
}

export function onlineParents() {
  const now = Date.now();
  const accounts = new Set();
  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(presencePrefix)) continue;
      const entry = JSON.parse(localStorage.getItem(key));
      if (entry?.expires > now) accounts.add(JSON.stringify([entry.id, entry.version]));
    }
  } catch {
    return [];
  }
  return getRecords().parents.filter((parent) => !parent.mustChangePassword
    && accounts.has(JSON.stringify([parent.id, parent.passwordVersion])));
}

setInterval(heartbeat, heartbeatMs);
window.addEventListener("pagehide", clearTab);
window.addEventListener("pageshow", heartbeat);
