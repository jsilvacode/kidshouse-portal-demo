export const demoPassword = "kids-demo";
export const ownerEmail = "administracion@kids-house.test";
export const recordsKey = "kidshouse-demo-records";

const exampleJourneys = [
  { id: "morning", name: "Jornada de mañana", start: "08:30", end: "12:30" },
  { id: "afternoon", name: "Jornada de tarde", start: "14:00", end: "18:00" },
  { id: "full", name: "Jornada completa", start: "08:30", end: "19:30" },
];
const exampleCourses = [
  { id: "exploradores", name: "Exploradores", journeyId: "morning" },
  { id: "creadores", name: "Pequeños creadores", journeyId: "afternoon" },
  { id: "semillitas", name: "Semillitas", journeyId: "full" },
];
const exampleChildren = [
  { id: "isidora", name: "Isidora", courseId: "exploradores" },
  { id: "mateo", name: "Mateo", courseId: "creadores" },
  { id: "alma", name: "Alma", courseId: "semillitas" },
];
const exampleParents = [
  { id: "morning", name: "Camila", email: "familia.manana@kids-house.test", childId: "isidora", passwordVersion: 0 },
  { id: "afternoon", name: "Nicolás", email: "familia.tarde@kids-house.test", childId: "mateo", passwordVersion: 0 },
  { id: "full", name: "Andrea", email: "familia.completa@kids-house.test", childId: "alma", passwordVersion: 0 },
];

const santiagoClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "America/Santiago", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
});

let records = readRecords();

function migrateCourses(saved) {
  // Earlier drafts stored the course name and journey on each child.
  const courses = new Map();
  const children = saved.children.map(({ id, name, group, journeyId }) => {
    const key = JSON.stringify([group.toLowerCase(), journeyId]);
    if (!courses.has(key)) {
      courses.set(key, { id: `curso-anterior-${courses.size + 1}`, name: group, journeyId });
    }
    return { id, name, courseId: courses.get(key).id };
  });
  return { ...saved, courses: [...courses.values()], children };
}

export function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function migrateEmails(parents) {
  const alreadyAssigned = parents.filter((parent) => parent.email).map((parent) => normalizeEmail(parent.email));
  const usedEmails = new Set([ownerEmail, ...alreadyAssigned]);
  return parents.map(({ user, ...parent }) => {
    if (!parent.email) {
      const previous = normalizeEmail(user);
      const localPart = previous.replace(/[^a-z0-9._-]+/g, "-").replace(/^[.-]+|[.-]+$/g, "") || "familia";
      const existingEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(previous) ? previous : `${localPart}@kids-house.test`;
      let email = existingEmail;
      for (let suffix = 2; usedEmails.has(email); suffix += 1) email = `${localPart}-${suffix}@kids-house.test`;
      parent.email = email;
      usedEmails.add(email);
    }
    return { ...parent, email: normalizeEmail(parent.email), passwordVersion: parent.passwordVersion ?? 0 };
  });
}

function readRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(recordsKey));
    if (Array.isArray(saved?.journeys) && Array.isArray(saved.children) && Array.isArray(saved.parents)) {
      const updated = Array.isArray(saved.courses) ? saved : migrateCourses(saved);
      return { ...updated, parents: migrateEmails(updated.parents) };
    }
  } catch {
    // Start with the example data if browser storage is unavailable.
  }
  return {
    journeys: [...exampleJourneys],
    courses: [...exampleCourses],
    children: [...exampleChildren],
    parents: [...exampleParents],
  };
}

export function reloadRecords() {
  records = readRecords();
}

export function getRecords() {
  return records;
}

export function addRecord(kind, record) {
  return addRecords([[kind, record]]);
}

export function addRecords(entries) {
  const next = { ...records };
  for (const [kind, record] of entries) next[kind] = [...next[kind], record];
  return saveRecords(next);
}

function saveRecords(next) {
  records = next;
  try {
    localStorage.setItem(recordsKey, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
}

export function getParentByEmail(email) {
  return records.parents.find((parent) => parent.email === normalizeEmail(email));
}

export function replaceParentPassword(id, expectedVersion, passwordHash) {
  const parent = records.parents.find((item) => item.id === id);
  if (!parent || parent.passwordVersion !== expectedVersion) return null;
  const updated = { ...parent, passwordHash, passwordVersion: expectedVersion + 1, mustChangePassword: false };
  saveRecords({ ...records, parents: records.parents.map((item) => item.id === id ? updated : item) });
  return updated;
}

export function getFamily(parentId) {
  const parent = records.parents.find((item) => item.id === parentId);
  const child = records.children.find((item) => item.id === parent?.childId);
  const course = records.courses.find((item) => item.id === child?.courseId);
  const journey = records.journeys.find((item) => item.id === course?.journeyId);
  return parent && child && course && journey ? { parent, child, course, journey } : null;
}

export function journeyHours(journey) {
  return journey.start + " a " + journey.end;
}

export function journeyAvailability(journey, now = new Date()) {
  const time = Object.fromEntries(santiagoClock.formatToParts(now).map(({ type, value }) => [type, value]));
  const current = time.hour + ":" + time.minute;
  const weekday = time.weekday !== "Sat" && time.weekday !== "Sun";
  if (weekday && current >= journey.start && current < journey.end) {
    return { open: true, detail: `Disponibles hasta las ${journey.end} de hoy.` };
  }
  if (weekday && current < journey.start) {
    return { open: false, detail: `Vuelven a abrir hoy a las ${journey.start}.` };
  }
  const next = time.weekday === "Fri" || time.weekday === "Sat" ? "el lunes" : "mañana";
  return { open: false, detail: `Vuelven a abrir ${next} a las ${journey.start}.` };
}

export function isJourneyOpen(journey, now = new Date()) {
  return journeyAvailability(journey, now).open;
}

function hex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function legacyPasswordHash(id, password) {
  const value = new TextEncoder().encode(id + "\n" + password);
  const digest = await crypto.subtle.digest("SHA-256", value);
  return hex(new Uint8Array(digest));
}

async function derivePassword(password, salt) {
  const passphrase = new TextEncoder().encode(password);
  const key = await crypto.subtle.importKey("raw", passphrase, "PBKDF2", false, ["deriveBits"]);
  const digest = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 200000 }, key, 256);
  return hex(new Uint8Array(digest));
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return `pbkdf2:${hex(salt)}:${await derivePassword(password, salt)}`;
}

export async function passwordMatches(parent, password) {
  const saved = parent.passwordHash;
  if (!saved) return password === demoPassword;
  if (!saved.startsWith("pbkdf2:")) return saved === await legacyPasswordHash(parent.id, password);
  const [, salt, expected] = saved.split(":");
  if (!/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{64}$/.test(expected)) return false;
  const bytes = Uint8Array.from(salt.match(/../g), (pair) => Number.parseInt(pair, 16));
  return expected === await derivePassword(password, bytes);
}

export function createTemporaryPassword() {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const random = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join("");
  return random.match(/.{4}/g).join("-");
}
