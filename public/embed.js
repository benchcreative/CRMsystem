/*
 * Embeddable booking widget. Host sites add:
 *   <div id="crm-booking"></div>
 *   <script src="https://<crm>/embed.js" async></script>
 * (snippet shown on the CRM's Settings page).
 *
 * Plain JavaScript, no dependencies. Renders a two-step booking form into a
 * Shadow DOM on the host page and talks to this CRM's /api/public/* routes,
 * which only accept requests from domains listed under Settings.
 */
(function () {
  "use strict";

  // Must be read synchronously — currentScript is null inside callbacks.
  const script = document.currentScript;
  if (!script || !script.src) return;
  const API_BASE = new URL(script.src).origin;

  const CONTAINER_ID = "crm-booking";
  const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"];
  const UTM_STORAGE_KEY = "crm-booking-utm";
  const MAX_UTM_LENGTH = 200;
  // Mirrors BOOKING_WINDOW_DAYS / isClosedDay in lib/booking.ts. The server
  // re-checks every slot, so drift here only affects which days are shown.
  const BOOKING_WINDOW_DAYS = 30;
  const CLOSED_WEEKDAY = 0; // Sunday
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const FONT_PREFIX = "crm-embed-";
  const FONTS_URL =
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Outfit:wght@700&display=swap";
  const GENERIC_ERROR =
    "Something went wrong sending your details. Please try again.";
  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const ICON_ATTRS =
    'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

  // Mirrors jobTypeOrder/jobTypeLabels in lib/labels.ts. The API validates
  // jobType, so any drift surfaces as a validation error, not bad data.
  const JOB_TYPES = [
    {
      value: "kitchen",
      label: "Kitchen",
      icon: `<svg ${ICON_ATTRS}><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 9h16"/><path d="M8 6h.01M12 6h.01"/><rect x="7.5" y="12" width="9" height="6" rx="1"/></svg>`,
    },
    {
      value: "bathroom",
      label: "Bathroom",
      icon: `<svg ${ICON_ATTRS}><path d="M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z"/><path d="M6 12V5.5a2.5 2.5 0 0 1 5 0"/><path d="M7 19l-1 2M17 19l1 2"/></svg>`,
    },
    {
      value: "bedroom",
      label: "Bedroom",
      icon: `<svg ${ICON_ATTRS}><path d="M3 19V6"/><path d="M3 14h18v5"/><path d="M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="2"/></svg>`,
    },
  ];

  // Same messages as the server (lib/booking.ts) so client and server
  // validation read identically.
  const REQUIRED_MESSAGES = {
    firstName: "First name is required.",
    lastName: "Last name is required.",
    phone: "Phone is required.",
    email: "Email is required.",
    addressLine1: "Address is required.",
    postcode: "Postcode is required.",
  };
  const DETAIL_FIELDS = [
    "firstName",
    "lastName",
    "phone",
    "email",
    "addressLine1",
    "addressLine2",
    "postcode",
  ];

  const COLOR = {
    ink: "#1c1b18",
    muted: "#6f6a5d",
    surface: "#fffdf9",
    line: "#e7e0d1",
    inputBorder: "#d9d3c7",
    inputBorderHover: "#b3ab9b",
    accent: "#d98a2e",
    accentHover: "#c97c25",
    accentTint: "rgba(217, 138, 46, 0.08)",
    accentRing: "rgba(217, 138, 46, 0.28)",
    onAccent: "#10151c",
    error: "#c0524a",
  };

  const STYLES = `
    :host { all: initial; display: block; }
    *, *::before, *::after { box-sizing: border-box; }
    [hidden] { display: none !important; }

    .shell {
      container-type: inline-size;
      max-width: 560px;
      margin: 0 auto;
    }
    .widget {
      position: relative;
      font-family: '${FONT_PREFIX}Inter', system-ui, -apple-system, 'Segoe UI', sans-serif;
      font-size: 16px;
      line-height: 1.5;
      color: ${COLOR.ink};
      background: ${COLOR.surface};
      border: 1px solid ${COLOR.line};
      border-radius: 12px;
      padding: 24px 16px;
      -webkit-font-smoothing: antialiased;
    }
    @container (min-width: 480px) {
      .widget { padding: 32px; }
    }

    h2 {
      margin: 0;
      font-family: '${FONT_PREFIX}Outfit', system-ui, -apple-system, 'Segoe UI', sans-serif;
      font-weight: 700;
      font-size: 24px;
      line-height: 1.2;
      color: ${COLOR.ink};
    }
    h2:focus { outline: none; }
    p { margin: 0; }
    button { font: inherit; color: inherit; -webkit-tap-highlight-color: transparent; }

    /* Progress */
    .progress { margin-bottom: 24px; }
    .progress-label { font-size: 14px; font-weight: 500; color: ${COLOR.muted}; }
    .progress-track {
      margin-top: 8px;
      height: 4px;
      background: ${COLOR.line};
      border-radius: 999px;
      overflow: hidden;
    }
    .progress-fill {
      height: 100%;
      width: 50%;
      background: ${COLOR.accent};
      transition: width 180ms ease-out;
    }

    /* Steps */
    /* minmax(0, 1fr) everywhere: without it, grid tracks grow to fit the
       horizontally scrolling day row instead of letting it scroll. */
    .step { display: grid; grid-template-columns: minmax(0, 1fr); gap: 24px; }
    .step.enter-forward { animation: enter-forward 180ms ease-out; }
    .step.enter-back { animation: enter-back 180ms ease-out; }
    @keyframes enter-forward { from { opacity: 0; transform: translateX(12px); } }
    @keyframes enter-back { from { opacity: 0; transform: translateX(-12px); } }
    @media (prefers-reduced-motion: reduce) {
      .step.enter-forward, .step.enter-back { animation: none; }
      .progress-fill { transition: none; }
    }
    .intro { margin-top: 4px; color: ${COLOR.muted}; font-size: 15px; }

    .label, label {
      display: block;
      margin-bottom: 8px;
      font-size: 15px;
      font-weight: 500;
      color: ${COLOR.ink};
    }
    .optional { font-weight: 400; color: ${COLOR.muted}; }

    /* Shared tappable-choice base (cards, days, times, not-sure) */
    .choice {
      border: 1px solid ${COLOR.inputBorder};
      border-radius: 8px;
      background: #fff;
      color: ${COLOR.ink};
      cursor: pointer;
      transition: border-color 150ms, background-color 150ms;
    }
    .choice:hover { border-color: ${COLOR.inputBorderHover}; }
    .choice:focus-visible { outline: 3px solid ${COLOR.accentRing}; outline-offset: 0; }

    /* Job type cards */
    .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .card {
      min-height: 96px;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 15px;
      font-weight: 500;
    }
    .card svg { width: 28px; height: 28px; color: ${COLOR.muted}; transition: color 150ms; }
    .card[aria-pressed="true"] {
      border: 2px solid ${COLOR.accent};
      background: ${COLOR.accentTint};
    }
    .card[aria-pressed="true"] svg { color: ${COLOR.accent}; }

    /* Days */
    .days {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      scroll-snap-type: x proximity;
      padding-bottom: 8px;
      scrollbar-width: thin;
    }
    .day {
      flex: 0 0 64px;
      min-height: 72px;
      padding: 8px 4px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      scroll-snap-align: start;
      font-size: 13px;
      line-height: 1.3;
    }
    .day-num { font-size: 20px; font-weight: 600; }
    .day-month { color: ${COLOR.muted}; }
    .day[aria-pressed="true"],
    .time[aria-pressed="true"] {
      background: ${COLOR.accent};
      border-color: ${COLOR.accent};
      color: ${COLOR.onAccent};
    }
    .day[aria-pressed="true"] .day-month { color: ${COLOR.onAccent}; }

    /* Times */
    .times-block { margin-top: 16px; }
    .status { font-size: 15px; color: ${COLOR.muted}; }
    .status:empty { display: none; }
    .times { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .times:empty { display: none; }
    @container (min-width: 480px) {
      .times { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    }
    .time { min-height: 48px; font-size: 16px; font-weight: 500; }

    .not-sure {
      width: 100%;
      min-height: 48px;
      margin-top: 8px;
      padding: 12px 16px;
      text-align: left;
      font-size: 15px;
    }
    .not-sure[aria-pressed="true"] {
      border: 2px solid ${COLOR.accent};
      background: ${COLOR.accentTint};
    }

    /* Inputs */
    .fields { display: grid; grid-template-columns: minmax(0, 1fr); gap: 16px; }
    .pair { display: grid; gap: 16px; grid-template-columns: minmax(0, 1fr); }
    @container (min-width: 480px) {
      .pair { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    input, textarea {
      display: block;
      width: 100%;
      min-height: 48px;
      margin: 0;
      padding: 11px 14px;
      font: inherit;
      font-size: 16px; /* 16px+ stops iOS Safari zooming on focus */
      color: ${COLOR.ink};
      background: #fff;
      border: 1px solid ${COLOR.inputBorder};
      border-radius: 8px;
      transition: border-color 150ms;
    }
    textarea { min-height: 96px; resize: vertical; }
    input:hover, textarea:hover { border-color: ${COLOR.inputBorderHover}; }
    input:focus, textarea:focus {
      outline: 3px solid ${COLOR.accentRing};
      outline-offset: 0;
      border-color: ${COLOR.accent};
    }
    input[aria-invalid="true"] { border-color: ${COLOR.error}; }
    .error { margin-top: 4px; font-size: 14px; color: ${COLOR.error}; }
    .error:empty { display: none; }

    /* Buttons & links */
    .primary {
      width: 100%;
      min-height: 52px;
      padding: 0 20px;
      border: 0;
      border-radius: 8px;
      background: ${COLOR.accent};
      color: ${COLOR.onAccent};
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background-color 150ms, opacity 150ms;
    }
    .primary:hover:not(:disabled) { background: ${COLOR.accentHover}; }
    .primary:focus-visible { outline: 3px solid ${COLOR.accentRing}; outline-offset: 2px; }
    .primary:disabled { opacity: 0.45; cursor: not-allowed; }
    .link {
      padding: 0;
      border: 0;
      background: none;
      font-size: 15px;
      font-weight: 500;
      color: ${COLOR.ink};
      text-decoration: underline;
      text-underline-offset: 3px;
      cursor: pointer;
    }
    .link:focus-visible { outline: 3px solid ${COLOR.accentRing}; outline-offset: 2px; border-radius: 4px; }
    .back { justify-self: start; }

    .summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      border: 1px solid ${COLOR.line};
      border-radius: 8px;
      background: ${COLOR.accentTint};
      font-size: 15px;
    }
    .summary-text { font-weight: 500; }
    .form-error { font-size: 15px; color: ${COLOR.error}; }
    .form-error:empty { display: none; }

    .honeypot {
      position: absolute;
      left: -9999px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    }

    /* Success */
    .success { text-align: center; padding: 16px 0; }
    .success.enter-forward { animation: enter-forward 180ms ease-out; }
    .tick {
      width: 56px;
      height: 56px;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: ${COLOR.accentTint};
      color: ${COLOR.accent};
    }
    .tick svg { width: 28px; height: 28px; }
    .success-summary { margin-top: 12px; font-weight: 500; }
    .success-email { margin-top: 8px; font-size: 15px; color: ${COLOR.muted}; }
  `;

  // Static markup only — every dynamic value is set via textContent.
  function field(name, label, type, autocomplete, optional) {
    return `
      <div class="field">
        <label for="f-${name}">${label}${optional ? ' <span class="optional">(optional)</span>' : ""}</label>
        <input id="f-${name}" name="${name}" type="${type}" autocomplete="${autocomplete}"
          aria-describedby="e-${name}">
        <p class="error" id="e-${name}" data-error-for="${name}"></p>
      </div>`;
  }

  const TEMPLATE = `
    <div class="shell">
      <div class="widget">
        <div class="progress">
          <p class="progress-label">Step 1 of 2</p>
          <div class="progress-track" aria-hidden="true"><div class="progress-fill"></div></div>
        </div>

        <form novalidate>
          <section class="step" data-step="1">
            <div>
              <h2 tabindex="-1">Your project</h2>
              <p class="intro">Tell us what you're planning and, if you like, pick a time for a free home visit.</p>
            </div>

            <div>
              <p class="label" id="job-label">What are you interested in?</p>
              <div class="cards" role="group" aria-labelledby="job-label">
                ${JOB_TYPES.map(
                  (job) =>
                    `<button type="button" class="choice card" data-job="${job.value}" aria-pressed="false">${job.icon}<span>${job.label}</span></button>`
                ).join("")}
              </div>
              <p class="error" data-error-for="jobType"></p>
            </div>

            <div>
              <p class="label" id="day-label">When suits you? <span class="optional">(optional)</span></p>
              <div class="days" role="group" aria-labelledby="day-label"></div>
              <div class="times-block" hidden>
                <p class="label">Available times</p>
                <p class="status" aria-live="polite"></p>
                <div class="times" role="group" aria-label="Available times"></div>
              </div>
              <button type="button" class="choice not-sure" aria-pressed="false">Not sure yet? We'll call you to arrange a time</button>
              <p class="error" data-error-for="time"></p>
            </div>

            <div class="field">
              <label for="f-notes">Anything else we should know? <span class="optional">(optional)</span></label>
              <textarea id="f-notes" name="notes" rows="3"></textarea>
            </div>

            <button type="button" class="primary continue" disabled>Continue</button>
          </section>

          <section class="step" data-step="2" hidden>
            <button type="button" class="link back">&larr; Back</button>
            <h2 tabindex="-1">Your details</h2>

            <div class="summary">
              <span class="summary-text"></span>
              <button type="button" class="link edit">Edit</button>
            </div>

            <div class="fields">
              <div class="pair">
                ${field("firstName", "First name", "text", "given-name")}
                ${field("lastName", "Last name", "text", "family-name")}
              </div>
              <div class="pair">
                ${field("phone", "Phone", "tel", "tel")}
                ${field("email", "Email", "email", "email")}
              </div>
              ${field("addressLine1", "Address line 1", "text", "address-line1")}
              ${field("addressLine2", "Address line 2", "text", "address-line2", true)}
              ${field("postcode", "Postcode", "text", "postal-code")}
            </div>

            <div class="honeypot" aria-hidden="true">
              <label>Leave this field empty
                <input type="text" name="website" tabindex="-1" autocomplete="off">
              </label>
            </div>

            <p class="form-error" role="alert"></p>
            <button type="submit" class="primary submit">Send my details</button>
          </section>
        </form>

        <div class="success" hidden>
          <div class="tick"><svg ${ICON_ATTRS} stroke-width="2.5"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
          <h2 tabindex="-1">You're booked in</h2>
          <p class="success-summary"></p>
          <p class="success-email"></p>
        </div>
      </div>
    </div>`;

  // @font-face rules are ignored inside a shadow root, so fonts have to be
  // declared in the host document. Families are renamed with a prefix so
  // they can't collide with (or restyle) any fonts the host site uses.
  function loadFonts() {
    if (document.getElementById("crm-embed-fonts")) return;
    const style = document.createElement("style");
    style.id = "crm-embed-fonts";
    document.head.appendChild(style);
    fetch(FONTS_URL)
      .then((response) => (response.ok ? response.text() : ""))
      .then((css) => {
        style.textContent = css.replace(
          /font-family:\s*'([^']+)'/g,
          (_, name) => `font-family: '${FONT_PREFIX}${name}'`
        );
      })
      .catch(() => {
        // System fonts are the fallback — the widget still works.
      });
  }

  // UTMs come from the HOST page's URL. They're also kept in the host's
  // sessionStorage so they survive the visitor clicking around the host
  // site before reaching the page with the form.
  function readUtm() {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = {};
    for (const key of UTM_KEYS) {
      const value = (params.get(key) || "").trim().slice(0, MAX_UTM_LENGTH);
      if (value) fromUrl[key] = value;
    }
    try {
      if (Object.keys(fromUrl).length > 0) {
        sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(fromUrl));
        return fromUrl;
      }
      const stored = JSON.parse(sessionStorage.getItem(UTM_STORAGE_KEY) || "{}");
      const utm = {};
      for (const key of UTM_KEYS) {
        if (stored && typeof stored[key] === "string") utm[key] = stored[key];
      }
      return utm;
    } catch {
      return fromUrl;
    }
  }

  function isoDate(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${date.getFullYear()}-${month}-${day}`;
  }

  function bookableDays() {
    const days = [];
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    for (let i = 0; i <= BOOKING_WINDOW_DAYS; i++) {
      if (date.getDay() !== CLOSED_WEEKDAY) days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  }

  function shortDayLabel(date) {
    return `${WEEKDAYS[date.getDay()]} ${date.getDate()} ${MONTHS[date.getMonth()]}`;
  }

  function mount(container) {
    if (container.shadowRoot) return; // script included twice
    const root = container.attachShadow({ mode: "open" });
    root.innerHTML = `<style>${STYLES}</style>${TEMPLATE}`;
    loadFonts();
    const utm = readUtm();

    const $ = (selector) => root.querySelector(selector);
    const form = $("form");
    const step1 = $('[data-step="1"]');
    const step2 = $('[data-step="2"]');
    const success = $(".success");
    const progress = $(".progress");
    const progressLabel = $(".progress-label");
    const progressFill = $(".progress-fill");
    const cards = [...root.querySelectorAll(".card")];
    const daysRow = $(".days");
    const timesBlock = $(".times-block");
    const timesStatus = $(".status");
    const timesGrid = $(".times");
    const notSureButton = $(".not-sure");
    const continueButton = $(".continue");
    const submitButton = $(".submit");
    const summaryText = $(".summary-text");
    const formError = $(".form-error");

    const state = { jobType: "", date: null, time: "" };
    let latestSlotsRequest = 0;

    function errorEl(name) {
      return root.querySelector(`[data-error-for="${name}"]`);
    }

    function setFieldError(name, message) {
      const el = errorEl(name);
      if (el) el.textContent = message;
      const input = form.elements[name];
      if (input && input.setAttribute) {
        if (message) input.setAttribute("aria-invalid", "true");
        else input.removeAttribute("aria-invalid");
      }
    }

    function clearAllErrors() {
      formError.textContent = "";
      for (const el of root.querySelectorAll("[data-error-for]")) el.textContent = "";
      for (const input of root.querySelectorAll("[aria-invalid]")) input.removeAttribute("aria-invalid");
    }

    // ---- Step navigation -------------------------------------------------

    function replayAnimation(el, className) {
      el.classList.remove("enter-forward", "enter-back");
      void el.offsetWidth; // restart the CSS animation
      el.classList.add(className);
    }

    function showStep(step, direction) {
      step1.hidden = step !== 1;
      step2.hidden = step !== 2;
      const current = step === 1 ? step1 : step2;
      replayAnimation(current, direction === "back" ? "enter-back" : "enter-forward");
      progressLabel.textContent = `Step ${step} of 2`;
      progressFill.style.width = step === 1 ? "50%" : "100%";
      if (step === 2) {
        summaryText.textContent = summaryLine();
        submitButton.textContent = state.date && state.time ? "Book appointment" : "Send my details";
      }
      current.querySelector("h2").focus({ preventScroll: true });
      if (container.getBoundingClientRect().top < 0) {
        container.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    }

    function jobLabel() {
      const job = JOB_TYPES.find((j) => j.value === state.jobType);
      return job ? job.label : "";
    }

    function summaryLine() {
      const when =
        state.date && state.time
          ? `${shortDayLabel(state.date)}, ${state.time}`
          : "We'll call to arrange a time";
      return `${jobLabel()} · ${when}`;
    }

    // ---- Step 1: job type ------------------------------------------------

    for (const card of cards) {
      card.addEventListener("click", () => {
        state.jobType = card.dataset.job;
        for (const other of cards) other.setAttribute("aria-pressed", String(other === card));
        errorEl("jobType").textContent = "";
        continueButton.disabled = false;
      });
    }

    // ---- Step 1: day & time ----------------------------------------------

    for (const date of bookableDays()) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "choice day";
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", shortDayLabel(date));
      const weekday = document.createElement("span");
      weekday.textContent = WEEKDAYS[date.getDay()];
      const num = document.createElement("span");
      num.className = "day-num";
      num.textContent = String(date.getDate());
      const month = document.createElement("span");
      month.className = "day-month";
      month.textContent = MONTHS[date.getMonth()];
      button.append(weekday, num, month);
      button.addEventListener("click", () => selectDay(date, button));
      daysRow.append(button);
    }

    function setPressed(container, activeButton) {
      for (const button of container.children) {
        button.setAttribute("aria-pressed", String(button === activeButton));
      }
    }

    async function selectDay(date, button) {
      state.date = date;
      state.time = "";
      setPressed(daysRow, button);
      notSureButton.setAttribute("aria-pressed", "false");
      errorEl("time").textContent = "";
      timesGrid.replaceChildren();
      timesBlock.hidden = false;
      timesStatus.textContent = "Checking availability...";

      // Ignore responses for a day the visitor has since moved away from.
      const requestId = ++latestSlotsRequest;
      try {
        const response = await fetch(
          `${API_BASE}/api/public/availability?date=${encodeURIComponent(isoDate(date))}`
        );
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const { slots } = await response.json();
        if (requestId === latestSlotsRequest) renderTimes(slots);
      } catch {
        if (requestId === latestSlotsRequest) {
          timesStatus.textContent = "Couldn't load available times. Please try again.";
        }
      }
    }

    function renderTimes(slots) {
      timesGrid.replaceChildren();
      timesStatus.textContent =
        slots.length === 0 ? "No times left that day. Please pick another day." : "";
      for (const slot of slots) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "choice time";
        button.textContent = slot;
        button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", () => {
          state.time = slot;
          setPressed(timesGrid, button);
          errorEl("time").textContent = "";
        });
        timesGrid.append(button);
      }
    }

    notSureButton.addEventListener("click", () => {
      state.date = null;
      state.time = "";
      latestSlotsRequest++;
      setPressed(daysRow, null);
      timesGrid.replaceChildren();
      timesBlock.hidden = true;
      errorEl("time").textContent = "";
      notSureButton.setAttribute("aria-pressed", "true");
    });

    continueButton.addEventListener("click", () => {
      if (state.jobType) showStep(2, "forward");
    });
    $(".back").addEventListener("click", () => showStep(1, "back"));
    $(".edit").addEventListener("click", () => showStep(1, "back"));

    // ---- Step 2: validation ----------------------------------------------

    function validateField(name) {
      const value = (form.elements[name].value || "").trim();
      if (REQUIRED_MESSAGES[name] && !value) return REQUIRED_MESSAGES[name];
      if (name === "email" && value && !EMAIL_PATTERN.test(value)) {
        return "Enter a valid email address.";
      }
      return "";
    }

    // Errors appear on blur or submit, never while typing — typing only
    // clears an error that's already showing.
    for (const name of DETAIL_FIELDS) {
      const input = form.elements[name];
      input.addEventListener("blur", () => setFieldError(name, validateField(name)));
      input.addEventListener("input", () => {
        if (input.hasAttribute("aria-invalid")) setFieldError(name, "");
      });
    }

    function showServerErrors(errors) {
      let firstInvalid = null;
      let unmatched = false;
      for (const [name, message] of Object.entries(errors)) {
        if (!errorEl(name)) {
          unmatched = true;
          continue;
        }
        setFieldError(name, message);
        if (!firstInvalid && form.elements[name]) firstInvalid = form.elements[name];
      }
      if (unmatched) formError.textContent = GENERIC_ERROR;
      // Job type / slot problems live on step 1, so send the visitor back.
      if (errors.jobType || errors.time) {
        showStep(1, "back");
      } else if (firstInvalid) {
        firstInvalid.focus();
      }
    }

    // ---- Submit & success ------------------------------------------------

    function showSuccess(result, email) {
      $(".success-summary").textContent = result.dateLabel
        ? `${jobLabel()} · ${result.dateLabel} at ${result.time}`
        : "We'll be in touch to arrange a time.";
      $(".success-email").textContent = `A confirmation email is on its way to ${email}.`;
      form.hidden = true;
      progress.hidden = true;
      success.hidden = false;
      replayAnimation(success, "enter-forward");
      success.querySelector("h2").focus({ preventScroll: true });
      if (container.getBoundingClientRect().top < 0) {
        container.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    }

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (step2.hidden) return;
      clearAllErrors();

      const invalid = DETAIL_FIELDS.map((name) => [name, validateField(name)]).filter(
        ([, message]) => message
      );
      if (invalid.length > 0) {
        for (const [name, message] of invalid) setFieldError(name, message);
        form.elements[invalid[0][0]].focus();
        return;
      }

      const buttonLabel = submitButton.textContent;
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";

      const payload = Object.fromEntries(new FormData(form));
      payload.jobType = state.jobType;
      payload.date = state.date && state.time ? isoDate(state.date) : "";
      payload.time = state.date ? state.time : "";
      for (const key of UTM_KEYS) {
        if (typeof utm[key] === "string") payload[key] = utm[key];
      }

      try {
        const response = await fetch(`${API_BASE}/api/public/book`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (response.ok && data.success) {
          showSuccess(data.success, payload.email);
          return;
        }
        if (data.errors) showServerErrors(data.errors);
        else formError.textContent = data.error || GENERIC_ERROR;
      } catch {
        formError.textContent = GENERIC_ERROR;
      }

      submitButton.disabled = false;
      submitButton.textContent = buttonLabel;
    });
  }

  function init() {
    const container = document.getElementById(CONTAINER_ID);
    if (!container) {
      console.warn(`[crm-booking] No element with id "${CONTAINER_ID}" found on this page.`);
      return;
    }
    mount(container);
  }

  // The snippet uses `async`, so this may run before the container is parsed.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
