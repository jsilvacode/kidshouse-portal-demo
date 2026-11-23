export const demoPassword = "kids-demo";
export const ownerUser = "duena.demo";
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
  { id: "morning", name: "Camila", user: "familia.manana", childId: "isidora" },
  { id: "afternoon", name: "Nicolás", user: "familia.tarde", childId: "mateo" },
  { id: "full", name: "Andrea", user: "familia.completa", childId: "alma" },
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

function readRecords() {
  try {
    const saved = JSON.parse(localStorage.getItem(recordsKey));
    if (Array.isArray(saved?.journeys) && Array.isArray(saved.children) && Array.isArray(saved.parents)) {
      return Array.isArray(saved.courses) ? saved : migrateCourses(saved);
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
  const next = { ...records, [kind]: [...records[kind], record] };
  records = next;
  try {
    localStorage.setItem(recordsKey, JSON.stringify(next));
    return true;
  } catch {
    return false;
  }
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

export function isJourneyOpen(journey, now = new Date()) {
  const time = Object.fromEntries(santiagoClock.formatToParts(now).map(({ type, value }) => [type, value]));
  const current = time.hour + ":" + time.minute;
  return time.weekday !== "Sat" && time.weekday !== "Sun"
    && current >= journey.start && current < journey.end;
}

export async function demoPasswordHash(id, password) {
  const value = new TextEncoder().encode(id + "\n" + password);
  const digest = await crypto.subtle.digest("SHA-256", value);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
