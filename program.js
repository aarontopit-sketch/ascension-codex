// =====================================================================
// Program structure & consistency/block-completion tracking
// =====================================================================
// Real program content, recovered from earlier session history — this
// replaces an earlier placeholder that wrongly assumed each week ran one
// repeated session type. The actual structure: every non-deload week runs
// all three session types (A appears twice), not one type per week.

const ACTIVE_PROGRAM = {
  id: "4week-block-v1",
  name: "4-Week Block — Session A/B/C",
  // Weekly schedule for weeks 1-3 (non-deload)
  weeklySchedule: [
    { day: "Mon", session: "A" },
    { day: "Tue", session: "B" },
    { day: "Thu", session: "A" },
    { day: "Fri", session: "C" }
  ],
  // Deload week (week 4, and every 4th week) — reduced schedule
  deloadSchedule: [
    { day: "Mon", session: "A" },
    { day: "Fri", session: "C" }
  ],
  sessionTypes: {
    A: {
      label: "Volume",
      schedule: "Mon / Thu",
      description: [
        "5 rounds: reps of pull-ups + reps of pike push-ups, superset style",
        "Rest ~2 min between rounds",
        "Stop 2 reps short of failure every set"
      ],
      targetFormula: "reps/round = 65% of AMRAP (rounded down)"
    },
    B: {
      label: "Density",
      schedule: "Tue",
      description: [
        "10-min EMOM, alternating minutes",
        "Odd minutes: pull-ups · Even minutes: pike push-ups",
        "5 rounds each, easy controlled pace"
      ],
      targetFormula: "reps/EMOM minute = 50% of AMRAP (rounded down)"
    },
    C: {
      label: "Intensity",
      schedule: "Fri",
      description: [
        "Build to 1 hard top set (RPE 8) on pull-ups, then pike push-ups",
        "3-4 total sets each, ~3 min rest",
        "Every 2nd Friday: true AMRAP retest on both, after warm-up sets"
      ],
      targetFormula: "top working set = AMRAP − 1"
    }
  },
  prehab: "2×10 band pull-aparts before pulling work, every session",
  deload: [
    "Drop to Mon / Fri sessions only",
    "Half normal volume, nothing near failure"
  ],
  fatigueRegulation: [
    "Before each session, gut-check fatigue: Low / Medium / High (legs, shoulders, grip, sleep)",
    "High → Regulation Day: cut prescribed volume ~40%, stay ≤RPE 6, skip Session C entirely",
    "If a scheduled Session C day lands High, swap in a light A/B-style session instead — don't stack two hard days to make it up",
    "In-session check: if the first round isn't crisp strict form, downgrade immediately",
    "Handstand training stays as-is regardless of fatigue"
  ],
  progressionNote: "Recalculate every 2 weeks off your latest AMRAP (pull-ups and pike push-ups tracked separately)."
};

// Real weekly session count: 4 sessions/week for weeks 1-3, 2 for deload
// week 4 — corrects the earlier placeholder's wrong 3x/week assumption.
function totalExpectedSessions() {
  return ACTIVE_PROGRAM.weeklySchedule.length * 3 + ACTIVE_PROGRAM.deloadSchedule.length;
}

// Progression math — real formulas recovered from program history.
// AMRAP baseline uses the tracked skill max (state.skillLogs), same value
// Current Max displays on Dashboard.
function progressionTarget(sessionType, amrapMax) {
  if (sessionType === "A") return Math.floor(amrapMax * 0.65);
  if (sessionType === "B") return Math.floor(amrapMax * 0.50);
  if (sessionType === "C") return Math.max(amrapMax - 1, 0);
  return null;
}

function dayKey(date) {
  return date.toISOString().slice(0, 10); // YYYY-MM-DD
}

// Marks today as a completed training day. Only called for real skill
// logs (tree or Log-tab entries) — per the doc's rule, RawStat quick-log
// entries do NOT count toward day-completion, since a gate-verification
// check ("did I hit 20 dips") isn't a training session.
function markDayCompleted(date) {
  const d = date || new Date();
  state.completedDays = state.completedDays || {};
  // programStartDate should reflect the earliest real activity, not
  // necessarily "today" — if the very first log ever entered is a
  // backfilled past date, the program should be considered to have
  // started then, not on whatever day you happened to enter it.
  if (!state.programStartDate || dayKey(d) < state.programStartDate) {
    state.programStartDate = dayKey(d);
  }
  state.completedDays[dayKey(d)] = true;
}

function sessionsCompletedInProgram() {
  if (!state.programStartDate) return 0;
  const start = new Date(state.programStartDate);
  const now = new Date();
  const daysSinceStart = Math.floor((now - start) / 86400000);
  if (daysSinceStart >= 28) {
    // count only days within the 28-day window
    return Object.keys(state.completedDays || {}).filter(d => {
      const diff = Math.floor((new Date(d) - start) / 86400000);
      return diff >= 0 && diff < 28;
    }).length;
  }
  return Object.keys(state.completedDays || {}).length;
}

function daysSinceProgramStart() {
  if (!state.programStartDate) return 0;
  return Math.floor((new Date() - new Date(state.programStartDate)) / 86400000);
}

// Checks whether this log just completed the 4-week block, and returns a
// Consistency achievement if so — fires once per program cycle, not
// repeatedly on every log after completion.
function checkBlockCompletion() {
  if (state.blockCompletionFired) return null;
  if (daysSinceProgramStart() < 28) return null;
  if (sessionsCompletedInProgram() < totalExpectedSessions()) return null;

  state.blockCompletionFired = true;
  return {
    rare: true, zone: "achieve",
    rune: "Jera", runeConcept: "Consistency",
    title: "Full Cycle Complete",
    description: `Made it through all 4 weeks — ${sessionsCompletedInProgram()} sessions logged`
  };
}
