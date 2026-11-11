/**
 * Drunken Odu — Five Movements of Consciousness
 * Standalone client-side journal. Nothing is sent to a server.
 */
(() => {
  "use strict";

  const MOVEMENTS = {
    alafia: {
      odu: "Alafia", response: "Yes", name: "Opening Consciousness", count: "4 open",
      cue: "Sway → Step forward → Open palms → Return",
      meaning: "Uplift and acceptance: open with care, then return to center."
    },
    oyeku: {
      odu: "Oyeku", response: "No", name: "Vanishing Consciousness", count: "0 open",
      cue: "Withdraw → Lower → Guard → Be still",
      meaning: "Restraint and protection: make space while maintaining awareness."
    },
    etawa: {
      odu: "Etawa", response: "Probably", name: "Wandering Consciousness", count: "3 open",
      cue: "Test → Pause → Redirect → Recover",
      meaning: "Investigation and adjustment: do not rush a conditional path."
    },
    okana: {
      odu: "Okana", response: "Doubtful", name: "Uncertain Consciousness", count: "1 open",
      cue: "Feint → Reconsider → Change direction → Guard",
      meaning: "Caution and discernment: reconsider before committing."
    },
    ejife: {
      odu: "Ejife", response: "Definitely", name: "Balanced Consciousness", count: "2 open",
      cue: "Sway → Center → Exchange palms → Balance",
      meaning: "Certainty through equilibrium: two open and two closed."
    }
  };

  const STORAGE_KEY = "swamig-drunken-odu-v1";
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  // Local date, not UTC, so an evening session belongs to the correct calendar day.
  const now = new Date();
  const dayKey = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("-");
  const dayLabel = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(now);
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let animationsPaused = Boolean(reducedMotion);
  let canSave = true;

  function loadRecords() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
    } catch (err) {
      canSave = false;
      return {};
    }
  }

  let records = loadRecords();
  function ensureToday() {
    if (!records[dayKey] || typeof records[dayKey] !== "object") {
      records[dayKey] = { movement: "", morning: false, evening: false, reflection: "" };
    }
    return records[dayKey];
  }
  ensureToday();

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      canSave = true;
      $("#saveStatus").textContent = "Saved on this device. Export a CSV to keep a separate copy.";
    } catch (err) {
      canSave = false;
      $("#saveStatus").textContent = "Browser storage is unavailable. Export the journal to keep this entry.";
    }
  }

  function srcFor(id) {
    const suffix = {
      alafia: "alafia_yes_consciousness",
      oyeku: "oyeku_no_consciousness",
      etawa: "etawa_probably_consciousness",
      okana: "okana_doubtful_consciousness",
      ejife: "ejife_definitely_consciousness"
    }[id];
    return animationsPaused ? `assets/stills/${suffix}.jpg` : `assets/animations/${suffix}.gif`;
  }

  function setMotion(paused) {
    animationsPaused = Boolean(paused);
    $$('img[data-animated]').forEach(img => {
      img.src = img.dataset[animationsPaused ? "still" : "animated"];
    });
    const button = $("#motionToggle");
    button.textContent = animationsPaused ? "Play animations" : "Pause animations";
    button.setAttribute("aria-pressed", String(animationsPaused));
    renderSelected();
  }

  function renderStats() {
    const saved = Object.values(records).filter(entry => entry && typeof entry === "object");
    $("#daysCount").textContent = String(saved.filter(entry => entry.movement || entry.morning || entry.evening).length);
    $("#sessionsCount").textContent = String(saved.reduce((sum, entry) => sum + (entry.morning ? 1 : 0) + (entry.evening ? 1 : 0), 0));
  }

  function renderSelected() {
    const current = ensureToday();
    const movement = MOVEMENTS[current.movement];
    $$(".cast-option").forEach(button => {
      button.setAttribute("aria-pressed", String(button.dataset.response === current.movement));
    });
    $$("[data-card]").forEach(card => {
      card.classList.toggle("selected-card", card.dataset.card === current.movement);
    });
    $("#unselectedMessage").hidden = Boolean(movement);
    $("#selectedMovement").hidden = !movement;
    if (movement) {
      $("#selectedMovementTitle").textContent = `${movement.odu.toUpperCase()} — ${movement.name}`;
      $("#selectedMovementCue").textContent = movement.cue;
      $("#selectedMovementMeaning").textContent = movement.meaning;
      const image = $("#selectedMovementImage");
      image.src = srcFor(current.movement);
      image.alt = `${movement.odu}: ${movement.name} movement demonstration`;
      image.hidden = false;
      $("#journalResponse").textContent = `${movement.odu.toUpperCase()} · ${movement.response.toUpperCase()} · ${movement.name}`;
    } else {
      $("#selectedMovementImage").hidden = true;
      $("#journalResponse").textContent = "Cast not yet recorded";
    }
    $("#morningDone").checked = Boolean(current.morning);
    $("#eveningDone").checked = Boolean(current.evening);
    $("#reflection").value = String(current.reflection || "");
    renderStats();
  }

  function chooseMovement(id, scrollToOracle = false) {
    if (!MOVEMENTS[id]) return;
    ensureToday().movement = id;
    save();
    renderSelected();
    if (scrollToOracle) $("#oracle").scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  }

  $$("[data-response]").forEach(button => button.addEventListener("click", () => chooseMovement(button.dataset.response)));
  $$("[data-choose]").forEach(button => button.addEventListener("click", () => chooseMovement(button.dataset.choose, true)));
  $("#motionToggle").addEventListener("click", () => setMotion(!animationsPaused));
  $("#morningDone").addEventListener("change", e => { ensureToday().morning = e.target.checked; save(); renderStats(); });
  $("#eveningDone").addEventListener("change", e => { ensureToday().evening = e.target.checked; save(); renderStats(); });
  $("#reflection").addEventListener("input", e => { ensureToday().reflection = e.target.value.slice(0, 2500); save(); });
  $("#journalForm").addEventListener("submit", e => e.preventDefault());

  function csvCell(value) {
    const text = String(value == null ? "" : value);
    return '"' + text.replace(/"/g, '""') + '"';
  }
  $("#exportButton").addEventListener("click", () => {
    const rows = [["Date", "Oracle", "Response", "Movement", "Morning completed", "Evening completed", "Reflection"]];
    Object.keys(records).sort().forEach(date => {
      const entry = records[date];
      if (!entry || !(entry.movement || entry.morning || entry.evening || entry.reflection)) return;
      const movement = MOVEMENTS[entry.movement];
      rows.push([date, movement?.odu ?? "", movement?.response ?? "", movement?.name ?? "", entry.morning ? "Yes" : "No", entry.evening ? "Yes" : "No", entry.reflection || ""]);
    });
    const csv = "\uFEFF" + rows.map(row => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = `drunken-odu-journal-${dayKey}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  });

  $("#clearToday").addEventListener("click", () => {
    if (!window.confirm("Clear today's selected cast, session checkmarks, and reflection from this device?")) return;
    records[dayKey] = { movement: "", morning: false, evening: false, reflection: "" };
    save();
    renderSelected();
  });

  $("#todayDate").textContent = dayLabel;
  $("#journalDate").textContent = dayLabel;
  $("#copyrightYear").textContent = String(now.getFullYear());
  setMotion(animationsPaused);
  renderSelected();
  if (!canSave) $("#saveStatus").textContent = "Browser storage is unavailable. Export your journal to keep a copy.";
})();
