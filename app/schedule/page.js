'use client';
import { RouteGuard } from '../_lib/RouteGuard';
import { useApp } from '../_lib/AppContext';
import { useIsMobile, useDarkMode, useSidebarCollapse } from '../_lib/usePageLayout';
import PageShell from '../_components/PageShell';
import { useMemo, useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Check, X, Coffee, UtensilsCrossed, Save } from 'lucide-react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const GRID_START  = 7 * 60;
const GRID_END    = 18 * 60;
const PX_PER_MIN  = 1.6;
const GRID_HEIGHT = (GRID_END - GRID_START) * PX_PER_MIN;

const COLORS = [
  { hex: '#0ea5e9' }, { hex: '#7c3aed' }, { hex: '#10b981' }, { hex: '#f59e0b' },
  { hex: '#f43f5e' }, { hex: '#ec4899' }, { hex: '#6366f1' }, { hex: '#14b8a6' },
];

const BLOCK_TYPES = {
  class: { label: 'Class Period', icon: null            },
  break: { label: 'Break',        icon: Coffee          },
  lunch: { label: 'Lunch',        icon: UtensilsCrossed },
};

function toMin(time) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}
function toTimeStr(min) {
  return `${Math.floor(min/60)}:${(min%60).toString().padStart(2,'0')}`;
}
function fmt(time) {
  const [h, m] = time.split(':').map(Number);
  return `${h%12||12}:${m.toString().padStart(2,'0')} ${h>=12?'PM':'AM'}`;
}
function blockColor(b) {
  return (b.type==='lunch') ? '#10b981' : (b.type==='break') ? '#f59e0b' : (COLORS[b.color??0]?.hex ?? '#0ea5e9');
}

const HOUR_LABELS = Array.from({length:(GRID_END-GRID_START)/60+1},(_,i)=>({
  label: toTimeStr(GRID_START+i*60),
  top: i*60*PX_PER_MIN,
}));

const SEED = [
  {id:1, type:'class',subject:'Mathematics',  class:'',day:'Monday',   start:'7:30', end:'8:30', color:0,room:'Room 101'},
  {id:2, type:'break',subject:'Break',        class:'',day:'Monday',   start:'10:00',end:'10:15',color:3,room:''},
  {id:3, type:'lunch',subject:'Lunch',        class:'',day:'Monday',   start:'12:00',end:'13:00',color:2,room:''},
  {id:4, type:'class',subject:'Science',      class:'',day:'Tuesday',  start:'8:00', end:'9:30', color:2,room:'Lab 1'},
  {id:5, type:'break',subject:'Break',        class:'',day:'Tuesday',  start:'10:00',end:'10:15',color:3,room:''},
  {id:6, type:'lunch',subject:'Lunch',        class:'',day:'Tuesday',  start:'12:00',end:'13:00',color:2,room:''},
  {id:7, type:'class',subject:'English',      class:'',day:'Wednesday',start:'7:30', end:'9:00', color:1,room:'Room 102'},
  {id:8, type:'break',subject:'Break',        class:'',day:'Wednesday',start:'10:00',end:'10:15',color:3,room:''},
  {id:9, type:'lunch',subject:'Lunch',        class:'',day:'Wednesday',start:'12:00',end:'13:00',color:2,room:''},
  {id:10,type:'class',subject:'Filipino',     class:'',day:'Thursday', start:'9:00', end:'10:00',color:4,room:'Room 101'},
  {id:11,type:'break',subject:'Break',        class:'',day:'Thursday', start:'10:00',end:'10:15',color:3,room:''},
  {id:12,type:'lunch',subject:'Lunch',        class:'',day:'Thursday', start:'12:00',end:'13:00',color:2,room:''},
  {id:13,type:'class',subject:'Social Studies',class:'',day:'Friday',  start:'8:00', end:'9:30', color:5,room:'Room 103'},
  {id:14,type:'break',subject:'Break',        class:'',day:'Friday',   start:'10:00',end:'10:15',color:3,room:''},
  {id:15,type:'lunch',subject:'Lunch',        class:'',day:'Friday',   start:'12:00',end:'13:00',color:2,room:''},
];

function storageKey(userInfo) {
  return `schedule_v2_${userInfo?.username||userInfo?.fullName||'default'}`;
}

function TimeInput({ label, value, onChange, darkMode }) {
  const [raw, setRaw] = useState(value);
  useEffect(()=>setRaw(value),[value]);

  function parse(s) {
    const isPM = /pm/i.test(s), isAM = /am/i.test(s);
    s = s.replace(/[^\d:]/g,'');
    let h=0,m=0;
    if(s.includes(':'))[h,m]=s.split(':').map(Number);
    else if(s.length<=2) h=parseInt(s)||0;
    else if(s.length===3){h=parseInt(s[0]);m=parseInt(s.slice(1));}
    else{h=parseInt(s.slice(0,2));m=parseInt(s.slice(2));}
    if(isPM&&h<12)h+=12;
    if(isAM&&h===12)h=0;
    h=Math.max(7,Math.min(17,h||0));
    m=Math.max(0,Math.min(59,m||0));
    return `${h}:${m.toString().padStart(2,'0')}`;
  }

  const cls = `w-full px-3 py-2.5 rounded-xl border text-sm font-mono outline-none ${darkMode?'bg-white/[0.05] border-white/10 text-white placeholder:text-gray-600':'bg-gray-50 border-gray-200 text-gray-900'}`;
  const lbl = `block text-[11px] font-black uppercase tracking-wider mb-1 ${darkMode?'text-gray-500':'text-gray-400'}`;

  return (
    <div>
      <label className={lbl}>{label}</label>
      <input value={raw} onChange={e=>setRaw(e.target.value)} onBlur={()=>{const r=parse(raw);setRaw(r);onChange(r);}}
        placeholder="8:45 or 845" className={cls} />
    </div>
  );
}

function BlockModal({ block, classes, darkMode, onSave, onClose }) {
  const isNew = !block?.id;
  const [form, setForm] = useState(block ?? {type:'class',subject:'',class:classes[0]??'',day:'Monday',start:'8:00',end:'9:00',color:0,room:''});
  const set = (k,v)=>setForm(f=>({...f,[k]:v}));
  const inp = `w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${darkMode?'bg-white/[0.05] border-white/10 text-white placeholder:text-gray-600':'bg-gray-50 border-gray-200 text-gray-900'}`;
  const lbl = `block text-[11px] font-black uppercase tracking-wider mb-1 ${darkMode?'text-gray-500':'text-gray-400'}`;
  const tab = (active)=>`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all ${active?'text-white border-transparent':''}`;

  useEffect(()=>{
    if(form.type==='break'&&form.subject==='Lunch')set('subject','Break');
    if(form.type==='lunch'&&form.subject==='Break')set('subject','Lunch');
  },[form.type]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}/>
      <div className={`relative w-full max-w-md rounded-2xl border overflow-hidden ${darkMode?'bg-[#0d1220] border-white/10':'bg-white border-gray-200'}`}
        style={{boxShadow:'0 32px 80px rgba(0,0,0,0.4)',animation:'modal-pop .3s cubic-bezier(.34,1.5,.64,1) both'}}>
        <div className="h-0.5" style={{background:'linear-gradient(90deg,#0ea5e9,#7c3aed,#10b981)'}}/>
        <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center justify-between">
            <p className={`font-black text-base ${darkMode?'text-white':'text-gray-900'}`}>{isNew?'Add Block':'Edit Block'}</p>
            <button onClick={onClose} className={`p-1.5 rounded-lg ${darkMode?'hover:bg-white/8 text-gray-400':'hover:bg-gray-100 text-gray-500'}`}><X size={15}/></button>
          </div>

          {/* Type */}
          <div>
            <label className={lbl}>Type</label>
            <div className="flex gap-2">
              {Object.entries(BLOCK_TYPES).map(([k,v])=>{
                const Icon=v.icon;
                return <button key={k} onClick={()=>set('type',k)}
                  className={`${tab(form.type===k)} flex items-center justify-center gap-1.5`}
                  style={form.type===k?{background:'linear-gradient(135deg,#0ea5e9,#7c3aed)'}:{borderColor:darkMode?'rgba(255,255,255,0.1)':'#e5e7eb',color:darkMode?'#9ca3af':'#6b7280'}}>
                  {Icon&&<Icon size={12}/>}{v.label}
                </button>;
              })}
            </div>
          </div>

          {/* Label */}
          <div>
            <label className={lbl}>{form.type==='class'?'Subject':'Label'}</label>
            <input value={form.subject} onChange={e=>set('subject',e.target.value)} placeholder="e.g. Mathematics" className={inp}/>
          </div>

          {/* Day */}
          <div>
            <label className={lbl}>Day</label>
            <div className="flex gap-1.5">
              {DAYS.map(d=><button key={d} onClick={()=>set('day',d)}
                className={`${tab(form.day===d)} flex-1`}
                style={form.day===d?{background:'linear-gradient(135deg,#0ea5e9,#7c3aed)'}:{borderColor:darkMode?'rgba(255,255,255,0.1)':'#e5e7eb',color:darkMode?'#9ca3af':'#6b7280'}}>
                {d.slice(0,3)}
              </button>)}
            </div>
          </div>

          {/* Time */}
          <div className="grid grid-cols-2 gap-3">
            <TimeInput label="Start" value={form.start} onChange={v=>set('start',v)} darkMode={darkMode}/>
            <TimeInput label="End"   value={form.end}   onChange={v=>set('end',v)}   darkMode={darkMode}/>
          </div>

          {/* Class + Room */}
          {form.type==='class'&&(
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={lbl}>Class</label>
                <select value={form.class} onChange={e=>set('class',e.target.value)} className={inp}>
                  {classes.map(c=><option key={c}>{c}</option>)}
                  <option value="">— None —</option>
                </select>
              </div>
              <div>
                <label className={lbl}>Room</label>
                <input value={form.room} onChange={e=>set('room',e.target.value)} placeholder="Room 101" className={inp}/>
              </div>
            </div>
          )}

          {/* Color */}
          {form.type==='class'&&(
            <div>
              <label className={lbl}>Color</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c,i)=>(
                  <button key={i} onClick={()=>set('color',i)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:scale-110 ${form.color===i?'ring-2 ring-offset-2 scale-110':''}`}
                    style={{background:c.hex}}>
                    {form.color===i&&<Check size={12} className="text-white"/>}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2.5 pt-1">
            <button onClick={onClose} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border ${darkMode?'border-white/10 text-gray-300 hover:bg-white/6':'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>Cancel</button>
            <button onClick={()=>{if(!form.subject.trim())return;onSave({...form,id:form.id??Date.now()});}}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg" style={{background:'linear-gradient(135deg,#0ea5e9,#7c3aed)'}}>
              {isNew?'Add':'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const [darkMode, toggleTheme] = useDarkMode();
  const isMobile = useIsMobile();
  const [sidebarCollapsed, toggleSidebar] = useSidebarCollapse();
  const { classes, loading, fetchData, userInfo } = useApp();

  const [periods, setPeriods] = useState([]);
  const [loaded,  setLoaded]  = useState(false);
  const [modal,   setModal]   = useState(null);
  const [activeDay, setActiveDay] = useState('Monday');
  const [saved,   setSaved]   = useState(false);

  // Load per-teacher schedule from localStorage
  useEffect(()=>{
    if(!userInfo||loaded) return;
    try {
      const raw = localStorage.getItem(storageKey(userInfo));
      setPeriods(raw ? JSON.parse(raw) : SEED);
    } catch { setPeriods(SEED); }
    setLoaded(true);
  },[userInfo,loaded]);

  // Auto-save on change
  useEffect(()=>{
    if(!loaded||!userInfo) return;
    try { localStorage.setItem(storageKey(userInfo), JSON.stringify(periods)); } catch {}
    setSaved(true);
    const t=setTimeout(()=>setSaved(false),2000);
    return ()=>clearTimeout(t);
  },[periods,loaded,userInfo]);

  const classOptions = useMemo(()=>classes.length?classes:['Grade 7-A','Grade 7-B','Grade 8-A','Grade 8-B'],[classes]);
  const byDay = useMemo(()=>{
    const m={};
    DAYS.forEach(d=>{m[d]=periods.filter(p=>p.day===d).sort((a,b)=>toMin(a.start)-toMin(b.start));});
    return m;
  },[periods]);

  function handleSave(form){
    setPeriods(ps=>form.id&&ps.some(p=>p.id===form.id)?ps.map(p=>p.id===form.id?form:p):[...ps,form]);
    setModal(null);
  }
  function handleDelete(id){ setPeriods(ps=>ps.filter(p=>p.id!==id)); }

  const visibleDays = isMobile?[activeDay]:DAYS;
  const gc = darkMode?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.05)';
  const hc = darkMode?'rgba(255,255,255,0.02)':'rgba(0,0,0,0.025)';

  return (
    <RouteGuard allowedRoles={['teacher']}>
      <PageShell darkMode={darkMode} toggleTheme={toggleTheme} isMobile={isMobile}
        sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar}
        loading={loading} onRefresh={fetchData}>
        <div className="fade-in-up space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className={`text-lg font-black ${darkMode?'text-white':'text-gray-900'}`}>Class Schedule</h2>
              <p className={`text-xs mt-0.5 flex items-center gap-1.5 ${darkMode?'text-gray-500':'text-gray-400'}`}>
                {userInfo?.fullName||userInfo?.username||'Teacher'} · {periods.length} blocks
                {saved&&<span className="flex items-center gap-1 text-emerald-500 font-bold"><Save size={10}/>Saved</span>}
              </p>
            </div>
            <button onClick={()=>setModal({block:null})}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95"
              style={{background:'linear-gradient(135deg,#0ea5e9,#7c3aed)'}}>
              <Plus size={15}/> Add Block
            </button>
          </div>

          {/* Mobile day tabs */}
          {isMobile&&(
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {DAYS.map(d=>(
                <button key={d} onClick={()=>setActiveDay(d)}
                  className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeDay===d?'text-white shadow-md':darkMode?'text-gray-400 bg-white/[0.04] border border-white/8':'text-gray-500 bg-white border border-gray-200'}`}
                  style={activeDay===d?{background:'linear-gradient(135deg,#0ea5e9,#7c3aed)'}:undefined}>
                  {d.slice(0,3)}
                </button>
              ))}
            </div>
          )}

          {/* Grid */}
          <div className={`border rounded-2xl overflow-auto ${darkMode?'bg-white/[0.04] border-white/8':'bg-white border-gray-200/80 shadow-sm'}`}>
            <div className="flex" style={{minWidth:isMobile?320:640}}>

              {/* Time column */}
              <div className="flex-shrink-0 w-16 border-r" style={{borderColor:darkMode?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)'}}>
                <div className={`h-10 border-b ${darkMode?'border-white/[0.06]':'border-gray-100'}`}/>
                <div className="relative" style={{height:GRID_HEIGHT}}>
                  {HOUR_LABELS.map(({label,top})=>(
                    <div key={label} className="absolute right-2" style={{top:top-7}}>
                      <span className={`text-[10px] font-semibold ${darkMode?'text-gray-700':'text-gray-400'}`}>{fmt(label)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Day columns */}
              {visibleDays.map((day,di)=>(
                <div key={day} className="flex-1 min-w-0"
                  style={{borderRight:di<visibleDays.length-1?`1px solid ${darkMode?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.06)'}`:undefined}}>
                  <div className={`h-10 flex items-center justify-center border-b ${darkMode?'border-white/[0.06]':'border-gray-100'}`}>
                    <span className={`text-xs font-black ${darkMode?'text-gray-300':'text-gray-700'}`}>{isMobile?day:day.slice(0,3)}</span>
                  </div>
                  <div className="relative" style={{height:GRID_HEIGHT}}>
                    {/* Gridlines */}
                    {HOUR_LABELS.map(({top})=>(
                      <div key={top} className="absolute w-full border-b pointer-events-none" style={{top,borderColor:gc}}/>
                    ))}
                    {HOUR_LABELS.slice(0,-1).map(({top})=>(
                      <div key={`h${top}`} className="absolute w-full border-b pointer-events-none" style={{top:top+30*PX_PER_MIN,borderColor:hc,borderStyle:'dashed'}}/>
                    ))}
                    {/* Blocks */}
                    {byDay[day].map(b=>{
                      const color = blockColor(b);
                      const Icon  = BLOCK_TYPES[b.type]?.icon;
                      const top_  = (toMin(b.start)-GRID_START)*PX_PER_MIN;
                      const h_    = Math.max((toMin(b.end)-toMin(b.start))*PX_PER_MIN-2,18);
                      return (
                        <div key={b.id} onClick={()=>setModal({block:b})}
                          className="absolute left-1 right-1 rounded-lg overflow-hidden cursor-pointer group"
                          style={{top:top_,height:h_,background:`${color}18`,border:`1px solid ${color}40`}}>
                          <div className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-lg" style={{background:color}}/>
                          <div className="pl-3 pr-1 py-1 h-full flex flex-col justify-center overflow-hidden">
                            <div className="flex items-center gap-1 min-w-0">
                              {Icon&&<Icon size={9} style={{color,flexShrink:0}}/>}
                              <p className="text-[10px] font-black truncate leading-tight" style={{color}}>{b.subject}</p>
                            </div>
                            {h_>32&&b.class&&<p className="text-[9px] truncate leading-tight" style={{color:`${color}99`}}>{b.class}</p>}
                            {h_>48&&<p className="text-[9px] leading-tight" style={{color:`${color}70`}}>{fmt(b.start)}–{fmt(b.end)}</p>}
                          </div>
                          <button onClick={e=>{e.stopPropagation();handleDelete(b.id);}}
                            className="absolute top-0.5 right-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            style={{background:`${color}30`}}>
                            <X size={8} style={{color}}/>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* List */}
          <div className={`border rounded-2xl overflow-hidden ${darkMode?'bg-white/[0.04] border-white/8':'bg-white border-gray-200/80 shadow-sm'}`}>
            <div className={`px-5 py-3.5 flex items-center justify-between border-b ${darkMode?'border-white/[0.05]':'border-gray-100'}`}>
              <p className={`text-sm font-black ${darkMode?'text-white':'text-gray-900'}`}>All Blocks</p>
              <p className={`text-xs ${darkMode?'text-gray-500':'text-gray-400'}`}>{periods.length} total</p>
            </div>
            {DAYS.map(day=>{
              const blocks=byDay[day];
              if(!blocks.length) return null;
              return (
                <div key={day}>
                  <div className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest ${darkMode?'text-gray-600 bg-white/[0.02]':'text-gray-400 bg-gray-50/60'}`}>{day}</div>
                  {blocks.map(b=>{
                    const color=blockColor(b);
                    const Icon=BLOCK_TYPES[b.type]?.icon;
                    return (
                      <div key={b.id} className={`flex items-center gap-3 px-5 py-3 border-b last:border-0 transition-colors group ${darkMode?'border-white/[0.04] hover:bg-white/[0.03]':'border-gray-50 hover:bg-slate-50/60'}`}>
                        <div className="w-1.5 h-8 rounded-full flex-shrink-0" style={{background:color}}/>
                        <div className="flex items-center gap-1.5 flex-1 min-w-0">
                          {Icon&&<Icon size={12} style={{color,flexShrink:0}}/>}
                          <div className="min-w-0">
                            <p className={`text-sm font-bold truncate ${darkMode?'text-white':'text-gray-900'}`}>{b.subject}</p>
                            <p className={`text-xs ${darkMode?'text-gray-500':'text-gray-400'}`}>
                              {[b.class,b.room].filter(Boolean).join(' · ')||BLOCK_TYPES[b.type]?.label}
                            </p>
                          </div>
                        </div>
                        <p className={`text-xs font-mono flex-shrink-0 ${darkMode?'text-gray-400':'text-gray-500'}`}>{fmt(b.start)}–{fmt(b.end)}</p>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={()=>setModal({block:b})} className={`p-1.5 rounded-lg hover:scale-110 transition-all ${darkMode?'hover:bg-white/8 text-gray-500':'hover:bg-gray-100 text-gray-400'}`}><Edit3 size={13}/></button>
                          <button onClick={()=>handleDelete(b.id)} className={`p-1.5 rounded-lg hover:scale-110 transition-all ${darkMode?'hover:bg-rose-500/10 text-gray-600':'hover:bg-rose-50 text-gray-300 hover:text-rose-400'}`}><Trash2 size={13}/></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {modal!==null&&<BlockModal block={modal.block} classes={classOptions} darkMode={darkMode} onSave={handleSave} onClose={()=>setModal(null)}/>}

        <style jsx global>{`
          @keyframes modal-pop{from{opacity:0;transform:translateY(14px) scale(0.97)}to{opacity:1;transform:none}}
        `}</style>
      </PageShell>
    </RouteGuard>
  );
}