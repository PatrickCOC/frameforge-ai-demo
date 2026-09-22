export type StoryboardInput = { prompt: string; duration: number; style: string };

export function buildStoryboard(input: StoryboardInput) {
  const segment = Math.max(1, Math.floor(input.duration / 3));
  const theme = input.prompt.includes("雨") ? "雨夜" : input.prompt.includes("海") ? "海岸" : "故事";
  return [
    { title: `${theme} · 建立場景`, startSecond: 0, endSecond: segment, prompt: `${input.style}，廣角建立鏡頭：${input.prompt}` },
    { title: "動態 · 推進衝突", startSecond: segment, endSecond: segment * 2, prompt: `${input.style}，中景推進，強調主體動作與環境層次。` },
    { title: "情緒 · 收束畫面", startSecond: segment * 2, endSecond: input.duration, prompt: `${input.style}，特寫收束，留下清晰情緒與視覺記憶點。` },
  ];
}

export function deriveJobState(createdAt: number, readyAt: number) {
  const now = Date.now();
  if (now >= readyAt) return { status: "completed" as const, progress: 100 };
  const total = Math.max(1, readyAt - createdAt);
  const elapsed = Math.max(0, now - createdAt);
  const progress = Math.min(92, Math.max(8, Math.round((elapsed / total) * 100)));
  return { status: elapsed < 900 ? ("queued" as const) : ("processing" as const), progress };
}
