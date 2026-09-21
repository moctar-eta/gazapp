const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEFAULT_PRICES = {
  B3: 15,
  B6: 25,
  B12: 45,
};

const DEFAULT_DISCOUNT_PRICES = {
  B3: 10,
  B6: 18,
  B12: 35,
};

async function main() {
  await prisma.merchantSettings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, name: "Bezeid" },
  });

  for (const [type, price] of Object.entries(DEFAULT_PRICES)) {
    await prisma.bottlePrice.upsert({
      where: { type },
      update: {},
      create: { type, price },
    });
  }

  for (const [type, price] of Object.entries(DEFAULT_DISCOUNT_PRICES)) {
    await prisma.discountPrice.upsert({
      where: { type },
      update: {},
      create: { type, price },
    });
  }

  console.log("Seed terminé : paramètres commerçant + prix par défaut créés.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
