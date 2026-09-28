import { PDFDocument, StandardFonts, rgb, PDFFont, PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";

type Opts = {
  name: string;
  eventTitle: string;
  orgName: string;
  date: string;
  verifyUrl: string;
  code: string;
  certificateText?: string;
  templateUrl?: string;
};

/**
 * Tries to fetch and embed NotoSans for non-Latin names.
 * Falls back to standard fonts if the fetch fails.
 */
async function embedFont(pdf: PDFDocument): Promise<{ serif: PDFFont; serifB: PDFFont; sans: PDFFont; hasNoto: boolean }> {
  pdf.registerFontkit(fontkit);

  try {
    // Use Noto Sans from Google Fonts CDN — covers Latin, Devanagari, and many more scripts
    const url = "https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/notosans/NotoSans%5Bwdth%2Cwght%5D.ttf";
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`);
    const fontBytes = await res.arrayBuffer();
    const noto = await pdf.embedFont(fontBytes, { subset: true });
    const serif = await pdf.embedFont(StandardFonts.TimesRoman);
    return { serif, serifB: noto, sans: noto, hasNoto: true };
  } catch {
    // Fallback to standard fonts (Latin only)
    const serifB = await pdf.embedFont(StandardFonts.TimesRomanBold);
    const serif = await pdf.embedFont(StandardFonts.TimesRoman);
    const sans = await pdf.embedFont(StandardFonts.Helvetica);
    return { serif, serifB, sans, hasNoto: false };
  }
}

// Strip non-Latin characters only when using standard fonts
const latin = (s: string) => s.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "").trim();

export async function makeCertificate(o: Opts): Promise<Uint8Array> {
  let pdf: PDFDocument;
  let page: PDFPage;

  // If a template URL is provided, fetch and use it as the base
  if (o.templateUrl) {
    try {
      const res = await fetch(o.templateUrl);
      if (!res.ok) throw new Error(`Template fetch failed: ${res.status}`);
      const templateBytes = await res.arrayBuffer();
      pdf = await PDFDocument.load(templateBytes);
      const pages = pdf.getPages();
      page = pages[0];
    } catch {
      // Fallback to blank certificate
      pdf = await PDFDocument.create();
      page = pdf.addPage([842, 595]);
    }
  } else {
    pdf = await PDFDocument.create();
    page = pdf.addPage([842, 595]); // A4 landscape
  }

  const { serif, serifB, sans, hasNoto } = await embedFont(pdf);
  const ink = rgb(0.08, 0.13, 0.24);
  const pop = rgb(1, 0.24, 0.18);

  const pageW = page.getWidth();
  const center = (t: string, y: number, size: number, font: PDFFont = serif, color = ink) =>
    page.drawText(t, { x: (pageW - font.widthOfTextAtSize(t, size)) / 2, y, size, font, color });

  // Only draw the decorative border if there's no template
  if (!o.templateUrl) {
    page.drawRectangle({ x: 24, y: 24, width: pageW - 48, height: page.getHeight() - 48, borderColor: ink, borderWidth: 3 });
    page.drawRectangle({ x: 34, y: 34, width: pageW - 68, height: page.getHeight() - 68, borderColor: pop, borderWidth: 1 });
  }

  center("Certificate of Participation", 470, 34, serifB);

  // Use the customizable certificate_text, replacing {{event}} and {{name}}
  const certText = (o.certificateText ?? "for participating in {{event}}")
    .replace(/\{\{event\}\}/g, o.eventTitle)
    .replace(/\{\{name\}\}/g, o.name);

  center("This is to certify that", 410, 16);

  const displayName = hasNoto ? o.name.trim() || "Participant" : (latin(o.name) || "Participant");
  let size = 46;
  while (serifB.widthOfTextAtSize(displayName, size) > pageW - 160 && size > 20) size -= 2;
  center(displayName, 350, size, serifB, pop);
  page.drawLine({ start: { x: 221, y: 340 }, end: { x: pageW - 221, y: 340 }, thickness: 1, color: ink });

  // Certificate text line
  let ctSize = 16;
  while (serif.widthOfTextAtSize(certText, ctSize) > pageW - 160 && ctSize > 10) ctSize -= 1;
  center(certText, 300, ctSize);

  const orgLine = `organised by ${hasNoto ? o.orgName.trim() : latin(o.orgName)}  |  ${o.date}`;
  center(orgLine, 260, 14);

  const png = await pdf.embedPng(await QRCode.toBuffer(o.verifyUrl, { margin: 1, width: 240 }));
  page.drawImage(png, { x: pageW - 122, y: 60, width: 72, height: 72 });
  page.drawText("Scan to verify", { x: pageW - 122, y: 46, size: 8, font: sans, color: ink });
  page.drawText(`ID: ${o.code}`, { x: 60, y: 60, size: 10, font: sans, color: ink });

  return pdf.save();
}
