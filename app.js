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

// Anchor points as PERCENTAGES of the coat image's width/height (0–100).
// Wearer's LEFT = image-right (ribbon/pocket side). Wearer's RIGHT = image-left (nametag side).
//
// Measured directly from images/coat-front.png (1106x1422) via pixel
// color detection: nametag center ~31% x / 32.8-35.3% y, welt pocket
// (mirrors the nametag on the other side) center ~67.7% x / 34.2-37.5% y.
//
// If you replace coat-front.png again, use "Calibrate anchors" on the
// live page to re-check these — click the real nametag/pocket corners
// and compare against the numbers below.
// Anchors for the DEFAULT coat image (no cord, or a cord with no per-cord
// override below). Each anchor has an "align" telling render() which edge
// of the badge image should sit at that y-coordinate:
//   'top'    -> badge's top edge sits at y (use when the measured point
//               was "top of the badge should be here")
//   'bottom' -> badge's bottom edge sits at y
//   'center' -> badge is centered on the point (default when nothing's
//               been measured yet)
// x is always the horizontal center regardless of align.
const ANCHORS = {
  aviationBase: { x: 67.7, y: 27, align: "center" },     // first aviation badge, above the ribbon rack
  aviationStep: 5,                                        // vertical spacing (in % of image height) between stacked aviation badges
  pocket: { x: 67.6, y: 39.4, align: "top" },              // wearer's left welt pocket — rocketry (or first queued specialty badge) fixed here, top edge
  pocketFlap: { x: 67.6, y: 36.0, align: "center" },       // pocket CENTER — NRA marksmanship centered here
  pocketTop: { x: 67.6, y: 34.2, align: "top" },           // top edge of the pocket — ribbon rack's bottom row rests here (not yet re-measured; carried over from earlier crop-based estimate, consistent with the new 36.0 center)
  belowNametag: { x: 30.9, y: 37.5, align: "top" },        // wearer's right, 1.5" below nametag, top edge
  aboveNametag: { x: 30.9, y: 32.0, align: "bottom" }      // centered over the nametag, 0.5" above it, bottom edge
};

// Per-cord anchor overrides. Selecting a cord swaps in a whole new coat
// photo (different framing/resolution than the base illustration), so
// the pocket/nametag positions above won't necessarily line up on that
// photo. Add an entry here (any subset of ANCHORS keys) once a cord's
// composite photo has been calibrated with "Calibrate anchors"; anything
// not overridden falls back to the default ANCHORS above.
const ANCHOR_OVERRIDES = {
   red: {
    pocket: { x: 66.2, y: 40.0, align: "top" },
    pocketFlap: { x: 66.2, y: 36.4, align: "center" },
    belowNametag: { x: 30.3, y: 38.2, align: "top" },
    aboveNametag: { x: 30.3, y: 3.6, align: "bottom" }
  },
};

function getActiveAnchors() {
  const override = selectedCord ? ANCHOR_OVERRIDES[selectedCord] : null;
  if (!override) return ANCHORS;
  return { ...ANCHORS, ...override };
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

const RIBBON_RACK = {
  leftPct: 59.9,
  rightPct: 75.5,
  aviationGapPct: null // computed below, proportional to row height (0.5in gap vs 0.375in row height)
};

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

const DATA_VERSION = 6;

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

  // Aviation/occupational badges: stack upward from the base anchor, in selection order.
  const aviationBaseY = ribbonTopY - aviationGapPct;
  const aviation = chosen.filter(b => b.category === "aviation_occupational");
  aviation.forEach((b, i) => {
    placements.push({
      badge: b,
      x: anchors.aviationBase.x,
      y: aviationBaseY - i * anchors.aviationStep,
      align: anchors.aviationBase.align
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

  if (n === 0) {
    // No ribbons: badge sits 1/2" above the pocket top edge directly.
    // Derive that gap from a hypothetical single row's height so it's
    // consistent with the ribbon-present case, not a separate guess.
    const rackWidth0 = RIBBON_RACK.rightPct - RIBBON_RACK.leftPct;
    const slotWidth0 = rackWidth0 / RIBBON_ROW_SIZE;
    const rowHeightPct0 = ((slotWidth0 / 100) * COAT_IMG.width / RIBBON_ASPECT / COAT_IMG.height) * 100;
    return { placements, topY: pocketTopY, aviationGapPct: rowHeightPct0 * (0.5 / 0.375) };
  }

  const rowSize = RIBBON_ROW_SIZE;
  const totalRows = Math.ceil(n / rowSize);
  const topRowCount = n - (totalRows - 1) * rowSize;
  const rackWidth = RIBBON_RACK.rightPct - RIBBON_RACK.leftPct;
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
    const rowStartX = RIBBON_RACK.leftPct + (rackWidth - rowContentWidth) / 2;

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
function setupCalibration() {
  const toggleBtn = document.getElementById("calibrate-toggle");
  const frame = document.getElementById("uniform-frame");
  const crosshair = document.getElementById("calibrate-crosshair");
  const readout = document.getElementById("calibrate-readout");
  let active = false;

  toggleBtn.addEventListener("click", () => {
    active = !active;
    toggleBtn.classList.toggle("active", active);
    crosshair.hidden = !active;
    readout.textContent = active ? "Click the coat to read x/y %" : "";
    frame.style.cursor = active ? "crosshair" : "default";
  });

  frame.addEventListener("click", (e) => {
    if (!active) return;
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
}

init();
