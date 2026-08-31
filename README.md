# CAP Class A Badge Placement Builder

A live reference tool for placing badges and devices on the CAP Men's
Service Dress (Class A) coat, per **CAPR 39-1, §4.1.5.2.2.4** and
**Attachment 4**. Scoped to **cadet-achievable badges only** — no
senior-member-only insignia (pilot wings, chaplain badges, etc.) is
included. Check the badges you're authorized to wear and the diagram
updates to show where each one goes, enforcing the max-4-total and
max-2-aviation/occupational limits as you go.

Live at: `https://<username>.github.io/CAP-Uniform-Builder/` once
GitHub Pages is enabled for this repo (Settings → Pages → deploy from
`main`).

## How placement is calculated

- **Aviation & occupational badges** stack upward from just above the
  wearer's-left pocket, capped at 2. Chaplain badges always sort to the
  top of the stack when present.
- **Service / specialty track / STEM / Cyber / rocketry / marksmanship
  badges** share a queue of three positions: the left pocket, the spot
  1½" below the nametag on the wearer's right, and centered ½" above
  the nametag. The Model Rocketry Badge and NRA Marksmanship Badge
  have fixed, non-negotiable spots (pocket and pocket-flap-top
  respectively) — everything else queues into whatever's left.
- Combined, the two categories can't exceed 4 badges total.

This mirrors the exact sequencing described in the regulation: rocketry
always claims the pocket position when worn, which bumps any other
queued specialty badge (like a specialty track badge or STEM badge)
down to the next open slot.

## Shoulder cords

Pick a cord color in the sidebar and the tool tries to load a full
coat+cord composite photo. If you upload one, name it exactly:

- `images/cords/coat-front-cord-red.png`
- `images/cords/coat-front-cord-blue.png`
- `images/cords/coat-front-cord-white.png`
- `images/cords/coat-front-cord-black.png`
- `images/cords/coat-front-cord-silver.png`

If that file isn't there yet, the tool falls back to drawing a simple
colored placeholder band over the plain coat so the page never looks
broken while you're still gathering photos.

## Calibrating anchor positions

Badge positions are guesses based on what's visible in the coat
illustration (mainly the hip-level pocket flaps). Click **"Calibrate
anchors"** on the live page, then click anywhere on the coat image —
it reports the exact x/y percentage under your cursor. Use that to
correct the `ANCHORS` object near the top of `app.js`.

## Files

- `index.html` — page structure and the SVG coat silhouette
- `style.css` — visual styling
- `app.js` — checklist rendering, limit enforcement, slot-assignment logic
- `badges.json` — the badge dataset (category, restrictions, fixed slots)

## Extending it

The badge list in `badges.json` only covers the handful of badges
needed to exercise both categories and both fixed-slot cases. To add
more (Ground Team Badge, Legal Officer, additional specialty tracks,
etc.), add an entry with:

```json
{
  "id": "unique_id",
  "name": "Display Name",
  "category": "aviation_occupational | specialty",
  "restrictedTo": "cadet | cadet_nco",
  "fixedSlot": "pocket | pocket_flap"   // omit unless it's rocketry/marksmanship-style
}
```

No build step — this is plain HTML/CSS/JS, safe to edit directly on
GitHub or serve from Pages as-is.

## Known limitations

- The regulation is silent on exact placement instructions for the
  sUAS Pre-Solo Badge, deferring instead to NHQ Directorate of
  Operations guidance. It's shown here per the Attachment 4 chart
  code (over left pocket), but double-check current NHQ guidance
  before wearing it.
- Ribbon rack rendering isn't modeled yet — the "above the ribbon
  rack" anchor for aviation badges is currently a fixed point, not
  dynamic based on how many ribbon rows you'd actually be wearing.
- Female Service Dress placement rules differ (right-side stacking
  over the nametag rather than left-pocket/right-below/above) and
  aren't modeled — this version follows the men's new-style sequence.
- This is a reference aid, not authoritative. Always check the current
  CAPR 39-1 and your Wing's guidance before an inspection.
