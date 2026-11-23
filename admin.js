import { addRecord, demoPasswordHash, getRecords, journeyHours, ownerUser } from "./records.js";

const sectionButtons = document.querySelectorAll("[data-admin-section]");
const panels = document.querySelectorAll("[data-admin-pane]");
const journeyList = document.querySelector("#journey-records");
const childList = document.querySelector("#child-records");
const parentList = document.querySelector("#parent-records");
const childJourney = document.querySelector("#child-journey");
const parentChild = document.querySelector("#parent-child");

function listItem(name, description) {
  const item = document.createElement("li");
  const title = document.createElement("strong");
  const detail = document.createElement("span");
  title.textContent = name;
  detail.textContent = description;
  item.append(title, detail);
  return item;
}

function fillChoices(select, placeholder, options) {
  const previous = select.value;
  const empty = new Option(placeholder, "", true, true);
  empty.disabled = true;
  select.replaceChildren(empty, ...options);
  if (options.some((option) => option.value === previous)) select.value = previous;
}

export function renderAdmin() {
  const { journeys, children, parents } = getRecords();
  const journeyById = new Map(journeys.map((journey) => [journey.id, journey]));
  const childById = new Map(children.map((child) => [child.id, child]));
  journeyList.replaceChildren(...journeys.map((journey) =>
    listItem(journey.name, journeyHours(journey) + " · Lunes a viernes")));
  childList.replaceChildren(...children.map((child) =>
    listItem(child.name, child.group + " · " + (journeyById.get(child.journeyId)?.name ?? "Jornada pendiente"))));
  parentList.replaceChildren(...parents.map((parent) => {
    const child = childById.get(parent.childId);
    const journey = journeyById.get(child?.journeyId);
    return listItem(parent.name, [parent.user, child?.name, journey?.name].filter(Boolean).join(" · "));
  }));
  fillChoices(childJourney, "Elige una jornada", journeys.map((journey) =>
    new Option(journey.name + " · " + journeyHours(journey), journey.id)));
  fillChoices(parentChild, "Elige un niño o niña", children.map((child) =>
    new Option(child.name + " · " + child.group, child.id)));
}

function feedback(form, message, error = false) {
  const status = form.querySelector(".admin-feedback");
  status.textContent = message;
  status.dataset.error = String(error);
  status.hidden = false;
}

function created(form, kind, record, message) {
  const saved = addRecord(kind, record);
  form.reset();
  renderAdmin();
  feedback(form, saved ? message : message + " Disponible en esta pestaña.");
}

export function bindAdmin(isOwner) {
  for (const button of sectionButtons) {
    button.addEventListener("click", () => {
      const selected = button.dataset.adminSection;
      for (const control of sectionButtons) control.setAttribute("aria-pressed", String(control === button));
      for (const panel of panels) panel.hidden = panel.dataset.adminPane !== selected;
    });
  }

  document.querySelector("#new-journey").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!isOwner()) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const name = values.get("nombre").trim();
    const start = values.get("inicio");
    const end = values.get("fin");
    if (!name || !start || !end) return feedback(form, "Completa el nombre y las dos horas.", true);
    if (start >= end) return feedback(form, "La hora de inicio debe ser anterior a la de término.", true);
    if (getRecords().journeys.some((journey) => journey.name.toLowerCase() === name.toLowerCase())) {
      return feedback(form, "Ya existe una jornada con ese nombre.", true);
    }
    created(form, "journeys", { id: crypto.randomUUID(), name, start, end }, "Jornada creada.");
  });

  document.querySelector("#new-child").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!isOwner()) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const name = values.get("nombre").trim();
    const group = values.get("grupo").trim();
    const journeyId = values.get("jornada");
    if (!name || !group || !getRecords().journeys.some((journey) => journey.id === journeyId)) {
      return feedback(form, "Completa el nombre, el grupo y la jornada.", true);
    }
    created(form, "children", { id: crypto.randomUUID(), name, group, journeyId }, "Niño o niña registrado.");
  });

  document.querySelector("#new-parent").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isOwner()) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const name = values.get("nombre").trim();
    const user = values.get("usuario").trim().toLowerCase();
    const password = values.get("clave");
    const childId = values.get("nino");
    if (!name || !user || !password.trim() || !getRecords().children.some((child) => child.id === childId)) {
      return feedback(form, "Completa los datos del apoderado y elige a qué niño o niña vincularlo.", true);
    }
    if (user === ownerUser || getRecords().parents.some((parent) => parent.user === user)) {
      return feedback(form, "Ese usuario ya está registrado.", true);
    }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    try {
      const id = crypto.randomUUID();
      const passwordHash = await demoPasswordHash(id, password);
      if (!isOwner()) return;
      created(form, "parents", { id, name, user, childId, passwordHash }, "Apoderado dado de alta.");
    } catch {
      feedback(form, "No se pudo completar el alta. Vuelve a intentar.", true);
    } finally {
      button.disabled = false;
    }
  });
}
