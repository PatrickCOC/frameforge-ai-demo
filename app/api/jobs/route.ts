import { env } from "cloudflare:workers";
import { NextRequest, NextResponse } from "next/server";
import { buildStoryboard } from "@/lib/mock-provider";
import { requireApiUser } from "@/lib/demo-auth";

const allowedStyles = new Set(["手繪動畫", "電影寫實", "立體黏土"]);
const allowedDurations = new Set([5, 10, 15]);
const allowedRatios = new Set(["16:9", "9:16", "1:1"]);

export async function POST(request: NextRequest) {
  const user = await requireApiUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const db = env.DB;
  if (!db) return NextResponse.json({ error: "Database unavailable" }, { status: 503 });

  const body = (await request.json()) as Record<string, unknown>;
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  const style = typeof body.style === "string" && allowedStyles.has(body.style) ? body.style : "手繪動畫";
  const duration = typeof body.duration === "number" && allowedDurations.has(body.duration) ? body.duration : 10;
  const ratio = typeof body.ratio === "string" && allowedRatios.has(body.ratio) ? body.ratio : "16:9";
  const motion = typeof body.motion === "number" ? Math.max(0, Math.min(100, Math.round(body.motion))) : 50;
  if (prompt.length < 8 || prompt.length > 500) return NextResponse.json({ error: "Prompt must contain 8–500 characters" }, { status: 400 });

  const now = Date.now();
  const projectId = crypto.randomUUID();
  const jobId = crypto.randomUUID();
  const storyboard = buildStoryboard({ prompt, duration, style });
  const title = prompt.replace(/[。！？.!?][\s\S]*$/, "").slice(0, 28) || "未命名動畫";
  const statements = [
    db.prepare("INSERT INTO projects (id, owner_id, title, prompt, style, duration, ratio, motion, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(projectId, user.userId, title, prompt, style, duration, ratio, motion, now, now),
    ...storyboard.map((scene, position) => db.prepare("INSERT INTO scenes (id, project_id, owner_id, position, title, start_second, end_second, prompt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").bind(crypto.randomUUID(), projectId, user.userId, position, scene.title, scene.startSecond, scene.endSecond, scene.prompt)),
    db.prepare("INSERT INTO generation_jobs (id, project_id, owner_id, provider, status, progress, ready_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").bind(jobId, projectId, user.userId, "mock-zero-budget-v1", "queued", 8, now + 6200, now, now),
  ];
  await db.batch(statements);

  return NextResponse.json({
    job: {
      id: jobId,
      projectId,
      status: "queued",
      progress: 8,
      provider: "mock-zero-budget-v1",
      createdAt: now,
      scenes: storyboard.map((scene, position) => ({ id: `pending-${position}`, position, ...scene })),
    },
  }, { status: 201 });
}
