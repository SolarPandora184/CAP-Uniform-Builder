const CATEGORY_META = {
  aviation_occupational: {
    label: "Aviation & Occupational Badges",
    sub: "Max 2 worn together, wearer's left, stacked above the ribbon rack."
  },
  specialty: {
    label: "STEM, Cyber, Rocketry & Marksmanship",
    sub: "Max 4 combined with the badges above, including the Specialty Track Badge dropdown. Rocketry and NRA Marksmanship have fixed spots."
  }
};

const RESTRICTION_LABEL = {
  cadet: "cadets only",
  cadet_nco: "cadet NCOs & officers",
  any: null
};

// ============================================================
// DEFAULT ANCHORS (no cord / plain jacket)
// ============================================================
// Anchor points as percentages of the coat image's width/height (0-100).
// Wearer's LEFT = image-right (ribbon/pocket side). Wearer's RIGHT =
// image-left (nametag side).
//
// Each anchor has an "align" telling render() which edge of the badge
// image should sit at that y-coordinate:
//   'top'    -> badge's top edge sits at y
//   'bottom' -> badge's bottom edge sits at y
//   'center' -> badge is centered on the point
// x is always the horizontal center regardless of align.
//
// Every anchor below corresponds to one calibration click. To
// recalibrate this image: open the live page with no cord selected,
// click "Calibrate anchors", click the described point, and paste the
// x/y readout straight into that field.
const ANCHORS = {
 pocketTop:    { x: 67.6, y: 34.4, align: "top" },
pocketFlap:   { x: 67.6, y: 36, align: "center" },
pocket:       { x: 67.6, y: 40, align: "top" },
belowNametag: { x: 31, y: 41.1, align: "top" },
aboveNametag: { x: 31, y: 30.8, align: "bottom" },

// --- reference points (paste into the same block, needed for the measurement overlay) ---
pocketBottom: { x: 67.6, y: 37.6 },
nametagTop:   { x: 31, y: 32.7 },
nametagBottom:{ x: 31, y: 35.5 },
  // Reference-only points — NOT used for any badge placement. They exist
  // purely so the dimension overlay (toggle button under the coat image)
  // can draw and label the actual regulation gaps against something.
  // Leave as null until calibrated; the overlay just skips lines it
  // doesn't have data for, same null-safe pattern as everything else here.
pocketBottom: { x: 67.6, y: 37.6 },
nametagTop:   { x: 31, y: 32.7 },
nametagBottom:{ x: 31, y: 35.5 },
};

// Vertical spacing (% of image height) between stacked aviation badges.
// Not a calibration click — aviation badges no longer have their own
// anchor at all. Both x and y are derived live from wherever the ribbon
// rack actually is (see assignPositions): x matches the rack's own
// centerline (same as anchors.pocket.x), and y sits the same
// proportional gap above the top ribbon row (or the pocket, if there
// are no ribbons) that layoutRibbonRack() already computes. This keeps
// the badge glued to the ribbons/pocket no matter which cord or badge
// combination is selected, with nothing that can drift out of sync.
const AVIATION_STEP = 5;

// ============================================================
// PER-CORD ANCHOR OVERRIDES
// ============================================================
// Each cord swaps in a completely different coat photo, so it needs
// its own calibration. Every block below has the SAME six fields as
// the default ANCHORS above, with the same click instructions — fill
// each one in by selecting that cord, clicking "Calibrate anchors",
// clicking the described point, and pasting the x/y readout straight
// in. Leave a field as `null` (for either x or y) and it's ignored —
// that specific anchor just falls back to the default ANCHORS until
// you fill it in, so you can calibrate a cord one point at a time
// without anything breaking in between.
const ANCHOR_OVERRIDES = {

  // --- RED ----------------------------------------------------
  red: {
    pocket:       { x: 66.2, y: 40.0, align: "top" },     // TOP edge of pocket-slot badge (rocketry)
    pocketFlap:   { x: 66.2, y: 36.4, align: "center" },  // CENTER of the pocket (NRA Marksmanship)
    pocketTop:    { x: null, y: null, align: "top" },     // TOP edge of the pocket (ribbon rack rests here) — not yet calibrated
    belowNametag: { x: 30.3, y: 38.2, align: "top" },     // TOP edge of badge below the nameplate
    aboveNametag: { x: 30.3, y: 30.6, align: "bottom" },  // BOTTOM edge of badge above the nameplate
    pocketBottom:  { x: null, y: null },  // BOTTOM edge of the pocket (for the measurement overlay)
    nametagTop:    { x: null, y: null },  // TOP edge of the nameplate (for the measurement overlay)
    nametagBottom: { x: null, y: null },  // BOTTOM edge of the nameplate (for the measurement overlay)
  },

  // --- BLUE ---------------------------------------------------
  blue: {
    pocket:       { x: null, y: null, align: "top" },     // TOP edge of pocket-slot badge (rocketry)
    pocketFlap:   { x: null, y: null, align: "center" },  // CENTER of the pocket (NRA Marksmanship)
    pocketTop:    { x: null, y: null, align: "top" },     // TOP edge of the pocket (ribbon rack rests here)
    belowNametag: { x: null, y: null, align: "top" },     // TOP edge of badge below the nameplate
    aboveNametag: { x: null, y: null, align: "bottom" },  // BOTTOM edge of badge above the nameplate
    pocketBottom:  { x: null, y: null },  // BOTTOM edge of the pocket (for the measurement overlay)
    nametagTop:    { x: null, y: null },  // TOP edge of the nameplate (for the measurement overlay)
    nametagBottom: { x: null, y: null },  // BOTTOM edge of the nameplate (for the measurement overlay)
  },

  // --- GREEN --------------------------------------------------
  green: {
    pocket:       { x: null, y: null, align: "top" },
    pocketFlap:   { x: null, y: null, align: "center" },
    pocketTop:    { x: null, y: null, align: "top" },
    belowNametag: { x: null, y: null, align: "top" },
    aboveNametag: { x: null, y: null, align: "bottom" },
    pocketBottom:  { x: null, y: null },  // BOTTOM edge of the pocket (for the measurement overlay)
    nametagTop:    { x: null, y: null },  // TOP edge of the nameplate (for the measurement overlay)
    nametagBottom: { x: null, y: null },  // BOTTOM edge of the nameplate (for the measurement overlay)
  },

  // --- WHITE --------------------------------------------------
  white: {
    pocket:       { x: null, y: null, align: "top" },
    pocketFlap:   { x: null, y: null, align: "center" },
    pocketTop:    { x: null, y: null, align: "top" },
    belowNametag: { x: null, y: null, align: "top" },
    aboveNametag: { x: null, y: null, align: "bottom" },
    pocketBottom:  { x: null, y: null },  // BOTTOM edge of the pocket (for the measurement overlay)
    nametagTop:    { x: null, y: null },  // TOP edge of the nameplate (for the measurement overlay)
    nametagBottom: { x: null, y: null },  // BOTTOM edge of the nameplate (for the measurement overlay)
  },

  // --- BLACK --------------------------------------------------
  black: {
    pocket:       { x: null, y: null, align: "top" },
    pocketFlap:   { x: null, y: null, align: "center" },
    pocketTop:    { x: null, y: null, align: "top" },
    belowNametag: { x: null, y: null, align: "top" },
    aboveNametag: { x: null, y: null, align: "bottom" },
    pocketBottom:  { x: null, y: null },  // BOTTOM edge of the pocket (for the measurement overlay)
    nametagTop:    { x: null, y: null },  // TOP edge of the nameplate (for the measurement overlay)
    nametagBottom: { x: null, y: null },  // BOTTOM edge of the nameplate (for the measurement overlay)
  },

  // --- SILVER -------------------------------------------------
  silver: {
    pocket:       { x: null, y: null, align: "top" },
    pocketFlap:   { x: null, y: null, align: "center" },
    pocketTop:    { x: null, y: null, align: "top" },
    belowNametag: { x: null, y: null, align: "top" },
    aboveNametag: { x: null, y: null, align: "bottom" },
    pocketBottom:  { x: null, y: null },  // BOTTOM edge of the pocket (for the measurement overlay)
    nametagTop:    { x: null, y: null },  // TOP edge of the nameplate (for the measurement overlay)
    nametagBottom: { x: null, y: null },  // BOTTOM edge of the nameplate (for the measurement overlay)
  },

};

function getActiveAnchors() {
  const override = selectedCord ? ANCHOR_OVERRIDES[selectedCord] : null;
  if (!override) return ANCHORS;

  // Only apply fields that are actually filled in (both x and y non-null).
  // Anything still null falls back to the default ANCHORS untouched, so a
  // cord can be calibrated one point at a time without breaking the rest.
  const applied = {};
  for (const key of Object.keys(override)) {
    const entry = override[key];
    if (entry && entry.x != null && entry.y != null) {
      applied[key] = entry;
    }
  }
  return { ...ANCHORS, ...applied };
}

// Fallback cord band path, as percentage-based points along the coat
// (used only if a real coat+cord photo hasn't been uploaded for the
// selected color). Runs from the wearer's-left shoulder seam down
// under the arm — a rough stand-in, not a precise drape.
const CORD_PATH = [
  { x: 74, y: 8 },
  { x: 78, y: 18 },
  { x: 70, y: 30 },
  { x: 66, y: 44 }
];

// Ribbon rack geometry, in the same % coordinate space as ANCHORS.
// Rack width matches the wearer's-left welt pocket edges (measured from
// images/coat-front.png), per CAPR 39-1 11.2.7: rows of three are
// "centered above the pocket between the left and right pocket edges."
// The bottom row's bottom edge sits exactly on ANCHORS.pocketTop.y
// ("resting on, but not over, top edge of left welt or pocket").
//
// Row height isn't a guessed constant — it's derived below from the
// actual ribbon PNGs' aspect ratio (100x30, i.e. 10:3) so that stacked
// rows touch exactly with zero gap, matching "There will be no space
// between the rows of ribbons" (CAPR 39-1 11.2.7/11.3.3).
const COAT_IMG = { width: 1106, height: 1422 }; // must match images/coat-front.png's actual pixel size
const RIBBON_ASPECT = 100 / 30; // width:height of the ribbon PNGs in images/ribbons/
// Rendered ribbon height is nudged slightly taller than the exact
// mathematical row spacing so adjacent rows overlap by a hair instead of
// touching exactly — guards against a 1px seam from browser sub-pixel
// rounding, which can otherwise show as a thin gap even when the math
// is perfect. The extra overlap is small enough to be invisible.
const RIBBON_OVERLAP = 1.06;

// Badges vary wildly in natural shape (rocketry is a tall thin pin,
// sUAS wings are wide and flat, STEM is roughly square), so instead of
// forcing one fixed width or height, each badge is scaled to fit inside
// a fixed pixel box (like CSS object-fit: contain) while preserving its
// own proportions. Sized via each image's actual naturalWidth/Height
// once loaded, so it works for any future badge image without needing
// per-badge tuning.
const BADGE_BOX_PX = 70;

const RIBBON_RACK_WIDTH = 15.6; // total rack width in % of image width, centered on the ACTIVE profile's pocket-side x

function getRibbonRackBounds() {
  const center = getActiveAnchors().pocket.x; // already reflects any per-cord override
  return {
    leftPct: center - RIBBON_RACK_WIDTH / 2,
    rightPct: center + RIBBON_RACK_WIDTH / 2
  };
}

// ============================================================
// GUIDED CALIBRATION: derive all 5 anchors from 6 primitive clicks
// ============================================================
// Real-world height of the CAP Class A nameplate, in inches — this is
// the one fact that lets us convert the regulation's inch-based offsets
// ("1 1/2 inch below the nametag", etc.) into percentages of any given
// coat image. Confirmed directly, not assumed.
const NAMETAG_HEIGHT_IN = 0.75;

// Turns 6 raw clicked points into the 5 badge anchors, using the exact
// offsets from CAPR 39-1 4.1.5.2.2.4.2:
//   - pocketFlap (NRA Marksmanship): centered on the pocket — pure
//     geometry, no inches needed, since it's literally the pocket's
//     own midpoint.
//   - pocketTop (ribbon rack boundary): the pocket's top edge itself —
//     also pure geometry, no offset.
//   - pocket (rocketry/first specialty badge): "1 1/2 inch below top
//     of welt pocket"
//   - belowNametag: "1 1/2 inch below the nametag" (measured from the
//     nametag's bottom edge to the badge's top edge)
//   - aboveNametag: "1/2 inch above the nametag" (measured from the
//     nametag's top edge to the badge's bottom edge)
function deriveAnchorsFromPrimitives(p) {
  const round1 = n => Math.round(n * 10) / 10;
  const inchesToPct = (p.nametagBottomY - p.nametagTopY) / NAMETAG_HEIGHT_IN;

  return {
    anchors: {
      pocketTop:    { x: round1(p.pocketSideX), y: round1(p.pocketTopY), align: "top" },
      pocketFlap:   { x: round1(p.pocketSideX), y: round1((p.pocketTopY + p.pocketBottomY) / 2), align: "center" },
      pocket:       { x: round1(p.pocketSideX), y: round1(p.pocketTopY + 1.5 * inchesToPct), align: "top" },
      belowNametag: { x: round1(p.nametagSideX), y: round1(p.nametagBottomY + 1.5 * inchesToPct), align: "top" },
      aboveNametag: { x: round1(p.nametagSideX), y: round1(p.nametagTopY - 0.5 * inchesToPct), align: "bottom" }
    },
    // Raw reference points (not used for badge placement, only for the
    // measurement overlay — it needs the actual nameplate/pocket edges,
    // which otherwise get discarded once the anchors above are computed.
    reference: {
      pocketBottom:  { x: round1(p.pocketSideX), y: round1(p.pocketBottomY) },
      nametagTop:    { x: round1(p.nametagSideX), y: round1(p.nametagTopY) },
      nametagBottom: { x: round1(p.nametagSideX), y: round1(p.nametagBottomY) }
    },
    inchesToPct,
    warnings: validatePrimitives(p, inchesToPct)
  };
}

// Catches exactly the kind of silent error found earlier (a stale
// pocketTop that put a badge's top edge ABOVE the pocket instead of
// below it) instead of producing a result that looks fine on paper but
// is actually backwards.
function validatePrimitives(p, inchesToPct) {
  const warnings = [];
  if (p.pocketBottomY <= p.pocketTopY) {
    warnings.push("Pocket bottom is above pocket top — did you click those in the wrong order?");
  }
  if (p.nametagBottomY <= p.nametagTopY) {
    warnings.push("Nameplate bottom is above nameplate top — did you click those in the wrong order?");
  }
  if (!Number.isFinite(inchesToPct) || inchesToPct <= 0) {
    warnings.push("Couldn't compute a usable inches-to-% scale from the nameplate clicks.");
  } else if (inchesToPct < 1 || inchesToPct > 15) {
    warnings.push(`Scale factor came out to ${inchesToPct.toFixed(2)}% per inch, which is an unusual value — double-check the nameplate top/bottom clicks.`);
  }
  return warnings;
}

const GUIDED_STEPS = [
  { key: "pocketTopY",    axis: "y", label: "Click the TOP edge of the pocket" },
  { key: "pocketBottomY", axis: "y", label: "Click the BOTTOM edge of the pocket" },
  { key: "pocketSideX",   axis: "x", label: "Click the CENTERLINE of the pocket (left-right center)" },
  { key: "nametagTopY",   axis: "y", label: "Click the TOP edge of the nameplate" },
  { key: "nametagBottomY",axis: "y", label: "Click the BOTTOM edge of the nameplate" },
  { key: "nametagSideX",  axis: "x", label: "Click the CENTERLINE of the nameplate (left-right center)" }
];

let guidedActive = false;
let guidedStepIndex = 0;
let guidedValues = {};

function stopGuidedCalibration() {
  guidedActive = false;
  const startBtn = document.getElementById("guided-start");
  const stepText = document.getElementById("guided-step");
  const frame = document.getElementById("uniform-frame");
  if (!freeformCalibrationActive) frame.style.cursor = "default";
  if (stepText) stepText.textContent = "";
}

function setupGuidedCalibration() {
  const startBtn = document.getElementById("guided-start");
  const stepText = document.getElementById("guided-step");
  const frame = document.getElementById("uniform-frame");
  const outputWrap = document.getElementById("guided-output-wrap");
  const output = document.getElementById("guided-output");
  const copyBtn = document.getElementById("guided-copy");

  startBtn.addEventListener("click", () => {
    // Only one calibration mode active at a time.
    freeformCalibrationActive = false;
    document.getElementById("calibrate-toggle").classList.remove("active");
    document.getElementById("calibrate-crosshair").hidden = true;
    document.getElementById("calibrate-readout").textContent = "";

    guidedActive = true;
    guidedStepIndex = 0;
    guidedValues = {};
    outputWrap.hidden = true;
    output.value = "";
    frame.style.cursor = "crosshair";
    stepText.textContent = `Step 1 of 6: ${GUIDED_STEPS[0].label}`;
  });

  frame.addEventListener("click", (e) => {
    if (!guidedActive) return;

    const rect = frame.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    const step = GUIDED_STEPS[guidedStepIndex];
    guidedValues[step.key] = step.axis === "x" ? xPct : yPct;

    guidedStepIndex++;
    if (guidedStepIndex < GUIDED_STEPS.length) {
      stepText.textContent = `Step ${guidedStepIndex + 1} of 6: ${GUIDED_STEPS[guidedStepIndex].label}`;
    } else {
      guidedActive = false;
      frame.style.cursor = "default";
      stepText.textContent = "Done — see the code below.";
      showGuidedResult(outputWrap, output);
    }
  });

  copyBtn.addEventListener("click", () => {
    output.select();
    document.execCommand("copy");
  });
}

function showGuidedResult(outputWrap, output) {
  const { anchors, reference, inchesToPct, warnings } = deriveAnchorsFromPrimitives(guidedValues);
  const profileLabel = selectedCord ? `cord: ${selectedCord}` : "default (no cord)";

  const lines = [];
  lines.push(`// Profile: ${profileLabel}`);
  lines.push(`// Scale: ${inchesToPct.toFixed(2)}% of image height per inch (from a ${NAMETAG_HEIGHT_IN}" nameplate)`);
  if (warnings.length) {
    lines.push("// ⚠ WARNINGS — check these before using this result:");
    warnings.forEach(w => lines.push(`//   - ${w}`));
  }
  lines.push("");
  lines.push("// --- badge anchors (paste into ANCHORS or that cord's block) ---");
  for (const [key, val] of Object.entries(anchors)) {
    const pad = " ".repeat(Math.max(0, 13 - key.length));
    lines.push(`${key}:${pad}{ x: ${val.x}, y: ${val.y}, align: "${val.align}" },`);
  }
  lines.push("");
  lines.push("// --- reference points (paste into the same block, needed for the measurement overlay) ---");
  for (const [key, val] of Object.entries(reference)) {
    const pad = " ".repeat(Math.max(0, 13 - key.length));
    lines.push(`${key}:${pad}{ x: ${val.x}, y: ${val.y} },`);
  }

  outputWrap.hidden = false;
  output.value = lines.join("\n");
}

const BADGE_IMG_DIR = "images/badges/";

function findBadge(id) {
  return BADGES.find(b => b.id === id) || TRACKS.find(b => b.id === id);
}

let BADGES = [];
let TRACKS = [];
let CORDS = [];
let RIBBONS = [];
let RIBBON_ROW_SIZE = 3;
let LIMITS = { totalMax: 4, aviationOccupationalMax: 2 };
const selected = new Set();
const selectedRibbons = new Set();
let selectedCord = null;
let selectedTrack = null;

const DATA_VERSION = 12;

async function init() {
  const [badgeRes, cordRes, ribbonRes] = await Promise.all([
    fetch(`badges.json?v=${DATA_VERSION}`),
    fetch(`cords.json?v=${DATA_VERSION}`),
    fetch(`ribbons.json?v=${DATA_VERSION}`)
  ]);
  const data = await badgeRes.json();
  const cordData = await cordRes.json();
  const ribbonData = await ribbonRes.json();
  BADGES = data.badges;
  TRACKS = data.specialtyTracks || [];
  LIMITS = data.limits;
  CORDS = cordData.cords;
  RIBBONS = ribbonData.ribbons;
  RIBBON_ROW_SIZE = ribbonData.rowSize || 3;
  renderChecklist();
  renderCordOptions();
  renderTrackOptions();
  renderRibbonChecklist();
  setupRowSizeToggle();
  setupCalibration();
  setupGuidedCalibration();
  setupMeasurementToggle();
  render();
}

function setupRowSizeToggle() {
  const buttons = document.querySelectorAll(".row-size-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      RIBBON_ROW_SIZE = parseInt(btn.dataset.size, 10);
      buttons.forEach(b => b.classList.toggle("active", b === btn));
      render();
    });
  });
}

function renderChecklist() {
  const root = document.getElementById("badge-checklist");
  root.innerHTML = "";

  for (const [catKey, meta] of Object.entries(CATEGORY_META)) {
    const group = document.createElement("div");
    group.className = "cat-group";

    const h2 = document.createElement("h2");
    h2.textContent = meta.label;
    const sub = document.createElement("p");
    sub.className = "cat-sub";
    sub.textContent = meta.sub;
    group.appendChild(h2);
    group.appendChild(sub);

    BADGES.filter(b => b.category === catKey).forEach(b => {
      const row = document.createElement("div");
      row.className = "badge-row";
      row.dataset.id = b.id;

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = `cb-${b.id}`;
      cb.addEventListener("change", () => toggle(b.id, cb));

      const label = document.createElement("label");
      label.setAttribute("for", cb.id);
      const nameEl = document.createElement("div");
      nameEl.className = "b-name";
      nameEl.textContent = b.name;
      label.appendChild(nameEl);

      const restriction = RESTRICTION_LABEL[b.restrictedTo];
      const noteBits = [];
      if (restriction) noteBits.push(restriction);
      if (b.fixedSlot) noteBits.push("fixed position");
      if (b.note) noteBits.push(b.note);
      if (noteBits.length) {
        const noteEl = document.createElement("div");
        noteEl.className = "b-note";
        noteEl.textContent = noteBits.join(" · ");
        label.appendChild(noteEl);
      }

      row.appendChild(cb);
      row.appendChild(label);
      group.appendChild(row);
    });

    root.appendChild(group);
  }
}

// Rocketry (fixedSlot "pocket") always claims the pocket slot, which
// leaves only 2 open slots (below/above nametag) for other non-fixed
// specialty badges instead of 3. Adding a badge that would push the
// queueable count past whatever's available — in either direction,
// whether the new badge IS rocketry or one of the queueable ones —
// silently dropped one before; this catches it up front instead.
function wouldOverflowSpecialtySlots(newId) {
  const hypothetical = new Set(selected);
  hypothetical.add(newId);
  const hasRocketry = [...hypothetical].some(id => {
    const b = findBadge(id);
    return b && b.fixedSlot === "pocket";
  });
  const queueableCount = [...hypothetical].filter(id => {
    const b = findBadge(id);
    return b && b.category === "specialty" && !b.fixedSlot;
  }).length;
  const availableSlots = hasRocketry ? 2 : 3;
  return queueableCount > availableSlots;
}

function toggle(id, checkbox) {
  const badge = findBadge(id);
  const willSelect = checkbox.checked;

  if (willSelect) {
    const totalCount = selected.size;
    const aviationCount = [...selected].filter(bid =>
      findBadge(bid).category === "aviation_occupational"
    ).length;

    if (totalCount >= LIMITS.totalMax) {
      checkbox.checked = false;
      flashLimit("count-total");
      return;
    }
    if (badge.category === "aviation_occupational" && aviationCount >= LIMITS.aviationOccupationalMax) {
      checkbox.checked = false;
      flashLimit("count-aviation");
      return;
    }
    if (badge.category === "specialty" && wouldOverflowSpecialtySlots(id)) {
      checkbox.checked = false;
      flashLimit("count-total");
      return;
    }
    selected.add(id);
  } else {
    selected.delete(id);
  }

  render();
}

function flashLimit(pillId) {
  const pill = document.getElementById(pillId);
  pill.classList.add("warn");
  setTimeout(() => pill.classList.remove("warn"), 700);
}

function updateCounts() {
  const total = selected.size;
  const aviation = [...selected].filter(bid =>
    findBadge(bid).category === "aviation_occupational"
  ).length;

  document.getElementById("count-total").textContent = `Total ${total} / ${LIMITS.totalMax}`;
  document.getElementById("count-aviation").textContent = `Aviation/Occ ${aviation} / ${LIMITS.aviationOccupationalMax}`;
}

function assignPositions(ribbonTopY, aviationGapPct) {
  const chosen = [...selected].map(id => findBadge(id));
  const placements = [];
  const anchors = getActiveAnchors();

  // Aviation/occupational badges: stack upward from just above the ribbon
  // rack (or the pocket, if no ribbons), sharing the rack's own centerline —
  // no separate calibration needed, this just follows wherever the ribbons are.
  const aviationBaseY = ribbonTopY - aviationGapPct;
  const aviationX = anchors.pocket.x;
  const aviation = chosen.filter(b => b.category === "aviation_occupational");
  aviation.forEach((b, i) => {
    placements.push({
      badge: b,
      x: aviationX,
      y: aviationBaseY - i * AVIATION_STEP,
      align: "center"
    });
  });

  // Specialty group: rocketry and marksmanship are fixed; everything else queues
  // into pocket -> below-nametag -> above-nametag, skipping the pocket slot if
  // rocketry already occupies it.
  const specialty = chosen.filter(b => b.category === "specialty");
  const rocketry = specialty.find(b => b.fixedSlot === "pocket");
  const marksmanship = specialty.find(b => b.fixedSlot === "pocket_flap");
  const queueable = specialty.filter(b => !b.fixedSlot);

  if (rocketry) placements.push({ badge: rocketry, ...anchors.pocket });
  if (marksmanship) placements.push({ badge: marksmanship, ...anchors.pocketFlap });

  const slotOrder = rocketry
    ? [anchors.belowNametag, anchors.aboveNametag]
    : [anchors.pocket, anchors.belowNametag, anchors.aboveNametag];

  queueable.forEach((b, i) => {
    const slot = slotOrder[i];
    if (slot) placements.push({ badge: b, x: slot.x, y: slot.y, align: slot.align });
  });

  return placements;
}

const RIBBON_GROUP_LABELS = {
  decoration: "Civil Air Patrol Decorations",
  cadet_award: "Cadet Program Awards/Achievements",
  service: "Service Awards",
  activity: "Activity & Participation Awards"
};

function renderRibbonChecklist() {
  const root = document.getElementById("ribbon-checklist");
  root.innerHTML = "";

  for (const [groupKey, label] of Object.entries(RIBBON_GROUP_LABELS)) {
    const group = document.createElement("div");
    group.className = "cat-group";

    const h3 = document.createElement("h2");
    h3.style.fontSize = "14px";
    h3.textContent = label;
    group.appendChild(h3);

    RIBBONS.filter(r => r.group === groupKey).forEach(r => {
      const row = document.createElement("div");
      row.className = "badge-row";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = `rb-${r.id}`;
      cb.addEventListener("change", () => {
        if (cb.checked) selectedRibbons.add(r.id);
        else selectedRibbons.delete(r.id);
        render();
      });

      const label2 = document.createElement("label");
      label2.setAttribute("for", cb.id);
      const nameEl = document.createElement("div");
      nameEl.className = "b-name";
      nameEl.textContent = r.name;
      label2.appendChild(nameEl);

      row.appendChild(cb);
      row.appendChild(label2);
      group.appendChild(row);
    });

    root.appendChild(group);
  }
}

// Builds the ribbon rack: sorts selected ribbons by precedence (1 = highest,
// worn topmost), splits into rows, and returns both the placements and the
// y-coordinate of the top of the stack (or the pocket, if no ribbons are
// selected) so aviation badges can be anchored relative to it.
function layoutRibbonRack() {
  const chosen = [...selectedRibbons]
    .map(id => RIBBONS.find(r => r.id === id))
    .filter(Boolean)
    .sort((a, b) => a.precedence - b.precedence);

  const n = chosen.length;
  const placements = [];
  const pocketTopY = getActiveAnchors().pocketTop.y;
  const rackBounds = getRibbonRackBounds();

  if (n === 0) {
    // No ribbons: badge sits 1/2" above the pocket top edge directly.
    // Derive that gap from a hypothetical single row's height so it's
    // consistent with the ribbon-present case, not a separate guess.
    const rackWidth0 = rackBounds.rightPct - rackBounds.leftPct;
    const slotWidth0 = rackWidth0 / RIBBON_ROW_SIZE;
    const rowHeightPct0 = ((slotWidth0 / 100) * COAT_IMG.width / RIBBON_ASPECT / COAT_IMG.height) * 100;
    return { placements, topY: pocketTopY, aviationGapPct: rowHeightPct0 * (0.5 / 0.375) };
  }

  const rowSize = RIBBON_ROW_SIZE;
  const totalRows = Math.ceil(n / rowSize);
  const topRowCount = n - (totalRows - 1) * rowSize;
  const rackWidth = rackBounds.rightPct - rackBounds.leftPct;
  const slotWidth = rackWidth / rowSize;

  // Derive row height from the ribbon image's real aspect ratio so rows
  // touch with zero gap, rather than guessing a percentage.
  const slotWidthPx = (slotWidth / 100) * COAT_IMG.width;
  const rowHeightPx = slotWidthPx / RIBBON_ASPECT;
  const rowHeightPct = (rowHeightPx / COAT_IMG.height) * 100;

  // Build rows top-to-bottom: row 0 (top) gets the highest-precedence
  // ribbons (the "leftover" count so every row below it is full).
  const rows = [];
  let cursor = 0;
  rows.push(chosen.slice(cursor, cursor + topRowCount));
  cursor += topRowCount;
  while (cursor < n) {
    rows.push(chosen.slice(cursor, cursor + rowSize));
    cursor += rowSize;
  }

  rows.forEach((rowItems, rowIndex) => {
    // Bottom row's bottom edge sits exactly on the pocket top edge; rows
    // stack upward from there with no gap between them.
    const rowsFromBottom = rows.length - 1 - rowIndex;
    const rowBottomY = pocketTopY - rowsFromBottom * rowHeightPct;
    const rowCenterY = rowBottomY - rowHeightPct / 2;

    const rowContentWidth = slotWidth * rowItems.length;
    const rowStartX = rackBounds.leftPct + (rackWidth - rowContentWidth) / 2;

    rowItems.forEach((ribbon, i) => {
      placements.push({
        ribbon,
        x: rowStartX + slotWidth * (i + 0.5),
        y: rowCenterY,
        width: slotWidth,
        height: rowHeightPct
      });
    });
  });

  // Aviation badge gap is proportional to row height: a real ribbon row
  // is 3/8" tall and the badge sits 1/2" above the stack, so the gap is
  // row height scaled by (0.5 / 0.375).
  const aviationGapPct = rowHeightPct * (0.5 / 0.375);
  const topY = pocketTopY - rows.length * rowHeightPct;
  return { placements, topY, aviationGapPct };
}

function renderTrackOptions() {
  const select = document.getElementById("track-select");
  select.innerHTML = "";

  const noneOpt = document.createElement("option");
  noneOpt.value = "";
  noneOpt.textContent = "None";
  select.appendChild(noneOpt);

  TRACKS.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    select.appendChild(opt);
  });

  select.addEventListener("change", () => {
    const newId = select.value || null;

    if (newId) {
      // Count everything else already selected, excluding the track we're about to replace.
      const totalExcludingOldTrack = [...selected].filter(id => id !== selectedTrack).length;

      if (totalExcludingOldTrack >= LIMITS.totalMax) {
        select.value = selectedTrack || "";
        flashLimit("count-total");
        return;
      }

      const withoutOldTrack = new Set(selected);
      if (selectedTrack) withoutOldTrack.delete(selectedTrack);
      const hasRocketry = [...withoutOldTrack, newId].some(id => {
        const b = findBadge(id);
        return b && b.fixedSlot === "pocket";
      });
      const queueableCount = [...withoutOldTrack, newId].filter(id => {
        const b = findBadge(id);
        return b && b.category === "specialty" && !b.fixedSlot;
      }).length;
      if (queueableCount > (hasRocketry ? 2 : 3)) {
        select.value = selectedTrack || "";
        flashLimit("count-total");
        return;
      }
    }

    if (selectedTrack) selected.delete(selectedTrack);
    if (newId) selected.add(newId);
    selectedTrack = newId;
    render();
  });
}

function renderCordOptions() {
  const select = document.getElementById("cord-select");
  select.innerHTML = "";

  const noneOpt = document.createElement("option");
  noneOpt.value = "";
  noneOpt.textContent = "None";
  select.appendChild(noneOpt);

  CORDS.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    select.appendChild(opt);
  });

  select.addEventListener("change", () => {
    selectedCord = select.value || null;
    renderCord();
  });
}

function renderCord() {
  const coatImg = document.getElementById("coat-img");
  const fallbackSvg = document.getElementById("cord-fallback");
  fallbackSvg.innerHTML = "";

  if (!selectedCord) {
    coatImg.src = "images/coat-front.png";
    return;
  }

  const cord = CORDS.find(c => c.id === selectedCord);

  // Try the real coat+cord composite photo first.
  const probe = new Image();
  probe.onload = () => { coatImg.src = cord.image; };
  probe.onerror = () => {
    // No real photo uploaded yet — keep the plain coat and draw a
    // simple placeholder band in the cord's color instead.
    coatImg.src = "images/coat-front.png";
    drawFallbackCord(cord.hex);
  };
  probe.src = cord.image;
}

function drawFallbackCord(hex) {
  const svg = document.getElementById("cord-fallback");
  const points = CORD_PATH.map(p => `${p.x},${p.y}`).join(" ");
  const ns = "http://www.w3.org/2000/svg";

  const line = document.createElementNS(ns, "polyline");
  line.setAttribute("points", points);
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", hex);
  line.setAttribute("stroke-width", "3.2");
  line.setAttribute("stroke-linecap", "round");
  line.setAttribute("stroke-linejoin", "round");
  line.setAttribute("vector-effect", "non-scaling-stroke");
  svg.appendChild(line);

  const loop = document.createElementNS(ns, "circle");
  loop.setAttribute("cx", CORD_PATH[0].x);
  loop.setAttribute("cy", CORD_PATH[0].y);
  loop.setAttribute("r", "1.8");
  loop.setAttribute("fill", hex);
  svg.appendChild(loop);
}

// --- Calibration mode: click the coat to read off % coordinates for ANCHORS ---
let freeformCalibrationActive = false;

function setupCalibration() {
  const toggleBtn = document.getElementById("calibrate-toggle");
  const frame = document.getElementById("uniform-frame");
  const crosshair = document.getElementById("calibrate-crosshair");
  const readout = document.getElementById("calibrate-readout");

  toggleBtn.addEventListener("click", () => {
    freeformCalibrationActive = !freeformCalibrationActive;
    if (freeformCalibrationActive) stopGuidedCalibration(); // only one mode active at a time
    toggleBtn.classList.toggle("active", freeformCalibrationActive);
    crosshair.hidden = !freeformCalibrationActive;
    readout.textContent = freeformCalibrationActive ? "Click the coat to read x/y %" : "";
    frame.style.cursor = freeformCalibrationActive ? "crosshair" : "default";
  });

  frame.addEventListener("click", (e) => {
    if (!freeformCalibrationActive) return;
    const rect = frame.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    crosshair.style.left = `${xPct}%`;
    crosshair.style.top = `${yPct}%`;
    const text = `x: ${xPct.toFixed(1)}%, y: ${yPct.toFixed(1)}%`;
    readout.textContent = text;
    console.log("Anchor point ->", text);
  });
}

let measurementsVisible = false;

function setupMeasurementToggle() {
  const btn = document.getElementById("measurement-toggle");
  const svg = document.getElementById("measurement-overlay");
  btn.addEventListener("click", () => {
    measurementsVisible = !measurementsVisible;
    btn.classList.toggle("active", measurementsVisible);
    svg.hidden = !measurementsVisible;
    render();
  });
}

// Draws the actual CAPR 39-1 distance (a fixed number, always — this is
// NOT a live ruler measuring the current pixel gap) between each pair of
// real reference points, wherever they currently render. Purely a visual
// aid: it never reads from or writes back into ANCHORS/placements, so it
// can't affect badge positions no matter what it's toggled to.
function renderMeasurements(ribbonTopY, placements) {
  const svg = document.getElementById("measurement-overlay");
  svg.innerHTML = "";
  if (!measurementsVisible) return;

  const anchors = getActiveAnchors();
  const ns = "http://www.w3.org/2000/svg";

  function drawGap(x, yTop, yBottom, label) {
    if (!Number.isFinite(yTop) || !Number.isFinite(yBottom)) return;
    const line = document.createElementNS(ns, "line");
    line.setAttribute("class", "measurement-line");
    line.setAttribute("x1", x); line.setAttribute("y1", yTop);
    line.setAttribute("x2", x); line.setAttribute("y2", yBottom);
    svg.appendChild(line);

    [yTop, yBottom].forEach(y => {
      const tick = document.createElementNS(ns, "line");
      tick.setAttribute("class", "measurement-tick");
      tick.setAttribute("x1", x - 1.2); tick.setAttribute("y1", y);
      tick.setAttribute("x2", x + 1.2); tick.setAttribute("y2", y);
      svg.appendChild(tick);
    });

    const text = document.createElementNS(ns, "text");
    text.setAttribute("class", "measurement-label");
    text.setAttribute("x", x + 1.8);
    text.setAttribute("y", (yTop + yBottom) / 2 + 1);
    text.textContent = label;
    svg.appendChild(text);
  }

  // Pocket top -> pocket-slot badge (rocketry etc.): 1.5" per CAPR 39-1
  drawGap(anchors.pocket.x, anchors.pocketTop.y, anchors.pocket.y, '1.5"');

  // Nameplate bottom -> badge below nameplate: 1.5"
  if (anchors.nametagBottom && anchors.nametagBottom.y != null) {
    drawGap(anchors.belowNametag.x, anchors.nametagBottom.y, anchors.belowNametag.y, '1.5"');
  }

  // Nameplate top -> badge above nameplate: 0.5"
  if (anchors.nametagTop && anchors.nametagTop.y != null) {
    drawGap(anchors.aboveNametag.x, anchors.nametagTop.y, anchors.aboveNametag.y, '0.5"');
  }

  // Ribbon rack top (or pocket top, if no ribbons) -> first aviation badge: 0.5"
  const aviationPlacement = placements.find(p => p.badge.category === "aviation_occupational");
  if (aviationPlacement) {
    drawGap(aviationPlacement.x, ribbonTopY, aviationPlacement.y, '0.5"');
  }
}

function render() {
  updateCounts();

  const rackLayer = document.getElementById("ribbon-stack");
  rackLayer.innerHTML = "";
  const { placements: ribbonPlacements, topY, aviationGapPct } = layoutRibbonRack();

  ribbonPlacements.forEach(({ ribbon, x, y, width, height }) => {
    const img = document.createElement("img");
    img.className = "ribbon-pin";
    img.src = `images/ribbons/${ribbon.id}.png`;
    img.alt = ribbon.name;
    img.title = ribbon.name;
    img.style.left = `${x}%`;
    img.style.top = `${y}%`;
    img.style.width = `${width}%`;
    img.style.height = `${height * RIBBON_OVERLAP}%`;
    img.addEventListener("error", () => { img.style.display = "none"; });
    rackLayer.appendChild(img);
  });

  const layer = document.getElementById("badge-layer");
  layer.innerHTML = "";

  const placements = assignPositions(topY, aviationGapPct);
  placements.forEach(({ badge, x, y, align }) => {
    // Safety net: "top: undefined%" / "top: NaN%" is invalid CSS and gets
    // silently ignored by the browser, which makes position:absolute
    // elements fall back to the top-left of their container — exactly
    // the "badge flies to the top of the screen" symptom. Skip instead
    // of rendering somewhere wrong, and log it so it's traceable.
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      console.warn(`Skipping "${badge.name}" — invalid position (x=${x}, y=${y}). Check ANCHORS / ANCHOR_OVERRIDES for a missing or malformed entry.`);
      return;
    }

    const img = document.createElement("img");
    img.className = "badge-pin";
    img.alt = badge.name;
    img.title = badge.name;
    img.style.left = `${x}%`;
    img.style.top = `${y}%`;
    img.style.transform = align === "top" ? "translate(-50%, 0%)"
      : align === "bottom" ? "translate(-50%, -100%)"
      : "translate(-50%, -50%)"; // default: centered on the point
    img.addEventListener("error", () => { img.style.display = "none"; });
    img.addEventListener("load", () => {
      // Contain-fit within BADGE_BOX_PX using the image's real proportions,
      // then convert to % of the coat image so sizing stays viewport-independent.
      const scale = Math.min(BADGE_BOX_PX / img.naturalWidth, BADGE_BOX_PX / img.naturalHeight);
      const renderedWidthPx = img.naturalWidth * scale;
      const renderedHeightPx = img.naturalHeight * scale;
      img.style.width = `${(renderedWidthPx / COAT_IMG.width) * 100}%`;
      img.style.height = `${(renderedHeightPx / COAT_IMG.height) * 100}%`;
    });
    img.src = `${BADGE_IMG_DIR}${badge.id}.png`;
    layer.appendChild(img);
  });

  renderMeasurements(topY, placements);
}

init();
