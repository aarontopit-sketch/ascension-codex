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
  prerequisites: [skillRef("regular-handstand", 10, "seconds"), rawStat("overhead press (80% BW)", 1, "reps")] });
SKILLS.push({ id: "archer-hspu", name: "Archer HSPU", category: "Push", branch: "Vertical Press",
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("Handstand push-up", 5, "reps")] });
SKILLS.push({ id: "90-hspu", name: "90° HSPU", category: "Push", branch: "Vertical Press",
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("regular-handstand", 15, "seconds"), rawStat("Handstand push-up", 5, "reps")] });

SKILLS.push({ id: "planche-lean", name: "Planche lean", category: "Push", branch: "Straight-Arm Press",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("Strict push-up", 30, "reps"), rawStat("dips", 15, "reps"), rawStat("hollow body hold", 60, "seconds")] });
SKILLS.push({ id: "tuck-planche", name: "Tuck planche", category: "Push", branch: "Straight-Arm Press",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("planche-lean", 10, "seconds")] });
SKILLS.push({ id: "adv-tuck-planche", name: "Advanced tuck planche", category: "Push", branch: "Straight-Arm Press",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("tuck-planche", 15, "seconds")] });
SKILLS.push({ id: "half-lay-planche", name: "Half Lay planche", category: "Push", branch: "Straight-Arm Press",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("adv-tuck-planche", 15, "seconds")] });
SKILLS.push({ id: "full-planche", name: "Full planche", category: "Push", branch: "Straight-Arm Press",
  isRoot: false, ladder: standardLadder("seconds"),
  formCheckpoints: ["Back (banana)","Elbows (bent)"],
  badgeRule: { tier: 10, variants: ["None","Minor","Major"] },
  prerequisites: [skillRef("half-lay-planche", 30, "seconds")] });
SKILLS.push({ id: "planche-pushup", name: "Planche push-up", category: "Push", branch: "Straight-Arm Press",
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("full-planche", 5, "seconds")] });

SKILLS.push({ id: "archer-pushup", name: "Archer push-up", category: "Push", branch: "Unilateral",
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("Strict push-up", 20, "reps")] });
SKILLS.push({ id: "one-arm-pushup", name: "One-arm push-up", category: "Push", branch: "Unilateral",
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("Archer push-up", 5, "reps")] });

// =====================================================================
// PULL — active pull pattern
// =====================================================================
SKILLS.push({ id: "strict-pullup", name: "Strict pull-up", category: "Pull", branch: null,
  isRoot: true, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null, prerequisites: [] });

SKILLS.push({ id: "tuck-front-lever", name: "Tuck front lever", category: "Pull", branch: "Straight-Arm Pull",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("Strict pull-up", 10, "reps"), rawStat("hollow body hold", 60, "seconds"), rawStat("active hang", 20, "seconds")] });
SKILLS.push({ id: "adv-tuck-front-lever", name: "Advanced tuck front lever", category: "Pull", branch: "Straight-Arm Pull",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("tuck-front-lever", 15, "seconds")] });
SKILLS.push({ id: "one-leg-front-lever", name: "One-Leg front lever", category: "Pull", branch: "Straight-Arm Pull",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("adv-tuck-front-lever", 15, "seconds")] });
SKILLS.push({ id: "full-front-lever", name: "Full front lever", category: "Pull", branch: "Straight-Arm Pull",
  isRoot: false, ladder: standardLadder("seconds"),
  formCheckpoints: ["Hips (sag)","Elbows (bent)"],
  badgeRule: { tier: 10, variants: ["None","Minor","Major"] },
  prerequisites: [skillRef("one-leg-front-lever", 15, "seconds")] });

SKILLS.push({ id: "archer-pullup", name: "Archer pull-up", category: "Pull", branch: "Unilateral",
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("Strict pull-up", 15, "reps")] });
SKILLS.push({ id: "typewriter-pullup", name: "Typewriter pull-up", category: "Pull", branch: "Unilateral",
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("Strict pull-up", 10, "reps"), rawStat("Archer pull-up/side", 5, "reps")] });
SKILLS.push({ id: "one-arm-pullup", name: "One-arm pull-up", category: "Pull", branch: "Unilateral",
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("Archer pull-up/side (4x8)", 8, "reps")] });

SKILLS.push({ id: "slow-muscleup", name: "Slow muscle-up", category: "Pull", branch: "Muscle-up",
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("Strict pull-up", 10, "reps"), rawStat("dips", 10, "reps")] });
SKILLS.push({ id: "muscleup", name: "Muscle-up", category: "Pull", branch: "Muscle-up",
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("Strict pull-up", 10, "reps"), rawStat("dips", 15, "reps"), rawStat("top hold", 5, "seconds")] });
// =====================================================================
// RINGS — genuinely distinct ring-only movements
// =====================================================================
SKILLS.push({ id: "ring-support-hold", name: "Ring support hold", category: "Rings", branch: null,
  isRoot: true, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null, prerequisites: [] });

SKILLS.push({ id: "ring-muscleup", name: "Ring muscle-up", category: "Rings", branch: null,
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("Strict pull-up", 10, "reps"), rawStat("strict ring dips", 10, "reps")] });
SKILLS.push({ id: "ring-handstand", name: "Ring Handstand", category: "Rings", branch: null,
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("regular-handstand", 30, "seconds")] });
SKILLS.push({ id: "ring-planche", name: "Ring Planche", category: "Rings", branch: null,
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("full-planche", 15, "seconds")] });
SKILLS.push({ id: "ring-hspu", name: "Ring HSPU", category: "Rings", branch: null,
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("ring-handstand", 10, "seconds"), rawStat("Handstand push-up", 5, "reps")] });
SKILLS.push({ id: "ring-lsit", name: "Ring L-sit", category: "Rings", branch: null,
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("ring-support-hold", 30, "seconds"), rawStat("Floor L-sit", 30, "seconds")] });
SKILLS.push({ id: "iron-cross", name: "Iron Cross", category: "Rings", branch: null,
  isRoot: false, ladder: standardLadder("seconds"),
  formCheckpoints: ["Elbows (lockout)","Shoulders (depression)"],
  badgeRule: { tier: 10, variants: ["None","Minor","Major"] },
  prerequisites: [
    rawStat("pull-ups/dips", 5, "reps"),
    rawStat("ring support hold (5x30s)", 30, "seconds"),
    rawStat("ring dips (5x5, turned out)", 5, "reps"),
    skillRef("full-front-lever", 10, "seconds"),
    skillRef("half-lay-planche", 15, "seconds")
  ] });
SKILLS.push({ id: "maltese", name: "Maltese", category: "Rings", branch: null,
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("full-planche", 30, "seconds"), rawStat("strong back lever", 1, "reps")] });

// =====================================================================
// CORE — fails by sagging/collapsing
// =====================================================================
SKILLS.push({ id: "hollow-body-hold", name: "Hollow body hold", category: "Core", branch: null,
  isRoot: true, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null, prerequisites: [] });

// Anti-extension (Dragon Flag)
SKILLS.push({ id: "tuck-dragon-flag", name: "Tuck dragon flag", category: "Core", branch: "Anti-extension",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("hollow-body-hold", 30, "seconds")] });
SKILLS.push({ id: "half-lay-dragon-flag", name: "Half Lay dragon flag", category: "Core", branch: "Anti-extension",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("tuck-dragon-flag", 15, "seconds")] });
SKILLS.push({ id: "full-dragon-flag", name: "Full dragon flag", category: "Core", branch: "Anti-extension",
  isRoot: false, ladder: standardLadder("seconds"),
  formCheckpoints: ["Back (banana/arch)","Hips (sag)"],
  badgeRule: { tier: 10, variants: ["None","Minor","Major"] },
  prerequisites: [skillRef("half-lay-dragon-flag", 15, "seconds")] });

// Anti-rotation (Human Flag)
SKILLS.push({ id: "vertical-press-flag", name: "Vertical press-flag", category: "Core", branch: "Anti-rotation",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("Strict pull-up", 12, "reps"), rawStat("dips", 20, "reps"), rawStat("push-up", 40, "reps"), skillRef("full-lsit", 15, "seconds")] });
SKILLS.push({ id: "tuck-human-flag", name: "Tuck human flag", category: "Core", branch: "Anti-rotation",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("vertical-press-flag", 15, "seconds")] });
SKILLS.push({ id: "one-leg-human-flag", name: "One-Leg human flag", category: "Core", branch: "Anti-rotation",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("tuck-human-flag", 20, "seconds")] });
SKILLS.push({ id: "straddle-human-flag", name: "Straddle human flag", category: "Core", branch: "Anti-rotation",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("one-leg-human-flag", 20, "seconds")] });
SKILLS.push({ id: "full-human-flag", name: "Full human flag", category: "Core", branch: "Anti-rotation",
  isRoot: false, ladder: standardLadder("seconds"),
  formCheckpoints: ["Hips (sag)","Arms (elbow lockout)"],
  badgeRule: { tier: 10, variants: ["None","Minor","Major"] },
  prerequisites: [skillRef("straddle-human-flag", 20, "seconds")] });

// Compression (L-sit line)
SKILLS.push({ id: "tuck-lsit", name: "Tuck L-sit", category: "Core", branch: "Compression",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("hollow-body-hold", 15, "seconds")] });
SKILLS.push({ id: "full-lsit", name: "Full L-sit", category: "Core", branch: "Compression",
  isRoot: false, ladder: standardLadder("seconds"),
  formCheckpoints: ["Shoulders (depression)","Hips (height held steady)"],
  badgeRule: { tier: 10, variants: ["None","Minor","Major"] },
  prerequisites: [skillRef("tuck-lsit", 30, "seconds")] });
SKILLS.push({ id: "vsit", name: "V-sit", category: "Core", branch: "Compression",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("full-lsit", 15, "seconds")] });
SKILLS.push({ id: "manna", name: "Manna", category: "Core", branch: "Compression",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("vsit", 15, "seconds"), rawStat("dips", 20, "reps"), rawStat("German hang", 20, "seconds")] });
// Back Lever branch
SKILLS.push({ id: "tuck-back-lever", name: "Tuck back lever", category: "Core", branch: "Back Lever",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("dead hang", 30, "seconds"), rawStat("skin-the-cat", 1, "reps"), rawStat("Strict pull-up", 5, "reps")] });
SKILLS.push({ id: "adv-tuck-back-lever", name: "Advanced tuck back lever", category: "Core", branch: "Back Lever",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("tuck-back-lever", 20, "seconds")] });
SKILLS.push({ id: "straddle-back-lever", name: "Straddle back lever", category: "Core", branch: "Back Lever",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("adv-tuck-back-lever", 15, "seconds")] });
SKILLS.push({ id: "full-back-lever", name: "Full back lever", category: "Core", branch: "Back Lever",
  isRoot: false, ladder: standardLadder("seconds"),
  formCheckpoints: ["Shoulders (extension)","Back (arch/banana)","Arms (elbow bend)"],
  badgeRule: { tier: 10, variants: ["None","Minor","Major"] },
  prerequisites: [skillRef("straddle-back-lever", 10, "seconds")] });

// Dynamic
SKILLS.push({ id: "touch-front-lever", name: "Touch front lever", category: "Core", branch: "Dynamic",
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [skillRef("full-front-lever", 10, "seconds")] });
SKILLS.push({ id: "meat-hook", name: "Meat hook", category: "Core", branch: "Dynamic",
  isRoot: false, ladder: null, formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("skin-the-cat", 1, "reps"), rawStat("pike hold", 1, "reps"), rawStat("single-arm hang", 1, "reps")] });

// =====================================================================
// LEGS
// =====================================================================
SKILLS.push({ id: "bodyweight-squat", name: "Bodyweight squat", category: "Legs", branch: null,
  isRoot: true, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null, prerequisites: [] });

SKILLS.push({ id: "split-squat", name: "Split squat", category: "Legs", branch: "Squat Pattern",
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("Bodyweight squat", 25, "reps")] });
SKILLS.push({ id: "pistol-squat", name: "Pistol squat", category: "Legs", branch: "Squat Pattern",
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("Bodyweight squat", 50, "reps")] });
SKILLS.push({ id: "shrimp-squat", name: "Shrimp squat", category: "Legs", branch: "Squat Pattern",
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("Pistol squat", 10, "reps")] });
SKILLS.push({ id: "dragon-squat", name: "Dragon squat", category: "Legs", branch: "Squat Pattern",
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("Pistol squat", 3, "reps")] });

SKILLS.push({ id: "nordic-curl", name: "Nordic curl", category: "Legs", branch: "Hamstring/Hinge",
  isRoot: false, ladder: standardLadder("reps"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("single-leg hinge (per leg, 3x10-12)", 10, "reps")] });

SKILLS.push({ id: "single-leg-wall-sit", name: "Single Leg Wall Sit", category: "Legs", branch: "Static Hold",
  isRoot: false, ladder: standardLadder("seconds"), formCheckpoints: null, badgeRule: null,
  prerequisites: [rawStat("Wall Sit", 60, "seconds")] });
SKILLS.push({ id: "horse-stance", name: "Horse stance", category: "Legs", branch: "Static Hold",
  isRoot: false,
  ladder: [60,120,180,240,300].map(v => ({ value: v, unit: "seconds" })),
  formCheckpoints: null, badgeRule: null, prerequisites: [] });

// =====================================================================
// COMBO — binary unlock, cross-category references
// =====================================================================
function combo(id, name, prereqSkillIds) {
  return { id, name, category: "Combo", branch: null, isRoot: false,
    ladder: null, formCheckpoints: null, badgeRule: null,
    prerequisites: prereqSkillIds.map(s => skillRef(s, 1, "reps")) };
}
SKILLS.push(combo("combo-lsit-muscleup", "L-sit muscle-up", ["muscleup","full-lsit"]));
SKILLS.push(combo("combo-muscleup-hspu", "Muscle-up → HSPU", ["muscleup","handstand-pushup"]));
SKILLS.push(combo("combo-lsit-ring-muscleup", "L-sit Ring muscle-up", ["ring-muscleup","full-lsit"]));
SKILLS.push(combo("combo-ring-muscleup-hspu", "Ring muscle-up → HSPU", ["ring-muscleup","handstand-pushup"]));
SKILLS.push(combo("combo-handstand-planche", "Handstand → Planche", ["regular-handstand","full-planche"]));
SKILLS.push(combo("combo-lsit-handstand-90hspu", "L-sit → Handstand → 90° HSPU", ["full-lsit","regular-handstand","90-hspu"]));
SKILLS.push(combo("combo-lsit-planche", "L-sit → Planche", ["full-lsit","full-planche"]));
SKILLS.push(combo("combo-ring-handstand-planche", "Ring Handstand → Ring Planche", ["ring-handstand","ring-planche"]));
SKILLS.push(combo("combo-lsit-ring-handstand-ring-hspu", "L-sit → Ring Handstand → Ring HSPU", ["full-lsit","ring-handstand","ring-hspu"]));
SKILLS.push(combo("combo-inverted-hang-back-lever", "Inverted dead hang → pike → Back Lever", ["full-back-lever"]));

// ===== lookup helpers =====
const SKILLS_BY_ID = Object.fromEntries(SKILLS.map(s => [s.id, s]));
const SKILLS_BY_CATEGORY = SKILLS.reduce((acc, s) => {
  (acc[s.category] = acc[s.category] || []).push(s);
  return acc;
}, {});

if (typeof module !== "undefined") {
  module.exports = { SKILLS, SKILLS_BY_ID, SKILLS_BY_CATEGORY, ASCENSION_TITLES, standardLadder };
}
