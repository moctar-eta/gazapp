const express = require("express");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
const BOTTLE_TYPES = ["B3", "B6", "B12"];

router.use(requireAuth);

router.get("/", asyncHandler(async (req, res) => {
  const settings = await prisma.merchantSettings.findUnique({ where: { id: 1 } });
  const prices = await prisma.bottlePrice.findMany();
  res.json({
    name: settings?.name || "Bezeid",
    phone: settings?.phone || null,
    prices: Object.fromEntries(prices.map((p) => [p.type, Number(p.price)])),
  });
}));

router.put("/", asyncHandler(async (req, res) => {
  const phone = req.body?.phone ? String(req.body.phone).trim() : null;
  const prices = req.body?.prices || {};

  await prisma.merchantSettings.upsert({
    where: { id: 1 },
    update: { phone },
    create: { id: 1, name: "Bezeid", phone },
  });

  for (const type of BOTTLE_TYPES) {
    if (prices[type] === undefined) continue;
    const price = Number(prices[type]);
    if (!Number.isFinite(price) || price < 0) continue;
    await prisma.bottlePrice.upsert({
      where: { type },
      update: { price },
      create: { type, price },
    });
  }

  res.json({ message: "Paramètres mis à jour" });
}));

module.exports = router;
