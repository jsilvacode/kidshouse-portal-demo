import { bindAccount } from "./account.js";
import { bindAdmin, openAdminSection, renderAdmin, resetAdmin } from "./admin.js";
import { renderDashboard, renderOnline } from "./dashboard.js";
import { announcePresence, presencePrefix } from "./presence.js";
import {
  getFamily, isJourneyOpen, journeyAvailability, journeyHours, ownerEmail, recordsKey, reloadRecords,
} from "./records.js";
import { resetViewer } from "./viewer.js";

const storageKey = "kidshouse-demo-session";
const ownerPages = ["home", "cameras", "admin"];

const entry = document.querySelector("#entry");
const signOutButton = document.querySelector("#sign-out");
const ownerNavigation = document.querySelector("#owner-navigation");
const ownerLinks = ownerNavigation.querySelectorAll("[data-owner-page]");
const ownerHome = document.querySelector("#owner-home");
const ownerTitle = document.querySelector("#owner-title");
const passwordTitle = document.querySelector("#password-title");
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
const viewerTitle = document.querySelector("#viewer-title");
const adminPanel = document.querySelector("#admin-panel");
const adminTitle = document.querySelector("#admin-title");
const loginTitle = document.querySelector("#hero-title");

let session = restoreSession();
const account = bindAccount({
  onLogin({ role, parent }) {
    session = role === "owner" ? { role, account: ownerEmail, page: "home" }
      : { role, account: parent.id, passwordVersion: parent.passwordVersion, journey: null };
    saveSession();
    showSession(true);
  },
  onEnrollment(parent) {
    if (session?.role !== "parent" || session.account !== parent.id) return;
    session.passwordVersion = parent.passwordVersion;
    saveSession();
    showSession(true);
  },
});

function restoreSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (saved?.role === "owner" && [ownerEmail, "duena.demo"].includes(saved.account)) {
      return { role: "owner", account: ownerEmail, page: ownerPages.includes(saved.page) ? saved.page : "home" };
    }
    const family = getFamily(saved?.account ?? saved?.family);
    if (family && (saved.passwordVersion ?? 0) === family.parent.passwordVersion) {
      return {
        role: "parent",
        account: family.parent.id,
        passwordVersion: family.parent.passwordVersion,
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
  if (session?.role !== "parent") return null;
  const family = getFamily(session.account);
  return family?.parent.passwordVersion === session.passwordVersion ? family : null;
}

function showSession(moveFocus = false) {
  const family = currentFamily();
  const owner = session?.role === "owner";
  if (session?.role === "parent" && !family) {
    session = null;
    saveSession();
    resetViewer();
    account.reset("Tu acceso cambió. Vuelve a ingresar con tu contraseña.");
    moveFocus = true;
  }
  const needsPassword = Boolean(family?.parent.mustChangePassword);
  const availability = family && journeyAvailability(family.journey);
  const familyViewer = Boolean(!needsPassword && availability?.open && session.journey === family.journey.id);
  const ownerPage = owner ? session.page : null;
  const ownerViewer = ownerPage === "cameras";
  const interrupted = Boolean(session?.journey && !familyViewer);
  if (interrupted) {
    session.journey = null;
    resetViewer();
    saveSession();
  }

  entry.hidden = owner || Boolean(family && !needsPassword);
  if (needsPassword) account.enroll(family.parent);
  signOutButton.hidden = !family && !owner;
  ownerNavigation.hidden = !owner;
  for (const link of ownerLinks) link.setAttribute("aria-pressed", String(link.dataset.ownerPage === ownerPage));
  ownerHome.hidden = ownerPage !== "home";
  adminPanel.hidden = ownerPage !== "admin";
  familyHome.hidden = !family || needsPassword || familyViewer;
  familySummary.hidden = !familyViewer;
  cameras.hidden = !familyViewer && !ownerViewer;
  viewerTitle.textContent = ownerViewer ? "Cámaras de Kids House" : "Cámaras";
  announcePresence(needsPassword ? null : family?.parent);

  if (family && !needsPassword) {
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

  if (ownerPage === "home") renderDashboard();
  if (ownerPage === "admin") renderAdmin();
  if (moveFocus || interrupted) {
    let heading = loginTitle;
    if (owner) heading = { home: ownerTitle, cameras: viewerTitle, admin: adminTitle }[ownerPage];
    else if (family) heading = needsPassword ? passwordTitle : familyViewer ? familyTitle : welcomeTitle;
    window.scrollTo({ top: 0, behavior: "instant" });
    heading.focus({ preventScroll: true });
  }
}

function openOwnerPage(page) {
  if (session?.role !== "owner" || !ownerPages.includes(page)) return;
  if (session.page === "cameras" && page !== "cameras") resetViewer();
  session.page = page;
  saveSession();
  showSession(true);
}

for (const link of ownerLinks) link.addEventListener("click", () => openOwnerPage(link.dataset.ownerPage));
document.querySelector("#new-family-shortcut").addEventListener("click", () => {
  if (session?.role !== "owner") return;
  openAdminSection("parents");
  openOwnerPage("admin");
});
document.querySelector(".topbar .brand").addEventListener("click", (event) => {
  if (session?.role !== "owner") return;
  event.preventDefault();
  openOwnerPage("home");
});

openCameras.addEventListener("click", () => {
  const family = currentFamily();
  if (!family || family.parent.mustChangePassword || !isJourneyOpen(family.journey)) {
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
  account.reset();
  saveSession();
  showSession(true);
});

bindAdmin(() => session?.role === "owner");
window.addEventListener("storage", (event) => {
  if (event.key === recordsKey || event.key === null) {
    reloadRecords();
    showSession();
  } else if (!ownerHome.hidden && event.key.startsWith(presencePrefix)) {
    renderOnline();
  }
});
function refreshAccess() {
  const family = currentFamily();
  if (family && !family.parent.mustChangePassword && accessDetail.textContent !== journeyAvailability(family.journey).detail) {
    showSession();
  }
}
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) refreshAccess();
});
setInterval(refreshAccess, 1000);
setInterval(() => { if (!ownerHome.hidden) renderOnline(); }, 10000);
showSession();
