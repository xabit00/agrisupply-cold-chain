const { MembershipRole, PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const STAGING_ORG_SLUG = "default-staging-org";
const STAGING_FARM_ID = "farm_default_staging";

async function main() {
  const farmerEmail = process.env.SEED_FARMER_EMAIL?.trim().toLowerCase();
  if (!farmerEmail) {
    throw new Error("SEED_FARMER_EMAIL must be set to the signed-in farmer's email");
  }

  const farmer = await prisma.user.findUnique({
    where: { email: farmerEmail },
    select: { id: true, email: true },
  });

  if (!farmer) {
    throw new Error(`No existing user found for SEED_FARMER_EMAIL=${farmerEmail}`);
  }

  const existingOrganization = await prisma.organization.findUnique({
    where: { slug: STAGING_ORG_SLUG },
    select: { id: true },
  });

  const organization = await prisma.organization.upsert({
    where: { slug: STAGING_ORG_SLUG },
    create: {
      name: "Default Staging Organization",
      slug: STAGING_ORG_SLUG,
    },
    update: {
      name: "Default Staging Organization",
    },
  });

  const existingFarm = await prisma.farm.findUnique({
    where: { id: STAGING_FARM_ID },
    select: { id: true },
  });

  const farm = await prisma.farm.upsert({
    where: { id: STAGING_FARM_ID },
    create: {
      id: STAGING_FARM_ID,
      organizationId: organization.id,
      name: "Sargodha Farm A",
      address: "University Road, Sargodha, Punjab",
      city: "Sargodha",
      region: "Punjab",
      latitude: 32.0836,
      longitude: 72.6711,
    },
    update: {
      organizationId: organization.id,
      name: "Sargodha Farm A",
      address: "University Road, Sargodha, Punjab",
      city: "Sargodha",
      region: "Punjab",
      latitude: 32.0836,
      longitude: 72.6711,
    },
  });

  const membershipKey = {
    userId: farmer.id,
    organizationId: organization.id,
  };
  const existingMembership = await prisma.organizationMembership.findUnique({
    where: { userId_organizationId: membershipKey },
    select: { id: true },
  });

  const membership = await prisma.organizationMembership.upsert({
    where: { userId_organizationId: membershipKey },
    create: {
      ...membershipKey,
      role: MembershipRole.FARMER,
    },
    update: {
      role: MembershipRole.FARMER,
    },
  });

  console.log("Farmer staging seed complete:");
  console.log(`- User: existing and unchanged (${farmer.email}, ${farmer.id})`);
  console.log(
    `- Organization: ${existingOrganization ? "existing" : "created"} (${organization.slug}, ${organization.id})`
  );
  console.log(
    `- Farm: ${existingFarm ? "existing" : "created"} (${farm.name}, ${farm.id})`
  );
  console.log(
    `- FARMER membership: ${existingMembership ? "existing" : "created"} (${membership.id})`
  );
}

main()
  .catch((error) => {
    console.error("Farmer staging seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
