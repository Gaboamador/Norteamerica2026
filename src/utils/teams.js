export const NATIONAL_TEAMS = [
  { name: "Alemania", shortName: "Alemania", flagCode: "de", marcadorCode: "GER" },
  { name: "Arabia Saudí", shortName: "Arabia Saudí", flagCode: "sa", marcadorCode: "KSA" },
  { name: "Argelia", shortName: "Argelia", flagCode: "dz", marcadorCode: "ALG" },
  { name: "Argentina", shortName: "Argentina", flagCode: "ar", marcadorCode: "ARG" },
  { name: "Australia", shortName: "Australia", flagCode: "au", marcadorCode: "AUS" },
  { name: "Austria", shortName: "Austria", flagCode: "at", marcadorCode: "AUT" },

  { name: "Bélgica", shortName: "Bélgica", flagCode: "be", marcadorCode: "BEL" },
  {
    name: "Bosnia y Herzegovina",
    shortName: "Bosnia",
    flagCode: "ba",
    marcadorCode: "BIH",
  },
  { name: "Brasil", shortName: "Brasil", flagCode: "br", marcadorCode: "BRA" },

  {
    name: "Islas de Cabo Verde",
    shortName: "Cabo Verde",
    flagCode: "cv",
    marcadorCode: "CPV",
  },
  { name: "Canadá", shortName: "Canadá", flagCode: "ca", marcadorCode: "CAN" },
  { name: "Chequia", shortName: "Chequia", flagCode: "cz", marcadorCode: "CZE" },
  { name: "Colombia", shortName: "Colombia", flagCode: "co", marcadorCode: "COL" },
  {
    name: "Costa de Marfil",
    shortName: "C. de Marfil",
    flagCode: "ci",
    marcadorCode: "CIV",
  },
  { name: "Croacia", shortName: "Croacia", flagCode: "hr", marcadorCode: "CRO" },
  { name: "Curazao", shortName: "Curazao", flagCode: "cw", marcadorCode: "CUW" },
  { name: "Catar", shortName: "Catar", flagCode: "qa", marcadorCode: "QAT" },

  { name: "Ecuador", shortName: "Ecuador", flagCode: "ec", marcadorCode: "ECU" },
  { name: "Egipto", shortName: "Egipto", flagCode: "eg", marcadorCode: "EGY" },
  { name: "Escocia", shortName: "Escocia", flagCode: "gb-sct", marcadorCode: "SCO" },
  { name: "España", shortName: "España", flagCode: "es", marcadorCode: "ESP" },
  { name: "EE. UU.", shortName: "EE. UU.", flagCode: "us", marcadorCode: "USA" },

  { name: "Francia", shortName: "Francia", flagCode: "fr", marcadorCode: "FRA" },

  { name: "Ghana", shortName: "Ghana", flagCode: "gh", marcadorCode: "GHA" },

  { name: "Haití", shortName: "Haití", flagCode: "ht", marcadorCode: "HAI" },

  { name: "Inglaterra", shortName: "Inglaterra", flagCode: "gb-eng", marcadorCode: "ENG" },
  { name: "Irak", shortName: "Irak", flagCode: "iq", marcadorCode: "IRQ" },
  { name: "RI de Irán", shortName: "Irán", flagCode: "ir", marcadorCode: "IRN" },

  { name: "Japón", shortName: "Japón", flagCode: "jp", marcadorCode: "JPN" },
  { name: "Jordania", shortName: "Jordania", flagCode: "jo", marcadorCode: "JOR" },

  { name: "Marruecos", shortName: "Marruecos", flagCode: "ma", marcadorCode: "MAR" },
  { name: "México", shortName: "México", flagCode: "mx", marcadorCode: "MEX" },

  { name: "Noruega", shortName: "Noruega", flagCode: "no", marcadorCode: "NOR" },
  {
    name: "Nueva Zelanda",
    shortName: "N. Zelanda",
    flagCode: "nz",
    marcadorCode: "NZL",
  },

  {
    name: "Países Bajos",
    shortName: "P. Bajos",
    flagCode: "nl",
    marcadorCode: "NED",
  },
  { name: "Panamá", shortName: "Panamá", flagCode: "pa", marcadorCode: "PAN" },
  { name: "Paraguay", shortName: "Paraguay", flagCode: "py", marcadorCode: "PAR" },
  { name: "Portugal", shortName: "Portugal", flagCode: "pt", marcadorCode: "POR" },

  {
    name: "República de Corea",
    shortName: "Corea",
    flagCode: "kr",
    marcadorCode: "KOR",
  },
  { name: "RD Congo", shortName: "RD Congo", flagCode: "cd", marcadorCode: "COD" },

  { name: "Senegal", shortName: "Senegal", flagCode: "sn", marcadorCode: "SEN" },
  { name: "Sudáfrica", shortName: "Sudáfrica", flagCode: "za", marcadorCode: "RSA" },
  { name: "Suecia", shortName: "Suecia", flagCode: "se", marcadorCode: "SWE" },
  { name: "Suiza", shortName: "Suiza", flagCode: "ch", marcadorCode: "SUI" },

  { name: "Túnez", shortName: "Túnez", flagCode: "tn", marcadorCode: "TUN" },
  { name: "Turquía", shortName: "Turquía", flagCode: "tr", marcadorCode: "TUR" },

  { name: "Uruguay", shortName: "Uruguay", flagCode: "uy", marcadorCode: "URU" },
  { name: "Uzbekistán", shortName: "Uzbekistán", flagCode: "uz", marcadorCode: "UZB" },
];

export function getTeamShortName(teamName) {
  const team = NATIONAL_TEAMS.find((item) => item.name === teamName);

  return team?.shortName || teamName;
}

export function getMarcadorCode(teamName) {
  const team = NATIONAL_TEAMS.find((item) => item.name === teamName);

  return team?.marcadorCode || teamName;
}