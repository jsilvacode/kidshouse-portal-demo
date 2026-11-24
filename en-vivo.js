"use strict";

const signingKey = {
  kty: "EC",
  crv: "P-256",
  x: "TnX6-4gLnCynPslm7BaQ0c4kwZH-8gr7F_H7DSgGoVA",
  y: "CjeEELNlWcQsrBKDf5uLdTo9b_lZnTAnIKrNiqcPFqw",
};
const frame = document.querySelector("#live-frame");
const message = document.querySelector("#live-message");

function bytes(value) {
  return Uint8Array.from(atob(value.replaceAll("-", "+").replaceAll("_", "/")), (letter) => letter.charCodeAt(0));
}

async function verifiedInvite(fragment) {
  if (!/^[A-Za-z0-9_-]{1,500}\.[A-Za-z0-9_-]{86}$/.test(fragment)) return null;
  const [encoded, signature] = fragment.split(".");
  const payload = bytes(encoded);
  const key = await crypto.subtle.importKey("jwk", signingKey, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"]);
  const signed = await crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, bytes(signature), payload);
  if (!signed) return null;
  const invite = JSON.parse(new TextDecoder().decode(payload));
  const { host, code, expires } = invite;
  if (typeof host !== "string" || !/^[a-z0-9-]{1,63}\.trycloudflare\.com$/.test(host)
      || typeof code !== "string" || !/^[A-Za-z0-9_-]{32}$/.test(code)
      || !Number.isSafeInteger(expires) || expires <= Date.now()) return null;
  return { origin: `https://${host}`, code };
}

function openFrame({ origin, code }) {
  window.addEventListener("message", (event) => {
    if (event.origin !== origin || event.source !== frame.contentWindow) return;
    const height = event.data?.kidshouseHeight;
    if (Number.isInteger(height) && height >= 240 && height <= 3600) {
      frame.style.height = `${height}px`;
    }
  });
  frame.src = `${origin}/embebido#${code}`;
  message.hidden = true;
  frame.hidden = false;
}

if (location.hash) {
  verifiedInvite(location.hash.slice(1)).catch(() => null).then((invite) => {
    if (invite) openFrame(invite);
    else message.textContent = "El enlace privado no es válido o ya venció.";
  });
}
