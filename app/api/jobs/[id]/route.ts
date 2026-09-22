import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db";
import { generationJobs, scenes } from "@/db/schema";
import { requireApiUser } from "@/lib/demo-auth";
import { deriveJobState } from "@/lib/mock-provider";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const { id } = await context.params;
  const db = getDb();
  const [job] = await db.select().from(generationJobs).where(and(eq(generationJobs.id, id), eq(generationJobs.ownerId, user.userId))).limit(1);
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const derived = deriveJobState(job.createdAt, job.readyAt);
  if (derived.status !== job.status || derived.progress !== job.progress) {
    await db.update(generationJobs).set({ ...derived, updatedAt: Date.now() }).where(eq(generationJobs.id, job.id));
  }
  const storyboard = await db.select().from(scenes).where(and(eq(scenes.projectId, job.projectId), eq(scenes.ownerId, user.userId))).orderBy(scenes.position);
  return NextResponse.json({ job: { ...job, ...derived, scenes: storyboard } }, { headers: { "cache-control": "no-store" } });
}
