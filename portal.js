import { bindAdmin, renderAdmin } from "./admin.js";
import {
  demoPassword, demoPasswordHash, getFamily, getRecords, isJourneyOpen,
  journeyHours, ownerUser, recordsKey, reloadRecords,
} from "./records.js";
import { resetViewer } from "./viewer.js";

const storageKey = "kidshouse-demo-session";

const entry = document.querySelector("#entry");
const signIn = document.querySelector("#sign-in");
const signInForm = document.querySelector("#sign-in-form");
const userField = document.querySelector("#demo-user");
const passwordField = document.querySelector("#demo-password");
const signInError = document.querySelector("#sign-in-error");
const signOutButton = document.querySelector("#sign-out");
const journeyView = document.querySelector("#choose-journey");
const journeyForm = document.querySelector("#journey-form");
const journeyInput = document.querySelector("#assigned-journey");
const welcomeTitle = document.querySelector("#welcome-title");
const welcomeChild = document.querySelector("#welcome-child");
const journeyName = document.querySelector("#journey-name");
const journeyCourse = document.querySelector("#journey-course");
const journeyTime = document.querySelector("#journey-hours");
const journeyNotice = document.querySelector("#journey-notice");
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

function showSession(moveFocus = false) {
  const family = currentFamily();
  const owner = session?.role === "owner";
  const available = Boolean(family && isJourneyOpen(family.journey));
  const showCameras = available && session.journey === family.journey.id;
  const interrupted = Boolean(session?.journey && !showCameras);
  if (interrupted) {
    session.journey = null;
    resetViewer();
    saveSession();
  }

  entry.hidden = owner || showCameras;
  signIn.hidden = Boolean(family) || owner;
  signOutButton.hidden = !family && !owner;
  journeyView.hidden = !family || showCameras;
  familySummary.hidden = !showCameras;
  cameras.hidden = !showCameras;
  adminPanel.hidden = !owner;

  if (family) {
    const { child, course, journey } = family;
    welcomeChild.textContent = child.name;
    journeyName.textContent = journey.name;
    journeyCourse.textContent = "Curso " + course.name;
    journeyTime.textContent = journeyHours(journey);
    journeyInput.value = journey.id;
    journeyInput.checked = true;
    journeyNotice.textContent = available
      ? ""
      : "Fuera de horario. Las cámaras se habilitan de lunes a viernes dentro de esta jornada.";
    journeyNotice.hidden = available;
    openCameras.disabled = !available;
    familyTitle.textContent = "Familia de " + child.name;
    familyInitial.textContent = child.name[0];
    familyDetails.textContent = [
      "Curso " + course.name, journey.name, journeyHours(journey),
    ].join(" · ");
  } else {
    journeyInput.value = "";
    journeyInput.checked = false;
  }

  if (owner && moveFocus) renderAdmin();
  if (moveFocus || interrupted) {
    const heading = owner ? adminTitle : showCameras ? familyTitle : family ? welcomeTitle : loginTitle;
    heading.focus();
  }
}

for (const button of document.querySelectorAll("[data-demo-family]")) {
  button.addEventListener("click", () => {
    const id = button.dataset.demoFamily;
    const account = id === "owner" ? ownerUser : getFamily(id)?.parent.user;
    if (!account) return;
    userField.value = account;
    passwordField.value = demoPassword;
    signInError.hidden = true;
    signInForm.querySelector('button[type="submit"]').focus();
  });
}

signInForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const user = userField.value.trim().toLowerCase();
  const password = passwordField.value;
  const submit = signInForm.querySelector('button[type="submit"]');
  submit.disabled = true;
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
        signInError.textContent = "Revisa los datos ingresados o carga una cuenta de ejemplo.";
        signInError.hidden = false;
        return;
      }
      session = { role: "parent", account: parent.id, journey: null };
    }
    signInForm.reset();
    signInError.hidden = true;
    saveSession();
    showSession(true);
  } catch {
    signInError.textContent = "No se pudo iniciar la sesión de demostración. Vuelve a intentar.";
    signInError.hidden = false;
  } finally {
    submit.disabled = false;
  }
});

journeyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const family = currentFamily();
  if (!family || !isJourneyOpen(family.journey)
      || new FormData(journeyForm).get("jornada") !== family.journey.id) {
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
  session = null;
  resetViewer();
  signInForm.reset();
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
  if (family && openCameras.disabled !== !isJourneyOpen(family.journey)) {
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
