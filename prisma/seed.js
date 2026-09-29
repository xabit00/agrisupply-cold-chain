const { MembershipRole, PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

// Existing bcrypt hash for the documented demo password. No plaintext password
// is stored in the database seed.
const DEMO_PASSWORD_HASH =
  "$2b$10$7hoagj8pSy9rHjzbnRi6UOb/byduuhXrYWsenAdHWSqJP4QzW8Mnu";

const organizations = [
  {
    id: "org_salinas_coop",
    name: "Sargodha Growers Cooperative",
    slug: "sargodha-growers-cooperative",
  },
  {
    id: "org_arctichaul_fleet",
    name: "ArcticHaul Fleet",
    slug: "arctichaul-fleet",
  },
  {
    id: "org_metro_cold_depot",
    name: "AgriSupply Lahore Cold Storage",
    slug: "agrisupply-lahore-cold-storage",
  },
  {
    id: "org_pacific_organic",
    name: "AgriSupply Lahore Market",
    slug: "agrisupply-lahore-market",
  },
];

const users = [
  {
    id: "usr_farm_elena",
    name: "Muhammad Yousaf",
    email: "farmer@agrisupply.pk",
    organizationId: "org_salinas_coop",
    role: MembershipRole.FARMER,
    createdAt: new Date("2026-01-15T08:00:00Z"),
  },
  {
    id: "usr_trans_marcus",
    name: "Asif Javed",
    email: "transporter@agrisupply.pk",
    organizationId: "org_arctichaul_fleet",
    role: MembershipRole.TRANSPORTER,
    createdAt: new Date("2026-01-20T08:00:00Z"),
  },
  {
    id: "usr_wh_sarah",
    name: "Sara Ahmed",
    email: "warehouse@agrisupply.pk",
    organizationId: "org_metro_cold_depot",
    role: MembershipRole.WAREHOUSE_ADMIN,
    createdAt: new Date("2026-02-01T08:00:00Z"),
  },
  {
    id: "usr_ret_david",
    name: "Nadia Hussain",
    email: "retailer@agrisupply.pk",
    organizationId: "org_pacific_organic",
    role: MembershipRole.RETAILER,
    createdAt: new Date("2026-02-10T08:00:00Z"),
  },
];

async function main() {
  for (const organization of organizations) {
    await prisma.organization.upsert({
      where: { id: organization.id },
      create: organization,
      update: { name: organization.name, slug: organization.slug },
    });
  }

  for (const user of users) {
    const { organizationId, role, ...userRecord } = user;

    await prisma.user.upsert({
      where: { id: userRecord.id },
      create: { ...userRecord, passwordHash: DEMO_PASSWORD_HASH },
      update: {
        name: userRecord.name,
        email: userRecord.email,
        passwordHash: DEMO_PASSWORD_HASH,
      },
    });

    await prisma.organizationMembership.upsert({
      where: {
        userId_organizationId: {
          userId: userRecord.id,
          organizationId,
        },
      },
      create: {
        id: "membership_" + userRecord.id,
        userId: userRecord.id,
        organizationId,
        role,
        createdAt: userRecord.createdAt,
      },
      update: { role },
    });
  }

  await prisma.farm.upsert({
    where: { id: "farm_sargodha_a" },
    create: {
      id: "farm_sargodha_a",
      organizationId: "org_salinas_coop",
      name: "Sargodha Farm A",
      address: "University Road, Sargodha, Punjab",
      city: "Sargodha",
      region: "Punjab",
      latitude: 32.0836,
      longitude: 72.6711,
    },
    update: {
      organizationId: "org_salinas_coop",
      name: "Sargodha Farm A",
      address: "University Road, Sargodha, Punjab",
      city: "Sargodha",
      region: "Punjab",
      latitude: 32.0836,
      longitude: 72.6711,
    },
  });

  await prisma.warehouse.upsert({
    where: { id: "warehouse_lahore_cold_storage" },
    create: {
      id: "warehouse_lahore_cold_storage",
      organizationId: "org_metro_cold_depot",
      name: "Lahore Cold Storage",
      address: "Kot Lakhpat Industrial Estate, Lahore, Punjab",
      city: "Lahore",
      region: "Punjab",
      latitude: 31.5204,
      longitude: 74.3587,
      coldStorageEnabled: true,
    },
    update: {
      organizationId: "org_metro_cold_depot",
      name: "Lahore Cold Storage",
      address: "Kot Lakhpat Industrial Estate, Lahore, Punjab",
      city: "Lahore",
      region: "Punjab",
      latitude: 31.5204,
      longitude: 74.3587,
      coldStorageEnabled: true,
    },
  });

  const [organizationCount, userCount, membershipCount, farmCount, warehouseCount] =
    await Promise.all([
      prisma.organization.count(),
      prisma.user.count(),
      prisma.organizationMembership.count(),
      prisma.farm.count(),
      prisma.warehouse.count(),
    ]);

  console.log(
    "Seed complete: " +
      organizationCount +
      " organizations, " +
      userCount +
      " users, " +
      membershipCount +
      " memberships, " +
      farmCount +
      " farms, " +
      warehouseCount +
      " warehouses."
  );
}

main()
  .catch((error) => {
    console.error("Prisma seed failed", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });