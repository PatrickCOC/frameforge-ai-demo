import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { generationJobs, projects } from "@/db/schema";
import { requireApiUser } from "@/lib/demo-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });

  const rows = await getDb()
    .select({
      id: projects.id,
      title: projects.title,
      prompt: projects.prompt,
      style: projects.style,
      duration: projects.duration,
      ratio: projects.ratio,
      createdAt: projects.createdAt,
      latestJobStatus: sql<string>`(
        SELECT status FROM generation_jobs
        WHERE generation_jobs.project_id = ${projects.id}
        ORDER BY generation_jobs.created_at DESC LIMIT 1
      )`,
    })
    .from(projects)
    .leftJoin(generationJobs, eq(generationJobs.projectId, projects.id))
    .where(eq(projects.ownerId, user.userId))
    .groupBy(projects.id)
    .orderBy(desc(projects.createdAt))
    .limit(20);

  return NextResponse.json({ projects: rows }, { headers: { "cache-control": "no-store" } });
}
