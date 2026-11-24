import {
  demoPassword, getFamily, getParentByEmail, hashPassword, normalizeEmail, ownerEmail,
  passwordMatches, replaceParentPassword,
} from "./records.js";

const verificationMinutes = 10;
const attemptsAllowed = 5;

export function bindAccount({ onLogin, onEnrollment }) {
  const signIn = document.querySelector("#sign-in");
  const requestPane = document.querySelector("#request-recovery");
  const verifyPane = document.querySelector("#verify-recovery");
  const passwordPane = document.querySelector("#password-setup");
  const panes = [signIn, requestPane, verifyPane, passwordPane];
  const loginForm = document.querySelector("#sign-in-form");
  const requestForm = document.querySelector("#recovery-form");
  const verifyForm = document.querySelector("#verify-form");
  const passwordForm = document.querySelector("#password-form");
  const loginError = document.querySelector("#sign-in-error");
  const loginFeedback = document.querySelector("#sign-in-feedback");
  const codeError = document.querySelector("#verify-error");
  const passwordError = document.querySelector("#password-error");
  const passwordToggle = document.querySelector("#toggle-password");
  const inbox = document.querySelector("#demo-inbox");
  const inboxMessage = document.querySelector("#demo-inbox-message");
  const inboxCode = document.querySelector("#demo-inbox-code");
  const passwordReason = document.querySelector("#password-reason");
  const cancelReset = document.querySelector("#cancel-password-reset");

  let currentPane = signIn;
  let loginAttempt = 0;
  let challenge;
  let passwordGrant;

  function feedback(node, message = "") {
    node.textContent = message;
    node.hidden = !message;
  }

  function selectPane(selected, focus = false) {
    currentPane = selected;
    for (const pane of panes) pane.hidden = pane !== selected;
    if (focus) {
      window.scrollTo({ top: 0, behavior: "instant" });
      selected.querySelector("h1").focus({ preventScroll: true });
    }
  }

  function revealPassword(visible) {
    loginForm.elements.clave.type = visible ? "text" : "password";
    passwordToggle.textContent = visible ? "Ocultar" : "Ver";
    passwordToggle.setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
  }

  function reset(message = "", email = "") {
    loginAttempt += 1;
    challenge = undefined;
    passwordGrant = undefined;
    for (const form of [loginForm, requestForm, verifyForm, passwordForm]) form.reset();
    inbox.open = false;
    inboxCode.querySelector("strong").textContent = "";
    inboxCode.hidden = true;
    loginForm.elements.correo.value = email;
    revealPassword(false);
    feedback(loginError);
    feedback(loginFeedback, message);
    feedback(codeError);
    feedback(passwordError);
    selectPane(signIn);
  }

  function setPasswordPane(parent, kind, expires = Infinity) {
    if (passwordGrant?.account === parent.id && passwordGrant.version === parent.passwordVersion && passwordGrant.kind === kind) return;
    passwordGrant = { account: parent.id, version: parent.passwordVersion, kind, expires };
    passwordForm.reset();
    feedback(passwordError);
    passwordReason.textContent = kind === "enrollment"
      ? "Ingresaste con una clave temporal. Crea tu contraseña antes de abrir el portal."
      : "Verificaste tu correo de prueba. Ahora elige una contraseña nueva.";
    cancelReset.hidden = kind === "enrollment";
    selectPane(passwordPane, kind === "recovery");
  }

  function requestCode(email) {
    const parent = getParentByEmail(email);
    const value = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
    const code = parent ? String(value).padStart(6, "0") : "";
    challenge = {
      email, code, account: parent?.id, version: parent?.passwordVersion,
      attempts: 0, expires: Date.now() + verificationMinutes * 60000,
    };
    inbox.open = false;
    inboxMessage.textContent = parent ? `Correo simulado para ${email}. Vence en ${verificationMinutes} minutos.`
      : "Esta solicitud no tiene mensajes en la bandeja de prueba.";
    inboxCode.querySelector("strong").textContent = code;
    inboxCode.hidden = !code;
    verifyForm.reset();
    feedback(codeError);
    selectPane(verifyPane, true);
  }

  passwordToggle.addEventListener("click", () => revealPassword(loginForm.elements.clave.type === "password"));

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = loginForm.querySelector('button[type="submit"]');
    if (submit.disabled) return;
    const email = normalizeEmail(loginForm.elements.correo.value);
    const password = loginForm.elements.clave.value;
    const attempt = ++loginAttempt;
    submit.disabled = true;
    feedback(loginError);
    feedback(loginFeedback);
    try {
      if (email === ownerEmail && password === demoPassword) {
        reset();
        onLogin({ role: "owner" });
        return;
      }
      const parent = getParentByEmail(email);
      const valid = parent && getFamily(parent.id) && await passwordMatches(parent, password);
      if (currentPane !== signIn || loginAttempt !== attempt) return;
      if (!valid || getParentByEmail(email)?.passwordVersion !== parent.passwordVersion) {
        feedback(loginError, "Revisa tu correo y tu contraseña.");
        return;
      }
      reset();
      onLogin({ role: "parent", parent });
    } catch {
      if (loginAttempt === attempt) feedback(loginError, "No se pudo iniciar la sesión de prueba. Vuelve a intentar.");
    } finally {
      submit.disabled = false;
    }
  });

  for (const button of document.querySelectorAll("[data-demo-family]")) {
    button.addEventListener("click", () => {
      const sample = button.dataset.demoFamily;
      const parent = getFamily(sample)?.parent;
      if (sample !== "owner" && !parent) return;
      reset();
      onLogin(sample === "owner" ? { role: "owner" } : { role: "parent", parent });
    });
  }

  document.querySelector("#forgot-password").addEventListener("click", () => {
    loginAttempt += 1;
    requestForm.elements.correo.value = loginForm.elements.correo.value;
    loginForm.elements.clave.value = "";
    selectPane(requestPane, true);
  });

  requestForm.addEventListener("submit", (event) => {
    event.preventDefault();
    requestCode(normalizeEmail(requestForm.elements.correo.value));
  });

  verifyForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!challenge || Date.now() >= challenge.expires || challenge.attempts >= attemptsAllowed) {
      feedback(codeError, "El código ya no está disponible. Genera uno nuevo.");
      return;
    }
    const parent = getFamily(challenge.account)?.parent;
    const code = verifyForm.elements.codigo.value.trim();
    challenge.attempts += 1;
    if (!parent || parent.passwordVersion !== challenge.version || challenge.code !== code) {
      feedback(codeError, "El código no coincide. Revisa el correo de prueba.");
      return;
    }
    setPasswordPane(parent, "recovery", challenge.expires);
    challenge = undefined;
    inboxCode.querySelector("strong").textContent = "";
    inboxCode.hidden = true;
  });

  document.querySelector("#resend-code").addEventListener("click", () => {
    if (challenge) requestCode(challenge.email);
  });

  document.querySelector("#change-recovery-email").addEventListener("click", () => {
    challenge = undefined;
    inboxCode.querySelector("strong").textContent = "";
    inboxCode.hidden = true;
    selectPane(requestPane, true);
  });

  passwordForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = passwordForm.querySelector('button[type="submit"]');
    const grant = passwordGrant;
    if (!grant || submit.disabled) return;
    const parent = getFamily(grant.account)?.parent;
    const password = passwordForm.elements.clave.value;
    const confirmation = passwordForm.elements.confirmacion.value;
    if (!parent || Date.now() >= grant.expires || parent.passwordVersion !== grant.version) {
      feedback(passwordError, "La verificación venció. Vuelve a iniciar el proceso.");
      return;
    }
    if (password.length < 8 || !password.trim() || password !== confirmation) {
      feedback(passwordError, "Usa al menos 8 caracteres y comprueba que las dos contraseñas coincidan.");
      return;
    }
    submit.disabled = true;
    feedback(passwordError);
    try {
      if (await passwordMatches(parent, password)) {
        feedback(passwordError, "Elige una contraseña distinta a la anterior.");
        return;
      }
      const hash = await hashPassword(password);
      if (passwordGrant !== grant) return;
      const updated = Date.now() < grant.expires && replaceParentPassword(grant.account, grant.version, hash);
      if (!updated) {
        feedback(passwordError, "La verificación venció. Vuelve a iniciar el proceso.");
        return;
      }
      if (grant.kind === "enrollment") {
        reset();
        onEnrollment(updated);
      } else {
        reset("Tu contraseña fue actualizada. Ya puedes ingresar.", updated.email);
        selectPane(signIn, true);
      }
    } catch {
      feedback(passwordError, "No pudimos guardar la contraseña. Vuelve a intentar.");
    } finally {
      submit.disabled = false;
    }
  });

  for (const button of document.querySelectorAll("[data-back-to-login]")) {
    button.addEventListener("click", () => {
      reset();
      selectPane(signIn, true);
    });
  }

  document.querySelector("#sign-in-fields").disabled = false;

  return { reset, enroll: (parent) => setPasswordPane(parent, "enrollment") };
}
