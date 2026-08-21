// =====================================================================
// Prerequisite status & visibility logic
// =====================================================================

// state.skillLogs: { skillId: currentMaxValue }  — tracked skills
// state.rawStatLogs: { label: currentValue }      — RawStat quick-log

function getSkillCurrentValue(skillId) {
  return state.skillLogs[skillId] || 0;
}
function getRawStatCurrentValue(label) {
  return state.rawStatLogs[label] || 0;
}

// A RawStat's label sometimes names a skill that's *also* a real tracked
// tree node (e.g. "Strict push-up" appearing as a raw prerequisite label
// elsewhere, even though Strict push-up is itself the Push root skill).
// Resolve these against the real skill log rather than the separate
// RawStat quick-log bucket, so an already-logged skill value is recognized.
function findSkillByName(name) {
  return SKILLS.find(s => s.name.toLowerCase() === name.toLowerCase());
}

// Returns { met: bool, current: number, required: number, unit } for one prerequisite
function checkPrerequisite(prereq) {
  if (prereq.type === "skill") {
    const current = getSkillCurrentValue(prereq.skillId);
    return { met: current >= prereq.value, current, required: prereq.value, unit: prereq.unit,
             label: SKILLS_BY_ID[prereq.skillId] ? SKILLS_BY_ID[prereq.skillId].name : prereq.skillId,
             type: "skill", skillId: prereq.skillId };
  } else {
    const matchingSkill = findSkillByName(prereq.label);
    const current = matchingSkill ? getSkillCurrentValue(matchingSkill.id) : getRawStatCurrentValue(prereq.label);
    return { met: current >= prereq.value, current, required: prereq.value, unit: prereq.unit,
             label: prereq.label, type: matchingSkill ? "stat-resolved-to-skill" : "stat",
             resolvedSkillId: matchingSkill ? matchingSkill.id : null };
  }
}

function checkAllPrerequisites(skill) {
  return skill.prerequisites.map(checkPrerequisite);
}

function countUnmet(skill) {
  return checkAllPrerequisites(skill).filter(p => !p.met).length;
}

// 'unlocked' = every prerequisite met (skill is trainable)
// 'close'    = at most one prerequisite unmet (show full detail)
// 'sealed'   = more than one prerequisite unmet
function skillVisibility(skill) {
  if (skill.isRoot || skill.prerequisites.length === 0) return "unlocked";
  const unmet = countUnmet(skill);
  if (unmet === 0) return "unlocked";
  if (unmet === 1) return "close";
  return "sealed";
}

// current Ascension tier reached for a laddered skill
function currentTier(skillId) {
  const val = getSkillCurrentValue(skillId);
  const tiers = Object.keys(ASCENSION_TITLES).map(Number).sort((a,b)=>a-b);
  let found = null;
  for (const t of tiers) if (val >= t) found = t;
  return found;
}

// ===== Seconds display formatting (M:SS at 60+, plain below) =====
// Shared by Dashboard and the tree logging form.
function formatSecondsValue(sec) {
  if (sec < 60) return `${sec}`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
