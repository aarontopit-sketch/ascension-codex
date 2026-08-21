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
function skillDepth(skill, seen) {
  seen = seen || new Set();
  if (skill.isRoot) return 0;
  if (seen.has(skill.id)) return 1;
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
          
