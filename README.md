# MatchLens

ATS-style **resume ↔ job description** match report (Jobscan-like).

Upload or paste a resume, paste a job posting, and get:

- **Match rate** (weighted)
- **Searchability** checks (contact, headings, title, dates, file type)
- **Hard skills** comparison with missing keywords
- **Soft skills** comparison
- **Recruiter tips** (summary, experience level, measurable results, tone, web presence, word count)
- **Formatting** ATS tips

Everything runs **in your browser** — resume text is not sent to a backend.

## Why not an LLM for the core ATS score?

Real ATS shortlisting is mostly **keyword and rules matching**, not generative AI. MatchLens uses the same approach so scores stay stable, cheap, and Cloudflare-friendly. (An LLM is optional later for rewrite suggestions; it is not required for match scoring.)

## Local development

```bash
npm install
npm run dev
```

App runs at [http://127.0.0.1:3847](http://127.0.0.1:3847).

```bash
npm run build
npm run preview
```

## Deploy to Cloudflare Pages

### Option A — Wrangler CLI

1. Log in: `npx wrangler login`
2. Deploy:

```bash
npm run deploy
```

This builds the static site into `dist/` and publishes it with Wrangler Pages (`project-name: matchlens`).

### Option B — Cloudflare dashboard (Git)

1. Push this repo to GitHub/GitLab.
2. In Cloudflare → **Workers & Pages** → **Create** → **Pages** → connect the repo.
3. Build settings:
   - **Framework preset:** Vite
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
4. Save and deploy.

No environment secrets are required for the core matcher.

## Using the app

1. Click **Load sample scan** to try the demo (or upload your PDF / paste text).
2. Paste the target job description.
3. Optionally set company + job title.
4. Click **Run ATS match scan**.
5. Use the sidebar to jump between Searchability, Hard Skills, Soft Skills, Recruiter Tips, and Formatting.

## Stack

- Vite + React + TypeScript
- Tailwind CSS v4
- pdf.js (client-side PDF text extraction)
- Cloudflare Pages (static hosting)
