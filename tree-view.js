// =====================================================================
// Tree browser — drill-down (most categories) + pan-zoom (Balance)
// =====================================================================

const CATEGORIES = ["Balance","Core","Push","Pull","Rings","Legs","Combo"];
const PAN_ZOOM_CATEGORIES = ["Balance"]; // structurally deep enough per schema doc

let treeState = {
  activeCategory: "Balance",
  popupSkillId: null,
  popupStep: "status", // 'status' | 'log' | 'badge-checklist'
  pendingLogValue: null,
  panX: 0, panY: 0, zoom: 1,
  dragging: false, dragStartX: 0, dragStartY: 0
};

function renderTreeBrowser() {
  const cat = treeState.activeCategory;
  const usesPanZoom = PAN_ZOOM_CATEGORIES.includes(cat);
  return `
    <div class="section">
      <div class="section-header">
        <div class="section-title">Skill Tree</div>
        <button class="section-link" onclick="switchTab('log')">← Back to Log</button>
      </div>
      <div class="cat-tabs">
        ${CATEGORIES.map(c => `<button class="cat-tab ${c===cat?'active':''}" onclick="switchTreeCategory('${c}')">${c}</button>`).join("")}
      </div>
    </div>
    <div class="section" style="padding-top:0;">
      ${usesPanZoom ? renderPanZoom(cat) : renderDrillDown(cat)}
    </div>
    ${treeState.popupSkillId ? renderSkillPopup(treeState.popupSkillId) : ""}
  `;
}

function switchTreeCategory(cat) {
  treeState.activeCategory = cat;
  treeState.panX = 0; treeState.panY = 0; treeState.zoom = 1;
  rerenderView();
}

function rerenderView() {
  document.getElementById("view").innerHTML = renderTreeBrowser();
  if (PAN_ZOOM_CATEGORIES.includes(treeState.activeCategory)) attachPanZoomHandlers();
}

// ===== DRILL-DOWN =====
function renderDrillDown(category) {
  const skills = SKILLS_BY_CATEGORY[category] || [];
  const branches = {};
  skills.forEach(s => {
    const key = s.branch || (s.isRoot ? "Root" : "General");
    (branches[key] = branches[key] || []).push(s);
  });
  return Object.entries(branches).map(([branch, list]) => `
    <div class="branch-group">
      <div class="branch-label">${branch}</div>
      ${list.map(renderSkillRow).join("")}
    </div>
  `).join("");
}

function renderSkillRow(skill) {
  const vis = skillVisibility(skill);
  if (vis === "sealed") {
    return `
      <div class="skill-row sealed" onclick="openSkillPopup('${skill.id}')">
        <div class="skill-silhouette">?</div>
        <div class="skill-sealed-text">Sealed</div>
      </div>`;
  }
  const tier = skill.ladder ? currentTier(skill.id) : null;
  const tierWord = tier ? ASCENSION_TITLES[tier] : null;
  return `
    <div class="skill-row ${vis}" onclick="openSkillPopup('${skill.id}')">
      <div class="skill-name">${skill.name}</div>
      ${tierWord ? `<div class="skill-tier">${tierWord}</div>` : `<div class="skill-tier muted">Not started</div>`}
    </div>`;
}

// ===== PAN-ZOOM (Balance) =====
// Simple layout: root centered top, branches fan out by depth using each
// skill's prerequisite chain length as a rough depth proxy.
function skillDepth(skill, seen) {
  seen = seen || new Set();
  if (skill.isRoot) return 0;
  if (seen.has(skill.id)) return 1; // cycle guard
  seen.add(skill.id);
  const skillPrereqs = skill.prerequisites.filter(p => p.type === "skill");
  if (skillPrereqs.length === 0) return 1;
  const depths = skillPrereqs.map(p => {
    const parent = SKILLS_BY_ID[p.skillId];
    return parent ? skillDepth(parent, seen) + 1 : 1;
  });
  return Math.max(...depths);
}

function renderPanZoom(category) {
  const skills = SKILLS_BY_CATEGORY[category] || [];
  const byDepth = {};
  skills.forEach(s => {
    const d = skillDepth(s);
    (byDepth[d] = byDepth[d] || []).push(s);
  });
  const depths = Object.keys(byDepth).map(Number).sort((a,b)=>a-b);
  const nodeSpacingX = 90, rowSpacingY = 100;

  let nodesHtml = "";
  depths.forEach(d => {
    const row = byDepth[d];
    row.forEach((s, i) => {
      const x = (i - (row.length-1)/2) * nodeSpacingX;
      const y = d * rowSpacingY;
      const vis = skillVisibility(s);
      nodesHtml += `
        <div class="tree-node ${vis}" style="left:${x}px; top:${y}px;" onclick="openSkillPopup('${s.id}')">
          ${vis === "sealed" ? "?" : s.name}
        </div>`;
    });
  });

  return `
    <div class="panzoom-controls">
      <button onclick="panZoomAdjust(0.1)">+</button>
      <button onclick="panZoomAdjust(-0.1)">−</button>
      <button onclick="panZoomReset()">Reset</button>
    </div>
    <div class="panzoom-viewport" id="panzoom-viewport">
      <div class="panzoom-canvas" id="panzoom-canvas" style="transform: translate(${treeState.panX}px, ${treeState.panY}px) scale(${treeState.zoom});">
        ${nodesHtml}
      </div>
    </div>
  `;
}

function panZoomAdjust(delta) {
  treeState.zoom = Math.max(0.5, Math.min(2, treeState.zoom + delta));
  applyPanZoomTransform();
}
function panZoomReset() {
  treeState.panX = 0; treeState.panY = 0; treeState.zoom = 1;
  applyPanZoomTransform();
}
function applyPanZoomTransform() {
  const canvas = document.getElementById("panzoom-canvas");
  if (canvas) canvas.style.transform = `translate(${treeState.panX}px, ${treeState.panY}px) scale(${treeState.zoom})`;
}

function attachPanZoomHandlers() {
  const vp = document.getElementById("panzoom-viewport");
  if (!vp) return;
  let dragging = false, lastX = 0, lastY = 0;

  const start = (x, y) => { dragging = true; lastX = x; lastY = y; };
  const move = (x, y) => {
    if (!dragging) return;
    treeState.panX += (x - lastX);
    treeState.panY += (y - lastY);
    lastX = x; lastY = y;
    applyPanZoomTransform();
  };
  const end = () => { dragging = false; };

  vp.addEventListener("mousedown", e => start(e.clientX, e.clientY));
  window.addEventListener("mousemove", e => move(e.clientX, e.clientY));
  window.addEventListener("mouseup", end);

  vp.addEventListener("touchstart", e => {
    const t = e.touches[0]; start(t.clientX, t.clientY);
  }, { passive: true });
  vp.addEventListener("touchmove", e => {
    const t = e.touches[0]; move(t.clientX, t.clientY);
  }, { passive: true });
  vp.addEventListener("touchend", end);
}

// ===== TAP-TO-REVEAL POPUP =====
function openSkillPopup(skillId) {
  treeState.popupSkillId = skillId;
  treeState.popupStep = "status";
  refreshPopup();
}
function closeSkillPopup() {
  treeState.popupSkillId = null;
  treeState.popupStep = "status";
  const existing = document.getElementById("skill-popup-root");
  if (existing) existing.remove();
}
function refreshPopup() {
  const existing = document.getElementById("skill-popup-root");
  const html = renderSkillPopup(treeState.popupSkillId);
  if (existing) existing.outerHTML = html;
  else document.getElementById("view").insertAdjacentHTML("beforeend", html);

  if (treeState.popupStep === "log") {
    attachLogFormListeners(SKILLS_BY_ID[treeState.popupSkillId]);
  }
  mountAllInscriptionLoops();
}

function renderSkillPopup(skillId) {
  const skill = SKILLS_BY_ID[skillId];
  if (!skill) return "";

  if (treeState.popupStep === "log") return renderLogStep(skill);
  if (treeState.popupStep === "badge-checklist") return renderBadgeChecklistStep(skill);
  return renderStatusStep(skill);
}

function renderStatusStep(skill) {
  const skillId = skill.id;
  const vis = skillVisibility(skill);
  const prereqStatuses = checkAllPrerequisites(skill);
  const tier = skill.ladder ? currentTier(skillId) : null;
  const canLog = vis === "unlocked" || skill.isRoot;

  return `
    <div class="popup-overlay" id="skill-popup-root" onclick="if(event.target===this) closeSkillPopup()">
      <div class="popup-card">
        <div class="popup-header">
          <div class="popup-title">${vis === "sealed" ? skill.name + " (Sealed)" : skill.name}</div>
          <button class="popup-close" onclick="closeSkillPopup()">×</button>
        </div>
        <div class="popup-body">
          <div class="popup-meta">${skill.category}${skill.branch ? " · " + skill.branch : ""}</div>
          ${tier ? `<div class="popup-tier">Current: ${ASCENSION_TITLES[tier]} (${tier})</div>` : ""}

          ${skill.prerequisites.length === 0 ? `<div class="popup-note">No prerequisites — this is a root skill.</div>` : `
            <div class="popup-subhead">Prerequisites</div>
            ${prereqStatuses.map(p => `
              <div class="prereq-row ${p.met ? 'met' : 'unmet'}">
                <span>${p.label}</span>
                <span class="prereq-status">
                  ${p.met ? "✓ met" : `${p.current}/${p.required} ${p.unit}`}
                </span>
                ${!p.met && p.type === "stat" ? `
                  <div class="rawstat-quicklog">
                    <input type="number" inputmode="numeric" placeholder="log ${p.label}" id="rawstat-${skillId}-${p.label.replace(/[^a-zA-Z0-9]/g,'')}">
                    <button onclick="logRawStat('${skillId}', '${p.label.replace(/'/g, "\\'")}', document.getElementById('rawstat-${skillId}-${p.label.replace(/[^a-zA-Z0-9]/g,'')}').value)">Log</button>
                  </div>
                ` : ""}
                ${!p.met && p.type === "stat-resolved-to-skill" ? `
                  <div class="popup-note" style="margin-top:4px;">Tracked skill — log it from the Skill Tree or Log tab directly.</div>
                ` : ""}
              </div>
            `).join("")}
          `}

          ${skill.ladder ? `
            <button class="log-cta" style="margin-top:14px;" ${canLog ? "" : "disabled"}
              onclick="${canLog ? `startLogStep('${skillId}')` : ""}">
              ${canLog ? "Log progress →" : "Meet prerequisites to log"}
            </button>
          ` : `<div class="popup-note" style="margin-top:10px;">No numeric ladder — checklist/binary skill, not logged here yet.</div>`}
        </div>
      </div>
    </div>
  `;
}

function startLogStep(skillId) {
  treeState.popupStep = "log";
  refreshPopup();
}

function renderLogStep(skill) {
  const unit = skill.ladder[0].unit;
  const isSeconds = unit === "seconds";
  return `
    <div class="popup-overlay" id="skill-popup-root" onclick="if(event.target===this) closeSkillPopup()">
      <div class="popup-card">
        <div class="popup-header">
          <div class="popup-title">Log ${skill.name}</div>
          <button class="popup-close" onclick="closeSkillPopup()">×</button>
        </div>
        <div class="popup-body">
          <div class="input-field-wrap" style="margin-top:4px;">
            <div class="input-field-body">
              <div class="input-field-label">${unit === "reps" ? "Reps" : unit === "seconds" ? "Seconds" : unit === "feet" ? "Feet" : "Degrees"}</div>
              <input class="input-field" type="number" inputmode="numeric" id="log-value-input" placeholder="0">
              ${isSeconds ? `<div class="popup-note" id="log-value-preview" style="margin-top:4px;"></div>` : ""}
            </div>
            <div class="inscription-loop-target" data-inscription-text="${RUNIC_PHRASES.newEntry}" data-inscription-color="--zone-log" data-inscription-draw-border="true"></div>
          </div>
          <button class="log-cta" onclick="submitSkillLog('${skill.id}')">Save</button>
        </div>
      </div>
    </div>
  `;
}

// Attaches the M:SS live-preview listener after the log form is in the DOM.
// Kept as a real JS function call, not an inline script element embedded
// as a string — a script-tag string inside a template literal breaks once
// this file is concatenated into one bundled script block, since the HTML
// parser closes the OUTER script block at the first literal closing script
// tag it finds anywhere in the text, regardless of JS string/comment context.
function attachLogFormListeners(skill) {
  if (skill.ladder[0].unit !== "seconds") return;
  const input = document.getElementById("log-value-input");
  const preview = document.getElementById("log-value-preview");
  if (!input || !preview) return;
  input.addEventListener("input", function () {
    const v = parseInt(this.value, 10);
    preview.textContent = (!isNaN(v) && v >= 60) ? "Displays as " + formatSecondsValue(v) : "";
  });
}

function submitSkillLog(skillId) {
  const input = document.getElementById("log-value-input");
  const val = parseInt(input.value, 10);
  if (isNaN(val) || val < 0) return; // basic validation, matches toWholeRep() convention
  const skill = SKILLS_BY_ID[skillId];
  const previousValue = getSkillCurrentValue(skillId);
  state.skillLogs[skillId] = Math.max(previousValue, val);
  recordLogHistory(skillId, val);
  markDayCompleted();

  const achievements = evaluateLogEntry(skillId, state.skillLogs[skillId], previousValue);
  const blockCompletion = checkBlockCompletion();
  if (blockCompletion) achievements.push(blockCompletion);

  // Only prompt the badge form check if this log actually reached the
  // badge's own tier threshold — badge-eligible skills can be logged at
  // any point on their ladder, and a 5-second Regular Handstand (badge
  // tier 10) shouldn't ask for a form check it isn't eligible for yet.
  if (skill.badgeRule && val >= skill.badgeRule.tier) {
    treeState.pendingLogValue = val;
    treeState.pendingAchievements = achievements;
    treeState.popupStep = "badge-checklist";
    refreshPopup();
  } else {
    closeSkillPopup();
    rerenderView();
    celebrateAchievements(achievements);
    saveState();
  }
}

function renderBadgeChecklistStep(skill) {
  const checkpoints = skill.formCheckpoints || [];
  return `
    <div class="popup-overlay" id="skill-popup-root" onclick="if(event.target===this) closeSkillPopup()">
      <div class="popup-card">
        <div class="popup-header">
          <div class="popup-title">Form Check — ${skill.name}</div>
          <button class="popup-close" onclick="closeSkillPopup()">×</button>
        </div>
        <div class="popup-body">
          <div class="popup-note">Badge-eligible skill — rate each checkpoint before saving.</div>
          ${checkpoints.map((cp, i) => `
            <div class="checklist-row">
              <div class="checklist-label">${cp}</div>
              <div class="checklist-options">
                <label><input type="radio" name="cp-${i}" value="None" checked> None</label>
                <label><input type="radio" name="cp-${i}" value="Minor"> Minor</label>
                <label><input type="radio" name="cp-${i}" value="Major"> Major</label>
              </div>
            </div>
          `).join("")}
          <button class="log-cta" style="margin-top:14px;" onclick="submitBadgeChecklist('${skill.id}', ${checkpoints.length})">Save form check</button>
        </div>
      </div>
    </div>
  `;
}

function submitBadgeChecklist(skillId, count) {
  // worst-fault rule: Major > Minor > None
  const severity = { "None": 0, "Minor": 1, "Major": 2 };
  let worst = "None";
  for (let i = 0; i < count; i++) {
    const checked = document.querySelector(`input[name="cp-${i}"]:checked`);
    if (checked && severity[checked.value] > severity[worst]) worst = checked.value;
  }
  const skill = SKILLS_BY_ID[skillId];
  const result = recordBadgeAttempt(skillId, worst);

  const achievements = (treeState.pendingAchievements || []).slice();
  // Real upgrade rule: a new badge achievement only fires on the first
  // attempt, or when this attempt's form beats every prior recorded
  // attempt for this skill. A same-or-worse repeat still saves to
  // history (so nothing is lost) but doesn't fire its own celebration —
  // and critically, the earlier better attempt's achievement record is
  // never touched or removed.
  if (result.isFirst || result.isUpgrade) {
    achievements.push({
      rare: true, zone: "badge",
      rune: "Thurisaz", runeConcept: "Power",
      title: result.isFirst ? `Badge Earned — ${skill.name}` : `Badge Upgraded — ${skill.name}`,
      description: `Worst fault: ${worst}`
    });
  }

  closeSkillPopup();
  rerenderView();
  celebrateAchievements(achievements);
  saveState();
}

function logRawStat(skillId, label, value) {
  const v = parseFloat(value);
  if (!isNaN(v)) {
    state.rawStatLogs[label] = Math.max(getRawStatCurrentValue(label), v);
  }
  refreshPopup();
  saveState();
}
