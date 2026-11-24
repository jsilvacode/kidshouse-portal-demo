import { getFamily, getRecords } from "./records.js";
import { onlineParents } from "./presence.js";

const today = document.querySelector("#owner-date");
const totalParents = document.querySelector("#total-parents");
const totalOnline = document.querySelector("#total-online");
const totalChildren = document.querySelector("#total-children");
const totalPending = document.querySelector("#total-pending");
const distribution = document.querySelector("#journey-distribution");
const onlineList = document.querySelector("#online-list");
const emptyList = document.querySelector("#online-empty");
const dateFormat = new Intl.DateTimeFormat("es-CL", { timeZone: "America/Santiago", weekday: "long", day: "numeric", month: "long" });

function journeyBar(journey, count, max) {
  const row = document.createElement("li");
  const label = document.createElement("span");
  const value = document.createElement("strong");
  const bar = document.createElement("span");
  const fill = document.createElement("span");
  label.textContent = journey.name;
  value.textContent = `${count} ${count === 1 ? "cuenta" : "cuentas"}`;
  bar.className = "journey-bar";
  bar.setAttribute("aria-hidden", "true");
  fill.style.width = `${(count / max) * 100}%`;
  bar.append(fill);
  row.append(label, value, bar);
  return row;
}

function onlineRow(parent) {
  const family = getFamily(parent.id);
  const row = document.createElement("li");
  const initials = document.createElement("span");
  const details = document.createElement("div");
  const name = document.createElement("strong");
  const course = document.createElement("span");
  initials.className = "online-initial";
  initials.setAttribute("aria-hidden", "true");
  initials.textContent = parent.name.slice(0, 1).toUpperCase();
  name.textContent = parent.name;
  course.textContent = family ? `Familia de ${family.child.name} · ${family.course.name}` : parent.email;
  details.append(name, course);
  row.append(initials, details);
  return row;
}

export function renderOnline() {
  const parents = onlineParents();
  totalOnline.textContent = parents.length;
  onlineList.replaceChildren(...parents.map(onlineRow));
  emptyList.hidden = parents.length > 0;
}

export function renderDashboard() {
  const { parents, children, journeys } = getRecords();
  today.textContent = dateFormat.format(new Date());
  totalParents.textContent = parents.length;
  totalChildren.textContent = children.length;
  totalPending.textContent = parents.filter((parent) => parent.mustChangePassword).length;

  const counts = new Map();
  for (const parent of parents) {
    const journeyId = getFamily(parent.id)?.journey.id;
    if (journeyId) counts.set(journeyId, (counts.get(journeyId) ?? 0) + 1);
  }
  const max = Math.max(1, ...counts.values());
  distribution.replaceChildren(...journeys.map((journey) => journeyBar(journey, counts.get(journey.id) ?? 0, max)));
  renderOnline();
}
