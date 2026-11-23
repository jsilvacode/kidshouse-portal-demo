import { resetViewer } from "./viewer.js";

const demoPassword = "kids-demo";
const storageKey = "kidshouse-demo-session";
const families = [
  {
    id: "morning", user: "familia.manana", child: "Isidora", group: "Exploradores",
    journey: "Jornada de mañana", hours: "08:30 a 12:30",
  },
  {
    id: "afternoon", user: "familia.tarde", child: "Mateo", group: "Pequeños creadores",
    journey: "Jornada de tarde", hours: "14:00 a 18:00",
  },
  {
    id: "full", user: "familia.completa", child: "Alma", group: "Semillitas",
    journey: "Jornada completa", hours: "08:30 a 18:00",
  },
];

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
const journeyGroup = document.querySelector("#journey-group");
const journeyHours = document.querySelector("#journey-hours");
const familySummary = document.querySelector("#family-summary");
const familyTitle = document.querySelector("#family-title");
const familyInitial = document.querySelector("#family-initial");
const familyDetails = document.querySelector("#family-details");
const cameras = document.querySelector("#camaras");

let session = restoreSession();

function restoreSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    const family = families.find((item) => item.id === saved?.family);
    return family ? { family, confirmed: saved.journey === family.id } : null;
  } catch {
    return null;
  }
}

function saveSession() {
  try {
    if (session) {
      sessionStorage.setItem(storageKey, JSON.stringify({
        family: session.family.id,
        journey: session.confirmed ? session.family.id : null,
      }));
    } else {
      sessionStorage.removeItem(storageKey);
    }
  } catch {
    // The demo remains usable when tab storage is unavailable.
  }
}

function showSession(moveFocus = false) {
  const family = session?.family;
  const showCameras = Boolean(session?.confirmed);
  entry.hidden = showCameras;
  signIn.hidden = Boolean(family);
  signOutButton.hidden = !family;
  journeyView.hidden = !family || showCameras;
  familySummary.hidden = !showCameras;
  cameras.hidden = !showCameras;

  if (family) {
    welcomeChild.textContent = family.child;
    journeyName.textContent = family.journey;
    journeyGroup.textContent = "Grupo " + family.group;
    journeyHours.textContent = family.hours;
    journeyInput.value = family.id;
    journeyInput.checked = true;
    familyTitle.textContent = "Familia de " + family.child;
    familyInitial.textContent = family.child[0];
    familyDetails.textContent = [
      "Grupo " + family.group, family.journey, family.hours,
    ].join(" · ");
  } else {
    journeyInput.value = "";
    journeyInput.checked = false;
  }

  if (moveFocus) {
    const heading = showCameras ? familyTitle : family ? welcomeTitle : document.querySelector("#hero-title");
    heading.focus();
  }
}

for (const button of document.querySelectorAll("[data-demo-family]")) {
  button.addEventListener("click", () => {
    const family = families.find((item) => item.id === button.dataset.demoFamily);
    userField.value = family.user;
    passwordField.value = demoPassword;
    signInError.hidden = true;
    signInForm.querySelector('button[type="submit"]').focus();
  });
}

signInForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const family = families.find((item) => item.user === userField.value.trim().toLowerCase());
  if (!family || passwordField.value !== demoPassword) {
    signInError.textContent = "Revisa los datos ingresados o carga una familia de ejemplo.";
    signInError.hidden = false;
    return;
  }
  session = { family, confirmed: false };
  signInForm.reset();
  signInError.hidden = true;
  saveSession();
  showSession(true);
});

journeyForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!session || new FormData(journeyForm).get("jornada") !== session.family.id) return;
  session.confirmed = true;
  saveSession();
  showSession(true);
});

document.querySelector("#view-journey").addEventListener("click", () => {
  session.confirmed = false;
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

document.querySelector("#sign-in-fields").disabled = false;
showSession();
