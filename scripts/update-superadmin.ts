import prisma from "../src/lib/prisma";

async function updateSuperadmin() {
    const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;

    if (!SUPERADMIN_EMAIL) {
        console.error("❌ SUPERADMIN_EMAIL not set in environment variables");
        process.exit(1);
    }

    console.log(`🔍 Looking for user: ${SUPERADMIN_EMAIL}`);

    const user = await prisma.user.findUnique({
        where: { email: SUPERADMIN_EMAIL },
    });

    if (!user) {
        console.error(`❌ User not found: ${SUPERADMIN_EMAIL}`);
        console.log("💡 The user must log in at least once before being promoted to superadmin");
        process.exit(1);
    }

    console.log(`✅ Found user: ${user.name || 'Unknown'} (${user.email})`);
    console.log(`📊 Current role: ${user.role}`);

    if (user.role === "SUPERADMIN") {
        console.log("✅ User is already a SUPERADMIN");
        process.exit(0);
    }

    await prisma.user.update({
        where: { email: SUPERADMIN_EMAIL },
        data: { role: "SUPERADMIN" },
    });

    console.log("✅ Successfully updated user to SUPERADMIN");

    const updated = await prisma.user.findUnique({
        where: { email: SUPERADMIN_EMAIL },
    });

    console.log(`📊 New role: ${updated?.role}`);
}

updateSuperadmin()
    .catch((e) => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
