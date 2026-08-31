const CATEGORY_META = {
  aviation_occupational: {
    label: "Aviation & Occupational Badges",
    sub: "Max 2 worn together, wearer's left, stacked above the ribbon rack."
  },
  specialty: {
    label: "Service, Specialty Track, STEM, Cyber, Rocketry & Marksmanship",
    sub: "Max 4 combined with the badges above. Rocketry and NRA Marksmanship have fixed spots."
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
// Estimated from images/coat-front.png: the illustration shows the hip-level
// welt pocket flaps clearly (~74% down), but has no visible nametag or
// breast-ribbon markings to calibrate against precisely.
//
// >>> USE THE "Calibrate anchors" BUTTON on the live page to fine-tune. <<<
// Click the real spots on your coat image, read the x/y % it reports, and
// paste those numbers in below.
const ANCHORS = {
  aviationBase: { x: 67, y: 22 },    // first aviation badge, upper chest, above the ribbon rack
  aviationStep: 6,                    // vertical spacing (in % of image height) between stacked aviation badges
  pocket: { x: 68, y: 74 },           // wearer's left welt pocket flap — rocketry fixed here (visible in the image)
  pocketFlap: { x: 68, y: 71 },       // top edge of that pocket — NRA marksmanship fixed here
  belowNametag: { x: 33, y: 34 },     // wearer's right, 1.5" below nametag
  aboveNametag: { x: 33, y: 22 }      // centered, 0.5" above nametag
};

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

const BADGE_IMG_DIR = "images/badges/";

let BADGES = [];
let CORDS = [];
let LIMITS = { totalMax: 4, aviationOccupationalMax: 2 };
const selected = new Set();
let selectedCord = null;

async function init() {
  const [badgeRes, cordRes] = await Promise.all([
    fetch("badges.json"),
    fetch("cords.json")
  ]);
  const data = await badgeRes.json();
  const cordData = await cordRes.json();
  BADGES = data.badges;
  LIMITS = data.limits;
  CORDS = cordData.cords;
  renderChecklist();
  renderCordOptions();
  setupCalibration();
  render();
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

function toggle(id, checkbox) {
  const badge = BADGES.find(b => b.id === id);
  const willSelect = checkbox.checked;

  if (willSelect) {
    const totalCount = selected.size;
    const aviationCount = [...selected].filter(bid =>
      BADGES.find(b => b.id === bid).category === "aviation_occupational"
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
    BADGES.find(b => b.id === bid).category === "aviation_occupational"
  ).length;

  document.getElementById("count-total").textContent = `Total ${total} / ${LIMITS.totalMax}`;
  document.getElementById("count-aviation").textContent = `Aviation/Occ ${aviation} / ${LIMITS.aviationOccupationalMax}`;
}

function assignPositions() {
  const chosen = [...selected].map(id => BADGES.find(b => b.id === id));
  const placements = [];

  // Aviation/occupational badges: stack upward from the base anchor, in selection order.
  const aviation = chosen.filter(b => b.category === "aviation_occupational");
  aviation.forEach((b, i) => {
    placements.push({
      badge: b,
      x: ANCHORS.aviationBase.x,
      y: ANCHORS.aviationBase.y - i * ANCHORS.aviationStep
    });
  });

  // Specialty group: rocketry and marksmanship are fixed; everything else queues
  // into pocket -> below-nametag -> above-nametag, skipping the pocket slot if
  // rocketry already occupies it.
  const specialty = chosen.filter(b => b.category === "specialty");
  const rocketry = specialty.find(b => b.fixedSlot === "pocket");
  const marksmanship = specialty.find(b => b.fixedSlot === "pocket_flap");
  const queueable = specialty.filter(b => !b.fixedSlot);

  if (rocketry) placements.push({ badge: rocketry, ...ANCHORS.pocket });
  if (marksmanship) placements.push({ badge: marksmanship, ...ANCHORS.pocketFlap });

  const slotOrder = rocketry
    ? [ANCHORS.belowNametag, ANCHORS.aboveNametag]
    : [ANCHORS.pocket, ANCHORS.belowNametag, ANCHORS.aboveNametag];

  queueable.forEach((b, i) => {
    const slot = slotOrder[i];
    if (slot) placements.push({ badge: b, x: slot.x, y: slot.y });
  });

  return placements;
}

function renderCordOptions() {
  const root = document.getElementById("cord-options");
  root.innerHTML = "";

  const noneRow = buildCordRow({ id: "", name: "None" }, true);
  root.appendChild(noneRow);

  CORDS.forEach(c => root.appendChild(buildCordRow(c, false)));
}

function buildCordRow(cord, checkedByDefault) {
  const row = document.createElement("div");
  row.className = "badge-row";

  const radio = document.createElement("input");
  radio.type = "radio";
  radio.name = "cord";
  radio.id = `cord-${cord.id || "none"}`;
  radio.checked = checkedByDefault;
  radio.addEventListener("change", () => {
    selectedCord = cord.id || null;
    renderCord();
  });

  const label = document.createElement("label");
  label.setAttribute("for", radio.id);
  const nameEl = document.createElement("div");
  nameEl.className = "b-name";
  nameEl.textContent = cord.name;
  label.appendChild(nameEl);

  row.appendChild(radio);
  row.appendChild(label);
  return row;
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
  line.setAttribute("stroke-width", "2.4");
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

  const layer = document.getElementById("badge-layer");
  layer.innerHTML = "";

  const placements = assignPositions();
  placements.forEach(({ badge, x, y }) => {
    const img = document.createElement("img");
    img.className = "badge-pin";
    img.src = `${BADGE_IMG_DIR}${badge.id}.png`;
    img.alt = badge.name;
    img.title = badge.name;
    img.style.left = `${x}%`;
    img.style.top = `${y}%`;
    // If a badge PNG hasn't been uploaded yet, don't leave a broken-image icon.
    img.addEventListener("error", () => { img.style.display = "none"; });
    layer.appendChild(img);
  });
}

init();
