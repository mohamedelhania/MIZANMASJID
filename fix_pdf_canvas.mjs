import fs from 'fs';

let code = fs.readFileSync('src/lib/pdf.ts', 'utf8');

// The text to replace starts at: doc.setFontSize(10);
// and ends right before: const sepY = headerY + 35;
const searchBlock = `  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0); // Very dark as requested
  // Since Arabic rendering in jsPDF requires a font, we will add the Spanish transliteration or meaning, or just the Arabic text and hope the client has a font or use standard.
  doc.setFont("helvetica", "italic");
  doc.text('"En ella hay hombres que aman purificarse, y Dios ama a los que se purifican" (Corǭn 9:108)', 105, headerY + 25, { align: "center" });
  doc.setFont("helvetica", "normal");

  // Separator
  const sepY = headerY + 35;`;

const newBlock = `  // Draw quote using Canvas to perfectly render Arabic and Spanish
  const createQuoteImage = () => {
    return new Promise<string>((resolve) => {
      const canvas = document.createElement("canvas");
      canvas.width = 1600;
      canvas.height = 420;
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve("");
      
      ctx.fillStyle = "rgba(255, 255, 255, 0)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = "#333333";
      ctx.textAlign = "center";
      
      ctx.font = "bold 32px sans-serif";
      ctx.fillText("9:108 | At-Táuba", canvas.width / 2, 40);
      
      ctx.font = "italic 26px sans-serif";
      ctx.fillText("No ores [¡Oh, Mujámmad!] en ella nunca, y sabe que una mezquita construida con piedad", canvas.width / 2, 85);
      ctx.fillText("desde el primer día es más digna de que ores en ella, pues allí hay gente", canvas.width / 2, 120);
      ctx.fillText("que desea purificarse, y Dios ama a quienes se purifican.", canvas.width / 2, 155);
      
      ctx.font = "bold 40px 'Traditional Arabic', 'Amiri', 'Times New Roman', serif";
      ctx.fillText("التوبة | ١٠٨", canvas.width / 2, 230);
      
      ctx.font = "36px 'Traditional Arabic', 'Amiri', 'Times New Roman', serif";
      ctx.fillText("لَا تَقُمْ فِيهِ أَبَدًا ۚ لَّمَسْجِدٌ أُسِّسَ عَلَى ٱلتَّقْوَىٰ مِنْ أَوَّلِ يَوْمٍ أَحَقُّ أَن تَقُومَ فِيهِ ۚ", canvas.width / 2, 290);
      ctx.fillText("فِيهِ رِجَالٌ يُحِبُّونَ أَن يَتَطَهَّرُوا۟ ۚ وَٱللَّهُ يُحِبُّ ٱلْمُطَّهِّرِينَ", canvas.width / 2, 340);
      
      resolve(canvas.toDataURL("image/png"));
    });
  };

  const quoteImg = await createQuoteImage();
  if (quoteImg) {
    doc.addImage(quoteImg, "PNG", 14, headerY + 12, 182, 47);
  }

  // Separator
  const sepY = headerY + 65;`;

code = code.replace(searchBlock, newBlock);

fs.writeFileSync('src/lib/pdf.ts', code);
console.log('PDF Canvas script replaced.');
