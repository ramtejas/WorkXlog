# workXlog

A minimal, blue‑themed webapp for weekly work logging, skills tagging, and a simple growth dashboard.

## Quick start
```bash
npm i
npm run dev
```

### Add your screenshot
Place your log form screenshot at:
```
public/assets/workxlog-logform.png
```
(Already added if you provided one earlier. The app will fall back to a built‑in SVG if missing.)

### Build & deploy (Vercel)
```bash
npm run build
npx vercel
npx vercel --prod
```

### Push to GitHub
```bash
git init
git add -A
git commit -m "feat: initial workXlog"
git branch -M main
git remote add origin https://github.com/<YOUR-USER>/workxlog.git
git push -u origin main
```
