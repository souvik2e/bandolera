// ==========================================================================
// BANDOLERA — CATALOG DATA (v3)
// Live categories: tshirt, oversized. Coming-soon categories: hoodie, sweatshirt
// (render a "Coming Soon" panel instead of a grid — see logic.js).
// Once the control panel is live, real products replace these placeholders.
// ==========================================================================

const CATALOG = {
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
  { key:"hoodie",     label:"Hoodies",     note:"Soon" },
  { key:"sweatshirt", label:"Sweatshirts", note:"Soon" },
];
