export const NATIONAL_TEAMS = [
  { name: "Alemania", shortName: "Alemania", flagCode: "de" },
  { name: "Arabia Saudí", shortName: "Arabia Saudí", flagCode: "sa" },
  { name: "Argelia", shortName: "Argelia", flagCode: "dz" },
  { name: "Argentina", shortName: "Argentina", flagCode: "ar" },
  { name: "Australia", shortName: "Australia", flagCode: "au" },
  { name: "Austria", shortName: "Austria", flagCode: "at" },

  { name: "Bélgica", shortName: "Bélgica", flagCode: "be" },
  {
    name: "Bosnia y Herzegovina",
    shortName: "Bosnia",
    flagCode: "ba",
  },
  { name: "Brasil", shortName: "Brasil", flagCode: "br" },

  {
    name: "Islas de Cabo Verde",
    shortName: "Cabo Verde",
    flagCode: "cv",
  },
  { name: "Canadá", shortName: "Canadá", flagCode: "ca" },
  { name: "Chequia", shortName: "Chequia", flagCode: "cz" },
  { name: "Colombia", shortName: "Colombia", flagCode: "co" },
  {
    name: "Costa de Marfil",
    shortName: "C. de Marfil",
    flagCode: "ci",
  },
  { name: "Croacia", shortName: "Croacia", flagCode: "hr" },
  { name: "Curazao", shortName: "Curazao", flagCode: "cw" },
  { name: "Catar", shortName: "Catar", flagCode: "qa" },

  { name: "Ecuador", shortName: "Ecuador", flagCode: "ec" },
  { name: "Egipto", shortName: "Egipto", flagCode: "eg" },
  { name: "Escocia", shortName: "Escocia", flagCode: "gb-sct" },
  { name: "España", shortName: "España", flagCode: "es" },
  { name: "EE. UU.", shortName: "EE. UU.", flagCode: "us" },

  { name: "Francia", shortName: "Francia", flagCode: "fr" },

  { name: "Ghana", shortName: "Ghana", flagCode: "gh" },

  { name: "Haití", shortName: "Haití", flagCode: "ht" },

  { name: "Inglaterra", shortName: "Inglaterra", flagCode: "gb-eng" },
  { name: "Irak", shortName: "Irak", flagCode: "iq" },
  { name: "RI de Irán", shortName: "Irán", flagCode: "ir" },

  { name: "Japón", shortName: "Japón", flagCode: "jp" },
  { name: "Jordania", shortName: "Jordania", flagCode: "jo" },

  { name: "Marruecos", shortName: "Marruecos", flagCode: "ma" },
  { name: "México", shortName: "México", flagCode: "mx" },

  { name: "Noruega", shortName: "Noruega", flagCode: "no" },
  {
    name: "Nueva Zelanda",
    shortName: "N. Zelanda",
    flagCode: "nz",
  },

  {
    name: "Países Bajos",
    shortName: "P. Bajos",
    flagCode: "nl",
  },
  { name: "Panamá", shortName: "Panamá", flagCode: "pa" },
  { name: "Paraguay", shortName: "Paraguay", flagCode: "py" },
  { name: "Portugal", shortName: "Portugal", flagCode: "pt" },

  {
    name: "República de Corea",
    shortName: "Corea",
    flagCode: "kr",
  },
  { name: "RD Congo", shortName: "RD Congo", flagCode: "cd" },

  { name: "Senegal", shortName: "Senegal", flagCode: "sn" },
  { name: "Sudáfrica", shortName: "Sudáfrica", flagCode: "za" },
  { name: "Suecia", shortName: "Suecia", flagCode: "se" },
  { name: "Suiza", shortName: "Suiza", flagCode: "ch" },

  { name: "Túnez", shortName: "Túnez", flagCode: "tn" },
  { name: "Turquía", shortName: "Turquía", flagCode: "tr" },

  { name: "Uruguay", shortName: "Uruguay", flagCode: "uy" },
  { name: "Uzbekistán", shortName: "Uzbekistán", flagCode: "uz" },
];

export function getTeamShortName(teamName) {
  const team = NATIONAL_TEAMS.find((item) => item.name === teamName);

  return team?.shortName || teamName;
}