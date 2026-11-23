"use strict";

const cameras = [
  { id: "acceso", name: "Acceso principal" },
  { id: "patio", name: "Patio delantero" },
  { id: "jardin", name: "Jardín" },
  { id: "terraza", name: "Terraza" },
  { id: "juegos", name: "Sala de juegos" },
  { id: "actividades", name: "Sala de actividades" },
  { id: "pasillo", name: "Pasillo" },
];

const grid = document.querySelector("#camera-grid");
const detail = document.querySelector("#single-view");
const picker = document.querySelector("#camera-picker");
const gridMode = document.querySelector("#grid-mode");
const singleMode = document.querySelector("#single-mode");
const player = document.querySelector("#camera-player");
const playerMessage = document.querySelector("#player-message");
const featuredNumber = document.querySelector("#featured-number");
const featuredTitle = document.querySelector("#featured-title");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let selectedIndex = 0;
let loadedCamera = null;

function caption(text, className) {
  const span = document.createElement("span");
  span.className = className;
  span.textContent = text;
  return span;
}

function channelLabel(index) {
  return "Cámara " + (index + 1);
}

function thumb(camera, priority = false) {
  const image = document.createElement("img");
  image.src = "assets/" + camera.id + ".jpg";
  image.alt = "";
  image.width = 512;
  image.height = 384;
  image.decoding = "async";
  if (!priority) image.loading = "lazy";
  return image;
}

const gridButtons = [];
const pickerButtons = [];

for (const [index, camera] of cameras.entries()) {
  const gridItem = document.createElement("li");
  const card = document.createElement("button");
  card.type = "button";
  card.className = "camera";
  card.setAttribute("aria-label", channelLabel(index) + ", " + camera.name + ". Abrir vista individual");
  const picture = caption("", "camera-image");
  const expand = caption("", "expand");
  expand.setAttribute("aria-hidden", "true");
  picture.append(thumb(camera, index < 4), expand);
  const cardCaption = caption("", "camera-caption");
  cardCaption.append(caption(channelLabel(index), "channel-number"), caption(camera.name, "camera-name"));
  card.append(picture, cardCaption);
  card.addEventListener("click", () => showCamera(index, true));
  gridItem.append(card);
  grid.append(gridItem);
  gridButtons.push(card);

  const pickerItem = document.createElement("li");
  const option = document.createElement("button");
  option.type = "button";
  option.setAttribute("aria-label", channelLabel(index) + ", " + camera.name);
  option.append(thumb(camera), caption(camera.name, ""));
  option.addEventListener("click", () => showCamera(index, false));
  pickerItem.append(option);
  picker.append(pickerItem);
  pickerButtons.push(option);
}

function showCamera(index, focusTitle) {
  selectedIndex = index;
  const camera = cameras[index];
  grid.hidden = true;
  detail.hidden = false;
  gridMode.setAttribute("aria-pressed", "false");
  singleMode.setAttribute("aria-pressed", "true");
  featuredNumber.textContent = channelLabel(index);
  featuredTitle.textContent = camera.name;
  for (const [optionIndex, option] of pickerButtons.entries()) {
    if (optionIndex === index) option.setAttribute("aria-current", "true");
    else option.removeAttribute("aria-current");
  }

  if (loadedCamera !== camera.id) {
    loadedCamera = camera.id;
    playerMessage.hidden = true;
    player.poster = "assets/" + camera.id + ".jpg";
    player.src = "assets/" + camera.id + ".mp4";
    player.muted = true;
    if (!reducedMotion.matches) {
      player.play().catch(() => {
        // The native controls stay available if autoplay is blocked.
      });
    }
  }
  if (focusTitle) featuredTitle.focus();
}

function showGrid(returnFocus) {
  detail.hidden = true;
  grid.hidden = false;
  gridMode.setAttribute("aria-pressed", "true");
  singleMode.setAttribute("aria-pressed", "false");
  player.pause();
  player.removeAttribute("src");
  player.removeAttribute("poster");
  player.load();
  loadedCamera = null;
  if (returnFocus) gridButtons[selectedIndex].focus();
}

player.addEventListener("error", () => {
  if (!loadedCamera) return;
  playerMessage.hidden = false;
  playerMessage.textContent = "El video de demostración no está disponible. Puedes seguir explorando el mosaico.";
});

gridMode.addEventListener("click", () => showGrid(false));
singleMode.addEventListener("click", () => showCamera(selectedIndex, false));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !detail.hidden && !document.fullscreenElement) showGrid(true);
});
