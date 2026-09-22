# FrameForge AI Demo

Zero-budget full-stack demo of an AI animation workspace. It uses a deterministic mock provider so the complete project, storyboard and job lifecycle can be demonstrated without paid AI calls.

## Included

- Next/Vinext UI deployed as a Cloudflare-compatible Worker
- D1 persistence for projects, scenes and generation jobs
- Authenticated per-user records through Sites identity headers
- `/api/projects`, `/api/jobs` and `/api/jobs/:id`
- Queue-like progress from `queued` to `processing` to `completed`
- WebMCP `create_animation_project` tool
- Provider boundary prepared for a future paid video API

## Local development

```bash
pnpm install
pnpm run db:generate
pnpm run dev
```

The production D1 resource is provisioned and migrated by Sites. No external API key is required for this demo.

## Zero-budget boundary

The demo does not call Sora or another paid video API. The preview artwork is bundled, storyboard generation is deterministic, and the job lifecycle is simulated while remaining fully persisted through the real backend and database.
