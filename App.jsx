import React, { useEffect, useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowRight, LogIn, LogOut, UserPlus, Save, Check, ChevronLeft, ChevronRight } from "lucide-react";

/**
 * workXlog — Single‑file app (landing + auth + app)
 * Blue theme aligned with landing. External hero images allowed.
 * Example log image is served from /public/assets/workxlog-logform.png with an inline SVG fallback.
 * Data stored in localStorage for the demo.
 */

const APP_KEY = "workxlog_v1";
const MAX_USERS = 500;

// Inline SVG fallback image (lightweight)
const LOGFORM_IMG_FALLBACK =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='700'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0' x2='1' y1='0' y2='1'%3E%3Cstop stop-color='%23eff6ff'/%3E%3Cstop offset='1' stop-color='%23bfdbfe'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='100%25' height='100%25'/%3E%3Crect x='80' y='90' rx='14' ry='14' width='1040' height='520' fill='%23ffffff' stroke='%23bfdbfe'/%3E%3Ctext x='600' y='140' text-anchor='middle' font-family='Inter,system-ui' font-size='20' fill='%231e40af'%3EExample: Weekly Log Form%3C/text%3E%3Crect x='120' y='190' width='960' height='100' fill='%23f1f5f9' stroke='%23cbd5e1'/%3E%3Crect x='120' y='320' width='960' height='40' fill='%23e2e8f0'/%3E%3Crect x='120' y='390' width='420' height='14' fill='%23c7d2fe'/%3E%3Crect x='120' y='430' width='780' height='14' fill='%23c7d2fe'/%3E%3Crect x='120' y='470' width='640' height='14' fill='%23c7d2fe'/%3E%3C/svg%3E";
const LOGFORM_IMG = "/assets/workxlog-logform.png";

const DEFAULT_SKILLS = [
  "Python","SQL","R","JavaScript","TypeScript","React","Node.js","API Design","Data Analysis","Statistics","Machine Learning","Testing","Automation","Cloud","AWS","GCP","Azure","CI/CD","Git","FEM","CAD","MedTech","Design Controls","Risk Analysis","Validation","Packaging","Sterilization",
  "Leadership","Strategy","Project Management","Program Management","Stakeholder Management","Cross-functional Collaboration","Mentoring","Facilitation","Roadmapping","Prioritization",
  "Communication","Presentation","Problem Solving","Adaptability","Teamwork","Time Management","Conflict Resolution","Ownership","Attention to Detail"
];

const TECH_KEYWORDS = new Set([
  "python","sql","r","javascript","typescript","react","node","node.js","api","data","analysis","statistics","ml","machine","testing","automation","cloud","aws","gcp","azure","ci","cd","git","fem","cad","medtech","design","controls","risk","validation","packaging","sterilization"
]);
const LEADERSHIP_VERBS = new Set(["led","managed","facilitated","mentored","coordinated","organized","owned","drove","spearheaded","delegated","presented" ]);
const SOFT_KEYWORDS = new Set(["communication","presented","wrote","explained","collaborated","resolved","negotiated","adapted","learned","teamwork","ownership","proactive","time","conflict"]);

const clamp = (n,min,max)=> Math.max(min, Math.min(max, n));
const avg = (arr)=> arr.length ? +(arr.reduce((a,b)=>a+b,0)/arr.length).toFixed(2) : null;

function naiveHash(s){ let h=0; for(let i=0;i<s.length;i++){ h=(h<<5)-h + s.charCodeAt(i); h|=0;} return (h>>>0).toString(16); }
function tokenize(text){ return (text||"").toLowerCase().replace(/[^a-z0-9\\s]/g," ").split(/\\s+/).filter(Boolean); }
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
  const l = line.trim().replace(/\\s+/g," ");
  const normalized = l
    .replace(/^i\\s+/i, "")
    .replace(/^(led|managed|owned|drove|spearheaded)/i, (m)=> m.charAt(0).toUpperCase()+m.slice(1))
    .replace(/^completed/i, "Completed")
    .replace(/^worked\\s+on/i, "Contributed to")
    .replace(/^helped\\s+/, "Supported ")
    .replace(/\\s{2,}/g, " ");
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
        <img
          src={img}
          alt={alt || title}
          className="block w-full h-40 object-cover"
          loading="lazy"
          onError={(e)=>{ e.currentTarget.style.display='none'; e.currentTarget.parentElement?.classList.add('bg-gradient-to-br','from-blue-50','to-blue-100'); }}
        />
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
            <div className="mt-5 flex items-center gap-3">
              <button onClick={onSignup} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">Start free <ArrowRight className="w-4 h-4"/></button>
              <a href="#features" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50">See features</a>
            </div>
            <div className="mt-6 text-xs text-gray-600">Private by default • Your data stays in your browser during the pilot</div>
          </div>
          {/* aspirational external hero image */}
          <div className="relative rounded-[20px] overflow-hidden border border-blue-100 shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1400&q=60"
              alt="Ambitious team collaborating to turn work into results"
              className="block w-full h-72 object-cover"
              loading="lazy"
              onError={(e)=>{ e.currentTarget.style.display='none'; e.currentTarget.parentElement?.classList.add('bg-gradient-to-br','from-blue-50','to-blue-100'); }}
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/60 via-transparent to-blue-100/40 pointer-events-none" />
          </div>
        </div>
      </div>

      <div id="features" className="max-w-6xl mx-auto px-4 py-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Minimal features, real impact</h2>
          <p className="text-gray-600 mt-2">No busywork. Just the inputs that matter.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <FeatureCard
            title="Weekly logging"
            text="Capture what you owned or contributed to in minutes."
            img="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=60"
            alt="Focused professional planning weekly tasks"
          />
          <FeatureCard
            title="Skills & strengths"
            text="Tag skills and see your strongest areas at a glance."
            img="https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1400&q=60"
            alt="Team reviewing charts and sticky notes"
          />
          <FeatureCard
            title="Well‑being trend"
            text="A simple 1–10 slider helps track energy and avoid burnout."
            img="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1400&q=60"
            alt="Laptop on a clean desk symbolizing clarity and focus"
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Log form, clearly explained</h3>
          <ul className="mt-3 space-y-2">
            {["One bullet per responsibility — owned or contributed.","Tag the skills you used (auto‑suggested).","Rate your week: 1 (overwhelmed) → 10 (excellent).","Save once — your dashboard updates automatically."].map((b,i)=>(
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700"><Check className="w-4 h-4 mt-0.5 text-blue-700"/> {b}</li>
            ))}
          </ul>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={onSignup} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">Sign up free <ArrowRight className="w-4 h-4"/></button>
            <button onClick={onLogin} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50">Log in</button>
          </div>
        </div>
        <div className="relative rounded-2xl overflow-hidden border border-blue-100 shadow-sm">
          <img
            src={LOGFORM_IMG}
            alt="Sample completed weekly log form"
            className="block w-full h-72 object-cover"
            loading="lazy"
            onError={(e)=>{ e.currentTarget.src = LOGFORM_IMG_FALLBACK; }}
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-50/60 via-transparent to-blue-100/40 pointer-events-none" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 pb-12">
        <div className="p-4 border border-blue-100 rounded-2xl bg-blue-50/40 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-700">Ready to start?</div>
            <div className="font-semibold text-gray-900">Create your account and log your first week in minutes.</div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onSignup} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700">Sign up <ArrowRight className="w-4 h-4"/></button>
            <button onClick={onLogin} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50">Log in</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Auth({defaultMode='login', onAuthed, onCancel}){
  const [mode, setMode] = useState(defaultMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");
  const [storageOK, setStorageOK] = useState(true);

  useEffect(()=>{ setStorageOK(isStorageWritable()); }, []);

  function submit(){
    setError("");
    if (!isStorageWritable()) { setStorageOK(false); setError("Can't access browser storage. Disable private mode and retry."); return; }
    const store = loadStore(); if (!store.users) store.users = {}; if (!store.logs) store.logs = {};

    if (mode==='signup'){
      if (Object.keys(store.users).length >= MAX_USERS) { setError("Signups full: 500-user contest cap reached."); return; }
      if (!name.trim()) { setError("Please enter your name."); return; }
      if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) { setError("Enter a valid email."); return; }
      if ((pass||"").length < 8) { setError("Password must be at least 8 characters."); return; }
      if (store.users[email]) { setError("That email is already registered. Try logging in."); return; }
      store.users[email] = { name: name.trim(), pass: naiveHash(pass), createdAt: new Date().toISOString() };
      store.logs[email] = [];
    } else {
      const u = store.users?.[email];
      if (!u || u.pass !== naiveHash(pass)) { setError("Invalid email or password."); return; }
    }

    store.session = { email };
    saveStore(store);
    onAuthed(email);
  }

  return (
    <div className="min-h-[70vh] bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="w-full max-w-md mx-auto p-6 bg-white border border-blue-100 rounded-2xl shadow-sm">
        <div className="flex items-center justify_between mb-3">
          <div className="flex items-center gap-2">
            {mode==='login' ? <LogIn className="w-5 h-5 text-blue-700"/> : <UserPlus className="w-5 h-5 text-blue-700"/>}
            <h1 className="text-xl font-semibold">{mode==='login' ? 'Welcome back' : 'Create your account'}</h1>
          </div>
          <div className="border border-blue-200 rounded-xl p-1 flex text-sm">
            <button onClick={()=>setMode('login')} className={`px-3 py-1 rounded-lg ${mode==='login' ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-50'}`}>Log in</button>
            <button onClick={()=>setMode('signup')} className={`px-3 py-1 rounded-lg ${mode==='signup' ? 'bg-blue-600 text-white' : 'text-blue-700 hover:bg-blue-50'}`}>Sign up</button>
          </div>
        </div>

        {mode==='signup' && (
          <div className="mb-3">
            <label className="text-sm font-medium">Full Name</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g., Sam Patel" className="mt-1 w-full border rounded-xl px-3 py-2"/>
          </div>
        )}
        <div className="mb-3">
          <label className="text-sm font-medium">Email</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@work.com" className="mt-1 w-full border rounded-xl px-3 py-2"/>
        </div>
        <div className="mb-1">
          <label className="text-sm font-medium">Password</label>
          <input value={pass} type="password" onChange={e=>setPass(e.target.value)} placeholder="Minimum 8 characters" className="mt-1 w-full border rounded-xl px-3 py-2"/>
        </div>
        {error && <div className="text-red-600 text-sm mt-2">{error}</div>}
        <div className="flex gap-2 mt-4">
          <button onClick={submit} disabled={!storageOK} className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl ${storageOK? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'} text_white`}>
            {mode==='login' ? <LogIn className="w-4 h-4"/> : <UserPlus className="w-4 h-4"/>}
            {mode==='login' ? 'Log in' : 'Sign up'}
          </button>
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50">Cancel</button>
        </div>
        {!storageOK && (
          <div className="text-sm text-blue-800 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mt-3">
            We can't write to your browser storage. Please disable private/incognito mode or allow storage for this site, then try again.
          </div>
        )}
        <p className="text-[12px] text-gray-500 mt-4 text-center">Pilot note: your account & logs are stored in your browser (localStorage).</p>
        {mode==='signup' && (
          <div className="mt-5">
            <div className="text-xs font-medium text-gray-800 mb-2">Example of the weekly log form</div>
            <div className="relative rounded-xl overflow-hidden border border-blue-100 shadow-sm">
              <img src={LOGFORM_IMG} alt="Example weekly log form" className="block w-full h-56 object-cover" loading="lazy" onError={(e)=>{ e.currentTarget.src = LOGFORM_IMG_FALLBACK; }}/>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TagInput({value, onChange, suggestions=DEFAULT_SKILLS}){
  const [draft, setDraft] = useState("");
  const [filtered, setFiltered] = useState([]);
  function add(tag){ const t = tag.trim(); if(!t) return; const next=[...value]; if(!next.includes(t)) next.push(t); onChange(next); setDraft(""); setFiltered([]); }
  function remove(idx){ const next=value.filter((_,i)=>i!==idx); onChange(next); }
  function onDraftChange(v){ setDraft(v); if(!v){ setFiltered([]); return;} const lower=v.toLowerCase(); setFiltered(suggestions.filter(s=>s.toLowerCase().includes(lower) && !value.includes(s)).slice(0,6)); }
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {value.map((t,i)=> (
          <span key={i} className="px-2 py-1 rounded_full bg-blue-50 border border-blue-200 text-sm inline-flex items-center gap-2">{t}<button onClick={()=>remove(i)} className="text-blue-700 hover:text-blue-900">×</button></span>
        ))}
      </div>
      <div className="relative">
        <input value={draft} onChange={e=>onDraftChange(e.target.value)} onKeyDown={e=>{ if(e.key==='Enter'){ e.preventDefault(); add(draft); } }} placeholder="Add a skill and press Enter (e.g., Python, Leadership)" className="w-full border rounded-xl px-3 py-2"/>
        {filtered.length>0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border rounded-xl shadow">
            {filtered.map((s,i)=> <button key={i} onClick={()=>add(s)} className="w-full text-left px-3 py-2 hover:bg-blue-50">{s}</button>)}
          </div>
        )}
      </div>
    </div>
  );
}

function MoodSlider({value, onChange}){
  return (
    <div>
      <div className="flex items-center justify_between text-xs text-gray-500 mb-1"><span>1 • Overwhelmed</span><span>10 • Excellent</span></div>
      <input type="range" min={1} max={10} value={value} onChange={e=>onChange(parseInt(e.target.value))} className="w-full accent-blue-600"/>
      <div className="text-sm text-gray-700 mt-1">Current: <span className="font-semibold text-blue-700">{value}</span></div>
    </div>
  );
}

function useUserLogs(email){
  const [logs, setLogs] = useState([]);
  useEffect(()=>{ const s=loadStore(); setLogs(s.logs?.[email]||[]); }, [email]);
  function saveLog(entry){ const s=loadStore(); if(!s.logs) s.logs={}; if(!s.logs[email]) s.logs[email]=[]; const i=s.logs[email].findIndex(l=>l.weekISO===entry.weekISO); if(i>=0) s.logs[email][i]=entry; else s.logs[email].push(entry); saveStore(s); setLogs([...s.logs[email]]); }
  return { logs, saveLog };
}

function WeekLogger({email}){
  const { logs, saveLog } = useUserLogs(email);
  const [weekISO, setWeekISO] = useState(startOfWeekISO());
  const [responsibilities, setResponsibilities] = useState("");
  const [skills, setSkills] = useState([]);
  const [mood, setMood] = useState(7);
  const [justSaved, setJustSaved] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(()=>{ setJustSaved(false); }, [weekISO]);

  useEffect(()=>{
    const existing = logs.find(l => l.weekISO === weekISO);
    if (existing){ setResponsibilities(existing.lines.join("\\n")); setSkills(existing.skills); setMood(existing.mood); }
    else { setResponsibilities(""); setSkills([]); setMood(7); }
  }, [weekISO, logs]);

  function save(){
    const lines = responsibilities.split(/\\n+/).map(s=>s.trim()).filter(Boolean);
    const entry = { weekISO, lines, skills, mood, savedAt: new Date().toISOString() };
    saveLog(entry);
    setJustSaved(true);
    setTimeout(()=>setJustSaved(false), 1600);
  }

  function shiftWeek(iso, delta){ // delta in weeks
    const d = new Date(iso);
    d.setDate(d.getDate() + (delta*7));
    return startOfWeekISO(d);
  }

  const sortedWeeks = logs.slice().sort((a,b)=> new Date(b.weekISO) - new Date(a.weekISO));

  const currentMondayISO = startOfWeekISO();
  const canGoNext = new Date(weekISO) < new Date(currentMondayISO);

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-4 flex items-center justify_between">
        <div>
          <h2 className="text-xl font-semibold">Log your week</h2>
          <p className="text-sm text-gray-600">Capture responsibilities, skills, and how you felt.</p>
        </div>
      </div>

      <div className="grid gap-4">
        <div>
          <label className="text-sm font-medium">Week (starts on Monday)</label>
          <div className="mt-1 flex items-center gap-2">
            <button onClick={()=>setWeekISO(shiftWeek(weekISO,-1))} className="px-3 py-2 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50" aria-label="Previous week"><ChevronLeft className="w-4 h-4"/></button>
            <input type="date" value={weekISO.slice(0,10)} onChange={e=>setWeekISO(startOfWeekISO(new Date(e.target.value)))} className="border rounded-xl px-3 py-2"/>
            <button onClick={()=>canGoNext && setWeekISO(shiftWeek(weekISO,1))} disabled={!canGoNext} className={`px-3 py-2 rounded-xl border ${canGoNext? 'border-blue-200 text-blue-700 hover:bg-blue-50' : 'border-gray-200 text-gray-400 cursor-not-allowed'}`} aria-label="Next week"><ChevronRight className="w-4 h-4"/></button>
            <button onClick={()=>setShowAll(s=>!s)} className="ml-auto px-3 py-2 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 text-sm">{showAll? 'Hide all weeks' : 'View all weeks'}</button>
          </div>
          <span className="text-xs text-gray-500 ml-1">Saved as {fmtDate(weekISO)}</span>
        </div>

        <div>
          <label className="text-sm font_medium">Responsibilities</label>
          <textarea
            value={responsibilities}
            onChange={e=>setResponsibilities(e.target.value)}
            rows={6}
            placeholder={"One per line. Example:\\n• Led roadmap review with XFN team\\n• Completed DV testing report redlines\\n• Coordinated packaging validation with supplier"}
            className="mt-1 w-full border rounded-2xl px-3 py-2"
          />
          <p className="text-xs text-gray-500 mt-1">Tip: Add action verbs like Led, Owned, Facilitated, Built.</p>
        </div>

        <div>
          <label className="text-sm font-medium">Skills Used</label>
          <TagInput value={skills} onChange={setSkills}/>
        </div>

        <div>
          <label className="text-sm font-medium">How did you feel?</label>
          <MoodSlider value={mood} onChange={setMood}/>
        </div>

        <div className="flex gap-3">
          <button onClick={save} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700"><Save className="w-4 h-4"/> Save Week</button>
          {justSaved && <span className="text-blue-700 text-sm">✅ Your week is logged. Keep going!</span>}
        </div>
      </div>

      {sortedWeeks.length>0 && (
        <div className="mt-8">
          <div className="flex items_center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Recent Weeks</h3>
            <span className="text-xs text-gray-500">{sortedWeeks.length} total</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {sortedWeeks.slice(0,12).map((l,i)=> (
              <button key={i} onClick={()=>setWeekISO(l.weekISO)} className={`px-3 py-1 rounded-full border text-sm ${l.weekISO===weekISO? 'bg-blue-600 text-white' : 'hover:bg-blue-50 border-blue-200 text-blue-700'}`}>
                {fmtDate(l.weekISO)}
              </button>
            ))}
          </div>

          {showAll && (
            <div className="mt-4 p-3 border border-blue-100 rounded-2xl bg-white max-h-64 overflow-auto">
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
                {sortedWeeks.map((l,i)=> (
                  <button key={i} onClick={()=>setWeekISO(l.weekISO)} className={`text-left px-3 py-2 rounded-xl border text-sm ${l.weekISO===weekISO? 'bg-blue-600 text-white' : 'hover:bg-blue-50 border-blue-200 text-blue-700'}`}>
                    <div className="font-medium">{fmtDate(l.weekISO)}</div>
                    <div className="text-xs text-gray-500">{(l.skills||[]).length} skills • mood {l.mood}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Dashboard({email}){
  const { logs } = useUserLogs(email);
  const [rangeWeeks, setRangeWeeks] = useState(8);

  const analyzed = useMemo(()=>{
    const sortedAll = logs.slice().sort((a,b)=> new Date(a.weekISO)-new Date(b.weekISO));
    const WAll = sortedAll.length; const rangeStart = Math.max(0, WAll - rangeWeeks); const sorted = sortedAll.slice(rangeStart);

    const perBucket = { technical: [], leadership: [], soft: [] };
    const allSkillCounts = {};

    sorted.forEach(l=>{
      const lines=l.lines||[]; const tagSkills=l.skills||[];
      tagSkills.forEach(s=>{ allSkillCounts[s]=(allSkillCounts[s]||0)+1; });
      lines.forEach(line=>{ const p=paraphrase(line); const b=classifyLine(line); perBucket[b].push({ text:p, weekISO:l.weekISO }); });
    });

    const moodTrend = sorted.map(l=>({ week: fmtDate(l.weekISO), mood: l.mood }));
    function topEntries(obj, n=8){ return Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>({name:k,count:v})); }
    const strengths = topEntries(allSkillCounts, 6);

    const avgMood = avg(sorted.map(l=>l.mood));
    let wellbeingTrend=null; if(moodTrend.length>=2){ const first=moodTrend[0].mood; const last=moodTrend[moodTrend.length-1].mood; wellbeingTrend = last>first+1? 'improving' : last<first-1? 'declining' : 'steady'; }
    const distinctSkillCount = Object.keys(allSkillCounts).length;

    return { perBucket, moodTrend, strengths, avgMood, wellbeingTrend, skillCount: distinctSkillCount, rangeWeeks };
  }, [logs, rangeWeeks]);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Growth Dashboard</h2>
          <p className="text-sm text-gray-600">Clear, factual insights based on your recent activity.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Range</span>
          {[4,8,12].map(n=> (
            <button key={n} onClick={()=>setRangeWeeks(n)} className={`px-3 py-1 rounded-xl border text-sm ${n===analyzed.rangeWeeks? 'bg-blue-600 text-white' : 'hover:bg-blue-50 border-blue-200 text-blue-700'}`}>{n}w</button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-6">
        <KpiCard label="Weeks Logged" value={String(logs.length)} sub={`All-time entries`} />
        <KpiCard label="Skills" value={String(analyzed.skillCount || 0)} sub={`Distinct skills tagged`} />
        <KpiCard label="Avg Mood" value={analyzed.avgMood!==null? String(analyzed.avgMood) : '—'} sub={analyzed.wellbeingTrend ? `Trend: ${analyzed.wellbeingTrend}` : 'Need more data'} />
      </div>

      <div className="p-4 border border-blue-100 rounded-2xl mb-6">
        <h3 className="font-semibold mb-2">Strengths (Top skills)</h3>
        {analyzed.strengths.length ? (
          <ul className="text-sm text-gray-700 space-y-1">
            {analyzed.strengths.map((s,i)=> (<li key={i} className="flex items-center justify-between"><span>{s.name}</span><span className="text-gray-500">{s.count}×</span></li>))}
          </ul>
        ) : <p className="text-sm text-gray-500">Tag skills to surface strengths.</p>}
      </div>

      <div className="p-4 border border-blue-100 rounded-2xl mb-6">
        <div className="flex items-center justify-between"><h3 className="font-semibold mb-2">Well‑being Trend</h3>{analyzed.wellbeingTrend && <span className="text-xs text-gray-600">Trend: <b>{analyzed.wellbeingTrend}</b></span>}</div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analyzed.moodTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis domain={[1,10]} ticks={[1,3,5,7,9,10]} />
              <Tooltip />
              <Line type="monotone" dataKey="mood" dot />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <BucketCard title="Technical Skills" items={analyzed.perBucket.technical} />
        <BucketCard title="Leadership Skills" items={analyzed.perBucket.leadership} />
      </div>

      {logs.length===0 && <div className="text-sm text-gray-500 mt-6">No data yet—log a week to populate your dashboard.</div>}
    </div>
  );
}

function KpiCard({label, value, sub}){
  return (
    <div className="p-4 border border-blue-100 rounded-2xl">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-2xl font-bold leading-tight text-blue-700">{value}</div>
      <div className="text-xs text-gray-600 mt-1">{sub}</div>
    </div>
  );
}

function BucketCard({title, items}){
  return (
    <div className="p-4 border border-blue-100 rounded-2xl">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="space-y-2 max-h-56 overflow-auto pr-1">
        {items.length===0 ? (
          <p className="text-sm text-gray-500">Add logs to generate paraphrased highlights here.</p>
        ) : items.slice().reverse().slice(0,10).map((it,i)=> (
          <div key={i} className="text-sm text-gray-700"><span className="px-2 py-0.5 mr-2 rounded-full bg-blue-50 border border-blue-200 text-[11px]">{fmtDate(it.weekISO)}</span>{it.text}</div>
        ))}
      </div>
    </div>
  );
}

export default function App(){
  const [view, setView] = useState('landing'); // landing | auth | app
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(null);
  const [nonce, setNonce] = useState(0);
  const [tab, setTab] = useState('log'); // log | dash
  const [flash, setFlash] = useState("");

  useEffect(()=>{
    const s = loadStore(); const email = s.session?.email; if(email){ setUser(email); setView('app'); }
  }, []);

  function onLogout(){ const s=loadStore(); delete s.session; saveStore(s); setUser(null); setView('landing'); }

  function seedDemo(){
    if(!user){ setFlash("Sign in first, then load demo data."); setTimeout(()=>setFlash(""),1600); return; }
    const s = loadStore(); if(!s.logs) s.logs={}; if(!s.logs[user]) s.logs[user]=[];
    const now=new Date();
    for(let w=0; w<10; w++){
      const d=new Date(now); d.setDate(now.getDate() - w*7); const weekISO=startOfWeekISO(d);
      const exists=s.logs[user].some(l=>l.weekISO===weekISO); if(!exists){
        const lines=[`Led roadmap sync with cross-functional teams (wk ${w+1})`,`Completed DV report redlines (wk ${w+1})`,`Coordinated packaging validation with supplier (wk ${w+1})`,`Mentored intern on test protocol and data review (wk ${w+1})`];
        const allSkills=["Design Controls","Leadership","Communication","Testing","Project Management","Python","Data Analysis","Stakeholder Management","Presentation","React","SQL","AWS"];
        const skills=allSkills.slice(0, 3 + (w % 7)); const mood=Math.min(10, 4 + ((w*2)%7));
        s.logs[user].push({ weekISO, lines, skills, mood, savedAt:new Date().toISOString() });
      }
    }
    saveStore(s); setNonce(n=>n+1); setFlash("Demo data loaded!"); setTimeout(()=>setFlash(""),1600);
  }

  return (
    <div className="min-h-screen bg-white">
      <Header user={user} onLogout={onLogout} goLanding={()=>setView('landing')} />

      {flash && <div className="max-w-6xl mx-auto px-4 mt-3"><div className="text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2">{flash}</div></div>}

      {view==='landing' && (
        <Landing onSignup={()=>{ setView('auth'); setAuthMode('signup'); }} onLogin={()=>{ setView('auth'); setAuthMode('login'); }} />
      )}

      {view==='auth' && (
        <Auth defaultMode={authMode} onAuthed={(email)=>{ setUser(email); setView('app'); setTab('log'); }} onCancel={()=>setView('landing')} />
      )}

      {view==='app' && user && (
        <>
          <div className="w-full max-w-6xl mx-auto px-4">
            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="border border-blue-200 rounded-2xl flex items-center gap-2 p-1 w-full max-w-md">
                <button onClick={()=>setTab('log')} className={`flex-1 px-4 py-2 rounded-xl text-sm ${tab==='log' ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-blue-700'}`}>Log Week</button>
                <button onClick={()=>setTab('dash')} className={`flex-1 px-4 py-2 rounded-xl text-sm ${tab==='dash' ? 'bg-blue-600 text-white' : 'hover:bg-blue-50 text-blue-700'}`}>Dashboard</button>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={seedDemo} className="px-3 py-2 rounded-xl border border-blue-200 text-blue-700 hover:bg-blue-50 text-sm">Load demo data</button>
              </div>
            </div>
          </div>
          {tab==='log' ? <WeekLogger key={user+nonce+'log'} email={user}/> : <Dashboard key={user+nonce+'dash'} email={user}/>}
        </>
      )}

      <Footer />
    </div>
  );
}
