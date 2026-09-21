const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
const BOTTLE_TYPES = ["B3", "B6", "B12"];
const PAYMENT_STATUSES = ["PAYE", "NON_PAYE"];

router.use(requireAuth);

router.get("/", asyncHandler(async (req, res) => {
  const search = String(req.query.search || "").trim();
  const status = String(req.query.status || "").trim();
  const where = {};
  if (search) where.buyerName = { contains: search, mode: "insensitive" };
  if (PAYMENT_STATUSES.includes(status)) where.status = status;

  const sales = await prisma.sale.findMany({
    where: Object.keys(where).length ? where : undefined,
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(sales);
}));

router.post("/", asyncHandler(async (req, res) => {
  const buyerName = String(req.body?.buyerName || "").trim();
  const buyerPhone = req.body?.buyerPhone ? String(req.body.buyerPhone).trim() : null;
  const quantities = req.body?.quantities || {};
  const status = PAYMENT_STATUSES.includes(req.body?.status) ? req.body.status : "PAYE";

  if (!buyerName) {
    return res.status(400).json({ error: "Le nom de l'acheteur est requis" });
  }

  const entries = BOTTLE_TYPES.map((type) => ({
    type,
    quantity: Math.max(0, parseInt(quantities[type], 10) || 0),
  })).filter((e) => e.quantity > 0);

  if (entries.length === 0) {
    return res.status(400).json({ error: "Sélectionnez au moins une quantité" });
  }

  const prices = await prisma.bottlePrice.findMany();
  const priceMap = Object.fromEntries(prices.map((p) => [p.type, Number(p.price)]));

  const items = entries.map((e) => {
    const unitPrice = priceMap[e.type] ?? 0;
    const subtotal = unitPrice * e.quantity;
    return { bottleType: e.type, quantity: e.quantity, unitPrice, subtotal };
  });
  const total = items.reduce((sum, it) => sum + it.subtotal, 0);

  const count = await prisma.sale.count();
  const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;

  const sale = await prisma.sale.create({
    data: {
      invoiceNumber,
      buyerName,
      buyerPhone,
      total,
      status,
      items: { create: items },
    },
    include: { items: true },
  });

  res.status(201).json(sale);
}));

router.patch("/:id/status", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Identifiant invalide" });
  }
  if (!PAYMENT_STATUSES.includes(req.body?.status)) {
    return res.status(400).json({ error: "Statut invalide" });
  }
  try {
    const sale = await prisma.sale.update({
      where: { id },
      data: { status: req.body.status },
      include: { items: true },
    });
    res.json(sale);
  } catch {
    res.status(404).json({ error: "Vente introuvable" });
  }
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: "Identifiant invalide" });
  }
  try {
    await prisma.sale.delete({ where: { id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: "Vente introuvable" });
  }
}));

module.exports = router;
