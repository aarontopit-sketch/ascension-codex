// =====================================================================
// Achievement engine
// =====================================================================
// Per the schema doc's hybrid rule:
// - Tier-crossing: auto-derives from ladder + Ascension title data
// - First-time unlock, comeback PR, max-reps PR: each gets its own
//   lightweight trigger check here
// - Consistency/block-completion: NOT implemented in this pass — it
//   depends on real Program/Calendar session-day tracking, which
//   doesn't exist yet (Dashboard's week strip is still mock display).
//   Flagged honestly rather than faked.

// Real Elder Futhark Unicode glyphs for the 5 sourced runes, per the
// finalized set. Noto Sans Runic only renders actual runic characters —
// passing it the transliterated name (e.g. "Uruz") would show as tofu.
const RUNE_GLYPHS = {
  Uruz: "ᚢ", Thurisaz: "ᚦ", Ingwaz: "ᛜ", Nauthiz: "ᚾ", Jera: "ᛃ"
};

// state.skillLogHistory: { skillId: [{value, timestamp}, ...] }
// Needed for comeback-PR detection, which requires more than "current max."

function recordLogHistory(skillId, value, timestamp, sourceSessionId) {
  state.skillLogHistory = state.skillLogHistory || {};
  const hist = (state.skillLogHistory[skillId] = state.skillLogHistory[skillId] || []);
  hist.push({ value, timestamp: timestamp || Date.now(), sourceSessionId: sourceSessionId || null });
  // Keep chronological order regardless of insertion order — a backfilled
  // entry for a past date must land in its correct historical position,
  // not just get appended at the end, or comeback-PR's "recent entries"
  // window would be looking at the wrong entries.
  hist.sort((a, b) => a.timestamp - b.timestamp);
}

// Recomputes a skill's tracked max from its actual history — the single
// source of truth once history can be edited or deleted, rather than the
// old incremental Math.max(prev, val) approach, which has no way to
// handle a value being lowered or removed after the fact.
function recomputeSkillMax(skillId) {
  const hist = (state.skillLogHistory && state.skillLogHistory[skillId]) || [];
  const max = hist.length ? Math.max(...hist.map(h => h.value)) : 0;
  state.skillLogs[skillId] = max;
  if (state.logs && state.logs[skillId]) state.logs[skillId].max = max;
  return max;
}

// Removes every skillLogHistory entry (across all skills) that was
// created by a given session-history entry — used when editing or
// deleting a session, so stale numbers don't linger after the session
// record itself changes.
function removeSkillHistoryBySessionId(sessionId) {
  if (!state.skillLogHistory) return;
  Object.keys(state.skillLogHistory).forEach(skillId => {
    state.skillLogHistory[skillId] = state.skillLogHistory[skillId].filter(h => h.sourceSessionId !== sessionId);
  });
}
// Evaluates one log submission and returns the batch of achievements it
// fired, per the "batch everything from one entry into one modal" rule.
function evaluateLogEntry(skillId, newValue, previousValue, entryTimestamp) {
  const skill = SKILLS_BY_ID[skillId];
  const achievements = [];

  const isFirstEver = previousValue === 0 && newValue > 0;

  if (isFirstEver) {
    achievements.push({
      rare: true, zone: "achieve",
      rune: "Ingwaz", runeConcept: "Potential",
      title: `First Unlock — ${skill.name}`,
      description: `Logged for the first time: ${newValue} ${skill.ladder ? skill.ladder[0].unit : ""}`
    });
  }

  // Tier-crossing: auto-derived from ladder data, fires once for the
  // highest new tier reached (not once per intermediate tier skipped)
  if (skill.ladder) {
    const prevTier = tierForValue(previousValue, skill);
    const newTier = tierForValue(newValue, skill);
    if (newTier && newTier !== prevTier) {
      achievements.push({
        rare: false, zone: "title",
        rune: "Jera", runeConcept: "Progress",
        title: `Tier Reached — ${skill.name}`,
        description: `${newValue} ${skill.ladder[0].unit} · ${ASCENSION_TITLES[newTier] || ""}`
      });
    }
  }

  // Max-reps/seconds PR — a new logged value higher than any previous
  // one, excluding the very-first-ever log (that's Potential, not
  // Strength — the two shouldn't double-fire for the same event)
  if (!isFirstEver && newValue > previousValue) {
    const comeback = isComebackPR(skillId, newValue, entryTimestamp);
    if (comeback) {
      achievements.push({
        rare: true, zone: "achieve",
        rune: "Nauthiz", runeConcept: "Perseverance",
        title: `Comeback PR — ${skill.name}`,
        description: `${newValue} ${skill.ladder ? skill.ladder[0].unit : ""}, past your prior peak after a dip`
      });
    } else {
      achievements.push({
        rare: false, zone: "achieve",
        rune: "Uruz", runeConcept: "Strength",
        title: `New PR — ${skill.name}`,
        description: `${newValue} ${skill.ladder ? skill.ladder[0].unit : ""}, your best yet`
      });
    }
  }

  return achievements;
}

function tierForValue(value, skill) {
  if (!skill.ladder || !skill.ladder.length) return null;
  // Only the universal 10-60 Ascension ladder maps to ASCENSION_TITLES;
  // mixed-unit ladders (Walking, Pirouettes) don't use tier titles the
  // same way, so skip those here.
  const usesAscension = skill.ladder.every(l => l.unit === "reps" || l.unit === "seconds");
  if (!usesAscension) return null;
  const tiers = Object.keys(ASCENSION_TITLES).map(Number).sort((a,b)=>a-b);
  let found = null;
  for (const t of tiers) if (value >= t) found = t;
  return found;
}

// Comeback-PR: requires a genuine plateau/dip, not just one noisy lower
// reading. True if there's a historical peak, at least 2 of the 3 most
// recent entries before this one sat below that peak (a sustained dip
// rather than a single off day), and this new value now exceeds it.
//
// Note: recordLogHistory() is called before this function runs, so the
// current entry is already the last item in hist — it must be excluded
// from both the peak calculation and the "recent entries" window, or the
// check becomes self-referential (comparing the new value against itself).
// Comeback-PR: requires a genuine plateau/dip, not just one noisy lower
// reading. True if there's a historical peak, at least 2 of the 3 most
// recent entries before this one sat below that peak (a sustained dip
// rather than a single off day), and this new value now exceeds it.
//
// Identifies "this one" by matching entryTimestamp rather than assuming
// it's the last array element — history is kept in chronological order
// (see recordLogHistory), and a backfilled entry for a past date can land
// in the middle of the array, not at the end. "Recent" here means
// chronologically recent relative to the entry being evaluated, which
// matters for backfilled entries specifically — otherwise a forgotten
// session logged today for last Tuesday would be judged against entries
// that happened *after* it, not before.
function isComebackPR(skillId, newValue, entryTimestamp) {
  const hist = (state.skillLogHistory && state.skillLogHistory[skillId]) || [];
  const priorHist = entryTimestamp
    ? hist.filter(h => h.timestamp < entryTimestamp)
    : hist.slice(0, -1);
  if (priorHist.length < 3) return false;

  const priorPeak = Math.max(...priorHist.map(h => h.value));
  if (newValue <= priorPeak) return false;

  const recentEntries = priorHist.slice(-3);
  const dippedCount = recentEntries.filter(h => h.value < priorPeak).length;
  return dippedCount >= 2;
}

// =====================================================================
// Badge history — real upgrade tracking
// =====================================================================
// state.badgeHistory: { skillId: [{worstFault, timestamp}, ...] }
// Every qualifying attempt is appended, never overwritten — a later
// worse-form attempt doesn't erase an earlier better one, matching the
// "original never erased" rule.

const FAULT_SEVERITY = { "None": 0, "Minor": 1, "Major": 2 };

function recordBadgeAttempt(skillId, worstFault) {
  state.badgeHistory = state.badgeHistory || {};
  const hist = (state.badgeHistory[skillId] = state.badgeHistory[skillId] || []);

  const isFirst = hist.length === 0;
  const currentBestSeverity = isFirst
    ? Infinity
    : Math.min(...hist.map(h => FAULT_SEVERITY[h.worstFault]));
  const isUpgrade = !isFirst && FAULT_SEVERITY[worstFault] < currentBestSeverity;

  hist.push({ worstFault, timestamp: Date.now() });
  return { isFirst, isUpgrade, attemptCount: hist.length };
}
