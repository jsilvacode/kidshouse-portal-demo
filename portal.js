import { bindAdmin, renderAdmin, resetAdmin } from "./admin.js";
import {
  demoPassword, demoPasswordHash, getFamily, getRecords, isJourneyOpen,
  journeyAvailability, journeyHours, ownerUser, recordsKey, reloadRecords,
} from "./records.js";
import { resetViewer } from "./viewer.js";

const storageKey = "kidshouse-demo-session";

const entry = document.querySelector("#entry");
const signInForm = document.querySelector("#sign-in-form");
const userField = document.querySelector("#demo-user");
const passwordField = document.querySelector("#demo-password");
const passwordToggle = document.querySelector("#toggle-password");
const signInSubmit = signInForm.querySelector('button[type="submit"]');
const signInError = document.querySelector("#sign-in-error");
const signOutButton = document.querySelector("#sign-out");
const familyHome = document.querySelector("#family-home");
const welcomeTitle = document.querySelector("#welcome-title");
const welcomeChild = document.querySelector("#welcome-child");
const welcomeCourse = document.querySelector("#welcome-course");
const journeyName = document.querySelector("#journey-name");
const journeyTime = document.querySelector("#journey-hours");
const accessCard = document.querySelector(".family-access");
const accessState = document.querySelector("#access-state");
const accessDetail = document.querySelector("#access-detail");
const openCameras = document.querySelector("#open-cameras");
const familySummary = document.querySelector("#family-summary");
const familyTitle = document.querySelector("#family-title");
const familyInitial = document.querySelector("#family-initial");
const familyDetails = document.querySelector("#family-details");
const cameras = document.querySelector("#camaras");
const adminPanel = document.querySelector("#admin-panel");
const adminTitle = document.querySelector("#admin-title");
const loginTitle = document.querySelector("#hero-title");

let session = restoreSession();

function restoreSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (saved?.role === "owner" && saved.account === ownerUser) return saved;
    const family = getFamily(saved?.account ?? saved?.family);
    if (family) {
      return {
        role: "parent",
        account: family.parent.id,
        journey: saved.journey === family.journey.id ? saved.journey : null,
      };
    }
  } catch {
    // Start at the demo sign-in screen if there is no usable tab session.
  }
  return null;
}

function saveSession() {
  try {
    if (session) sessionStorage.setItem(storageKey, JSON.stringify(session));
    else sessionStorage.removeItem(storageKey);
  } catch {
    // The demo remains usable when tab storage is unavailable.
  }
}

function currentFamily() {
  return session?.role === "parent" ? getFamily(session.account) : null;
}

function showPassword(visible) {
  passwordField.type = visible ? "text" : "password";
  passwordToggle.textContent = visible ? "Ocultar" : "Ver";
  passwordToggle.setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
}

function showSession(moveFocus = false) {
  const family = currentFamily();
  const owner = session?.role === "owner";
  const availability = family && journeyAvailability(family.journey);
  const showCameras = Boolean(availability?.open && session.journey === family.journey.id);
  const interrupted = Boolean(session?.journey && !showCameras);
  if (interrupted) {
    session.journey = null;
    resetViewer();
    saveSession();
  }

  entry.hidden = owner || Boolean(family);
  signOutButton.hidden = !family && !owner;
  familyHome.hidden = !family || showCameras;
  familySummary.hidden = !showCameras;
  cameras.hidden = !showCameras;
  adminPanel.hidden = !owner;

  if (family) {
    const { child, course, journey } = family;
    welcomeChild.textContent = child.name;
    welcomeCourse.textContent = "Curso " + course.name;
    journeyName.textContent = journey.name;
    journeyTime.textContent = journeyHours(journey);
    accessCard.dataset.open = String(availability.open);
    accessState.textContent = availability.open ? "Dentro de tu jornada." : "Fuera de horario.";
    accessDetail.textContent = availability.detail;
    openCameras.disabled = !availability.open;
    familyTitle.textContent = "Familia de " + child.name;
    familyInitial.textContent = child.name[0];
    familyDetails.textContent = [
      "Curso " + course.name, journey.name, journeyHours(journey),
    ].join(" · ");
  }

  if (owner && moveFocus) renderAdmin();
  if (moveFocus || interrupted) {
    const heading = owner ? adminTitle : showCameras ? familyTitle : family ? welcomeTitle : loginTitle;
    window.scrollTo({ top: 0, behavior: "instant" });
    heading.focus({ preventScroll: true });
  }
}

for (const button of document.querySelectorAll("[data-demo-family]")) {
  button.addEventListener("click", () => {
    if (signInSubmit.disabled) return;
    const id = button.dataset.demoFamily;
    const account = id === "owner" ? ownerUser : getFamily(id)?.parent.user;
    if (!account) return;
    userField.value = account;
    passwordField.value = demoPassword;
    signInError.hidden = true;
    signInForm.requestSubmit(signInSubmit);
  });
}

passwordToggle.addEventListener("click", () => showPassword(passwordField.type === "password"));

signInForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (signInSubmit.disabled) return;
  const user = userField.value.trim().toLowerCase();
  const password = passwordField.value;
  signInSubmit.disabled = true;
  try {
    if (user === ownerUser && password === demoPassword) {
      session = { role: "owner", account: ownerUser };
    } else {
      const parent = getRecords().parents.find((item) => item.user === user);
      const family = getFamily(parent?.id);
      const valid = family && (parent.passwordHash
        ? await demoPasswordHash(parent.id, password) === parent.passwordHash
        : password === demoPassword);
      if (!valid) {
        signInError.textContent = "Revisa tu usuario y tu contraseña.";
        signInError.hidden = false;
        return;
      }
      session = { role: "parent", account: parent.id, journey: null };
    }
    signInForm.reset();
    showPassword(false);
    signInError.hidden = true;
    saveSession();
    showSession(true);
  } catch {
    signInError.textContent = "No se pudo iniciar la sesión de demostración. Vuelve a intentar.";
    signInError.hidden = false;
  } finally {
    signInSubmit.disabled = false;
  }
});

openCameras.addEventListener("click", () => {
  const family = currentFamily();
  if (!family || !isJourneyOpen(family.journey)) {
    showSession();
    return;
  }
  session.journey = family.journey.id;
  saveSession();
  showSession(true);
});

document.querySelector("#view-journey").addEventListener("click", () => {
  if (!currentFamily()) return;
  session.journey = null;
  resetViewer();
  saveSession();
  showSession(true);
});

signOutButton.addEventListener("click", () => {
  if (session?.role === "owner") resetAdmin();
  session = null;
  resetViewer();
  signInForm.reset();
  showPassword(false);
  signInError.hidden = true;
  saveSession();
  showSession(true);
});

bindAdmin(() => session?.role === "owner");
window.addEventListener("storage", (event) => {
  if (event.key !== recordsKey) return;
  reloadRecords();
  if (session?.role === "owner") renderAdmin();
  showSession();
});
function refreshAccess() {
  const family = currentFamily();
  if (family && accessDetail.textContent !== journeyAvailability(family.journey).detail) {
    showSession();
  }
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshAccess();
});
setInterval(refreshAccess, 1000);

document.querySelector("#sign-in-fields").disabled = false;
if (session?.role === "owner") renderAdmin();
showSession();
