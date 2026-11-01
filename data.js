// ==========================================================================
// BANDOLERA — CATALOG DATA
// Products load from your Google Apps Script URL below.
// DEMO_CATALOG is shown only if the sheet cannot be reached.
// ==========================================================================

const SHEET_DATA_URL = "https://script.google.com/macros/s/AKfycbxSfxHB5APfHAh9oTJqlwWX8ZYLokNQsgvcPhKJIFDmRFUmJ5zNLhk3KtHbDFDnOToH/exec";

const ALWAYS_LIVE = ["tshirt", "oversized", "polo"]; // never show Coming Soon even when empty

const DEMO_CATALOG = {
  tshirt: {
    label: "T-Shirts",
    comingSoon: false,
    items: [
      { id:"t1", name:"Heritage Crew Tee",  code:"TS-01", price:899,  mrp:1799, art:{type:"wave",   c1:"#EDE4D3", c2:"#B7A688"}, badge:"Bestseller" },
      { id:"t2", name:"Ink Wash Tee",       code:"TS-02", price:849,  mrp:1699, art:{type:"stripe", c1:"#211F1C", c2:"#57534A"}, badge:null },
      { id:"t3", name:"Blush Fade Tee",     code:"TS-03", price:949,  mrp:1899, art:{type:"wave",   c1:"#E7C9C2", c2:"#AD766C"}, badge:"New" },
      { id:"t4", name:"Chalk Graphic Tee",  code:"TS-04", price:799,  mrp:1599, art:{type:"burst",  c1:"#F2EEE3", c2:"#ACA492"}, badge:null },
    ]
  },
  oversized: {
    label: "Oversized",
    comingSoon: false,
    items: [
      { id:"o1", name:"Boxy Drop-Shoulder Tee", code:"OS-01", price:1099, mrp:2199, art:{type:"stripe", c1:"#D8CCB8", c2:"#8B7E68"}, badge:"Bestseller" },
      { id:"o2", name:"Oversized Ink Tee",      code:"OS-02", price:1099, mrp:2199, art:{type:"wave",   c1:"#2B2A27", c2:"#6E695F"}, badge:null },
      { id:"o3", name:"Oversized Cocoa Tee",    code:"OS-03", price:1149, mrp:2299, art:{type:"burst",  c1:"#8B6A52", c2:"#5B4433"}, badge:"New" },
    ]
  },
  polo: {
    label: "Polo",
    comingSoon: false,
    items: [
      { id:"p1", name:"Classic Pique Polo", code:"PL-01", price:999,  mrp:1999, art:{type:"stripe", c1:"#DCE4D8", c2:"#8C9C86"}, badge:"New" },
      { id:"p2", name:"Ink Navy Polo",      code:"PL-02", price:1049, mrp:2099, art:{type:"wave",   c1:"#232A33", c2:"#4C5A6B"}, badge:null },
    ]
  },
  hoodie: {
    label: "Hoodies",
    comingSoon: true,
    items: []
  },
  sweatshirt: {
    label: "Sweatshirts",
    comingSoon: true,
    items: []
  }
};

const TABS = [
  { key:"tshirt",     label:"T-Shirts",    note:null },
  { key:"oversized",  label:"Oversized",   note:null },
  { key:"polo",       label:"Polo",        note:null },
  { key:"hoodie",     label:"Hoodies",     note:"Soon" },
  { key:"sweatshirt", label:"Sweatshirts", note:"Soon" },
];

// ==========================================================================
// DEFAULT SIZE CHARTS (garment measurements in inches).
// These are standard STARTER numbers — measure your own garments and edit them here,
// or upload your own size-chart photo for a product in the admin page (that photo wins).
// ==========================================================================
const SIZE_CHARTS = {
  tshirt: {
    note: "Garment measurements in inches (±0.5″). Lay a tee you already own flat and compare.",
    cols: ["Chest", "Length", "Shoulder"],
    rows: { XS:[36,25.5,16], S:[38,26.5,17], M:[40,27.5,18], L:[42,28.5,19], XL:[44,29.5,20], XXL:[46,30.5,21], "3XL":[48,31.5,22] }
  },
  oversized: {
    note: "Oversized fit — garment measurements in inches (±0.5″). Pick your usual size for the intended baggy look.",
    cols: ["Chest", "Length", "Drop shoulder"],
    rows: { XS:[42,26,19], S:[44,27,20], M:[46,28,21], L:[48,29,22], XL:[50,30,23], XXL:[52,31,24], "3XL":[54,32,25] }
  },
  polo: {
    note: "Garment measurements in inches (±0.5″).",
    cols: ["Chest", "Length", "Sleeve"],
    rows: { XS:[37,25.5,8], S:[39,26.5,8.5], M:[41,27.5,9], L:[43,28.5,9.5], XL:[45,29.5,10], XXL:[47,30.5,10.5], "3XL":[49,31.5,11] }
  },
  hoodie: {
    note: "Garment measurements in inches (±0.5″). Relaxed fit.",
    cols: ["Chest", "Length", "Sleeve"],
    rows: { XS:[40,25,24], S:[42,26,24.5], M:[44,27,25], L:[46,28,25.5], XL:[48,29,26], XXL:[50,30,26.5], "3XL":[52,31,27] }
  },
  sweatshirt: {
    note: "Garment measurements in inches (±0.5″). Relaxed fit.",
    cols: ["Chest", "Length", "Sleeve"],
    rows: { XS:[40,24.5,24], S:[42,25.5,24.5], M:[44,26.5,25], L:[46,27.5,25.5], XL:[48,28.5,26], XXL:[50,29.5,26.5], "3XL":[52,30.5,27] }
  },
};
