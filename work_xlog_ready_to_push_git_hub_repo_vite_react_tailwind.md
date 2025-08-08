# workXlog – Ready-to-Push GitHub Repo

Below are **all files** you need to initialize a GitHub repo and deploy on Vercel. Create this folder structure locally, paste each file’s contents, then follow the Git commands at the bottom.

---

## File tree

```
workxlog/
├─ package.json
├─ .gitignore
├─ vercel.json
├─ postcss.config.js
├─ tailwind.config.js
├─ index.html
├─ README.md
├─ public/
│  └─ assets/
│     └─ workxlog-logform.png   ← put your screenshot here (see README)
└─ src/
   ├─ main.jsx
   ├─ index.css
   └─ App.jsx
```

---

## package.json

```json
{
  "name": "workxlog",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.441.0",
    "recharts": "^2.12.7",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.41",
    "tailwindcss": "^3.4.9",
    "vite": "^5.3.4"
  }
}
```

---

## .gitignore

```gitignore
node_modules
.DS_Store
dist
.vercel
.env
```

---

## vercel.json (SPA fallback)

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

---

## postcss.config.js

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

## tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

---

## index.html

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>workXlog</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

---

## README.md

````md
# workXlog

A minimal, blue‑themed webapp for documenting weekly work, tagging skills, tracking well‑being (1–10), and getting AI‑style paraphrases grouped into Technical and Leadership buckets.

## Quick start
```bash
npm i
npm run dev
````

### Add your screenshot

Place your log form screenshot here:

```
public/assets/workxlog-logform.png
```

If not present, the app will show a built‑in fallback.

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

````

---

## src/main.jsx
```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
````

---

## src/index.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
:root{ font-synthesis-weight:none; -webkit-font-smoothing:antialiased; }
```

---

## src/App.jsx

```jsx
import React, { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowRight, LogIn, LogOut, UserPlus, Save, Check, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * workXlog — Single‑file app (landing + auth + app)
 * Blue theme. External hero images allowed; sample log image served from /public.
 * Data stored in localStorage for the demo.
 */

const APP_KEY = "workxlog_v1";
const MAX_USERS = 500;

// Lightweight inline fallback image (SVG) used if local asset is missing
const LOGFORM_IMG_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='700'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23eff6ff'/%3E%3Cstop offset='1' stop-color='%23bfdbfe'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='100%25' height='100%25'/%3E%3Crect x='80' y='90' rx='14' ry='14' width='1040' height='520' fill='%23ffffff' stroke='%23bfdbfe'/%3E%3Ctext x='600' y='140' text-anchor='middle' font-family='Inter,system-ui' font-size='20' fill='%231e40af'%3EExample: Weekly Log Form%3C/text%3E%3Crect x='120' y='190' width='960' height='100' fill='%23f1f5f9' stroke='%23cbd5e1'/%3E%3Crect x='120' y='320' width='960' height='40' fill='%23e2e8f0'/%3E%3Crect x='120' y='390' width='420' height='14' fill='%23c7d2fe'/%3E%3Crect x='120' y='430' width='780' height='14' fill='%23c7d2fe'/%3E%3Crect x='120' y='470' width='640' height='14' fill='%23c7d2fe'/%3E%3C/svg%3E";
const LOGFORM_IMG = "/assets/workxlog-logform.png"; // your real screenshot path

const DEFAULT_SKILLS = [
  "Python","SQL","R","JavaScript","TypeScript","React","Node.js","API Design","Data Analysis","Statistics","Machine Learning","Testing","Automation","Cloud","AWS","GCP","Azure","CI/CD","Git","FEM","CAD","MedTech","Design Controls","Risk Analysis","Validation","Packaging","Sterilization",
  "Leadership","Strategy","Project Management","Program Management","Stakeholder Management","Cross-functional Collaboration","Mentoring","Facilitation","Roadmapping","Prioritization",
  "Communication","Presentation","Problem Solving","Adaptability","Teamwork","Time Management","Conflict Resolution","Ownership","Attention to Detail"
];

const TECH_KEYWORDS = new Set(["python","sql","r","javascript","typescript","react","node","node.js","api","data","analysis","statistics","ml","machine","testing","automation","cloud","aws","gcp","azure","ci","cd","git","fem","cad","medtech","design","controls","risk","validation","packaging","sterilization"]);
const LEADERSHIP_VERBS = new Set(["led","managed","facilitated","mentored","coordinated","organized","owned","drove","spearheaded","delegated","presented" ]);
const SOFT_KEYWORDS = new Set(["communication","presented","wrote","explained","collaborated","resolved","negotiated","adapted","learned","teamwork","ownership","proactive","time","conflict"]);

const clamp = (n,min,max)=> Math.max(min, Math.min(max, n));
const avg = (arr)=> arr.length ? +(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2) : null;

function naiveHash(s){ let h=0; for(let i=0;i<s.length;i++){ h=(h<<5)-h + s.charCodeAt(i); h|=0;} return (h>>>0).toString(16); }
function tokenize(text){ return (text||"").toLowerCase().replace(/[^a-z0-9\s]/g," ").split(/\s+/).filter(Boolean); }
function classifySkill(skill){
  const t = String(skill||"").toLowerCase();
  if (TECH_KEYWORDS.has(t) || /api|cloud|data|ml|validation|testing|git|cad|fem/.test(t)) return "technical";
  if (/lead|mentor|manage|program|project|roadmap|stakeholder|strategy|facilitate|priorit/.test(t)) return "leadership";
  return "soft";
}
function classifyLine(line){
  const toks = tokenize(line);
  const hasLead = toks.some(t => LEADERSHIP_VERBS.has(t));
  const hasTech = toks.some(t => TECH_KEYWORDS.has(t));
  const hasSoft = toks.some(t => SOFT_KEYWORDS.has(t));
  if (hasTech) return "technical"; if (hasLead) return "leadership"; if (hasSoft) return "soft"; return "soft";
}
function paraphrase(line){
  if (!line) return "";
  const l = line.trim().replace(/\s+/g," ");
  const normalized = l
    .replace(/^i\s+/i, "")
    .replace(/^(led|managed|owned|drove|spearheaded)/i, (m)=> m.charAt(0).toUpperCase()+m.slice(1))
    .replace(/^completed/i, "Completed")
    .replace(/^worked\s+on/i, "Contributed to")
    .replace(/^helped\s+/, "Supported ")
    .replace(/\s{2,}/g, " ");
  return normalized.endsWith(".") ? normalized : normalized + ".";
}
function uniquePush(arr, val){ if (!arr.includes(val)) arr.push(val); }

function startOfWeekISO(date=new Date()){
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day===0? -6 : 1) - day; // Monday start
  d.setDate(d.getDate()+diff); d.setHours(0,0,0,0);
  return d.toISOString();
}
function fmtDate(iso){ const d = new Date(iso); return d.toLocaleDateString(); }

function loadStore(){ try { return JSON.parse(localStorage.getItem(APP_KEY)||"{}"); } catch { return {}; } }
function saveStore(s){ localStorage.setItem(APP_KEY, JSON.stringify(s)); }
function isStorageWritable(){ try{ const k='__wxl_test__'; localStorage.setItem(k,'1'); localStorage.removeItem(k); return true;} catch{ return false; } }

function Header({user, onLogout, goLanding}){
  return (
    <div className="w-full flex items-center justify-between py-4 px-5 bg-white border-b border-blue-100 sticky top-0 z-10">
      <button onClick={goLanding} className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">x</div>
        <div>
          <div className="text-lg font-semibold text-blue-700">workXlog</div>
          <div className="text-xs text-gray-500">Weekly career journal</div>
        </div>
      </button>
      <div className="flex items-center gap-3">
        {user && (
          <button onClick={onLogout} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 text-sm">
            <LogOut className="w-4 h-4"/> Logout
          </button>
        )}
      </div>
    </div>
  );
}

function Footer(){
  return <div className="border-t border-blue-100 mt-10 py-6 text-center text-xs text-gray-500">© {new Date().getFullYear()} workXlog • Make your experience visible.</div>;
}

function Landing({onSignup, onLogin}){
  const FeatureCard = ({title, text, img, alt}) => (
    <div className="p-3 rounded-2xl border border-blue-100 bg-white">
      <div className="rounded-xl overflow-hidden relative">
        <img src={img} alt={alt || title} className="block w-full h-40 object-cover" loading="lazy"
          onError={(e)=>{ e.currentTarget.style.display='none'; e.currentTarget.parentElement?.classList.add('bg-gradient-to-br','from-blue-50','to-blue-100'); }} />
      </div>
      <div className="mt-3">
        <div className="font-semibold text-gray-900">{title}</div>
        <div className="text-sm text-gray-600 mt-1">{text}</div>
      </div>
    </div>
  );

  return (
    <div className="bg-white">
      <div className="bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-6xl mx-auto px-4 pt-10 pb-12 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold leading-tight text-gray-900">Turn weekly work into <span className="text-blue-700">career leverage</span>.</h1>
            <p className="mt-3 text-gray-600">Log responsibilities, tag skills, track how you felt, and get clear strengths for reviews, promos, and job searches.</p>
          
```
