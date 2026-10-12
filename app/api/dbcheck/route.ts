import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return Response.json({ ok: false, message: "Forbidden" }, { status: 403 });
  }

  const start = Date.now();
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    await Promise.race([
      prisma.$queryRaw`select 1`,
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error("Database check timed out")), 8000);
      }),
    ]);
    return Response.json({ ok: true, ms: Date.now() - start });
  } catch (error) {
    console.error("Database health check failed:", error);
    return Response.json(
      {
        ok: false,
        ms: Date.now() - start,
        message: "Database check failed",
      },
      { status: 503 },
    );
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}