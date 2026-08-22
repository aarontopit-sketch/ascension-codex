// ===== Persisted state, backed by Netlify Blobs via /api/state =====
function defaultState() {
  return {
    activeTab: "dashboard",
    logs: {
      "strict-pullup": { max: 0, tier: null },
      "pike-pushup": { max: 0, tier: null }
    },
    todayLogged: { "strict-pullup": false, "pike-pushup": false },
    skillLogs: {},
    rawStatLogs: {},
    skillLogHistory: {},
    badgeHistory: {},
    completedDays: {},
    programStartDate: null,
    blockCompletionFired: false,
    earnedRecord: [],
    sessionHistory: []
  };
}

let state = defaultState();
let stateLoaded = false;

async function loadState() {
  try {
    const res = await fetch("/api/state");
    const saved = await res.json();
    if (saved) {
      // merge onto defaults so any new fields added since a save still exist
      state = Object.assign(defaultState(), saved);
    }
  } catch (e) {
    console.error("Failed to load saved state, starting fresh:", e);
  }
  stateLoaded = true;
}

let saveInFlight = null;
async function saveState() {
  // Coalesce rapid successive saves into the latest one rather than
  // firing an overlapping request per mutation.
  const payload = JSON.stringify(state);
  saveInFlight = fetch("/api/state", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload
  }).catch(e => console.error("Failed to save state:", e));
  return saveInFlight;
}

// ===== Input-field inscription phrases — genuine Elder Futhark
// transliteration (letter-by-letter phonetic, not authentic Old Norse
// grammar), purely decorative per the "felt not read" rule =====
const RUNIC_PHRASES = {
  newEntry: "ᛚᛖᛏ ᛁᛏ ᛒᛖ ᚱᛖᚲᛟᚱᛞᛖᛞ",       // "Let it be recorded"
  editEntry: "ᛊᛟ ᛁᛏ ᚹᚨᛊ ᛞᛟᚾᛖ",           // "So it was done"
  amrapEntry: "ᚦᛖ ᛏᚨᛚᛚᛁ ᛊᛏᚨᚾᛞᛊ ᚹᛁᛏᚾᛖᛊᛊ" // "The tally stands witness"
};

// (formatSecondsValue now lives in tree-logic.js, shared across the app)

// ===== Inscription text builder — constrained format + fit fallback =====
function inscriptionText(skillId, value, unit) {
  const tier = nearestTierAtOrBelow(value);
  const tierWord = tier ? ASCENSION_TITLES[tier] : "";
  const valDisplay = unit === "seconds" ? formatSecondsValue(value) : `${value}`;
  const base = `${valDisplay} ${unit === "seconds" ? "sec" : unit} · ${tierWord}`.toUpperCase();
  // fit-handling: if short, repeat with × divider (step 3). Real
  // letter-spacing adjustment (step 2) happens in CSS, not here.
  if (base.length < 18) return `${base}  ×  ${base}`;
  return base;
}
function nearestTierAtOrBelow(value) {
  const tiers = Object.keys(ASCENSION_TITLES).map(Number).sort((a,b) => a-b);
  let found = null;
  for (const t of tiers) if (value >= t) found = t;
  return found;
}

// ===== Card renderer (accent + heavy border + true perimeter inscription) =====
function renderCard({ zoneClass, zoneColorVar, inscription, bodyHtml }) {
  return `
    <div class="card ${zoneClass}">
      <div class="card-body">${bodyHtml}</div>
      <div class="inscription-loop-target" data-inscription-text="${inscription}" data-inscription-color="${zoneColorVar}"></div>
    </div>`;
}

// ===== DASHBOARD =====
function renderDashboard() {
  const pullup = SKILLS_BY_ID["strict-pullup"];
  const pikepushup = SKILLS_BY_ID["pike-pushup"];
  const pullupLog = state.logs["strict-pullup"];
  const pikeLog = state.logs["pike-pushup"];

  const todaySessions = (state.sessionHistory || []).filter(s => dayKey(new Date(s.date)) === dayKey(new Date()));
  const todayPullTotal = todaySessions.reduce((sum, s) => sum + (s.pullTotal || 0), 0);
  const todayPikeTotal = todaySessions.reduce((sum, s) => sum + (s.pikeTotal || 0), 0);

  const todayLogCard = renderCard({
    zoneClass: "card--log",
    zoneColorVar: "--zone-log",
    inscription: "LET IT BE RECORDED",
    bodyHtml: `
      <div class="log-row"><span>Pull-ups</span><span class="stat-num">${todaySessions.length ? todayPullTotal : "not logged"}</span></div>
      <div class="log-row"><span>Pike Push-ups</span><span class="stat-num">${todaySessions.length ? todayPikeTotal : "not logged"}</span></div>
      <button class="log-cta" onclick="switchTab('log')">Log today's session →</button>
    `
  });

    const weekDates = getWeekStripDates();
  const dayLabels = ["M","T","W","T","F","S","S"];
  const todayKey = dayKey(new Date());
  const weekStrip = `
    <div class="week-strip">
      ${weekDates.map((d, i) => {
        const dayNum = d.getDate();
        const thisDayKey = dayKey(d);
        const isToday = thisDayKey === todayKey;
        const isLogged = !!(state.completedDays && state.completedDays[thisDayKey]);
        const isFriday = d.getDay() === 5;
        const isAmrap = isFriday && isDeloadWeekForDate(d);
        let cls = "day";
        if (isLogged) cls += " logged";
        if (isToday) cls += " today";
        if (isAmrap) cls += " amrap";
        return `<div class="${cls}"><div class="d-label">${dayLabels[i]}</div><div class="d-num">${dayNum}</div></div>`;
      }).join("")}
    </div>`;


  const currentMaxCard = renderCard({
    zoneClass: "card--title",
    zoneColorVar: "--zone-title",
    inscription: pullupLog.max > 0 ? inscriptionText("strict-pullup", pullupLog.max, "reps") : "NOT YET TRAINED",
    bodyHtml: `
      <div class="max-grid">
        <div class="max-card">
          <div class="max-num">${pullupLog.max}</div>
          <div class="max-label">PULL-UPS</div>
          <div class="tier-word">${currentTier("strict-pullup") ? ASCENSION_TITLES[currentTier("strict-pullup")] : "—"}</div>
        </div>
        <div class="max-card">
          <div class="max-num">${pikeLog.max}</div>
          <div class="max-label">PIKE PUSH-UPS</div>
          <div class="tier-word">${currentTier("pike-pushup") ? ASCENSION_TITLES[currentTier("pike-pushup")] : "—"}</div>
        </div>
      </div>`
  });

  const earned = state.earnedRecord || [];
  const achieveEntries = earned.filter(a => a.zone === "achieve" || a.zone === "title").slice(-5).reverse();
  const badgeEntries = earned.filter(a => a.zone === "badge").slice(-5).reverse();

    const achievementsCard = renderCard({
    zoneClass: "card--achieve",
    zoneColorVar: "--zone-achieve",
    inscription: achieveEntries.length ? [...new Set(achieveEntries.map(a => a.runeConcept.toUpperCase()))].join(" · ") : "NOTHING EARNED YET",
    bodyHtml: achieveEntries.length
      ? achieveEntries.map(a => `<div class="earned-row"><b>${a.title}</b><br><span class="text-muted">${a.description}</span></div>`).join("")
      : `<div class="earned-row" style="color:var(--text-muted);">Nothing earned yet — this fills in as you log real progress.</div>`
  });

  const badgesCard = renderCard({
    zoneClass: "card--badge",
    zoneColorVar: "--zone-badge",
    inscription: badgeEntries.length ? [...new Set(badgeEntries.map(a => a.runeConcept.toUpperCase()))].join(" · ") : "NOTHING EARNED YET",
    bodyHtml: badgeEntries.length
      ? badgeEntries.map(a => `<div class="earned-row"><b>${a.title}</b><br><span class="text-muted">${a.description}</span></div>`).join("")
      : `<div class="earned-row" style="color:var(--text-muted);">No badges yet — these come from form-checked holds at badge tier.</div>`
  });


  const todayScheduled = todaysScheduledSession();
  return `
    <div class="section">
      <div class="section-header"><div class="section-title">${todayScheduled ? `Today — Session ${todayScheduled.key} · ${todayScheduled.label}` : "Today — Rest Day"}</div></div>
      ${todayLogCard}
    </div>
    <div class="section">
      <div class="section-header"><div class="section-title">This Week</div><button class="section-link">View full history</button></div>
      ${weekStrip}
    </div>
    <div class="section">
      <div class="section-header"><div class="section-title earned">Current Max</div></div>
      ${currentMaxCard}
    </div>
    <div class="section">
      <div class="section-header"><div class="section-title earned">Achievements</div></div>
      ${achievementsCard}
    </div>
    <div class="section">
      <div class="section-header"><div class="section-title earned">Badges</div></div>
      ${badgesCard}
    </div>
  `;
}

// ===== Log tab UI state (ephemeral — resets on page load, not data) =====
let logUIState = { fatigue: null, showBreakdown: false };

function setFatigue(level) {
  logUIState.fatigue = logUIState.fatigue === level ? null : level;
  switchTab("log");
}

function toggleRoundBreakdown() {
  logUIState.showBreakdown = !logUIState.showBreakdown;
  switchTab("log");
}

// Applies the fatigue-regulation rules to a scheduled session + raw target.
// High fatigue: cut ~40% and cap at RPE-adjacent volume; if today was
// Session C, swap to a light A-style session instead of skipping outright.
function applyFatigueAdjustment(scheduled, targetPull, targetPike) {
  if (logUIState.fatigue !== "High" || !scheduled) {
    return { effectiveKey: scheduled ? scheduled.key : null, effectiveLabel: scheduled ? scheduled.label : null, targetPull, targetPike, swapped: false, regulated: false };
  }
  if (scheduled.key === "C") {
    // swap to a light A-style session rather than skip
    return { effectiveKey: "A", effectiveLabel: "Volume (swapped, light)", targetPull: Math.floor(targetPull * 0.6), targetPike: Math.floor(targetPike * 0.6), swapped: true, regulated: true };
  }
  return { effectiveKey: scheduled.key, effectiveLabel: scheduled.label + " (Regulation)", targetPull: Math.floor(targetPull * 0.6), targetPike: Math.floor(targetPike * 0.6), swapped: false, regulated: true };
}
function isDeloadWeekForDate(date) {
  if (!state.programStartDate) return false;
  const daysIn = Math.floor((date - new Date(state.programStartDate)) / 86400000);
  const weekNum = Math.min(Math.floor(Math.max(daysIn, 0) / 7) + 1, 4);
  return weekNum === 4;
}

function getWeekStripDates() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun,1=Mon,...6=Sat
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function scheduledSessionForDate(date) {
  const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const dayName = dayNames[date.getDay()];
  let weekNum = 1;
  if (state.programStartDate) {
    const daysIn = Math.floor((date - new Date(state.programStartDate)) / 86400000);
    weekNum = Math.min(Math.floor(Math.max(daysIn, 0) / 7) + 1, 4);
  }
  const isDeloadWeek = weekNum === 4;
  const schedule = isDeloadWeek ? ACTIVE_PROGRAM.deloadSchedule : ACTIVE_PROGRAM.weeklySchedule;
  const match = schedule.find(s => s.day === dayName);
  if (!match) return null; // rest day
  return { key: match.session, ...ACTIVE_PROGRAM.sessionTypes[match.session] };
}

function todaysScheduledSession() {
  return scheduledSessionForDate(new Date());
}

function renderRoundBreakdownFields(effectiveKey) {
  if (effectiveKey === "C") {
    return `
      <div class="breakdown-block">
        <div class="breakdown-label">Pull-up sets</div>
        ${[0,1,2,3].map(i => `<input class="breakdown-input" type="number" inputmode="numeric" placeholder="set ${i+1}" data-bd="pull" oninput="sumBreakdown()">`).join("")}
      </div>
      <div class="breakdown-block">
        <div class="breakdown-label">Pike push-up sets</div>
        ${[0,1,2,3].map(i => `<input class="breakdown-input" type="number" inputmode="numeric" placeholder="set ${i+1}" data-bd="pike" oninput="sumBreakdown()">`).join("")}
      </div>
    `;
  }
  // Session A/B: 5 paired rounds
  return `
    <div class="breakdown-block">
      <div class="breakdown-label">Rounds (pull-ups / pike push-ups)</div>
      ${[0,1,2,3,4].map(i => `
        <div class="breakdown-round-row">
          <span class="breakdown-round-num">R${i+1}</span>
          <input class="breakdown-input" type="number" inputmode="numeric" placeholder="0" data-bd="pull" oninput="sumBreakdown()">
          <input class="breakdown-input" type="number" inputmode="numeric" placeholder="0" data-bd="pike" oninput="sumBreakdown()">
        </div>
      `).join("")}
    </div>
  `;
}

function sumBreakdown() {
  const pullVals = Array.from(document.querySelectorAll('[data-bd="pull"]')).map(el => parseInt(el.value, 10) || 0);
  const pikeVals = Array.from(document.querySelectorAll('[data-bd="pike"]')).map(el => parseInt(el.value, 10) || 0);
  document.getElementById("input-pullup").value = pullVals.reduce((a,b) => a+b, 0);
  document.getElementById("input-pikepushup").value = pikeVals.reduce((a,b) => a+b, 0);
}

function renderLog() {
  const scheduled = todaysScheduledSession();
  const amrapPull = getSkillCurrentValue("strict-pullup");
  const amrapPike = getSkillCurrentValue("pike-pushup");
  const rawTargetPull = scheduled ? progressionTarget(scheduled.key, amrapPull) : null;
  const rawTargetPike = scheduled ? progressionTarget(scheduled.key, amrapPike) : null;
  const adj = scheduled ? applyFatigueAdjustment(scheduled, rawTargetPull, rawTargetPike) : null;

  return `
    <div class="section">
      <div class="section-header">
        <div class="section-title">${adj ? `Session ${adj.effectiveKey} — ${adj.effectiveLabel}` : "Rest Day"}</div>
      </div>

      <div class="fatigue-row">
        <span class="fatigue-label">Fatigue:</span>
        ${["Low","Medium","High"].map(level => `
          <button class="fatigue-btn ${logUIState.fatigue === level ? 'active' : ''}" onclick="setFatigue('${level}')">${level}</button>
        `).join("")}
      </div>
      ${adj && adj.swapped ? `<p class="fatigue-note">High fatigue on a Session C day — swapped to a light Volume session instead of skipping.</p>` : ""}
      ${adj && adj.regulated && !adj.swapped ? `<p class="fatigue-note">Regulation Day — volume cut ~40%, stay ≤RPE 6.</p>` : ""}

      ${scheduled ? `
        <p style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:10px;">
          Target — Pull-ups: ${adj.targetPull ?? "—"} · Pike push-ups: ${adj.targetPike ?? "—"}
          (${ACTIVE_PROGRAM.sessionTypes[adj.effectiveKey].targetFormula})
        </p>
      ` : `
        <p style="font-size:0.78rem;color:var(--text-secondary);margin-bottom:10px;">
          Nothing scheduled today — logging still works if you want to.
        </p>
      `}

      <button class="breakdown-toggle" onclick="toggleRoundBreakdown()">
        ${logUIState.showBreakdown ? "− Hide round breakdown" : "+ Log each round"}
      </button>
      ${logUIState.showBreakdown ? renderRoundBreakdownFields(adj ? adj.effectiveKey : "A") : ""}

      <div class="input-field-wrap">
        <div class="input-field-body">
          <div class="input-field-label">Pull-ups (total)</div>
          <input class="input-field" type="number" inputmode="numeric" id="input-pullup" placeholder="0" ${logUIState.showBreakdown ? "readonly" : ""}>
        </div>
        <div class="inscription-loop-target" data-inscription-text="${RUNIC_PHRASES.newEntry}" data-inscription-color="--zone-log" data-inscription-draw-border="true"></div>
      </div>

      <div class="input-field-wrap">
        <div class="input-field-body">
          <div class="input-field-label">Pike push-ups (total)</div>
          <input class="input-field" type="number" inputmode="numeric" id="input-pikepushup" placeholder="0" ${logUIState.showBreakdown ? "readonly" : ""}>
        </div>
        <div class="inscription-loop-target" data-inscription-text="${RUNIC_PHRASES.newEntry}" data-inscription-color="--zone-log" data-inscription-draw-border="true"></div>
      </div>


      <button class="log-cta" onclick="saveLog()">Save session</button>
    </div>

    <div class="section">
      <div class="section-header"><div class="section-title">General Logging</div></div>
      <p style="font-size:0.8rem;color:var(--text-muted);line-height:1.4; margin-bottom:10px;">
        Browse the full tree to log any skill, or check what's still locked.
      </p>
      <button class="log-cta" onclick="switchTab('tree')">Browse skill tree →</button>
    </div>

    <div class="section">
      <div class="section-header"><div class="section-title">History</div></div>
      <p style="font-size:0.8rem;color:var(--text-muted);line-height:1.4; margin-bottom:10px;">
        Forgot to log a session, or need to fix a number? View, edit, or backfill past sessions here.
      </p>
      <button class="log-cta" onclick="openHistory()">View session history →</button>
    </div>
  `;
}

// Determines the real single-set/attempt value from a session, which is
// what tier-crossing and Ascension titles should actually track — NOT
// the summed session total. A 5-round session totaling 45 reps (9 per
// round) never actually produced a 45-rep single set, and shouldn't be
// treated as one.
//
// - If round-breakdown data exists: the highest individual round/set
//   value is the real attempt value.
// - If no breakdown, but the session is Session C ("build to 1 hard top
//   set") — the total IS effectively a single attempt by the exercise's
//   own structure, no summing involved, so it's valid to use directly.
// - Otherwise (a bare total on a multi-round session with no breakdown):
//   there's no way to know what any single round actually was — returns
//   null, meaning this entry does NOT drive tier/Ascension tracking, even
//   though the total itself is still saved for session-volume record.
function getAttemptValue(scheduledKey, total, breakdown) {
  if (breakdown && breakdown.length && breakdown.some(v => v > 0)) {
    return Math.max(...breakdown);
  }
  if (scheduledKey === "C") return total;
  return null;
}

function generateSessionId() {
  return "s" + Date.now() + Math.random().toString(36).slice(2, 8);
}

function saveLog() {
  const p = parseInt(document.getElementById("input-pullup").value, 10);
  const pp = parseInt(document.getElementById("input-pikepushup").value, 10);
  let allAchievements = [];
  let loggedSomething = false;
  const now = new Date();
  const sessionId = generateSessionId();

  const pullBreakdown = logUIState.showBreakdown ? Array.from(document.querySelectorAll('[data-bd="pull"]')).map(el => parseInt(el.value, 10) || 0) : null;
  const pikeBreakdown = logUIState.showBreakdown ? Array.from(document.querySelectorAll('[data-bd="pike"]')).map(el => parseInt(el.value, 10) || 0) : null;
  const scheduled = todaysScheduledSession();
  const scheduledKey = scheduled ? scheduled.key : null;

  state.sessionHistory = state.sessionHistory || [];
  state.sessionHistory.push({
    id: sessionId,
    date: now.toISOString(),
    scheduledKey,
    fatigue: logUIState.fatigue,
    pullTotal: isNaN(p) ? 0 : p,
    pikeTotal: isNaN(pp) ? 0 : pp,
    pullBreakdown, pikeBreakdown
  });

  // Tier-crossing/Ascension tracking uses the real single-set attempt
  // value (highest round from breakdown, or the total itself only when
  // the session structure genuinely is a single attempt — Session C).
  // A bare Session A/B total with no breakdown does NOT drive tier
  // tracking, since summed volume across rounds isn't a single-set number.
  const pullAttempt = !isNaN(p) ? getAttemptValue(scheduledKey, p, pullBreakdown) : null;
  const pikeAttempt = !isNaN(pp) ? getAttemptValue(scheduledKey, pp, pikeBreakdown) : null;

  if (!isNaN(p)) {
    if (pullAttempt !== null) {
      const prev = state.skillLogs["strict-pullup"] || 0;
      recordLogHistory("strict-pullup", pullAttempt, now.getTime(), sessionId);
      const newMax = recomputeSkillMax("strict-pullup");
      allAchievements = allAchievements.concat(evaluateLogEntry("strict-pullup", newMax, prev, now.getTime()));
    }
    state.todayLogged["strict-pullup"] = true;
    loggedSomething = true;
  }
  if (!isNaN(pp)) {
    if (pikeAttempt !== null) {
      const prev = state.skillLogs["pike-pushup"] || 0;
      recordLogHistory("pike-pushup", pikeAttempt, now.getTime(), sessionId);
      const newMax = recomputeSkillMax("pike-pushup");
      allAchievements = allAchievements.concat(evaluateLogEntry("pike-pushup", newMax, prev, now.getTime()));
    }
    state.todayLogged["pike-pushup"] = true;
    loggedSomething = true;
  }

  if (loggedSomething) {
    markDayCompleted(now);
    const blockCompletion = checkBlockCompletion();
    if (blockCompletion) allAchievements.push(blockCompletion);
  }

  logUIState = { fatigue: null, showBreakdown: false };
  switchTab("dashboard");
  celebrateAchievements(allAchievements);
  saveState();
}

// =====================================================================
// Session History — view, edit, delete, and backfill past sessions
// =====================================================================
let historyUIState = { editingId: null, isNew: false, deleteConfirmId: null, showBreakdown: false, draft: {} };

function openHistory() {
  document.getElementById("eyebrow").textContent = "History";
  document.getElementById("view").innerHTML = renderHistoryView();
}

function renderHistoryView() {
  const sessions = (state.sessionHistory || []).slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  return `
    <div class="section">
      <div class="section-header">
        <div class="section-title">Session History</div>
        <button class="section-link" onclick="switchTab('log')">← Back to Log</button>
      </div>
      <button class="log-cta" onclick="openSessionEditor(null)">+ Log a past session</button>
    </div>
    <div class="section">
      ${sessions.length === 0 ? `<p style="font-size:0.82rem;color:var(--text-muted);">No sessions logged yet.</p>` : ""}
      ${sessions.map(s => `
        <div class="skill-row" onclick="openSessionEditor('${s.id}')">
          <div class="skill-name">
            ${formatHistoryDate(s.date)} — ${s.scheduledKey ? `Session ${s.scheduledKey}` : "Unscheduled"}${s.fatigue ? ` · ${s.fatigue} fatigue` : ""}
          </div>
          </div>
          <div class="skill-tier muted">${s.pullTotal} pull / ${s.pikeTotal} pike</div>
        </div>
      `).join("")}
    </div>
    ${historyUIState.editingId !== null || historyUIState.isNew ? renderSessionEditorPopup() : ""}
  `;
}

function formatHistoryDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function openSessionEditor(sessionId) {
  historyUIState.editingId = sessionId;
  historyUIState.isNew = sessionId === null;
  historyUIState.deleteConfirmId = null;
  const session = sessionId ? (state.sessionHistory || []).find(s => s.id === sessionId) : null;
  historyUIState.showBreakdown = !!(session && (session.pullBreakdown || session.pikeBreakdown));
  historyUIState.draft = session
    ? { date: session.date.slice(0,10), fatigue: session.fatigue, pullTotal: session.pullTotal, pikeTotal: session.pikeTotal,
        pullBreakdown: session.pullBreakdown || [], pikeBreakdown: session.pikeBreakdown || [] }
    : { date: new Date().toISOString().slice(0,10), fatigue: null, pullTotal: 0, pikeTotal: 0, pullBreakdown: [], pikeBreakdown: [] };
  openHistory();
}

function closeSessionEditor() {
  historyUIState = { editingId: null, isNew: false, deleteConfirmId: null, showBreakdown: false, draft: {} };
  openHistory();
}

// Captures whatever's currently in the form fields before a re-render
// (triggered by date change or breakdown toggle) would otherwise wipe them.
function captureEditorDraft() {
  const dateEl = document.getElementById("edit-session-date");
  const pullEl = document.getElementById("edit-session-pull");
  const pikeEl = document.getElementById("edit-session-pike");
  if (dateEl) historyUIState.draft.date = dateEl.value;
  if (pullEl && !historyUIState.showBreakdown) historyUIState.draft.pullTotal = parseInt(pullEl.value, 10) || 0;
  if (pikeEl && !historyUIState.showBreakdown) historyUIState.draft.pikeTotal = parseInt(pikeEl.value, 10) || 0;
  if (historyUIState.showBreakdown) {
    historyUIState.draft.pullBreakdown = Array.from(document.querySelectorAll('[data-ebd="pull"]')).map(el => parseInt(el.value, 10) || 0);
    historyUIState.draft.pikeBreakdown = Array.from(document.querySelectorAll('[data-ebd="pike"]')).map(el => parseInt(el.value, 10) || 0);
  }
}

function onEditorDateChange() {
  captureEditorDraft();
  openHistory();
}

function toggleEditorBreakdown() {
  captureEditorDraft();
  historyUIState.showBreakdown = !historyUIState.showBreakdown;
  openHistory();
}

function setEditorFatigue(level, btnEl) {
  captureEditorDraft();
  historyUIState.draft.fatigue = historyUIState.draft.fatigue === level ? null : level;
  openHistory();
}

function renderSessionEditorPopup() {
  if (!historyUIState.isNew && !historyUIState.editingId) return "";
  const d = historyUIState.draft;
  const scheduledForDate = scheduledSessionForDate(new Date(d.date + "T12:00:00"));
  const breakdownKey = scheduledForDate ? scheduledForDate.key : "A";

  return `
    <div class="popup-overlay" onclick="if(event.target===this) closeSessionEditor()">
      <div class="popup-card">
        <div class="popup-header">
          <div class="popup-title">${historyUIState.isNew ? "Log a Past Session" : "Edit Session"}</div>
          <button class="popup-close" onclick="closeSessionEditor()">×</button>
        </div>
        <div class="popup-body">
          <div class="input-field-label" style="margin-bottom:2px;">Date</div>
          <input type="date" id="edit-session-date" value="${d.date}" class="breakdown-input" style="margin-bottom:4px;"
                 max="${new Date().toISOString().slice(0,10)}" onchange="onEditorDateChange()">
          <p style="font-size:0.72rem;color:var(--text-muted);margin-bottom:10px;">
            ${scheduledForDate ? `Scheduled: Session ${scheduledForDate.key} — ${scheduledForDate.label}` : "Rest day (no session scheduled)"}
          </p>

          <div class="fatigue-row">
            <span class="fatigue-label">Fatigue:</span>
            ${["Low","Medium","High"].map(level => `
              <button type="button" class="fatigue-btn ${d.fatigue === level ? 'active' : ''}" onclick="setEditorFatigue('${level}', this)">${level}</button>
            `).join("")}
          </div>

          <button class="breakdown-toggle" onclick="toggleEditorBreakdown()">
            ${historyUIState.showBreakdown ? "− Hide round breakdown" : "+ Log each round"}
          </button>

          ${historyUIState.showBreakdown ? renderEditorBreakdownFields(breakdownKey, d) : ""}

          <div class="input-field-label" style="margin-top:8px;">Pull-ups (total)</div>
          <input type="number" inputmode="numeric" id="edit-session-pull" value="${historyUIState.showBreakdown ? sumArr(d.pullBreakdown) : d.pullTotal}" class="breakdown-input" style="margin-bottom:8px;" ${historyUIState.showBreakdown ? "readonly" : ""}>

          <div class="input-field-label">Pike push-ups (total)</div>
          <input type="number" inputmode="numeric" id="edit-session-pike" value="${historyUIState.showBreakdown ? sumArr(d.pikeBreakdown) : d.pikeTotal}" class="breakdown-input" style="margin-bottom:10px;" ${historyUIState.showBreakdown ? "readonly" : ""}>

          <button class="log-cta" onclick="saveSessionEditor('${historyUIState.editingId || ''}')">${historyUIState.isNew ? "Log this session" : "Save changes"}</button>

          ${!historyUIState.isNew ? `
            ${historyUIState.deleteConfirmId === historyUIState.editingId ? `
              <button class="log-cta" style="background:var(--zone-badge); margin-top:8px;" onclick="confirmDeleteSession('${historyUIState.editingId}')">Tap again to permanently delete</button>
            ` : `
              <button class="log-cta" style="background:transparent; border:1px solid var(--zone-badge); color:var(--zone-badge); margin-top:8px;" onclick="askDeleteSession('${historyUIState.editingId}')">Delete this session</button>
            `}
          ` : ""}
        </div>
      </div>
    </div>
  `;
}

function sumArr(arr) {
  return (arr || []).reduce((a, b) => a + b, 0);
}

function renderEditorBreakdownFields(key, draft) {
  if (key === "C") {
    return `
      <div class="breakdown-block">
        <div class="breakdown-label">Pull-up sets</div>
        ${[0,1,2,3].map(i => `<input class="breakdown-input" type="number" inputmode="numeric" placeholder="set ${i+1}" data-ebd="pull" value="${draft.pullBreakdown[i] ?? ''}" oninput="sumEditorBreakdown()">`).join("")}
      </div>
      <div class="breakdown-block">
        <div class="breakdown-label">Pike push-up sets</div>
        ${[0,1,2,3].map(i => `<input class="breakdown-input" type="number" inputmode="numeric" placeholder="set ${i+1}" data-ebd="pike" value="${draft.pikeBreakdown[i] ?? ''}" oninput="sumEditorBreakdown()">`).join("")}
      </div>
    `;
  }
  return `
    <div class="breakdown-block">
      <div class="breakdown-label">Rounds (pull-ups / pike push-ups)</div>
      ${[0,1,2,3,4].map(i => `
        <div class="breakdown-round-row">
          <span class="breakdown-round-num">R${i+1}</span>
          <input class="breakdown-input" type="number" inputmode="numeric" placeholder="0" data-ebd="pull" value="${draft.pullBreakdown[i] ?? ''}" oninput="sumEditorBreakdown()">
          <input class="breakdown-input" type="number" inputmode="numeric" placeholder="0" data-ebd="pike" value="${draft.pikeBreakdown[i] ?? ''}" oninput="sumEditorBreakdown()">
        </div>
      `).join("")}
    </div>
  `;
}

function sumEditorBreakdown() {
  const pullVals = Array.from(document.querySelectorAll('[data-ebd="pull"]')).map(el => parseInt(el.value, 10) || 0);
  const pikeVals = Array.from(document.querySelectorAll('[data-ebd="pike"]')).map(el => parseInt(el.value, 10) || 0);
  document.getElementById("edit-session-pull").value = pullVals.reduce((a,b) => a+b, 0);
  document.getElementById("edit-session-pike").value = pikeVals.reduce((a,b) => a+b, 0);
}

function askDeleteSession(sessionId) {
  historyUIState.deleteConfirmId = sessionId;
  openHistory();
}

function confirmDeleteSession(sessionId) {
  state.sessionHistory = (state.sessionHistory || []).filter(s => s.id !== sessionId);
  removeSkillHistoryBySessionId(sessionId);
  recomputeSkillMax("strict-pullup");
  recomputeSkillMax("pike-pushup");
  // Note: does not recompute programStartDate if the deleted session was
  // the earliest one — a known, minor edge case, not handled retroactively.
  closeSessionEditor();
  saveState();
}

function saveSessionEditor(sessionId) {
  const dateStr = document.getElementById("edit-session-date").value;
  const pull = parseInt(document.getElementById("edit-session-pull").value, 10) || 0;
  const pike = parseInt(document.getElementById("edit-session-pike").value, 10) || 0;
  const entryDate = new Date(dateStr + "T12:00:00"); // noon, avoids timezone-boundary day-shift issues

  const isNew = historyUIState.isNew;
  
  const id = isNew ? generateSessionId() : sessionId;
  const pullBreakdown = historyUIState.showBreakdown ? Array.from(document.querySelectorAll('[data-ebd="pull"]')).map(el => parseInt(el.value, 10) || 0) : null;
  const pikeBreakdown = historyUIState.showBreakdown ? Array.from(document.querySelectorAll('[data-ebd="pike"]')).map(el => parseInt(el.value, 10) || 0) : null;

  // Editing: clear the old linked skill-history entries first, so the
  // recompute below reflects only the corrected numbers, not both old and
  // new stacked together.
  if (!isNew) removeSkillHistoryBySessionId(id);

  const scheduled = scheduledSessionForDate(entryDate);
  const scheduledKey = scheduled ? scheduled.key : null;
  state.sessionHistory = state.sessionHistory || [];
  const existingIndex = state.sessionHistory.findIndex(s => s.id === id);
  const record = {
    id, date: entryDate.toISOString(),
    scheduledKey,
    fatigue: historyUIState.draft.fatigue,
    pullTotal: pull, pikeTotal: pike,
    pullBreakdown, pikeBreakdown
  };
  if (existingIndex >= 0) state.sessionHistory[existingIndex] = record;
  else state.sessionHistory.push(record);

  // Same rule as the daily Log tab: tier-crossing only from a real
  // single-set attempt value, never from a bare session total unless the
  // session structure itself is inherently single-attempt (Session C).
  const pullAttempt = pull > 0 ? getAttemptValue(scheduledKey, pull, pullBreakdown) : null;
  const pikeAttempt = pike > 0 ? getAttemptValue(scheduledKey, pike, pikeBreakdown) : null;

  let allAchievements = [];
  if (pullAttempt !== null) {
    const prev = recomputeSkillMax("strict-pullup");
    recordLogHistory("strict-pullup", pullAttempt, entryDate.getTime(), id);
    const newMax = recomputeSkillMax("strict-pullup");
    if (isNew) allAchievements = allAchievements.concat(evaluateLogEntry("strict-pullup", newMax, prev, entryDate.getTime()));
  }
  if (pikeAttempt !== null) {
    const prev = recomputeSkillMax("pike-pushup");
    recordLogHistory("pike-pushup", pikeAttempt, entryDate.getTime(), id);
    const newMax = recomputeSkillMax("pike-pushup");
    if (isNew) allAchievements = allAchievements.concat(evaluateLogEntry("pike-pushup", newMax, prev, entryDate.getTime()));
  }

  markDayCompleted(entryDate);
  if (isNew) {
    const blockCompletion = checkBlockCompletion();
    if (blockCompletion) allAchievements.push(blockCompletion);
  }
  // Editing an existing entry never fires achievements — you already saw
  // whatever this session earned the first time it was logged; silently
  // correcting a number shouldn't produce a surprise celebration popup.

  closeSessionEditor();
  if (allAchievements.length) celebrateAchievements(allAchievements);
  saveState();
}

// ===== PROGRAM =====
function renderProgram() {
  const started = !!state.programStartDate;
  const daysIn = started ? daysSinceProgramStart() : 0;
  const weekNum = Math.min(Math.floor(daysIn / 7) + 1, 4);
  const isDeloadWeek = weekNum === 4;
  const completed = started ? sessionsCompletedInProgram() : 0;
  const expected = totalExpectedSessions();
  const P = ACTIVE_PROGRAM;

  return `
    <div class="section">
      <div class="section-header"><div class="section-title">Active Program</div></div>
      <div class="card card--log">
        <div class="card-body">
          <div style="font-family:var(--font-earned);color:var(--text-title);font-size:1rem;margin-bottom:6px;">
            ${P.name}
          </div>
          ${started ? `
            <div style="font-size:0.85rem;color:var(--text-primary);margin-bottom:4px;">
              Day ${daysIn + 1} of 28 — Week ${weekNum}${isDeloadWeek ? " (Deload)" : ""}
            </div>
            <div style="font-size:0.82rem;color:var(--text-secondary);">
              ${completed} / ${expected} sessions logged this block
            </div>
          ` : `
            <div style="font-size:0.82rem;color:var(--text-secondary);line-height:1.4;">
              No sessions logged yet — the block starts counting from your first log.
            </div>
          `}
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-header"><div class="section-title">Weekly Schedule</div></div>
      ${P.weeklySchedule.map(s => `
        <div class="skill-row">
          <div class="skill-name">${s.day} — Session ${s.session} (${P.sessionTypes[s.session].label})</div>
        </div>
      `).join("")}
      <p style="font-size:0.75rem;color:var(--text-muted);margin:6px 0 2px;">Weeks 1-3. Week 4 (deload) drops to:</p>
      ${P.deloadSchedule.map(s => `
        <div class="skill-row">
          <div class="skill-name">${s.day} — Session ${s.session} (${P.sessionTypes[s.session].label}, half volume)</div>
        </div>
      `).join("")}
    </div>

    ${Object.entries(P.sessionTypes).map(([key, s]) => `
      <div class="section">
        <div class="section-header"><div class="section-title">Session ${key} — ${s.label} (${s.schedule})</div></div>
        <div class="card card--log">
          <div class="card-body">
            <ul style="margin:0 0 8px 18px; padding:0; font-size:0.82rem; color:var(--text-primary); line-height:1.6;">
              ${s.description.map(line => `<li>${line}</li>`).join("")}
            </ul>
            <div style="font-size:0.75rem; color:var(--text-muted);">Target: ${s.targetFormula}</div>
          </div>
        </div>
      </div>
    `).join("")}

    <div class="section">
      <div class="section-header"><div class="section-title">Prehab</div></div>
      <p style="font-size:0.82rem;color:var(--text-primary);">${P.prehab}</p>
    </div>

    <div class="section">
      <div class="section-header"><div class="section-title">Deload — Week 4 (and every 4th week)</div></div>
      <ul style="margin:0 0 0 18px; padding:0; font-size:0.82rem; color:var(--text-primary); line-height:1.6;">
        ${P.deload.map(line => `<li>${line}</li>`).join("")}
      </ul>
    </div>

    <div class="section">
      <div class="section-header"><div class="section-title">Fatigue Regulation Days</div></div>
      <ul style="margin:0 0 0 18px; padding:0; font-size:0.82rem; color:var(--text-primary); line-height:1.6;">
        ${P.fatigueRegulation.map(line => `<li>${line}</li>`).join("")}
      </ul>
    </div>

    <div class="section">
      <div class="section-header"><div class="section-title">Progression Math</div></div>
      <p style="font-size:0.82rem;color:var(--text-secondary);line-height:1.4;margin-bottom:6px;">${P.progressionNote}</p>
      <ul style="margin:0 0 0 18px; padding:0; font-size:0.82rem; color:var(--text-primary); line-height:1.6;">
        <li>Session A: ${P.sessionTypes.A.targetFormula}</li>
        <li>Session B: ${P.sessionTypes.B.targetFormula}</li>
        <li>Session C: ${P.sessionTypes.C.targetFormula}</li>
      </ul>
    </div>
  `;
}

// ===== Tab switching =====
function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll(".nav-tab").forEach(el => {
    el.classList.toggle("active", el.dataset.tab === tab);
  });
  document.getElementById("eyebrow").textContent =
    tab === "tree" ? "Skill Tree" : tab.charAt(0).toUpperCase() + tab.slice(1);
  const view = document.getElementById("view");
  if (tab === "dashboard") view.innerHTML = renderDashboard();
  if (tab === "log") view.innerHTML = renderLog();
  if (tab === "program") view.innerHTML = renderProgram();
  if (tab === "tree") { rerenderView(); }
  mountAllInscriptionLoops();
}

document.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("view").innerHTML =
    `<div class="section"><p style="color:var(--text-muted);font-size:0.85rem;">Loading your training record…</p></div>`;
  await loadState();
  switchTab("dashboard");
});
