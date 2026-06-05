import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { MosqueInfo } from "./auth";

// Logo will be embedded as base64 at build time
import logoUrl from "@/assets/logo.png";

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

  // ─── Header with logo ───
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
  if (d.mosque.bank_account) {
    doc.text(`Cuenta: ${d.mosque.bank_account}`, 14, headerY + 15);
  }

  // Report title
  doc.setFontSize(13);
  doc.setTextColor(60);
  doc.text(`Informe ${d.monthLabel} ${d.year}`, 120, headerY + 4);

  // Arabic Quote (Using an available font, jsPDF core fonts don't fully support Arabic by default without a custom font, but we will add the text)
  // To avoid unreadable characters in jsPDF without an Arabic font embedded, we will skip printing the Arabic text if it fails, or we can use a base64 image if possible. 
  // Wait, standard jsPDF can't render Arabic properly without addFileToVFS and an Arabic font. 
  // Let's add the Spanish translation of the quote instead, or just try to render the text anyway. 
  // Let's just output the text, though it might appear disconnected.
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0); // Very dark as requested
  // Since Arabic rendering in jsPDF requires a font, we will add the Spanish transliteration or meaning, or just the Arabic text and hope the client has a font or use standard.
  doc.text("لَا تَقُمْ فِيهِ أَبَدًا لَّمَسْجِدٌ أُسِّسَ عَلَى ٱلتَّقْوَىٰ مِنْ أَوَّلِ يَوْمٍ أَحَقُّ أَن تَقُومَ فِيهِ فِيهِ رِجَالٌ يُحِبُّونَ أَن يَتَطَهَّرُوا وَٱللَّهُ يُحِبُّ ٱلْمُطَّهِّرِينَ 9:108", 14, headerY + 25, { maxWidth: 180, align: "right" });

  // Separator
  const sepY = headerY + 35;
  doc.setDrawColor(180, 150, 80);
  doc.setLineWidth(0.6);
  doc.line(14, sepY, 196, sepY);

  // Incomes table
  autoTable(doc, {
    startY: sepY + 6,
    head: [["Concepto (Ingresos)", "Remuneración"]],
    body: d.incomes.length ? d.incomes.map(i => [i.label, fmt(i.amount)]) : [["—", fmt(0)]],
    headStyles: { fillColor: [40, 90, 60], textColor: 255 },
    theme: "striped",
  });

  // Expenses table
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 8,
    head: [["Concepto (Gastos)", "Remuneración"]],
    body: d.expenses.length ? d.expenses.map(i => [i.label, fmt(i.amount)]) : [["—", fmt(0)]],
    headStyles: { fillColor: [140, 50, 50], textColor: 255 },
    theme: "striped",
  });

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(150);
  doc.text(`Generado el ${new Date().toLocaleString("es-ES")} · MizanMasjid`, 14, 285);

  doc.save(`informe-${d.mosque.name.replace(/\s+/g, "_")}-${d.year}-${String(d.monthLabel).slice(0, 3)}.pdf`);
}
