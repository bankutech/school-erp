import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanAndSeedInventory() {
  console.log('📦 Cleaning duplicate inventory records and establishing institutional catalog...');

  // 1. Delete all existing movements and inventory items
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventoryItem.deleteMany();

  // 2. Insert diverse, realistic campus stock items across 5 core categories
  const catalog = [
    // Stationery
    {
      itemCode: 'STN-001',
      name: 'A4 Photocopy Paper 75 GSM',
      category: 'Stationery',
      unit: 'REAM',
      minQuantity: 20,
      quantity: 85,
    },
    {
      itemCode: 'STN-002',
      name: 'Whiteboard Marker Box (Black/Blue)',
      category: 'Stationery',
      unit: 'BOX',
      minQuantity: 10,
      quantity: 42,
    },
    {
      itemCode: 'STN-003',
      name: 'Graph Paper Pad (100 Sheets)',
      category: 'Stationery',
      unit: 'PAD',
      minQuantity: 15,
      quantity: 75,
    },
    {
      itemCode: 'STN-004',
      name: 'Permanent Chisel-Tip Marker Set',
      category: 'Stationery',
      unit: 'PACK',
      minQuantity: 8,
      quantity: 6, // Low stock on purpose!
    },
    // Lab Equipment
    {
      itemCode: 'LAB-101',
      name: 'Borosilicate Glass Beakers 250ml',
      category: 'Lab Equipment',
      unit: 'PCS',
      minQuantity: 25,
      quantity: 60,
    },
    {
      itemCode: 'LAB-102',
      name: 'Digital Pocket Thermometer (-50C to 300C)',
      category: 'Lab Equipment',
      unit: 'PCS',
      minQuantity: 10,
      quantity: 4, // Low stock on purpose!
    },
    {
      itemCode: 'LAB-103',
      name: 'Compound Optical Microscope 1000x',
      category: 'Lab Equipment',
      unit: 'UNIT',
      minQuantity: 5,
      quantity: 12,
    },
    {
      itemCode: 'LAB-104',
      name: 'Safety Chemical Splash Goggles',
      category: 'Lab Equipment',
      unit: 'PAIR',
      minQuantity: 30,
      quantity: 48,
    },
    // Sports
    {
      itemCode: 'SPT-201',
      name: 'Official Football Size 5 FIFA Inspected',
      category: 'Sports',
      unit: 'PCS',
      minQuantity: 8,
      quantity: 14,
    },
    {
      itemCode: 'SPT-202',
      name: 'Badminton Tournament Rackets Carbon Pro',
      category: 'Sports',
      unit: 'PAIR',
      minQuantity: 6,
      quantity: 3, // Low stock!
    },
    {
      itemCode: 'SPT-203',
      name: 'Cricket Leather Ball Match Grade',
      category: 'Sports',
      unit: 'BOX',
      minQuantity: 12,
      quantity: 24,
    },
    // IT Assets
    {
      itemCode: 'ITA-301',
      name: 'Logitech Optical USB Mouse B100',
      category: 'IT Assets',
      unit: 'PCS',
      minQuantity: 10,
      quantity: 22,
    },
    {
      itemCode: 'ITA-302',
      name: 'Cat6 Shielded RJ45 Patch Cable 3m',
      category: 'IT Assets',
      unit: 'PCS',
      minQuantity: 20,
      quantity: 50,
    },
    {
      itemCode: 'ITA-303',
      name: 'HDMI to DisplayPort Active Adapter',
      category: 'IT Assets',
      unit: 'PCS',
      minQuantity: 5,
      quantity: 2, // Low stock!
    },
    // Uniforms
    {
      itemCode: 'UNI-401',
      name: 'Senior Secondary Academy Blazer Crest',
      category: 'Uniforms',
      unit: 'PCS',
      minQuantity: 50,
      quantity: 120,
    },
    {
      itemCode: 'UNI-402',
      name: 'House Competition Band Silk (Gold/Navy)',
      category: 'Uniforms',
      unit: 'PCS',
      minQuantity: 25,
      quantity: 65,
    },
  ];

  for (const item of catalog) {
    const created = await prisma.inventoryItem.create({
      data: item,
    });

    // Record initial stock receipt movement
    await prisma.inventoryMovement.create({
      data: {
        itemId: created.id,
        type: 'IN',
        quantity: item.quantity,
        reason: 'Initial term inventory baseline opening stock',
        performedBy: 'Store Officer (Central Stores)',
      },
    });
  }

  console.log(`✅ Successfully catalogued ${catalog.length} unique institutional stock items with opening movements!`);
  await prisma.$disconnect();
}

cleanAndSeedInventory().catch((err) => {
  console.error(err);
  process.exit(1);
});
