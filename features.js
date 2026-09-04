// ============================================================
// FEATURE CONTROL DOCUMENT
// ============================================================
// One switch per feature. Change a value to `true` to show/enable that
// feature on the live page, or `false` to hide/disable it. This file is
// loaded before app.js, so FEATURES is available everywhere.
//
// Turning a feature off hides its entire section from the page and skips
// wiring up its buttons/listeners — it does not delete any code, data,
// or calibration values, so flipping it back to `true` later restores it
// exactly as it was.

const FEATURES = {
  // Sidebar sections
  cords: true,                  // "Shoulder Cord" dropdown + coat/cord photo swapping
  specialtyTrackDropdown: true, // "Specialty Track Badge" dropdown (Communications/Safety/ES)
  collarInsignia: false,         // "Collar Insignia" checkbox + rendering at both collar points
  badgeChecklist: true,         // Main badge checklist (rocketry, STEM, cyber, NRA marksmanship, sUAS)
  ribbons: true,                // "Ribbons" checklist + rack rendering on the coat
  ribbonRowSizeToggle: false,    // The 3-per-row / 4-per-row buttons inside the ribbons section

  // Calibration & verification tools
  freeformCalibration: false,    // "Calibrate anchors" click-to-read-x/y% tool
  guidedCalibration: true,      // "Start guided calibration" 6-click panel with code output
  measurementOverlay: true,     // "Show measurements" regulation-distance overlay
};
