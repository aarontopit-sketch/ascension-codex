// =====================================================================
// Celebration UI — toast (ordinary) vs modal (rare), with batching
// =====================================================================
// Per-entry batching: everything one log submission produces shows
// together, never as separate popups.
//
// Per-time-window batching: achievements queue up rather than firing
// instantly. Each new arrival resets a short window; when nothing new
// arrives before the window elapses, the whole accumulated queue displays
// as one batch.
//
// Real-world correction from the original build: this window was
// initially set to a literal 3 minutes, taking "a few minutes" from the
// doc at face value. In practice that meant logging a PR produced total
// silence for 3 minutes before any feedback appeared — a bad tradeoff for
// a feature meant to prevent stacked popups, not delay every single one.
// Most of the actual "two things happen together" scenario (a log, then
// its badge form-check) is already one continuous flow handled by
// per-entry batching — separate submissions minutes apart are rare enough
// that a short debounce (a couple seconds) catches genuine back-to-back
// actions without making the app feel unresponsive for the normal case.

const CELEBRATION_BATCH_WINDOW_MS = 2500; // short debounce, not a literal "few minutes" wait — see note below

let pendingCelebrationQueue = [];
let pendingCelebrationTimer = null;

function celebrateAchievements(achievements) {
  if (!achievements || achievements.length === 0) return;

  // Persist to the real earned-achievements record — the celebration
  // popup is just the moment you find out; the Dashboard's Achievements
  // and Badges cards need this permanent list to show anything real,
  // rather than the placeholder content they had before.
  state.earnedRecord = state.earnedRecord || [];
  achievements.forEach(a => state.earnedRecord.push(Object.assign({ timestamp: Date.now() }, a)));

  pendingCelebrationQueue = pendingCelebrationQueue.concat(achievements);
  if (pendingCelebrationTimer) clearTimeout(pendingCelebrationTimer);
  pendingCelebrationTimer = setTimeout(flushCelebrationQueue, CELEBRATION_BATCH_WINDOW_MS);
}
// Exposed separately (not just the setTimeout callback) so it can be
// triggered directly — e.g. for testing, or if the app later wants a
// "show me now" affordance rather than waiting out the window.
function flushCelebrationQueue() {
  const batch = pendingCelebrationQueue;
  pendingCelebrationQueue = [];
  if (pendingCelebrationTimer) { clearTimeout(pendingCelebrationTimer); pendingCelebrationTimer = null; }
  if (batch.length === 0) return;

  const anyRare = batch.some(a => a.rare);
  if (anyRare) {
    showCelebrationModal(batch);
  } else {
    showCelebrationToast(batch);
  }
}

function showCelebrationToast(achievements) {
  const existing = document.getElementById("celebration-toast");
  if (existing) existing.remove();

  const zoneVar = { title: "--zone-title", achieve: "--zone-achieve", badge: "--zone-badge" };
  const el = document.createElement("div");
  el.id = "celebration-toast";
  el.className = "celebration-toast";
  el.innerHTML = achievements.map(a =>
    `<span style="color:var(${zoneVar[a.zone] || '--zone-achieve'})">${a.title}</span> — ${a.description}`
  ).join(" · ");
  document.body.appendChild(el);

  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

function showCelebrationModal(achievements) {
  const existing = document.getElementById("celebration-modal-root");
  if (existing) existing.remove();

  const zoneVar = { title: "--zone-title", achieve: "--zone-achieve", badge: "--zone-badge" };
  const zoneLabel = { title: "TITLE", achieve: "ACHIEVEMENT", badge: "BADGE" };
  const inscription = achievements.map(a => a.runeConcept.toUpperCase()).join(" · ");
  const primaryZone = achievements[0].zone;

  const html = `
    <div class="popup-overlay" id="celebration-modal-root" onclick="if(event.target===this) closeCelebrationModal()">
      <div class="popup-card celebration-card" style="border-top-color: var(${zoneVar[primaryZone]});">
        <div class="popup-header">
          <div class="popup-title">Earned</div>
          <button class="popup-close" onclick="closeCelebrationModal()">×</button>
        </div>
        <div class="popup-body">
          ${achievements.map(a => `
            <div class="celebration-item" style="border-left: 2px solid var(${zoneVar[a.zone]});">
              <div class="celebration-rune ${a.rune === 'Jera' ? 'rune-jera' : ''}" style="color: var(${zoneVar[a.zone]});">${RUNE_GLYPHS[a.rune] || a.rune}</div>
              <div>
                <div class="celebration-zone-tag" style="color: var(${zoneVar[a.zone]});">${zoneLabel[a.zone]}</div>
                <div class="celebration-title">${a.title}</div>
                <div class="celebration-desc">${a.description}</div>
              </div>
            </div>
          `).join("")}
        </div>
        <div class="inscription-loop-target" data-inscription-text="${inscription}" data-inscription-color="${zoneVar[primaryZone]}"></div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", html);
  mountAllInscriptionLoops();
}

function closeCelebrationModal() {
  const existing = document.getElementById("celebration-modal-root");
  if (existing) existing.remove();
}
