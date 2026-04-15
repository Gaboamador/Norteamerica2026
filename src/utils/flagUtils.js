const TEAM_FLAG_MAP = {
  // A
  alemania: "de",
  "arabia saudita": "sa",
  argelia: "dz",
  argentina: "ar",
  australia: "au",
  austria: "at",

  // B
  belgica: "be",
  "bosnia herzegovina": "ba",
  brasil: "br",

  // C
  "cabo verde": "cv",
  canada: "ca",
  colombia: "co",
  "corea del sur": "kr",
  "costa de marfil": "ci",
  croacia: "hr",
  curazao: "cw",

  // E
  ecuador: "ec",
  egipto: "eg",
  escocia: "gb-sct",
  espana: "es",
  "estados unidos": "us",

  // F
  francia: "fr",

  // G
  ghana: "gh",

  // H
  haiti: "ht",

  // I
  inglaterra: "gb-eng",
  irak: "iq",
  iran: "ir",

  // J
  japon: "jp",
  jordania: "jo",

  // M
  marruecos: "ma",
  mexico: "mx",

  // N
  noruega: "no",
  "nueva zelanda": "nz",

  // P
  "paises bajos": "nl",
  panama: "pa",
  paraguay: "py",
  portugal: "pt",

  // Q
  qatar: "qa",

  // R
  "rd congo": "cd",
  "republica checa": "cz",

  // S
  senegal: "sn",
  sudafrica: "za",
  suecia: "se",
  suiza: "ch",

  // T
  tunez: "tn",
  turquia: "tr",

  // U
  uruguay: "uy",
  uzbekistan: "uz",
};

function normalizeTeamName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, ""); // elimina tildes
}

export function getTeamFlagCode(teamName) {
  const normalized = normalizeTeamName(teamName);
  return TEAM_FLAG_MAP[normalized] ?? null;
}

export function getTeamFlagSrc(teamName) {
  const code = getTeamFlagCode(teamName);
  return code ? `/flags/${code}.png` : "/flags/fallback.png";
}

export function handleFlagImageError(e) {
  e.currentTarget.src = "/flags/fallback.png";
}