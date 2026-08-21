// Skill tree data — converted from skill-tree-full-data.md into the
// Skill{id,name,category,branch,isRoot,ladder,formCheckpoints,badgeRule,prerequisites}
// shape from skill-config-schema.md.
//
// Helpers first, then each category's skill list.

function standardLadder(unit) {
  // Universal 11-tier ladder, 10->60, used by most laddered skills
  return [10,15,20,25,30,35,40,45,50,55,60].map(v => ({ value: v, unit }));
}

function skillRef(skillId, value, unit) {
  return { type: "skill", skillId, value, unit };
}
function rawStat(label, value, unit) {
  return { type: "stat", label, value, unit };
}

const ASCENSION_TITLES = {
  10: "Awakened", 15: "Unchained", 20: "Relentless", 25: "Supreme",
  30: "Exalted", 35: "Transcending", 40: "Ascended", 45: "Almighty",
  50: "Divine", 55: "Eternal", 60: "Omnipotent"
};

const SKILLS = [];

// =====================================================================
// BALANCE — fails by tipping
// =====================================================================
SKILLS.push({
  id: "regular-handstand", name: "Regular Handstand", category: "Balance",
  branch: "Static", isRoot: true,
  ladder: standardLadder("seconds"),
  formCheckpoints: ["Wrists","Elbows","Shoulders","Back","Hips","Feet/legs"],
  badgeRule: { tier: 10, variants: ["None","Minor","Major"] },
  prerequisites: []
});
SKILLS.push({ id: "straddle-handstand", name: "Straddle", category: "Balance", branch: "Static",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("regular-handstand", 30, "seconds")] });
SKILLS.push({ id: "diamond-handstand", name: "Diamond", category: "Balance", branch: "Static",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("straddle-handstand", 15, "seconds")] });
SKILLS.push({ id: "stag-handstand", name: "Stag", category: "Balance", branch: "Static",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("regular-handstand", 30, "seconds")] });
SKILLS.push({ id: "pike-handstand", name: "Pike", category: "Balance", branch: "Static",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("straddle-handstand", 15, "seconds")] });
SKILLS.push({ id: "scorpion-handstand", name: "Scorpion", category: "Balance", branch: "Static",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("regular-handstand", 60, "seconds")] });
SKILLS.push({ id: "one-arm-handstand", name: "One-arm Handstand", category: "Balance", branch: "Static",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("regular-handstand", 60, "seconds")] });

// One-arm sub-branch
SKILLS.push({ id: "one-arm-half-straddle", name: "One-arm Half-Straddle", category: "Balance", branch: "Static",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("one-arm-handstand", 15, "seconds")] });
SKILLS.push({ id: "one-arm-legs-together", name: "One-arm Legs-Together", category: "Balance", branch: "Static",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("one-arm-half-straddle", 15, "seconds")] });
SKILLS.push({ id: "one-arm-diamond", name: "One-arm Diamond", category: "Balance", branch: "Static",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("one-arm-handstand", 10, "seconds")] });
SKILLS.push({ id: "one-arm-tuck", name: "One-arm Tuck", category: "Balance", branch: "Static",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("one-arm-handstand", 10, "seconds")] });
SKILLS.push({ id: "one-arm-twisting", name: "One-arm Twisting", category: "Balance", branch: "Static",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("one-arm-handstand", 10, "seconds")] });

// Dynamic
SKILLS.push({ id: "walking-handstand", name: "Walking", category: "Balance", branch: "Dynamic",
  isRoot: false,
  ladder: [{value:1,unit:"steps"},{value:3,unit:"steps"},{value:5,unit:"steps"},
           {value:10,unit:"steps"},{value:10,unit:"feet"},{value:15,unit:"feet"}],
  formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("regular-handstand", 30, "seconds")] });
SKILLS.push({ id: "pirouettes", name: "Pirouettes", category: "Balance", branch: "Dynamic",
  isRoot: false,
  ladder: [{value:90,unit:"degrees"},{value:180,unit:"degrees"},{value:270,unit:"degrees"},
           {value:360,unit:"degrees"},{value:720,unit:"degrees"}],
  formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("regular-handstand", 60, "seconds")] });
SKILLS.push({ id: "flow", name: "Flow", category: "Balance", branch: "Dynamic",
  isRoot: false, ladder: null, formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("30s hold per shape used", 30, "seconds")] });

// =====================================================================
// PUSH — active push pattern
// =====================================================================
SKILLS.push({ id: "strict-pushup", name: "Strict push-up", category: "Push", branch: null,
  isRoot: true, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null, prerequisites: [] });

SKILLS.push({ id: "pike-pushup", name: "Pike push-up", category: "Push", branch: "Vertical Press",
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("Strict push-up", 10, "reps"), rawStat("plank", 30, "seconds")] });
SKILLS.push({ id: "handstand-pushup", name: "Handstand push-up", category: "Push", branch: "Vertical Press",
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("regular-handstand", 10, "seconds"), rawStat("overhead press (80
