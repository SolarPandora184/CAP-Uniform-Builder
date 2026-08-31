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
  officer_nco: "officers & NCOs",
  any: null
};

// Anchor points in the 400x620 SVG coordinate space.
// Wearer's LEFT = image-right (ribbon/pocket side). Wearer's RIGHT = image-left (nametag side).
const ANCHORS = {
  aviationBase: { x: 260, y: 300 },   // first aviation badge, just above wearer's-left pocket
  aviationStep: 34,                    // vertical spacing between stacked aviation badges
  pocket: { x: 260, y: 343 },          // wearer's left pocket — rocketry fixed here
  pocketFlap: { x: 260, y: 328 },      // top edge of that pocket — NRA marksmanship fixed here
  belowNametag: { x: 140, y: 300 },    // wearer's right, 1.5" below nametag
  aboveNametag: { x: 140, y: 235 }     // centered, 0.5" above nametag
};

let BADGES = [];
let LIMITS = { totalMax: 4, aviationOccupationalMax: 2 };
const selected = new Set();

async function init() {
  const res = await fetch("badges.json");
  const data = await res.json();
  BADGES = data.badges;
  LIMITS = data.limits;
  renderChecklist();
  render();
}

function renderChecklist() {
  const root = document.getElementById("checklist");
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

  // Aviation/occupational: stack upward from the base anchor, chaplain badges first if present.
  const aviation = chosen.filter(b => b.category === "aviation_occupational");
  aviation.sort((a, b) => (a.id === "chaplain_badge" ? -1 : 0) - (b.id === "chaplain_badge" ? -1 : 0));
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

function render() {
  updateCounts();

  const layer = document.getElementById("badge-layer");
  layer.innerHTML = "";

  const placements = assignPositions();
  placements.forEach(({ badge, x, y }) => {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const pin = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    pin.setAttribute("class", "badge-pin");
    pin.setAttribute("x", x - 30);
    pin.setAttribute("y", y - 9);
    pin.setAttribute("width", 60);
    pin.setAttribute("height", 18);
    pin.setAttribute("rx", 2);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("class", "badge-pin-text");
    text.setAttribute("x", x);
    text.setAttribute("y", y + 3);
    text.textContent = abbreviate(badge.name);

    g.appendChild(pin);
    g.appendChild(text);
    layer.appendChild(g);
  });
}

function abbreviate(name) {
  const words = name.replace("Badge", "").replace("Wings", "Wgs").trim().split(" ");
  if (words.join(" ").length <= 14) return words.join(" ");
  return words.map(w => w[0]).join("");
}

init();
