import fs from "fs";
import https from "https";
import path from "path";

const codes = [
  "de", // Alemania
  "sa", // Arabia Saudita
  "dz", // Argelia
  "ar", // Argentina
  "au", // Australia
  "at", // Austria

  "be", // Bélgica
  "ba", // Bosnia
  "br", // Brasil

  "cv", // Cabo Verde
  "ca", // Canadá
  "co", // Colombia
  "kr", // Corea del Sur
  "ci", // Costa de Marfil
  "hr", // Croacia
  "cw", // Curazao

  "ec", // Ecuador
  "eg", // Egipto
  "gb-sct", // Escocia
  "es", // España
  "us", // Estados Unidos

  "fr", // Francia

  "gh", // Ghana

  "ht", // Haití

  "gb-eng", // Inglaterra
  "iq", // Irak
  "ir", // Irán

  "jp", // Japón
  "jo", // Jordania

  "ma", // Marruecos
  "mx", // México

  "no", // Noruega
  "nz", // Nueva Zelanda

  "nl", // Países Bajos
  "pa", // Panamá
  "py", // Paraguay
  "pt", // Portugal

  "qa", // Qatar

  "cd", // RD Congo
  "cz", // República Checa

  "sn", // Senegal
  "za", // Sudáfrica
  "se", // Suecia
  "ch", // Suiza

  "tn", // Túnez
  "tr", // Turquía

  "uy", // Uruguay
  "uz", // Uzbekistán
];

const baseUrl = "https://flagcdn.com/w40/";
const outputDir = "./public/flags";

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

codes.forEach(code => {
  const url = `${baseUrl}${code}.png`;
  const filePath = path.join(outputDir, `${code}.png`);

  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      console.log(`❌ Error: ${code}`);
      return;
    }

    const fileStream = fs.createWriteStream(filePath);
    res.pipe(fileStream);

    fileStream.on("finish", () => {
      fileStream.close();
      console.log(`✅ ${code}`);
    });
  });
});