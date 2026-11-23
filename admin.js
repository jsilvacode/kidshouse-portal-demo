import { addRecord, demoPasswordHash, getRecords, journeyHours, ownerUser } from "./records.js";

const sectionButtons = document.querySelectorAll("[data-admin-section]");
const panels = document.querySelectorAll("[data-admin-pane]");
const journeyList = document.querySelector("#journey-records");
const courseList = document.querySelector("#course-records");
const childList = document.querySelector("#child-records");
const parentList = document.querySelector("#parent-records");
const courseJourney = document.querySelector("#course-journey");
const childCourse = document.querySelector("#child-course");
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
  const { journeys, courses, children, parents } = getRecords();
  const journeyById = new Map(journeys.map((journey) => [journey.id, journey]));
  const courseById = new Map(courses.map((course) => [course.id, course]));
  const childById = new Map(children.map((child) => [child.id, child]));
  journeyList.replaceChildren(...journeys.map((journey) =>
    listItem(journey.name, journeyHours(journey) + " · Lunes a viernes")));
  courseList.replaceChildren(...courses.map((course) => {
    const journey = journeyById.get(course.journeyId);
    return listItem(course.name, journey ? journey.name + " · " + journeyHours(journey) : "Jornada pendiente");
  }));
  childList.replaceChildren(...children.map((child) => {
    const course = courseById.get(child.courseId);
    const journey = journeyById.get(course?.journeyId);
    return listItem(child.name, [course?.name, journey?.name].filter(Boolean).join(" · "));
  }));
  parentList.replaceChildren(...parents.map((parent) => {
    const child = childById.get(parent.childId);
    const course = courseById.get(child?.courseId);
    const journey = journeyById.get(course?.journeyId);
    return listItem(parent.name, [parent.user, child?.name, course?.name, journey?.name].filter(Boolean).join(" · "));
  }));
  fillChoices(courseJourney, "Elige una jornada", journeys.map((journey) =>
    new Option(journey.name + " · " + journeyHours(journey), journey.id)));
  fillChoices(childCourse, "Elige un curso", courses.map((course) =>
    new Option([course.name, journeyById.get(course.journeyId)?.name].filter(Boolean).join(" · "), course.id)));
  fillChoices(parentChild, "Elige un niño o niña", children.map((child) =>
    new Option([child.name, courseById.get(child.courseId)?.name].filter(Boolean).join(" · "), child.id)));
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

  document.querySelector("#new-course").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!isOwner()) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const name = values.get("nombre").trim();
    const journeyId = values.get("jornada");
    const { journeys, courses } = getRecords();
    if (!name || !journeys.some((journey) => journey.id === journeyId)) {
      return feedback(form, "Ingresa el nombre del curso y elige su jornada.", true);
    }
    if (courses.some((course) => course.journeyId === journeyId && course.name.toLowerCase() === name.toLowerCase())) {
      return feedback(form, "Ya existe un curso con ese nombre en esta jornada.", true);
    }
    created(form, "courses", { id: crypto.randomUUID(), name, journeyId }, "Curso creado.");
  });

  document.querySelector("#new-child").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!isOwner()) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const name = values.get("nombre").trim();
    const courseId = values.get("curso");
    if (!name || !getRecords().courses.some((course) => course.id === courseId)) {
      return feedback(form, "Completa el nombre y elige su curso.", true);
    }
    created(form, "children", { id: crypto.randomUUID(), name, courseId }, "Niño o niña registrado.");
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
