export const COLOR = {
  // light surfaces (default everywhere)
  white: "#FFFFFF",
  paper: "#F7F9FC", // page background
  paperAlt: "#EEF2F8", // alternate section band
  border: "#E4E7EC",

  // text (gray scale)
  ink: "#101828", // headings / primary text
  slate: "#475467", // body copy
  mist: "#98A2B3", // muted / captions

  // blue — the one accent color, used for CTAs, icons, links, highlights
  brand: "#1C4D8A",
  brandDeep: "#123363",
  brandLight: "#4C86D6",
  brandSoft: "#EAF1FB", // light blue tint for chips / alt rows

  // reserved dark surface — only for the hero check-in card
  ink900: "#0B1626",
  line900: "rgba(255,255,255,0.12)",
} as const