import { addRecord, addRecords, demoPasswordHash, getRecords, journeyHours, ownerUser } from "./records.js";

const sectionButtons = document.querySelectorAll("[data-admin-section]");
const panels = document.querySelectorAll("[data-admin-pane]");
const journeyList = document.querySelector("#journey-records");
const courseList = document.querySelector("#course-records");
const childList = document.querySelector("#child-records");
const parentList = document.querySelector("#parent-records");
const courseJourney = document.querySelector("#course-journey");
const childCourse = document.querySelector("#child-course");
const parentChild = document.querySelector("#parent-child");
const familyCourse = document.querySelector("#family-course");
const familyForm = document.querySelector("#new-parent");
const familyAssignment = document.querySelector("#family-assignment");
const newChildFields = document.querySelector("#new-child-fields");
const newChildValue = "nuevo";

function listItem(name, description) {
  const item = document.createElement("li");
  const title = document.createElement("strong");
  const detail = document.createElement("span");
  title.textContent = name;
  detail.textContent = description;
  item.append(title, detail);
  return item;
}

function fillChoices(select, placeholder, options, initialValue = "") {
  const previous = select.value;
  const first = new Option(placeholder, initialValue, true, true);
  first.disabled = !initialValue;
  select.replaceChildren(first, ...options);
  if (options.some((option) => option.value === previous)) select.value = previous;
}

function showAssignment() {
  const { children, courses, journeys } = getRecords();
  const adding = parentChild.value === newChildValue;
  const enrolledChild = children.find((child) => child.id === parentChild.value);
  const course = courses.find((item) => item.id === (adding ? familyCourse.value : enrolledChild?.courseId));
  const journey = journeys.find((item) => item.id === course?.journeyId);
  newChildFields.hidden = !adding;
  familyForm.elements.nino_nombre.disabled = !adding;
  familyCourse.disabled = !adding;
  familyAssignment.hidden = !journey;
  familyAssignment.textContent = journey ? `${journey.name} · ${journeyHours(journey)} · Lunes a viernes` : "";
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
  for (const select of [childCourse, familyCourse]) {
    fillChoices(select, "Elige un curso", courses.map((course) =>
      new Option([course.name, journeyById.get(course.journeyId)?.name].filter(Boolean).join(" · "), course.id)));
  }
  fillChoices(parentChild, "Inscribir a un niño o niña", children.map((child) =>
    new Option([child.name, courseById.get(child.courseId)?.name].filter(Boolean).join(" · "), child.id)), newChildValue);
  showAssignment();
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
  const followUp = form.querySelector("[data-next-input]");
  followUp.dataset.record = record.id;
  followUp.hidden = false;
}

function openSection(name, focusTab = false) {
  for (const control of sectionButtons) {
    const active = control.dataset.adminSection === name;
    control.setAttribute("aria-pressed", String(active));
    if (active && focusTab) control.focus();
  }
  for (const panel of panels) panel.hidden = panel.dataset.adminPane !== name;
}

export function resetAdmin() {
  for (const form of document.querySelectorAll("#admin-panel form")) {
    form.reset();
    for (const status of form.querySelectorAll(".admin-feedback, [data-next-input]")) status.hidden = true;
  }
  showAssignment();
  openSection("parents");
}

export function bindAdmin(isOwner) {
  for (const button of sectionButtons) {
    button.addEventListener("click", () => openSection(button.dataset.adminSection));
  }
  for (const button of document.querySelectorAll("[data-admin-open]")) {
    button.addEventListener("click", () => {
      const { adminOpen, nextInput, record } = button.dataset;
      openSection(adminOpen, true);
      if (!nextInput) return;
      const select = document.querySelector(nextInput);
      if (select === familyCourse) parentChild.value = newChildValue;
      select.value = record;
      showAssignment();
      select.focus();
    });
  }
  parentChild.addEventListener("change", showAssignment);
  familyCourse.addEventListener("change", showAssignment);

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

  familyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!isOwner()) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    const name = values.get("nombre").trim();
    const user = values.get("usuario").trim().toLowerCase();
    const password = values.get("clave");
    const { children, courses } = getRecords();
    const adding = values.get("nino") === newChildValue;
    const child = adding ? {
      id: crypto.randomUUID(),
      name: values.get("nino_nombre")?.trim(),
      courseId: values.get("nino_curso"),
    } : children.find((item) => item.id === values.get("nino"));
    if (!child?.name || !courses.some((course) => course.id === child.courseId)) {
      return feedback(form, "Completa la inscripción y elige un curso.", true);
    }
    if (!name || !user || !password.trim()) {
      return feedback(form, "Completa el nombre, el usuario y la clave del apoderado.", true);
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
      if (getRecords().parents.some((parent) => parent.user === user)) {
        return feedback(form, "Ese usuario ya está registrado.", true);
      }
      const parent = { id, name, user, childId: child.id, passwordHash };
      const entries = adding ? [["children", child], ["parents", parent]] : [["parents", parent]];
      const saved = addRecords(entries);
      form.reset();
      renderAdmin();
      const message = `Acceso ${user} creado para la familia de ${child.name}.`;
      feedback(form, saved ? message : message + " Disponible en esta pestaña.");
    } catch {
      feedback(form, "No se pudo completar el alta. Vuelve a intentar.", true);
    } finally {
      button.disabled = false;
    }
  });
}
