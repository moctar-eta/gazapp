const PDFDocument = require("pdfkit");
const ArabicReshaper = require("arabic-reshaper");
const bidiFactory = require("bidi-js");
const path = require("path");
const fs = require("fs");

const bidi = bidiFactory();
const FONT_PATH = path.join(__dirname, "..", "..", "fonts", "Amiri-Regular.ttf");
const LOGO_PATH = path.join(__dirname, "..", "..", "assets", "logo.jpg");

const BOTTLE_LABELS = { B3: "B3", B6: "B6", B12: "B12" };
const ARABIC_RE = /[؀-ۿ]/;

function toVisualArabic(text) {
  const reshaped = ArabicReshaper.convertArabic(String(text));
  const embeddingLevels = bidi.getEmbeddingLevels(reshaped);
  const flips = bidi.getReorderSegments(reshaped, embeddingLevels);
  const chars = reshaped.split("");
  flips.forEach(([start, end]) => {
    const slice = chars.slice(start, end + 1).reverse();
    chars.splice(start, slice.length, ...slice);
  });
  return chars.join("");
}

// Rend correctement un texte arabe s'il en contient (lettres liées + ordre visuel),
// sinon le laisse tel quel — permet d'insérer un nom arabe dans une facture en français.
function formatValue(text) {
  const str = String(text);
  return ARABIC_RE.test(str) ? toVisualArabic(str) : str;
}

function formatMoney(value) {
  return Number(value).toFixed(2);
}

function generateInvoicePdf({ sale, settings, res, subtitle }) {
  const doc = new PDFDocument({ margin: 40, size: "A4" });
  doc.pipe(res);

  const hasArabicFont = fs.existsSync(FONT_PATH);
  if (hasArabicFont) {
    doc.registerFont("Amiri", FONT_PATH);
    doc.font("Amiri");
  }

  const pageLeft = doc.page.margins.left;
  const pageRight = doc.page.width - doc.page.margins.right;
  const fullWidth = pageRight - pageLeft;

  // ---- En-tête ----
  let y = doc.y;
  const centerX = pageLeft + fullWidth / 2;
  const logoRadius = 55;
  const logoSize = logoRadius * 2;

  if (fs.existsSync(LOGO_PATH)) {
    try {
      doc.save();
      doc.circle(centerX, y + logoRadius, logoRadius).clip();
      doc.rect(centerX - logoRadius, y, logoSize, logoSize).fill("#ffffff");
      const imgAspect = 1080 / 720;
      const drawWidth = logoSize;
      const drawHeight = drawWidth / imgAspect;
      const offsetX = centerX - logoRadius;
      const offsetY = y + (logoSize - drawHeight) / 2;
      doc.image(LOGO_PATH, offsetX, offsetY, { width: drawWidth, height: drawHeight });
      doc.restore();
      doc.circle(centerX, y + logoRadius, logoRadius).lineWidth(2).strokeColor("#0e1a3d").stroke();
    } catch {
      // logo illisible : on continue sans bloquer la génération de la facture
    }
  } else {
    doc.circle(centerX, y + logoRadius, logoRadius).fill("#0e1a3d");
    doc.fillColor("#fff").fontSize(13).text("BEZEID", centerX - logoRadius, y + logoRadius - 7, {
      width: logoSize,
      align: "center",
    });
    doc.fillColor("#000");
  }

  y += logoSize + 10;

  if (settings.phone) {
    doc.fontSize(10).fillColor("#000").text(`Tél : ${settings.phone}`, pageLeft, y, {
      width: fullWidth,
      align: "center",
    });
    y += 16;
  }

  y += 10;
  doc.moveTo(pageLeft, y).lineTo(pageRight, y).strokeColor("#999").stroke();
  y += 15;

  // ---- Titre + infos facture ----
  doc.fontSize(20).fillColor("#0e1a3d");
  doc.text("FACTURE", pageLeft, y);
  doc.fillColor("#000");
  y += 26;

  if (subtitle) {
    doc.fontSize(10).fillColor("#17c3b2").text(subtitle, pageLeft, y);
    doc.fillColor("#000");
    y += 16;
  }

  y += 6;

  doc.fontSize(11);
  const createdAt = new Date(sale.createdAt);
  const dateStr = createdAt.toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const timeStr = createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  doc.text(`N° de facture : ${sale.invoiceNumber}`, pageLeft, y);
  y += 16;
  doc.text(`Date : ${dateStr}    Heure : ${timeStr}`, pageLeft, y);
  y += 26;

  // ---- Infos acheteur ----
  doc.fontSize(12).text("Informations acheteur", pageLeft, y);
  y += 18;
  doc.fontSize(11);
  doc.text(`Nom : ${formatValue(sale.buyerName)}`, pageLeft, y);
  y += 16;
  if (sale.buyerPhone) {
    doc.text(`Téléphone : ${sale.buyerPhone}`, pageLeft, y);
    y += 16;
  }
  y += 14;

  // ---- Tableau ----
  const cols = [
    { key: "type", label: "Type", width: fullWidth * 0.2 },
    { key: "qty", label: "Quantité", width: fullWidth * 0.2 },
    { key: "unit", label: "Prix unitaire", width: fullWidth * 0.3 },
    { key: "sub", label: "Total", width: fullWidth * 0.3 },
  ];
  const colX = [];
  let cursor = pageLeft;
  for (const col of cols) {
    colX.push(cursor);
    cursor += col.width;
  }

  const rowHeight = 24;
  doc.rect(pageLeft, y, fullWidth, rowHeight).fill("#f0f0f0");
  doc.fillColor("#000").fontSize(11);
  cols.forEach((col, i) => {
    doc.text(col.label, colX[i], y + 6, { width: col.width, align: "center" });
  });
  y += rowHeight;

  for (const item of sale.items) {
    doc.rect(pageLeft, y, fullWidth, rowHeight).strokeColor("#ddd").stroke();
    doc.fontSize(11).fillColor("#000");
    doc.text(BOTTLE_LABELS[item.bottleType] || item.bottleType, colX[0], y + 6, {
      width: cols[0].width,
      align: "center",
    });
    doc.text(String(item.quantity), colX[1], y + 6, { width: cols[1].width, align: "center" });
    doc.text(formatMoney(item.unitPrice), colX[2], y + 6, { width: cols[2].width, align: "center" });
    doc.text(formatMoney(item.subtotal), colX[3], y + 6, { width: cols[3].width, align: "center" });
    y += rowHeight;
  }

  y += 14;
  doc.fontSize(13);
  doc.text(`Total général : ${formatMoney(sale.total)} MRU`, pageLeft, y, {
    width: fullWidth,
    align: "right",
  });
  y += 40;

  doc.fontSize(11).fillColor("#333");
  doc.text("Merci pour votre confiance", pageLeft, y);

  const footerY = doc.page.height - doc.page.margins.bottom - 20;
  doc.fontSize(9).fillColor("#666");
  const footerParts = [settings.name || "Bezeid"];
  if (settings.phone) footerParts.push(`Tél : ${settings.phone}`);
  doc.text(footerParts.join(" - "), pageLeft, footerY, { width: fullWidth, align: "center" });

  doc.end();
}

module.exports = { generateInvoicePdf };
