const express = require("express");
const path = require("path");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");
const { generateInvoicePdf } = require("../services/pdf");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

router.get("/:id/pdf", requireAuth, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Identifiant invalide" });
  }

  const sale = await prisma.sale.findUnique({ where: { id }, include: { items: true } });
  if (!sale) {
    return res.status(404).json({ error: "Vente introuvable" });
  }

  const settings = await prisma.merchantSettings.findUnique({ where: { id: 1 } });

  const disposition = req.query.download ? "attachment" : "inline";
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${disposition}; filename="${sale.invoiceNumber}.pdf"`);

  generateInvoicePdf({
    sale,
    settings: {
      name: settings?.name || "Bezeid",
      phone: settings?.phone || null,
      logoPath: settings?.logoPath
        ? path.join(__dirname, "..", "..", "uploads", path.basename(settings.logoPath))
        : null,
    },
    res,
  });
}));

module.exports = router;
