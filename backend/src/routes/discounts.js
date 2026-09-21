const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");
const { generateInvoicePdf } = require("../services/pdf");

const router = express.Router();
const BOTTLE_TYPES = ["B3", "B6", "B12"];

router.use(requireAuth);

router.get("/prices", asyncHandler(async (req, res) => {
  const prices = await prisma.discountPrice.findMany();
  res.json(Object.fromEntries(prices.map((p) => [p.type, Number(p.price)])));
}));

router.put("/prices", asyncHandler(async (req, res) => {
  const prices = req.body?.prices || {};
  for (const type of BOTTLE_TYPES) {
    if (prices[type] === undefined) continue;
    const price = Number(prices[type]);
    if (!Number.isFinite(price) || price < 0) continue;
    await prisma.discountPrice.upsert({
      where: { type },
      update: { price },
      create: { type, price },
    });
  }
  res.json({ message: "تم تحديث أسعار التخفيض" });
}));

router.get("/", asyncHandler(async (req, res) => {
  const search = String(req.query.search || "").trim();
  const discounts = await prisma.discountSale.findMany({
    where: search ? { buyerName: { contains: search, mode: "insensitive" } } : undefined,
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(discounts);
}));

router.post("/", asyncHandler(async (req, res) => {
  const buyerName = String(req.body?.buyerName || "").trim();
  const quantities = req.body?.quantities || {};

  if (!buyerName) {
    return res.status(400).json({ error: "اسم المشتري مطلوب" });
  }

  const entries = BOTTLE_TYPES.map((type) => ({
    type,
    quantity: Math.max(0, parseInt(quantities[type], 10) || 0),
  })).filter((e) => e.quantity > 0);

  if (entries.length === 0) {
    return res.status(400).json({ error: "أدخل كمية واحدة على الأقل" });
  }

  const prices = await prisma.discountPrice.findMany();
  const priceMap = Object.fromEntries(prices.map((p) => [p.type, Number(p.price)]));

  const items = entries.map((e) => {
    const unitPrice = priceMap[e.type] ?? 0;
    const subtotal = unitPrice * e.quantity;
    return { bottleType: e.type, quantity: e.quantity, unitPrice, subtotal };
  });
  const total = items.reduce((sum, it) => sum + it.subtotal, 0);

  const count = await prisma.discountSale.count();
  const invoiceNumber = `RED-${String(count + 1).padStart(4, "0")}`;

  const discountSale = await prisma.discountSale.create({
    data: {
      invoiceNumber,
      buyerName,
      total,
      items: { create: items },
    },
    include: { items: true },
  });

  res.status(201).json(discountSale);
}));

router.get("/:id/pdf", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "معرّف غير صالح" });
  }

  const discountSale = await prisma.discountSale.findUnique({ where: { id }, include: { items: true } });
  if (!discountSale) {
    return res.status(404).json({ error: "التخفيض غير موجود" });
  }

  const settings = await prisma.merchantSettings.findUnique({ where: { id: 1 } });

  const disposition = req.query.download ? "attachment" : "inline";
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `${disposition}; filename="${discountSale.invoiceNumber}.pdf"`);

  generateInvoicePdf({
    sale: discountSale,
    settings: {
      name: settings?.name || "Bezeid",
      phone: settings?.phone || null,
    },
    subtitle: "Tarif réduit",
    res,
  });
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "معرّف غير صالح" });
  }
  try {
    await prisma.discountSale.delete({ where: { id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: "التخفيض غير موجود" });
  }
}));

module.exports = router;
