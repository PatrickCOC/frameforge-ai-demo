"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, Clapperboard, Clock3, Download, Film, History, LoaderCircle, Play, Plus, Save, Sparkles, WandSparkles } from "lucide-react";

type Scene = { id: string; position: number; title: string; startSecond: number; endSecond: number; prompt: string };
type Job = { id: string; projectId: string; status: "queued" | "processing" | "completed" | "failed"; progress: number; provider: string; createdAt: number; scenes?: Scene[] };
type Project = { id: string; title: string; prompt: string; style: string; duration: number; ratio: string; createdAt: number; latestJobStatus?: Job["status"] };

const DEFAULT_PROMPT = "雨夜裡，一位旅人站在霓虹屋頂，看著發光列車穿越城市天際線。鏡頭緩慢推近，風吹起外套和絲帶。";
const styles = ["手繪動畫", "電影寫實", "立體黏土"];

export default function Studio() {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [style, setStyle] = useState(styles[0]);
  const [duration, setDuration] = useState(10);
  const [ratio, setRatio] = useState("16:9");
  const [motion, setMotion] = useState(56);
  const [projects, setProjects] = useState<Project[]>([]);
  const [job, setJob] = useState<Job | null>(null);
  const [activeScene, setActiveScene] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [message, setMessage] = useState("Ready");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadProjects = useCallback(async () => {
    try {
      const response = await fetch("/api/projects", { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load projects");
      const data = (await response.json()) as { projects: Project[] };
      setProjects(data.projects);
    } catch {
      setMessage("歷史記錄暫時未能載入");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    void loadProjects();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadProjects]);

  const pollJob = useCallback((jobId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const response = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
      if (!response.ok) return;
      const next = (await response.json()) as { job: Job };
      setJob(next.job);
      if (next.job.status === "completed" || next.job.status === "failed") {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        setMessage(next.job.status === "completed" ? "分鏡預覽已完成" : "生成失敗，請重試");
        await loadProjects();
      }
    }, 900);
  }, [loadProjects]);

  const generate = useCallback(async (override?: Partial<{ prompt: string; style: string; duration: number; ratio: string }>) => {
    const payload = { prompt: override?.prompt ?? prompt, style: override?.style ?? style, duration: override?.duration ?? duration, ratio: override?.ratio ?? ratio, motion };
    if (!payload.prompt.trim()) {
      setMessage("請先輸入動畫描述");
      return { ok: false };
    }
    setMessage("正在建立專案與分鏡任務…");
    setActiveScene(0);
    const response = await fetch("/api/jobs", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) {
      setMessage("未能建立生成任務");
      return { ok: false };
    }
    const data = (await response.json()) as { job: Job };
    setJob(data.job);
    pollJob(data.job.id);
    return { ok: true, jobId: data.job.id, projectId: data.job.projectId };
  }, [duration, motion, pollJob, prompt, ratio, style]);

  useEffect(() => {
    const context = document.modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: "create_animation_project",
      title: "建立動畫專案",
      description: "以故事描述和風格建立 FrameForge 動畫分鏡專案及模擬生成任務。",
      inputSchema: {
        type: "object",
        properties: {
          prompt: { type: "string", minLength: 8, maxLength: 500 },
          style: { type: "string", enum: styles },
          duration: { type: "number", enum: [5, 10, 15] },
          ratio: { type: "string", enum: ["16:9", "9:16", "1:1"] },
        },
        required: ["prompt"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input: unknown) => {
        const value = input as Partial<{ prompt: string; style: string; duration: number; ratio: string }>;
        if (!value.prompt || value.prompt.length < 8) throw new Error("prompt must contain at least 8 characters");
        setPrompt(value.prompt);
        if (value.style) setStyle(value.style);
        if (value.duration) setDuration(value.duration);
        if (value.ratio) setRatio(value.ratio);
        return generate(value);
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, [generate]);

  const statusLabel = useMemo(() => {
    if (!job) return "等待新任務";
    return { queued: "排隊中", processing: `製作分鏡 ${job.progress}%`, completed: "預覽已完成", failed: "生成失敗" }[job.status];
  }, [job]);

  const scenes = job?.scenes ?? [];
  const displayScenes = scenes.length ? scenes : [
    { id: "placeholder-1", position: 0, title: "雨夜 · 天台遠景", startSecond: 0, endSecond: 3, prompt: "" },
    { id: "placeholder-2", position: 1, title: "列車穿越城市", startSecond: 3, endSecond: 7, prompt: "" },
    { id: "placeholder-3", position: 2, title: "旅人的決定", startSecond: 7, endSecond: 10, prompt: "" },
  ];

  return (
    <main className="studio-shell">
      <header className="topbar">
        <div className="brand"><span className="brand-mark"><Play size={12} fill="currentColor" /></span><span>FRAMEFORGE</span><em>ZERO-BUDGET LAB</em></div>
        <nav><button className="active">工作台</button><button onClick={() => document.querySelector("#history")?.scrollIntoView({ behavior: "smooth" })}>專案</button></nav>
        <div className="backend-state"><span /> D1 + Mock API</div>
      </header>

      <section className="title-row">
        <div><p>AI ANIMATION PROTOTYPE</p><h1>由故事到分鏡，完整保存每次創作。</h1></div>
        <span className="save-state"><Save size={14} /> 所有任務寫入資料庫</span>
      </section>

      <section className="studio-grid">
        <aside className="controls card">
          <div className="field">
            <div className="field-head"><label htmlFor="prompt">描述你的動畫</label><span>{prompt.length} / 500</span></div>
            <div className="prompt-wrap"><textarea id="prompt" maxLength={500} value={prompt} onChange={(event) => setPrompt(event.target.value)} /><button aria-label="優化提示詞" onClick={() => setPrompt((value) => `${value.replace(/\s+$/g, "")} 加入電影感運鏡、環境動態與光影層次。`)}><WandSparkles size={16} /></button></div>
          </div>
          <div className="field"><div className="field-head"><span>視覺風格</span></div><div className="style-grid">{styles.map((item, index) => <button key={item} className={style === item ? "selected" : ""} onClick={() => setStyle(item)}><i data-style={index} /><b>{item}</b></button>)}</div></div>
          <div className="two-col">
            <div className="field compact"><div className="field-head"><span>片長</span></div><div className="segments">{[5,10,15].map((value) => <button key={value} className={duration === value ? "selected" : ""} onClick={() => setDuration(value)}>{value} 秒</button>)}</div></div>
            <div className="field compact"><div className="field-head"><span>比例</span></div><div className="segments">{["16:9","9:16","1:1"].map((value) => <button key={value} className={ratio === value ? "selected" : ""} onClick={() => setRatio(value)}>{value}</button>)}</div></div>
          </div>
          <div className="field compact"><div className="field-head"><span>動態強度</span><b>{motion < 34 ? "平穩" : motion < 72 ? "自然" : "強烈"}</b></div><input aria-label="動態強度" type="range" min={0} max={100} value={motion} onChange={(event) => setMotion(Number(event.target.value))} /></div>
          <button className="generate" disabled={job?.status === "queued" || job?.status === "processing"} onClick={() => void generate()}>{job?.status === "queued" || job?.status === "processing" ? <LoaderCircle className="spin" /> : <Sparkles />}<b>{job?.status === "queued" || job?.status === "processing" ? "正在生成" : "建立動畫分鏡"}</b><small>0 API 成本</small></button>
          <output className="message" aria-live="polite">{message}</output>
        </aside>

        <section className="preview card">
          <div className="preview-head"><div className="status"><span className={job?.status ?? "idle"} /> <b>{statusLabel}</b></div><button className="export" disabled={job?.status !== "completed"} onClick={() => setMessage("Demo 模式：匯出已停用，未產生付費影片。")}>匯出影片 <Download size={14} /></button></div>
          <div className={`stage ${playing ? "playing" : ""}`}><img src="/animation-keyframe.webp" alt="FrameForge 雨夜城市分鏡示範" /><div className="stage-shade" /><div className="shot-label"><span>SHOT {String(activeScene + 1).padStart(2,"0")}</span><b>{scenes[activeScene]?.title ?? "雨夜 · 天台遠景"}</b></div><button className="play" aria-label="播放預覽" onClick={() => setPlaying((value) => !value)}>{playing ? "Ⅱ" : <Play size={22} fill="currentColor" />}</button>{job && job.status !== "completed" && <div className="progress-overlay"><LoaderCircle className="spin" /><b>{job.progress}%</b><span>本地 mock provider 正在組合分鏡</span></div>}</div>
          <div className="timeline-head"><div><p>鏡頭序列</p><span>{displayScenes.length} 個鏡頭 · {duration} 秒</span></div><button onClick={() => setMessage("Demo 已保留新增鏡頭接口")}>＋ 新增鏡頭</button></div>
          <div className="scene-list">{displayScenes.map((scene, index) => <button key={scene.id} className={activeScene === index ? "selected" : ""} onClick={() => setActiveScene(index)}><i data-scene={index} /><span><b>0{index + 1}</b><small>{scene.startSecond.toFixed(0).padStart(2,"0")}–{scene.endSecond.toFixed(0).padStart(2,"0")}s</small></span><strong>{scene.title}</strong></button>)}</div>
        </section>
      </section>

      <section className="history card" id="history">
        <div className="history-head"><div><p>DATABASE RECORDS</p><h2>最近專案</h2></div><span><History size={15} /> 真實讀取 D1</span></div>
        <div className="project-list">{loadingHistory ? <div className="empty"><LoaderCircle className="spin" /> 正在載入</div> : projects.length === 0 ? <div className="empty"><Clapperboard /> 尚未有專案，建立第一個分鏡任務。</div> : projects.slice(0,6).map((project) => <article key={project.id}><div className="project-icon"><Film /></div><div><b>{project.title}</b><p>{project.style} · {project.duration} 秒 · {project.ratio}</p></div><time>{new Date(project.createdAt).toLocaleDateString("zh-HK")}</time><span className={`job-pill ${project.latestJobStatus ?? "completed"}`}>{project.latestJobStatus ?? "completed"}</span></article>)}</div>
      </section>
      <footer><span><Check size={14} /> 無外部 AI 收費</span><span><Clock3 size={14} /> 任務狀態由 API 驅動</span><span><Plus size={14} /> 預留 SoraProvider 接口</span></footer>
    </main>
  );
}
