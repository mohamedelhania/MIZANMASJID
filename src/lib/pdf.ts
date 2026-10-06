import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { MosqueInfo } from "./auth";

// Logo will be embedded as base64 at build time
import logoUrl from "@/assets/mizan_logo.jpg";

export interface ReportData {
  mosque: MosqueInfo;
  monthLabel: string;
  year: number;
  incomes: { label: string; amount: number }[];
  expenses: { label: string; amount: number }[];
  totalIncomes: number;
  totalExpenses: number;
  monthlyNet: number;
  previousBalance: number;
  currentBalance: number;
}

async function getLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch(logoUrl);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });
  } catch { return null; }
}

export async function generateMonthlyReport(d: ReportData) {
  const doc = new jsPDF();
  const cur = d.mosque.currency || "EUR";
  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat("es-ES", { style: "currency", currency: cur }).format(n);
    } catch { return `${n.toFixed(2)} ${cur}`; }
  };

  // Header with logo
  const logoB64 = await getLogoBase64();
  let headerY = 14;
  if (logoB64) {
    doc.addImage(logoB64, "PNG", 14, headerY, 40, 16);
    headerY += 20;
  }

  // Mosque info
  doc.setFontSize(18);
  doc.setTextColor(30, 70, 45);
  doc.text(d.mosque.name, 14, headerY + 4);
  doc.setFontSize(9);
  doc.setTextColor(100);
  if (d.mosque.address) doc.text(d.mosque.address, 14, headerY + 10);
  

  // Report title
  doc.setFontSize(13);
  doc.setTextColor(60);
  doc.text(`Informe ${d.monthLabel} ${d.year}`, 120, headerY + 4);

  // Draw quote using Canvas to perfectly render Arabic and Spanish
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
    doc.addImage(quoteImg, "PNG", 14, headerY + 16, 182, 47);
  }

  // Separator
  const sepY = headerY + 65;
  doc.setDrawColor(180, 150, 80);
  doc.setLineWidth(0.6);
  doc.line(14, sepY, 196, sepY);

  // Incomes table
  autoTable(doc, {
    startY: sepY + 6,
    head: [["Concepto (Ingresos)", "Remuneración"]],
    body: d.incomes.length ? d.incomes.map(i => [i.label, fmt(i.amount)]) : [["-", fmt(0)]],
    headStyles: { fillColor: [40, 90, 60], textColor: 255 },
    theme: "striped",
  });

  // Expenses table
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    head: [["Concepto (Gastos)", "Remuneración"]],
    body: d.expenses.length ? d.expenses.map(i => [i.label, fmt(i.amount)]) : [["-", fmt(0)]],
    headStyles: { fillColor: [140, 50, 50], textColor: 255 },
    theme: "striped",
  });

  // Footer
  if (d.mosque.bank_account) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(50);
    // Centered at bottom
    const bankText = `Cuenta de la Mezquita: ${d.mosque.bank_account}`;
    const textWidth = doc.getStringUnitWidth(bankText) * 12 / doc.internal.scaleFactor;
    const pageWidth = doc.internal.pageSize.width;
    doc.text(bankText, (pageWidth - textWidth) / 2, 275);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`Generado el ${new Date().toLocaleString("es-ES")} - MizanMasjid`, 14, 285);

  doc.save(`informe-${d.mosque.name.replace(/\s+/g, "_")}-${d.year}-${String(d.monthLabel).slice(0, 3)}.pdf`);
}
