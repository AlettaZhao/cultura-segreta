import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { PHOTOS, CITIES } from "./data.js";
import { CHARACTERS, CONVERSATIONS, GROUPS, charactersInCity, getPreview, getGroupPreview } from "./conversations.js";

const FONT = "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&family=Playfair+Display:ital,wght@0,400;0,800;1,400;1,800&family=Inter:wght@400;500;600;700&display=swap";

async function askKimi({ system, user }){
  const r = await fetch("/api/chat", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body:JSON.stringify({ system, user })
  });
  if (!r.ok){
    let detail = {};
    try { detail = await r.json(); } catch {}
    throw new Error(detail.code || `http-${r.status}`);
  }
  const j = await r.json();
  return j.text?.trim() || "";
}

const CN_SERIF = `'Noto Serif SC','Source Han Serif SC','Songti SC','STSong','SimSun',serif`;
const UI_FONT = `'Inter',${CN_SERIF}`;

const CSS = `
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased}
html,body{background:#faf7f2}
body{margin:0;font-family:${UI_FONT};color:#1a1a1a;overscroll-behavior-y:none}
input::placeholder{color:#b0b0b0}
::-webkit-scrollbar{width:0;height:0}
img{-webkit-user-drag:none;user-select:none}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes popIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes slideInRight{from{transform:translateX(100%);opacity:.5}to{transform:translateX(0);opacity:1}}
@keyframes slideOutLeft{from{transform:translateX(0);opacity:1}to{transform:translateX(-30%);opacity:.5}}
@keyframes typingBounce{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes goldShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes taskDone{0%{transform:scale(1)}50%{transform:scale(1.05)}100%{transform:scale(1)}}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.85)}}
@keyframes heartPop{0%{transform:scale(0)}50%{transform:scale(1.3)}100%{transform:scale(1)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.anim-up{animation:fadeUp .4s ease both}
.anim-pop{animation:popIn .3s ease both}
.anim-slide{animation:slideUp .3s ease both}
.anim-right{animation:slideInRight .35s cubic-bezier(.22,1,.36,1) both}
.anim-fade{animation:fadeIn .3s ease both}
.no-scrollbar::-webkit-scrollbar{display:none}
.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
button{font-family:inherit;cursor:pointer}
.typing-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#999;margin:0 1px;animation:typingBounce 1.2s infinite}
.typing-dot:nth-child(2){animation-delay:.15s}.typing-dot:nth-child(3){animation-delay:.3s}
.gold-text{background:linear-gradient(90deg,#c9a55b 0%,#f5d98e 30%,#c9a55b 60%,#f5d98e 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:goldShimmer 3s linear infinite}
`;

const PHOTO_TAGS = [
  { id:'pretty',    emoji:'✨', label:'最美',     color:'#d4a574' },
  { id:'yummy',     emoji:'🍝', label:'最好吃',   color:'#e67e22' },
  { id:'absurd',    emoji:'😂', label:'最离谱',   color:'#e74c3c' },
  { id:'abstract',  emoji:'🤯', label:'最抽象',   color:'#9b59b6' },
  { id:'shock',     emoji:'🗿', label:'最震撼',   color:'#34495e' },
  { id:'heart',     emoji:'🥺', label:'最破防',   color:'#c0392b' },
  { id:'tipsy',     emoji:'🍷', label:'最微醺',   color:'#8e44ad' },
  { id:'cinematic', emoji:'🎬', label:'最电影感', color:'#2c3e50' },
  { id:'squad',     emoji:'👥', label:'最合影',   color:'#16a085' },
];
const TAG_BY_ID = Object.fromEntries(PHOTO_TAGS.map(t=>[t.id,t]));

function load(){
  try { const s = localStorage.getItem("cs_v13"); if (s) return JSON.parse(s); } catch {}
  return { progress:{}, choices:{}, tasksDone:{}, tasksDeferred:{}, secretsPeeked:{}, groupExtras:{}, photos:[], city:null };
}
function save(s){ try { localStorage.setItem("cs_v13", JSON.stringify(s)); } catch {} }

function Welcome({ onPick }){
  const [picking, setPicking] = useState(null);
  const handlePick = (id) => {
    setPicking(id);
    setTimeout(()=>onPick(id), 520);
  };
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#faf7f2 0%,#fff 60%)",overflow:"hidden"}}>
      <div style={{maxWidth:720,margin:"0 auto",padding:"60px 20px 40px"}}>
        <div style={{textAlign:"center",marginBottom:36}}>
          <div style={{fontSize:13,letterSpacing:4,color:"#8a6f47",fontWeight:600,marginBottom:10}}>MESSAGES FROM ITALY</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:44,fontWeight:800,margin:"0 0 10px",lineHeight:1.05}}>打开来自<br/>意大利的消息</h1>
          <p style={{color:"#555",fontSize:15,lineHeight:1.7,margin:"18px auto 0",maxWidth:440}}>
            从米开朗基罗到 Lucia 奶奶，<br/>
            艺术家、原住民、导览者——<br/>
            选一座城市，看看他们在说什么。
          </p>
          <div style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:18,padding:"6px 12px",background:"#fff",borderRadius:20,boxShadow:"0 2px 10px rgba(0,0,0,.05)",fontSize:12,color:"#8a6f47",fontWeight:600}}>
            <span style={{width:8,height:8,borderRadius:"50%",background:"#4caf50",display:"inline-block",animation:"pulse 2s infinite"}}/>
            {Object.keys(CITIES).reduce((n,c)=>n+charactersInCity(c).length,0)} 人在线 · 6 个城市群
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginTop:24}}>
          {Object.entries(CITIES).map(([id,c])=>{
            const isPicking = picking === id;
            const dimmed = picking && picking !== id;
            return (
              <button key={id} onClick={()=>handlePick(id)} disabled={!!picking}
                style={{position:"relative",border:"none",borderRadius:18,overflow:"hidden",aspectRatio:"1/1.1",padding:0,cursor:picking?"default":"pointer",background:"#222",color:"#fff",transform:isPicking?"scale(1.05)":dimmed?"scale(.95)":"scale(1)",opacity:dimmed?.3:1,transition:"all .5s cubic-bezier(.22,1,.36,1)",boxShadow:isPicking?"0 20px 60px rgba(0,0,0,.25)":"0 4px 14px rgba(0,0,0,.08)"}}>
                <img src={PHOTOS[id]} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:.7}}/>
                <div style={{position:"absolute",inset:0,background:`linear-gradient(180deg,transparent 40%,${c.color}dd 100%)`}}/>
                <div style={{position:"absolute",bottom:14,left:14,right:14,textAlign:"left"}}>
                  <div style={{fontSize:24}}>{c.emoji}</div>
                  <div style={{fontWeight:800,fontSize:18,fontFamily:"'Noto Serif SC',serif",marginTop:4}}>{c.nameZh}</div>
                  <div style={{fontSize:11,opacity:.85,letterSpacing:1}}>{c.en.toUpperCase()}</div>
                  <div style={{fontSize:11,opacity:.85,marginTop:6,display:"flex",alignItems:"center",gap:4}}>
                    <span style={{width:5,height:5,borderRadius:"50%",background:"#8fff9f",display:"inline-block"}}/>
                    {charactersInCity(id).length} 条新消息
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div style={{textAlign:"center",fontSize:11,color:"#aaa",marginTop:40,letterSpacing:1.5}}>By Xiaoxuan</div>
      </div>
    </div>
  );
}

function ChatList({ city, state, onOpen, onOpenGroup, onBack, onTab, tab, onOpenProfile }){
  const chars = charactersInCity(city);
  const cityInfo = CITIES[city];
  const unread = (id) => {
    const total = (CONVERSATIONS[id]||[]).length;
    const seen = state.progress[id] || 0;
    return Math.max(0, total - seen);
  };
  const groupUnread = (gid) => {
    const total = (GROUPS[gid]?.conversation || []).length;
    const seen = state.progress[`g_${gid}`] || 0;
    return Math.max(0, total - seen);
  };
  const groupIds = Object.keys(GROUPS).filter(gid => {
    const G = GROUPS[gid];
    return !G.city || G.city === city;
  }).sort((a,b)=>{
    const A = GROUPS[a].city === city ? 0 : 1;
    const B = GROUPS[b].city === city ? 0 : 1;
    return A - B;
  });
  return (
    <div className="anim-right" style={{minHeight:"100vh",background:"#faf7f2",display:"flex",flexDirection:"column"}}>
      <CityHeader city={cityInfo} onBack={onBack}/>
      <Tabs tab={tab} onTab={onTab}/>

      <div style={{padding:"18px 20px 6px"}}>
        <div style={{fontSize:11,letterSpacing:3,color:"#8a6f47",fontWeight:700}}>📌 PINNED · 群聊</div>
        <div style={{fontFamily:"'Noto Serif SC',serif",fontSize:13,color:"#7a6a54",marginTop:2,fontStyle:"italic"}}>有人把你拉进来了</div>
      </div>
      <div style={{padding:"4px 12px 10px"}}>
        {groupIds.map(gid => {
          const G = GROUPS[gid];
          const u = groupUnread(gid);
          const preview = getGroupPreview(gid);
          const avatars = G.members.slice(0,4).map(mid => CHARACTERS[mid]);
          return (
            <button key={gid} onClick={()=>onOpenGroup(gid)}
              style={{width:"100%",background:`linear-gradient(135deg,${G.color}15,${G.color}05)`,padding:"14px 16px",marginBottom:8,borderRadius:16,display:"flex",gap:12,alignItems:"center",textAlign:"left",cursor:"pointer",boxShadow:"0 1px 4px rgba(60,40,20,.05)",border:`1px solid ${G.color}25`}}>
              <div style={{position:"relative",width:54,height:54,flexShrink:0}}>
                {avatars.map((a,i)=>(
                  <div key={i} style={{position:"absolute",width:30,height:30,borderRadius:"50%",background:a.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,border:"2px solid #faf7f2",top:i<2?0:24,left:i%2===0?0:24,zIndex:4-i}}>{a.emoji}</div>
                ))}
                <div style={{position:"absolute",bottom:-2,right:-2,background:G.color,color:"#fff",borderRadius:"50%",width:20,height:20,fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",border:"2px solid #faf7f2"}}>{G.emoji}</div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8,minWidth:0}}>
                  <div title={G.name} style={{fontFamily:CN_SERIF,fontWeight:700,fontSize:16,color:"#1a1a1a",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{G.name}</div>
                  <div style={{fontSize:10.5,color:G.color,flexShrink:0,fontWeight:600}}>{G.members.length} 人</div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:5,gap:8}}>
                  <div style={{color:"#7a6a54",fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,fontFamily:CN_SERIF}}>{G.intro}</div>
                  {u > 0 && <div style={{background:G.color,color:"#fff",fontSize:11,fontWeight:700,borderRadius:12,padding:"2px 8px",minWidth:22,textAlign:"center"}}>{u}</div>}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{padding:"10px 20px 6px"}}>
        <div style={{fontSize:11,letterSpacing:3,color:"#8a6f47",fontWeight:700}}>LETTERS FROM LOCALS</div>
        <div style={{fontFamily:"'Noto Serif SC',serif",fontSize:17,fontWeight:700,marginTop:2,color:"#2a1e10"}}>他们想跟你说几件事</div>
      </div>
      <div style={{flex:1,padding:"4px 12px 20px"}}>
        {chars.map(c => {
          const u = unread(c.id);
          const preview = getPreview(c.id);
          return (
            <div key={c.id} style={{width:"100%",background:"#fff",padding:"14px 16px",marginBottom:8,borderRadius:16,display:"flex",gap:12,alignItems:"center",boxShadow:"0 1px 4px rgba(60,40,20,.05)"}}>
              <button onClick={(e)=>{e.stopPropagation(); onOpenProfile(c.id);}}
                style={{border:"none",padding:0,background:"transparent",cursor:"pointer",flexShrink:0}}>
                <div style={{width:54,height:54,borderRadius:"50%",background:c.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,boxShadow:`0 4px 12px ${c.color}55`,position:"relative"}}>
                  {c.emoji}
                  <div style={{position:"absolute",bottom:-2,right:-2,width:14,height:14,borderRadius:"50%",background:"#4caf50",border:"2px solid #fff"}}/>
                </div>
              </button>
              <button onClick={()=>onOpen(c.id)}
                style={{flex:1,minWidth:0,border:"none",background:"transparent",padding:0,textAlign:"left",cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8,minWidth:0}}>
                  <div title={c.nameZh} style={{fontFamily:CN_SERIF,fontWeight:700,fontSize:16.5,color:"#1a1a1a",flex:1,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.nameZh}</div>
                  <div style={{fontSize:10.5,color:c.color,flexShrink:0,fontWeight:600,letterSpacing:.5,maxWidth:"40%",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{c.tagline}</div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:5,gap:8}}>
                  <div style={{color:"#7a6a54",fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,fontFamily:CN_SERIF}}>「{preview}」</div>
                  {u > 0 && <div style={{background:"#d94f3a",color:"#fff",fontSize:11,fontWeight:700,borderRadius:12,padding:"2px 8px",minWidth:22,textAlign:"center"}}>{u}</div>}
                </div>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CityHeader({ city, onBack }){
  return (
    <div style={{background:city.color,color:"#fff",padding:"14px 18px 16px",paddingTop:"max(14px,env(safe-area-inset-top))",display:"flex",alignItems:"center",gap:10}}>
      <button onClick={onBack} style={{background:"rgba(255,255,255,.2)",border:"none",color:"#fff",width:32,height:32,borderRadius:"50%",fontSize:18,cursor:"pointer"}}>‹</button>
      <div>
        <div style={{fontSize:11,opacity:.85,letterSpacing:2}}>{city.en.toUpperCase()}</div>
        <div style={{fontWeight:800,fontSize:20,fontFamily:"'Noto Serif SC',serif"}}>{city.emoji} {city.nameZh}</div>
      </div>
    </div>
  );
}

function Tabs({ tab, onTab }){
  const items = [{id:'chats',label:'💬 聊天'},{id:'photos',label:'📷 相册'},{id:'tasks',label:'✓ 打卡'}];
  return (
    <div style={{display:"flex",borderBottom:"1px solid #eee",background:"#fff",position:"sticky",top:0,zIndex:5}}>
      {items.map(i=>(
        <button key={i.id} onClick={()=>onTab(i.id)}
          style={{flex:1,border:"none",background:"transparent",padding:"12px 6px",fontSize:13,fontWeight:600,color:tab===i.id?"#111":"#999",borderBottom:tab===i.id?"2px solid #111":"2px solid transparent",cursor:"pointer"}}>{i.label}</button>
      ))}
    </div>
  );
}

const PACE_SPEEDS = {
  slow:   { base:950,  perChar:45, cardBase:1400, cardExtra:450, mine:350, afterMine:1200, cap:2300 },
  normal: { base:700,  perChar:32, cardBase:1050, cardExtra:300, mine:260, afterMine:850,  cap:1700 },
  fast:   { base:420,  perChar:20, cardBase:680,  cardExtra:200, mine:190, afterMine:550,  cap:1050 },
};

function Chat({ charId, groupId, state, setState, onBack, onOpenProfile, onOpenArtwork }){
  const openProfileForChat = () => { if (!groupId && onOpenProfile) onOpenProfile(charId); };
  const isGroup = !!groupId;
  const entity = isGroup ? GROUPS[groupId] : CHARACTERS[charId];
  const convo = isGroup ? (entity.conversation || []) : (CONVERSATIONS[charId] || []);
  const cityColor = isGroup ? (entity.color || "#8a6f47") : CITIES[entity.city].color;
  const conversationKey = isGroup ? `g_${groupId}` : charId;

  const myChoices = state.choices[conversationKey] || {};

  const display = useMemo(()=>{
    const out = [];
    for (let i=0; i<convo.length; i++){
      const m = convo[i];
      if (m.t === 'choice'){
        const picked = myChoices[i];
        if (picked != null){
          const chosen = m.options[picked];
          out.push({ t:'text', mine:true, text:chosen.label, _k:`c${i}u` });
          if (chosen.reply) {
            if (typeof chosen.reply === 'string') {
              out.push({ t:'text', text:chosen.reply, _k:`c${i}r` });
            } else if (Array.isArray(chosen.reply)) {
              chosen.reply.forEach((r, j) => out.push({ ...r, _k:`c${i}r${j}` }));
            } else {
              out.push({ ...chosen.reply, _k:`c${i}r` });
            }
          }
        } else {
          out.push({ t:'choice', options:m.options, _idx:i, _k:`c${i}` });
          break;
        }
      } else {
        out.push({ ...m, _k:`m${i}`, _idx:i });
      }
    }
    return out;
  }, [convo, myChoices]);

  const taskDone = !isGroup && !!state.tasksDone[charId];
  const taskDeferred = !isGroup && !!(state.tasksDeferred || {})[charId];
  const secretPeeked = !isGroup && !!(state.secretsPeeked || {})[charId];
  const secretUnlocked = taskDone || secretPeeked;

  const groupExtras = isGroup ? ((state.groupExtras || {})[groupId] || []) : [];
  const [groupThinking, setGroupThinking] = useState(null);

  const savedProg = state.progress[conversationKey] || 1;
  const [revealed, setRevealed] = useState(Math.min(savedProg, display.length));
  const [typing, setTyping] = useState(false);
  const [paused, setPaused] = useState(false);
  const [holdForTap, setHoldForTap] = useState(false);
  const paceMode = state.pace || 'normal';
  const scrollRef = useRef(null);

  useEffect(()=>{
    if (revealed > display.length) setRevealed(display.length);
    if (revealed < 1) setRevealed(1);
  }, [display.length]);

  useEffect(()=>{
    if (revealed <= 0 || revealed >= display.length) { setHoldForTap(false); return; }
    const last = display[revealed-1];
    if (!last) { setHoldForTap(false); return; }
    if (last.t === 'artwork' || last.t === 'task' || last.t === 'tip' || last.t === 'ref' || last.t === 'place') {
      setHoldForTap(true); return;
    }
    setHoldForTap(false);
  }, [revealed, display.length]);

  useEffect(()=>{
    if (paused)                      { setTyping(false); return; }
    if (holdForTap)                  { setTyping(false); return; }
    if (revealed >= display.length)  { setTyping(false); return; }
    const next = display[revealed];
    if (!next)                       { setTyping(false); return; }
    if (next.t === 'choice')         { setTyping(false); return; }
    if (next.t === 'secret' && !secretUnlocked && !isGroup) { setTyping(false); return; }
    const prev = display[revealed-1];
    const prevIsCard = prev && (prev.t==='artwork'||prev.t==='ref'||prev.t==='tip'||prev.t==='task'||prev.t==='place');
    const prevIsMine = prev && prev.t === 'text' && prev.mine;
    const P = PACE_SPEEDS[paceMode] || PACE_SPEEDS.normal;
    let delay;
    if (next.mine) delay = P.mine;
    else if (next.t === 'text') {
      const len = (next.text||'').length;
      delay = P.base + Math.min(P.cap - P.base, len * P.perChar);
    }
    else if (next.t === 'artwork') delay = P.cardBase + 200;
    else if (next.t === 'ref' || next.t === 'tip') delay = P.cardBase - 100;
    else if (next.t === 'task') delay = P.cardBase;
    else if (next.t === 'place') delay = P.cardBase - 150;
    else delay = P.base;
    if (prevIsCard) delay += P.cardExtra;
    if (prevIsMine && !next.mine) delay = Math.max(delay, P.afterMine);
    delay = Math.min(delay, P.cap + P.cardExtra);
    setTyping(!next.mine && next.t === 'text');
    const timer = setTimeout(()=>{
      setTyping(false);
      setRevealed(r=>r+1);
    }, delay);
    return ()=>clearTimeout(timer);
  }, [revealed, display.length, taskDone, secretPeeked, paceMode, paused, holdForTap]);

  useEffect(()=>{
    setState(s=>{
      const prog = {...s.progress, [conversationKey]:revealed};
      return { ...s, progress:prog };
    });
  }, [revealed, conversationKey]);

  useEffect(()=>{
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [revealed, typing, groupExtras.length, groupThinking]);

  const pickChoice = (msgIdx, optIdx) => {
    setState(s=>({ ...s, choices:{ ...s.choices, [conversationKey]:{...(s.choices[conversationKey]||{}), [msgIdx]:optIdx} }}));
    setRevealed(r=>r+1);
  };

  const completeTask = () => {
    setState(s=>({ ...s, tasksDone:{...s.tasksDone, [charId]:Date.now()}, tasksDeferred:{...(s.tasksDeferred||{}), [charId]:false} }));
  };
  const deferTask = () => {
    setState(s=>({ ...s, tasksDeferred:{...(s.tasksDeferred||{}), [charId]:Date.now()} }));
    setHoldForTap(false);
    setRevealed(r=>Math.min(r+1, display.length));
  };
  const peekSecret = () => {
    setState(s=>({ ...s, secretsPeeked:{...(s.secretsPeeked||{}), [charId]:Date.now()} }));
  };

  const addReaction = (msgKey, emoji) => {
    setState(s=>{
      const r = {...(s.reactions||{})};
      const convR = {...(r[conversationKey]||{})};
      const existing = convR[msgKey];
      convR[msgKey] = existing === emoji ? null : emoji;
      r[conversationKey] = convR;
      return { ...s, reactions:r };
    });
  };
  const reactions = (state.reactions || {})[conversationKey] || {};

  const items = display.slice(0, revealed);
  const last = display[revealed-1];
  const atChoice = last && last.t === 'choice';
  const atLockedSecret = !isGroup && revealed < display.length && display[revealed]?.t === 'secret' && !secretUnlocked;
  const finished = revealed >= display.length;
  const progress = Math.round((revealed / display.length) * 100);

  const setPace = (p) => setState(s=>({ ...s, pace:p }));

  const groupMembers = isGroup ? entity.members.map(id => ({id, ...CHARACTERS[id]})).filter(m => m.name) : [];

  const appendGroupExtra = useCallback((msg) => {
    setState(s=>{
      const all = {...(s.groupExtras||{})};
      const key = groupId;
      const prev = all[key] || [];
      const _k = `gx_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
      all[key] = [...prev, {...msg, _k}];
      return { ...s, groupExtras:all };
    });
  }, [groupId, setState]);

  const handleGroupSend = async (text, mentionId) => {
    if (!isGroup) return;
    appendGroupExtra({ t:'text', mine:true, text });
    let responderId = mentionId;
    if (!responderId){
      const candidates = entity.members.filter(id => CHARACTERS[id]);
      responderId = candidates[0];
    }
    const responder = CHARACTERS[responderId];
    if (!responder) return;
    setGroupThinking(responderId);
    const otherMembers = entity.members.filter(id => id !== responderId && CHARACTERS[id])
      .map(id => `${CHARACTERS[id].nameZh}(${CHARACTERS[id].tagline})`).join('、');
    const system = `你是${responder.nameZh}（${responder.title}）。性格：${responder.tagline}。${responder.bio ? `背景：${responder.bio.replace(/\n/g,' ')}` : ''}
你在名叫"${entity.name}"的群聊里。${entity.intro || ''}
群里还有：${otherMembers}。
规则：
- 用第一人称，像在手机上发消息：1-2 句，短、真、有性格。
- 可以用少量 emoji，但不要堆砌。
- 不要自我介绍，不要说"作为 AI"。
- 只说${responder.nameZh}会说的话，带他/她独有的语气。
- 不要以"@某某"开头。
${mentionId ? '你被 @ 了，请针对用户这条消息作答。' : '在群里自然接话。'}`;
    try {
      const txt = await askKimi({ system, user:text });
      appendGroupExtra({ t:'text', from:responderId, text: txt || '…' });
    } catch (e) {
      const fallback = e.message === 'no-key'
        ? "自由聊天还没有开通。"
        : "消息没有送达，稍后再试一次。";
      appendGroupExtra({ t:'system', text: fallback });
    }
    setGroupThinking(null);
  };

  return (
    <div className="anim-right" style={{display:"flex",flexDirection:"column",height:"100vh",background:"#f5f0e4"}}>
      <ChatHeader entity={entity} isGroup={isGroup} members={groupMembers} color={cityColor} onBack={onBack}
        progress={progress} pace={paceMode} onPace={setPace} paused={paused} onPause={()=>setPaused(p=>!p)}
        onOpenProfile={openProfileForChat}/>
      <div ref={scrollRef} className="no-scrollbar" style={{flex:1,overflowY:"auto",padding:"14px 14px 20px"}}
           onClick={()=>{
             if (atChoice || atLockedSecret || revealed >= display.length) return;
             if (holdForTap) { setHoldForTap(false); return; }
             setRevealed(r=>Math.min(r+1, display.length));
           }}>
        {items.map((m,i)=>(
          <MessageBubble key={m._k} msg={m} charColor={cityColor} onTask={completeTask} onDeferTask={deferTask} taskDone={taskDone} taskDeferred={taskDeferred}
            isGroup={isGroup} members={groupMembers} onOpenArtwork={onOpenArtwork}
            reaction={reactions[m._k]} onReact={(e)=>addReaction(m._k, e)} onOpenProfile={onOpenProfile}/>
        ))}
        {isGroup && groupExtras.map((m)=>(
          <MessageBubble key={m._k} msg={m} charColor={cityColor} onTask={completeTask} onDeferTask={deferTask} taskDone={taskDone} taskDeferred={taskDeferred}
            isGroup={isGroup} members={groupMembers} onOpenArtwork={onOpenArtwork}
            reaction={reactions[m._k]} onReact={(e)=>addReaction(m._k, e)} onOpenProfile={onOpenProfile}/>
        ))}
        {isGroup && groupThinking && (
          <TypingBubble color={cityColor} isGroup={true} nextMsg={{t:'text', from:groupThinking}} members={groupMembers}/>
        )}
        {atLockedSecret && <LockedSecret onPeek={peekSecret} color={cityColor}/>}
        {typing && !atChoice && <TypingBubble color={cityColor} isGroup={isGroup} nextMsg={display[revealed]} members={groupMembers}/>}
        {holdForTap && !atChoice && !atLockedSecret && revealed < display.length && !typing && (
          <div className="anim-fade" style={{textAlign:"center",padding:"14px 0 6px"}}>
            <span style={{display:"inline-block",padding:"7px 16px",background:"#fff",borderRadius:999,boxShadow:"0 2px 10px rgba(0,0,0,.08)",fontSize:12.5,fontWeight:600,color:"#8a6f47",letterSpacing:.5}}>⌄ 点一下继续</span>
          </div>
        )}
        {paused && !finished && (
          <div onClick={(e)=>{e.stopPropagation(); setPaused(false);}} style={{textAlign:"center",padding:"12px",margin:"8px 0",background:"#fff",borderRadius:12,fontSize:12,color:"#666",cursor:"pointer",boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>⏸ 已暂停 · 点击继续</div>
        )}
        {finished && !atChoice && <ChatEndCard entity={entity} isGroup={isGroup} charId={charId}/>}
      </div>
      {atChoice && <ChoiceDock options={last.options} onPick={(idx)=>pickChoice(last._idx, idx)} isGroup={isGroup} members={groupMembers}/>}
      {!atChoice && !isGroup && <AskDock char={entity} charId={charId} color={cityColor}/>}
      {!atChoice && isGroup && <GroupInputDock color={cityColor} members={groupMembers} onSend={handleGroupSend} busy={!!groupThinking}/>}
    </div>
  );
}

const CHAR_OUTRO = {
  michelangelo: '他转身又凿起那块石头，背影比谁都沉。',
  davinci:      '他合上那本反着写的小册子，去隔壁院子看鸟了。',
  dante:        '他披上那件深红色长袍，往流放的方向走了。',
  lorenzo:      '他往账本上压了枚金币，说"继续支持"。',
  marco:        '他摘下耳机，"今晚 Santo Spirito 见？"',
  nonna:        '她把围裙一解："晚上早点回来，我给你留一份 carbonara。"',
  caesar:       '他拉紧披风："小心你身边的 Brutus。"',
  bernini:      '他用拇指抹掉大理石灰："许愿池的硬币别扔错方向。"',
  gino:         '他把一团新的面剂子摔在案板上："明天 19 点见，别迟到。"',
  maradona:     '他对球做了个鬼脸，朝 Napoli 的海那边去了。',
  giuseppe:     '他摘了颗柠檬塞你手里："甜蜜的事别赶。"',
  caruso:       '他清了清嗓，低声哼了半句《O Sole Mio》。',
  ferrante:     '她从来没露过脸，只留下一句"你读下去就是了。"',
  hans:         '他指了指山那边："云下来以前，回到屋子里。"',
  sissi:        '她把伞收起："自由，是自己选的路。"',
  bruno:        '他吹了声口哨，羊群开始动了。',
  sophia:       '她对你眨了下眼："做你自己，亲爱的。"',
  paolo:        '他拎着西装外套："今晚 Bar Basso，你来不来？"',
  miuccia:      '她把那本批判理论的书塞进包："丑比美诚实。"',
  fi_art:'她把展签折好塞进口袋："下次我们看别的。"',
  fi_shop:'她摆摆手："非名牌才有性格。"',
  fi_food:'他把账单收起："吃慢点，别像美国人。"',
  fi_culture:'他翻了页书："文艺复兴还没完呢。"',
  fi_lang:'她笑了："Grazie 要发得漂亮，尾音往上扬。"',
  rm_art:'她把图录合上："罗马不是一天看完的。"',
  rm_shop:'她拎起购物袋："下次去 Monti，带你看真货。"',
  rm_food:'他举起 espresso："吃完就走，这才是罗马。"',
  rm_culture:'他合起《罗马衰亡史》："帝国真的会谢。"',
  rm_lang:'她比了个手势："意大利语一半是手说的。"',
  mi_art:'她把设计图卷起："米兰的美是精确的。"',
  mi_shop:'她整了整西装："不买 logo，买剪裁。"',
  mi_food:'他把酒杯一放："risotto 要耐心，像米兰人。"',
  mi_culture:'他合上《宣言》："设计改变世界，知道吗。"',
  mi_lang:'她戴上墨镜："Ciao 要说得从容，别急。"',
  do_art:'他把相机放下："山，就是最好的画。"',
  do_shop:'她把木雕塞给你："Tyrolean 手工，带回家吧。"',
  do_food:'他擦了擦嘴："speck 加黑麦，这才是山里饭。"',
  do_culture:'他竖起耳朵："听，是山风。"',
  do_lang:'她点了头："Grüß Gott——这里德语也通。"',
  so_art:'她把素描本合上："海和柠檬，就够画一辈子了。"',
  so_shop:'她拎起一罐柠檬酒："回去记得冷藏。"',
  so_food:'他把盘子推过来："海鲜不能等。"',
  so_culture:'他望向海："Sirena 的歌，只有不怕的人听得见。"',
  so_lang:'她挥挥手："Arrivederci——记得回来。"',
  na_art:'他把喷漆罐收起："Napoli 的墙都会说话。"',
  na_shop:'她递给你一串号角："红的辟邪，别丢了。"',
  na_food:'他把披萨盒推过来："吃，别客气。"',
  na_culture:'他双手一摊："Maradona 就是神。"',
  na_lang:'他笑了："那不勒斯语和意大利语，完全两回事。"',
};

function ChatEndCard({ entity, isGroup, charId }){
  let msg;
  if (isGroup){
    msg = `（${entity.name} 的群聊暂时安静了。你可以 @ 他们中的任意一位，继续聊。）`;
  } else {
    const line = CHAR_OUTRO[charId] || `${entity.nameZh} 先不说了。故事还在这座城市里。`;
    msg = `（${line}）`;
  }
  return (
    <div className="anim-up" style={{textAlign:"center",padding:"24px 24px 8px",margin:"16px 0 0"}}>
      <div style={{fontSize:11,color:"#b5a58a",letterSpacing:2,marginBottom:6}}>— FINE —</div>
      <div style={{fontSize:13,color:"#7a6a54",fontStyle:"italic",lineHeight:1.7,fontFamily:CN_SERIF,letterSpacing:.3}}>{msg}</div>
    </div>
  );
}

function ChatHeader({ entity, isGroup, members, color, onBack, progress, pace, onPace, paused, onPause, onOpenProfile }){
  const [showMenu, setShowMenu] = useState(false);
  const title = isGroup ? entity.name : entity.nameZh;
  const sub = isGroup ? `${members.length} 人 · ${entity.intro}` : entity.title;
  return (
    <div style={{background:"#fff",borderBottom:"1px solid #e5e5e5",padding:"10px 14px 8px",paddingTop:"max(10px,env(safe-area-inset-top))",position:"sticky",top:0,zIndex:10}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <button onClick={onBack} style={{border:"none",background:"transparent",color:color,fontSize:26,padding:"0 6px",cursor:"pointer"}}>‹</button>
        {isGroup ? (
          <div style={{width:38,height:38,position:"relative",flexShrink:0}}>
            {members.slice(0,3).map((m,i)=>(
              <div key={m.id} style={{position:"absolute",width:20,height:20,borderRadius:"50%",background:m.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,border:"1.5px solid #fff",top:i===0?0:14,left:i===2?16:i===1?14:0,zIndex:3-i}}>{m.emoji}</div>
            ))}
          </div>
        ) : (
          <button onClick={()=>onOpenProfile && onOpenProfile()} style={{border:"none",padding:0,background:"transparent",cursor:"pointer"}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{entity.emoji}</div>
          </button>
        )}
        <button onClick={()=>!isGroup && onOpenProfile && onOpenProfile()} disabled={isGroup}
          style={{flex:1,minWidth:0,border:"none",background:"transparent",padding:0,textAlign:"left",cursor:isGroup?"default":"pointer"}}>
          <div style={{fontFamily:CN_SERIF,fontWeight:700,fontSize:15.5,color:"#1a1a1a",display:"flex",alignItems:"center",gap:4,minWidth:0}}>
            {isGroup && <span style={{flexShrink:0}}>{entity.emoji}</span>}
            <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",minWidth:0}}>{title}</span>
            {!isGroup && <span style={{fontSize:11,color:"#ccc",flexShrink:0}}>ⓘ</span>}
          </div>
          <div style={{fontSize:11,color:"#999",marginTop:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{sub}</div>
        </button>
        <button onClick={()=>setShowMenu(v=>!v)} style={{border:"none",background:"transparent",padding:"6px 10px",fontSize:18,color:"#999",cursor:"pointer"}}>⋯</button>
      </div>
      <div style={{marginTop:6,height:2,background:"#f0ebe0",borderRadius:1,overflow:"hidden"}}>
        <div style={{height:"100%",width:`${Math.min(100,progress||0)}%`,background:color,transition:"width .4s"}}/>
      </div>
      {showMenu && (
        <div className="anim-fade" onClick={()=>setShowMenu(false)} style={{position:"fixed",inset:0,zIndex:20}}>
          <div onClick={e=>e.stopPropagation()} style={{position:"absolute",top:60,right:10,background:"#fff",borderRadius:14,padding:10,boxShadow:"0 8px 30px rgba(0,0,0,.15)",minWidth:180}}>
            <div style={{fontSize:10,letterSpacing:2,color:"#999",padding:"4px 8px 8px",fontWeight:700}}>节奏</div>
            <div style={{display:"flex",gap:4,padding:"0 6px"}}>
              {['slow','normal','fast'].map(p=>(
                <button key={p} onClick={()=>{onPace(p);}}
                  style={{flex:1,border:"none",background:pace===p?color:"#f2f2f7",color:pace===p?"#fff":"#555",padding:"6px 4px",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"}}>
                  {p==='slow'?'慢':p==='normal'?'正常':'快'}
                </button>
              ))}
            </div>
            <button onClick={()=>{onPause(); setShowMenu(false);}}
              style={{width:"100%",marginTop:8,border:"none",background:"#f2f2f7",padding:"8px",borderRadius:8,fontSize:13,cursor:"pointer",color:"#333"}}>
              {paused?"▶ 继续":"⏸ 暂停"}
            </button>
            {!isGroup && (
              <button onClick={()=>{onOpenProfile && onOpenProfile(); setShowMenu(false);}}
                style={{width:"100%",marginTop:6,border:"none",background:"#f2f2f7",padding:"8px",borderRadius:8,fontSize:13,cursor:"pointer",color:"#333"}}>
                👤 TA 的资料
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const REACTIONS = ['❤️','😂','🤯','🗿','👀','🔥'];

function MessageBubble({ msg, charColor, onTask, onDeferTask, taskDone, taskDeferred, isGroup, members, onOpenArtwork, reaction, onReact, onOpenProfile }){
  if (msg.t === 'system'){
    return (
      <div className="anim-fade" style={{textAlign:"center",fontSize:11,color:"#a89a80",margin:"10px 0",padding:"0 20px",lineHeight:1.5,letterSpacing:.5}}>
        {msg.text}
      </div>
    );
  }
  if (msg.t === 'text'){
    const sender = isGroup && msg.from ? { id: msg.from, ...CHARACTERS[msg.from] } : null;
    return <TextBubble mine={msg.mine} text={msg.text} color={sender?.color || charColor} sender={sender} isGroup={isGroup}
      reaction={reaction} onReact={onReact} onOpenProfile={onOpenProfile}/>;
  }
  if (msg.t === 'artwork'){
    return <ArtworkCard msg={msg} color={charColor} onOpen={()=>onOpenArtwork && onOpenArtwork(msg)} reaction={reaction} onReact={onReact}/>;
  }
  if (msg.t === 'task'){
    return <TaskCard msg={msg} color={charColor} done={taskDone} deferred={taskDeferred} onTask={onTask} onDeferTask={onDeferTask}/>;
  }
  if (msg.t === 'secret'){
    return <SecretBlock texts={msg.texts} color={charColor}/>;
  }
  if (msg.t === 'tip'){
    return <TipCard label={msg.label} text={msg.text} color={charColor} onOpen={()=>onOpenArtwork && onOpenArtwork({...msg, t:'tip'})}/>;
  }
  if (msg.t === 'ref'){
    return <RefCard label={msg.label} text={msg.text} color={charColor} onOpen={()=>onOpenArtwork && onOpenArtwork({...msg, t:'ref'})}/>;
  }
  if (msg.t === 'place'){
    return <PlaceCard italianName={msg.italianName} address={msg.address} zh={msg.zh} color={charColor}/>;
  }
  return null;
}

function PlaceCard({ italianName, address, zh, color }){
  const query = encodeURIComponent(`${italianName}, ${address}`);
  const href = `https://www.google.com/maps/search/?api=1&query=${query}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="anim-rise"
      style={{alignSelf:"flex-start",maxWidth:"85%",textDecoration:"none",display:"block",margin:"2px 0"}}>
      <div style={{background:"#fff",border:`1px solid ${color}33`,borderRadius:18,borderBottomLeftRadius:6,padding:"12px 14px",boxShadow:"0 2px 8px rgba(0,0,0,.04)"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
          <div style={{width:34,height:34,borderRadius:10,background:`${color}14`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>📍</div>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontWeight:700,fontSize:14.5,color:"#1a1a1a",fontFamily:"'Playfair Display',serif",letterSpacing:.2}}>{italianName}</div>
            {zh && <div style={{fontSize:12,color:"#888",marginTop:2}}>{zh}</div>}
            <div style={{fontSize:12,color:"#666",marginTop:4,lineHeight:1.45}}>{address}</div>
          </div>
          <div style={{fontSize:11,color:color,fontWeight:700,letterSpacing:.5,whiteSpace:"nowrap",paddingTop:3}}>在地图打开 ↗</div>
        </div>
      </div>
    </a>
  );
}

function ReactionBar({ color, reaction, onReact, hasReaction }){
  const [picker, setPicker] = useState(false);
  if (hasReaction) return null;
  return (
    <div style={{position:"relative"}}>
      <button onClick={(e)=>{e.stopPropagation(); setPicker(v=>!v);}}
        style={{border:"none",background:"transparent",padding:"2px 6px",fontSize:11,color:"#bbb",cursor:"pointer"}}>
        + 反应
      </button>
      {picker && (
        <div onClick={e=>e.stopPropagation()} className="anim-pop" style={{position:"absolute",bottom:"100%",left:0,background:"#fff",borderRadius:20,padding:"6px 8px",boxShadow:"0 4px 20px rgba(0,0,0,.15)",display:"flex",gap:4,zIndex:5}}>
          {REACTIONS.map(e=>(
            <button key={e} onClick={()=>{onReact(e); setPicker(false);}}
              style={{border:"none",background:"transparent",padding:"4px 6px",fontSize:18,cursor:"pointer",borderRadius:12}}>{e}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function TextBubble({ mine, text, color, sender, isGroup, reaction, onReact, onOpenProfile }){
  const showSender = isGroup && sender && !mine;
  return (
    <div className="anim-up" style={{display:"flex",justifyContent:mine?"flex-end":"flex-start",margin:"3px 0",alignItems:"flex-end",gap:6}}>
      {showSender && (
        <button onClick={(e)=>{e.stopPropagation(); onOpenProfile && onOpenProfile(sender.id);}}
          style={{border:"none",background:"transparent",padding:0,cursor:"pointer",flexShrink:0}}>
          <div style={{width:26,height:26,borderRadius:"50%",background:sender.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,marginBottom:2}}>{sender.emoji}</div>
        </button>
      )}
      <div style={{maxWidth:isGroup?"70%":"78%"}}>
        {showSender && <div style={{fontSize:10.5,color:sender.color,fontWeight:700,marginLeft:12,marginBottom:2}}>{sender.nameZh}</div>}
        <div style={{
          background:mine?color:"#fff",
          color:mine?"#fff":"#1a1a1a",
          padding:"9px 14px",
          borderRadius:20,
          borderBottomRightRadius:mine?6:20,
          borderBottomLeftRadius:mine?20:6,
          fontSize:15,
          lineHeight:1.55,
          boxShadow:mine?"none":"0 1px 2px rgba(0,0,0,.06)",
          whiteSpace:"pre-wrap",
          wordBreak:"break-word",
          position:"relative",
          fontFamily: mine ? UI_FONT : CN_SERIF,
          letterSpacing: mine ? 0 : .2,
        }}>
          {text}
          {reaction && (
            <button onClick={(e)=>{e.stopPropagation(); onReact && onReact(reaction);}}
              title="再点一次取消反应"
              style={{position:"absolute",bottom:-10,right:mine?8:-6,background:"#fff",border:"none",borderRadius:12,padding:"2px 6px",fontSize:12,boxShadow:"0 1px 4px rgba(0,0,0,.12)",animation:"heartPop .3s ease",cursor:"pointer"}}>{reaction}</button>
          )}
        </div>
        {!mine && <div style={{marginTop:reaction?12:2,marginLeft:8}}><ReactionBar color={color} reaction={reaction} onReact={onReact} hasReaction={!!reaction}/></div>}
      </div>
    </div>
  );
}

function TypingBubble({ color, isGroup, nextMsg, members }){
  const sender = isGroup && nextMsg?.from ? CHARACTERS[nextMsg.from] : null;
  const bubbleColor = sender?.color || color;
  return (
    <div className="anim-up" style={{display:"flex",justifyContent:"flex-start",margin:"3px 0",alignItems:"flex-end",gap:6}}>
      {isGroup && sender && (
        <div style={{width:26,height:26,borderRadius:"50%",background:sender.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0,marginBottom:2}}>{sender.emoji}</div>
      )}
      <div>
        {isGroup && sender && <div style={{fontSize:10.5,color:sender.color,fontWeight:700,marginLeft:12,marginBottom:2}}>{sender.nameZh}</div>}
        <div style={{background:"#fff",padding:"12px 16px",borderRadius:20,borderBottomLeftRadius:6,boxShadow:"0 1px 2px rgba(0,0,0,.06)"}}>
          <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
        </div>
      </div>
    </div>
  );
}

function ArtworkCard({ msg, color, onOpen, reaction, onReact }){
  return (
    <div className="anim-up" style={{display:"flex",justifyContent:"flex-start",margin:"8px 0"}}>
      <div style={{maxWidth:"88%"}}>
        <button onClick={(e)=>{e.stopPropagation(); onOpen && onOpen();}}
          style={{width:"100%",border:"none",padding:0,background:"#fff",borderRadius:18,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,.08)",cursor:"pointer",textAlign:"left",position:"relative"}}>
          {msg.image && <img src={msg.image} alt={msg.title} style={{width:"100%",height:160,objectFit:"cover",display:"block",background:"#eee"}}/>}
          <div style={{padding:"12px 14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8}}>
              <div style={{fontWeight:800,fontSize:16,fontFamily:"'Noto Serif SC',serif"}}>{msg.title}</div>
              <div style={{fontSize:11,color:color,fontWeight:600,flexShrink:0}}>查看详情 ›</div>
            </div>
            <div style={{fontSize:12,color:color,fontWeight:600,marginTop:3}}>📍 {msg.location}</div>
            <div style={{fontSize:13.5,color:"#333",lineHeight:1.5,marginTop:8,display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{msg.why}</div>
            {msg.observe && <div style={{marginTop:10,padding:"8px 10px",background:"#fffbee",borderLeft:`3px solid ${color}`,fontSize:12.5,color:"#5a4a1a",lineHeight:1.5,borderRadius:"0 6px 6px 0",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>👁️ <b>观察</b>：{msg.observe}</div>}
          </div>
          {reaction && (
            <span onClick={(e)=>{e.stopPropagation(); onReact && onReact(reaction);}}
              title="再点一次取消反应"
              style={{position:"absolute",bottom:-10,right:16,background:"#fff",borderRadius:12,padding:"2px 6px",fontSize:12,boxShadow:"0 1px 4px rgba(0,0,0,.12)",cursor:"pointer"}}>{reaction}</span>
          )}
        </button>
        <div style={{marginTop:reaction?12:2,marginLeft:8}}><ReactionBar color={color} reaction={reaction} onReact={onReact} hasReaction={!!reaction}/></div>
      </div>
    </div>
  );
}

function TaskCard({ msg, color, done, onTask, onDeferTask, deferred }){
  const [shooting, setShooting] = useState(false);
  const muted = deferred && !done;
  return (
    <div className="anim-up" style={{margin:"12px 0",display:"flex",justifyContent:"center"}}>
      <div style={{width:"92%",background:done?"#e8f5e9":(muted?"#faf7f0":"#fff"),border:`2px dashed ${done?"#4caf50":(muted?"#d8cfbd":color)}`,borderRadius:16,padding:14,transition:"all .3s",opacity:muted?.85:1}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <span style={{fontSize:20}}>{done?"✅":(muted?"⏳":"📸")}</span>
          <div style={{fontWeight:800,fontSize:15,color:done?"#2e7d32":"#222"}}>
            {done?"打卡完成":(muted?"已存入待办":"观察任务")}
          </div>
        </div>
        <div style={{fontWeight:700,fontSize:14.5,marginBottom:4}}>{msg.title}</div>
        <div style={{fontSize:12.5,color:"#666",lineHeight:1.5}}>{msg.hint}</div>
        {!done && !muted && (
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <button onClick={()=>{ setShooting(true); setTimeout(()=>{ onTask(); setShooting(false); }, 700); }}
              style={{flex:2,padding:"10px",background:color,color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer",opacity:shooting?.6:1}}>
              {shooting?"📸 拍照中…":"立刻拍照"}
            </button>
            <button onClick={()=> onDeferTask && onDeferTask()}
              style={{flex:1,padding:"10px",background:"#fff",color:"#8a6e3f",border:`1px solid ${color}55`,borderRadius:10,fontWeight:700,fontSize:13,cursor:"pointer"}}>
              稍后再拍
            </button>
          </div>
        )}
        {!done && muted && (
          <button onClick={()=>{ setShooting(true); setTimeout(()=>{ onTask(); setShooting(false); }, 700); }}
            style={{marginTop:12,width:"100%",padding:"10px",background:color,color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer",opacity:shooting?.6:1}}>
            {shooting?"📸 拍照中…":"现在去补拍"}
          </button>
        )}
        {done && <div style={{marginTop:10,fontSize:12,color:"#2e7d32",fontStyle:"italic"}}>🔓 解锁了 TA 的小秘密（往下看）</div>}
      </div>
    </div>
  );
}

function SecretBlock({ texts, color }){
  return (
    <div className="anim-up" style={{margin:"10px 0"}}>
      <div style={{textAlign:"center",fontSize:11,color:"#999",letterSpacing:2,marginBottom:6}}>─── 🔓 小秘密 ───</div>
      {texts.map((t,i)=>(
        <div key={i} style={{display:"flex",justifyContent:"flex-start",margin:"3px 0"}}>
          <div style={{maxWidth:"82%",background:"linear-gradient(135deg,#fffbef,#fff)",border:`1px solid ${color}33`,padding:"9px 14px",borderRadius:20,borderBottomLeftRadius:6,fontSize:14.5,lineHeight:1.6,color:"#2a2a2a",whiteSpace:"pre-wrap",fontFamily:CN_SERIF,letterSpacing:.2}}>{t}</div>
        </div>
      ))}
    </div>
  );
}

function LockedSecret({ onPeek, color }){
  return (
    <div style={{textAlign:"center",padding:"18px 20px 8px",margin:"12px 0",color:"#999"}}>
      <div style={{fontSize:26,marginBottom:6}}>🔒</div>
      <div style={{fontSize:12.5,lineHeight:1.6}}>完成上面的观察任务<br/>TA 才愿意说出小秘密</div>
      {onPeek && (
        <button onClick={(e)=>{e.stopPropagation(); onPeek();}}
          style={{marginTop:12,background:"transparent",border:"none",color:color||"#8a6f47",fontSize:11.5,textDecoration:"underline",textUnderlineOffset:3,cursor:"pointer",letterSpacing:.3}}>
          下次再打卡，先偷看一眼 →
        </button>
      )}
    </div>
  );
}

function TipCard({ label, text, color, onOpen }){
  return (
    <div className="anim-up" style={{margin:"6px 0",display:"flex",justifyContent:"flex-start"}}>
      <button onClick={(e)=>{e.stopPropagation(); onOpen && onOpen();}}
        style={{maxWidth:"88%",background:"#f5f1e8",borderLeft:`3px solid ${color}`,border:`1px solid ${color}15`,borderLeftWidth:3,padding:"10px 14px",borderRadius:"0 12px 12px 0",fontSize:13.5,lineHeight:1.55,color:"#3a2f1e",textAlign:"left",cursor:"pointer",display:"block"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8}}>
          <div style={{fontWeight:700,marginBottom:3,fontSize:12.5}}>{label}</div>
          <div style={{fontSize:10.5,color:color,fontWeight:600,flexShrink:0}}>详情 ›</div>
        </div>
        <div style={{display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{text}</div>
      </button>
    </div>
  );
}

function RefCard({ label, text, color, onOpen }){
  return (
    <div className="anim-up" style={{margin:"6px 0",display:"flex",justifyContent:"flex-start"}}>
      <button onClick={(e)=>{e.stopPropagation(); onOpen && onOpen();}}
        style={{maxWidth:"88%",background:"#f0ebff",borderLeft:`3px solid #7c5cff`,border:`1px solid #7c5cff15`,borderLeftWidth:3,padding:"10px 14px",borderRadius:"0 12px 12px 0",fontSize:13,lineHeight:1.55,color:"#2a1e4a",textAlign:"left",cursor:"pointer",display:"block"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8}}>
          <div style={{fontWeight:700,marginBottom:3,fontSize:12.5}}>{label}</div>
          <div style={{fontSize:10.5,color:"#7c5cff",fontWeight:600,flexShrink:0}}>详情 ›</div>
        </div>
        <div style={{display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical",overflow:"hidden"}}>{text}</div>
      </button>
    </div>
  );
}

function ChoiceDock({ options, onPick, isGroup }){
  return (
    <div className="anim-slide" style={{background:"#fff",borderTop:"1px solid #e5e5e5",padding:"10px 14px",paddingBottom:"max(10px,env(safe-area-inset-bottom))"}}>
      <div style={{fontSize:11,color:"#999",marginBottom:8,letterSpacing:1}}>{isGroup ? "群里你想说" : "选择一条回复"}</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {options.map((o,i)=>(
          <button key={i} onClick={()=>onPick(i)}
            style={{textAlign:"left",background:"#f2f2f7",border:"1px solid #e5e5e5",padding:"10px 14px",borderRadius:14,fontSize:14,color:"#222",cursor:"pointer"}}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

function GroupInputDock({ color, members, onSend, busy }){
  const [text, setText] = useState("");
  const [mention, setMention] = useState(null);
  const [picker, setPicker] = useState(false);
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const v = e.target.value;
    setText(v);
    if (v.endsWith('@') && !mention) setPicker(true);
  };

  const pickMember = (m) => {
    setMention(m);
    setText(t => t.replace(/@\s*$/, ''));
    setPicker(false);
    setTimeout(()=>inputRef.current?.focus(), 0);
  };

  const clearMention = (e) => { e?.stopPropagation?.(); setMention(null); };

  const send = async () => {
    const t = text.trim();
    if (!t || busy) return;
    const payload = mention ? `@${mention.nameZh} ${t}` : t;
    const mId = mention?.id || null;
    setText("");
    setMention(null);
    setPicker(false);
    await onSend(payload, mId);
  };

  return (
    <div style={{background:"#fff",borderTop:"1px solid #e5e5e5",padding:"8px 12px",paddingBottom:"max(10px,env(safe-area-inset-bottom))"}}>
      {picker && (
        <div className="anim-fade no-scrollbar" style={{display:"flex",gap:6,overflowX:"auto",padding:"4px 2px 8px"}}>
          {members.map(m=>(
            <button key={m.id} onClick={()=>pickMember(m)}
              style={{flexShrink:0,display:"flex",alignItems:"center",gap:6,background:`${m.color}14`,border:`1px solid ${m.color}44`,padding:"5px 10px 5px 5px",borderRadius:999,cursor:"pointer"}}>
              <span style={{width:22,height:22,borderRadius:"50%",background:m.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12}}>{m.emoji}</span>
              <span style={{fontSize:12.5,color:m.color,fontWeight:600,whiteSpace:"nowrap"}}>{m.nameZh}</span>
            </button>
          ))}
        </div>
      )}
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <button onClick={()=>setPicker(p=>!p)} aria-label="@ 某人"
          style={{border:"none",background:picker?`${color}18`:"transparent",color:picker?color:"#888",fontSize:20,cursor:"pointer",width:36,height:36,borderRadius:"50%",flexShrink:0,fontWeight:600}}>@</button>
        <div style={{flex:1,display:"flex",alignItems:"center",gap:6,background:"#f2f2f7",borderRadius:22,padding:"3px 10px",minHeight:40}}>
          {mention && (
            <button onClick={clearMention}
              style={{display:"inline-flex",alignItems:"center",gap:4,background:mention.color,color:"#fff",border:"none",padding:"3px 8px 3px 6px",borderRadius:12,fontSize:12,cursor:"pointer",flexShrink:0}}>
              <span>@{mention.nameZh}</span>
              <span style={{opacity:.8,marginLeft:2}}>✕</span>
            </button>
          )}
          <input ref={inputRef} value={text} onChange={handleChange}
            onKeyDown={e=>{ if (e.key==='Enter') send(); }} disabled={busy}
            placeholder={mention ? `问 ${mention.nameZh}…` : '在群里说点什么…'}
            style={{flex:1,border:"none",outline:"none",background:"transparent",padding:"8px 4px",fontSize:14,minWidth:0}}/>
        </div>
        <button onClick={send} disabled={busy||!text.trim()}
          style={{background:color,color:"#fff",border:"none",borderRadius:"50%",width:40,height:40,fontSize:18,cursor:"pointer",opacity:(busy||!text.trim())?.4:1,flexShrink:0}}>↑</button>
      </div>
    </div>
  );
}

function AskDock({ char, charId, color }){
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [busy, setBusy] = useState(false);

  const runAsk = async (q) => {
    setMsgs(m=>[...m,{mine:true,text:q}]);
    setInput("");
    setBusy(true);
    const system = `你现在扮演${char.nameZh} (${char.name})，${char.title}。性格：${char.tagline}。用第一人称回答，保持角色声音（${char.nameZh}独有的语气和视角）。回答要简短（2-4 句），像在手机上发消息。可以用表情。不要说"作为 AI 助手"之类的话。只说${char.nameZh}会说的话。`;
    try {
      const txt = await askKimi({ system, user:q });
      setMsgs(m=>[...m,{mine:false,text: txt || "…我一时想不出怎么回你。"}]);
    } catch (e) {
      const text = e.message === "no-key"
        ? "自由聊天还没有开通。"
        : "消息没有送达，稍后再试一次。";
      setMsgs(m=>[...m,{system:true,text}]);
    }
    setBusy(false);
  };

  const ask = async () => {
    const q = input.trim();
    if (!q || busy) return;
    runAsk(q);
  };

  const suggestions = getSuggestions(charId);
  const askSuggestion = (q) => { if (!busy) runAsk(q); };

  if (!open){
    return (
      <div style={{background:"#fff",borderTop:"1px solid #e5e5e5",padding:"10px 14px",paddingBottom:"max(10px,env(safe-area-inset-bottom))"}}>
        <button onClick={()=>setOpen(true)} style={{width:"100%",background:"#f2f2f7",border:"none",borderRadius:22,padding:"10px 14px",textAlign:"left",fontSize:14,color:"#666",cursor:"pointer"}}>💬 问 {char.nameZh} 一个问题…</button>
      </div>
    );
  }

  return (
    <div className="anim-slide" style={{background:"#fff",borderTop:"1px solid #e5e5e5",padding:"10px 14px",paddingBottom:"max(10px,env(safe-area-inset-bottom))",maxHeight:"56vh",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <div style={{fontSize:12,color:"#999"}}>直接问 {char.nameZh}</div>
        <button onClick={()=>setOpen(false)} style={{border:"none",background:"transparent",fontSize:18,color:"#999",cursor:"pointer"}}>✕</button>
      </div>
      {msgs.length > 0 ? (
        <div className="no-scrollbar" style={{maxHeight:220,overflowY:"auto",marginBottom:8}}>
          {msgs.map((m,i)=>(
            m.system ? (
              <div key={i} style={{textAlign:"center",fontSize:11.5,color:"#a89a80",margin:"8px 0",lineHeight:1.5}}>{m.text}</div>
            ) : (
              <div key={i} style={{display:"flex",justifyContent:m.mine?"flex-end":"flex-start",margin:"3px 0"}}>
                <div style={{maxWidth:"82%",background:m.mine?color:"#f2f2f7",color:m.mine?"#fff":"#222",padding:"8px 12px",borderRadius:16,fontSize:13.5,lineHeight:1.45,whiteSpace:"pre-wrap"}}>{m.text}</div>
              </div>
            )
          ))}
          {busy && <div style={{color:"#999",fontSize:12,padding:"4px 8px"}}><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></div>}
        </div>
      ) : (
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:"#aaa",marginBottom:6,letterSpacing:.5}}>试试这些问题：</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {suggestions.map((s,i)=>(
              <button key={i} onClick={()=>askSuggestion(s)} disabled={busy}
                style={{background:`${color}12`,border:`1px solid ${color}33`,color:color,padding:"6px 12px",borderRadius:16,fontSize:12.5,cursor:"pointer",fontWeight:500}}>{s}</button>
            ))}
          </div>
        </div>
      )}
      <div style={{display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} autoFocus
          placeholder={`问 ${char.nameZh}…`}
          style={{flex:1,border:"1px solid #e5e5e5",borderRadius:22,padding:"10px 14px",fontSize:14,outline:"none",background:"#f2f2f7"}}/>
        <button onClick={ask} disabled={busy||!input.trim()}
          style={{background:color,color:"#fff",border:"none",borderRadius:"50%",width:40,height:40,fontSize:18,cursor:"pointer",opacity:busy||!input.trim()?.5:1}}>↑</button>
      </div>
    </div>
  );
}

const SUGGESTIONS = {
  michelangelo: ['你和达芬奇为什么互相看不顺眼', '西斯廷天花板你后悔画吗', '大卫真的朝罗马吗'],
  davinci:      ['你为什么左手反写', '《蒙娜丽莎》到底藏了什么', '你最得意的发明是哪个'],
  nonna:        ['最地道的 carbonara 在哪家', '游客最常犯的错是什么', '你最爱那不勒斯还是罗马'],
  maradona:     ['上帝之手你后悔吗', 'Napoli 现在怎么样了', '给那不勒斯的孩子一句话'],
  gino:         ['菠萝披萨到底怎么回事', '面团为什么要发酵 24 小时', '推荐一家不排队的 pizzeria'],
  caesar:       ['Brutus 那一刀你真的没想到吗', '斗兽场你建议先看哪里', '给当代领袖一条建议'],
  bernini:      ['怎么把大理石雕出皮肤的感觉', '你嫉妒米开朗基罗吗', '许愿池我该怎么扔硬币'],
  dante:        ['《神曲》最扎心的一句是哪句', '你恨佛罗伦萨吗', '我该先看地狱还是天堂'],
  hans:         ['多洛米蒂一日游怎么排', '游客最容易作死的是什么', '秋天去还是夏天去'],
  sophia:       ['你第一次去好莱坞是什么感觉', '意大利女人的底气是什么', '给年轻女孩一句话'],
  lorenzo:      ['你为什么资助那么多艺术家', '帕齐阴谋那天你怎么活下来的', '美第奇的钱都从哪来的'],
  marco:        ['乌菲兹必看的三幅画是哪三幅', '佛罗伦萨有什么游客不知道的角落', '你最八卦的一件事是什么'],
  miuccia:      ['丑为什么比美更有力量', '一件衣服如何成为政治声明', '你真的拿博士学位吗'],
  paolo:        ['AC 米兰和国米到底哪个强', '在米兰看球去哪家酒吧', '意大利金融圈真的很浮夸吗'],
  bruno:        ['牧羊人一年会下几次山', '你的羊认得你吗', '山里最怕什么'],
  sissi:        ['你为什么逃离维也纳', '多洛米蒂哪条小路你最爱', '皇后的自由是什么'],
  caruso:       ['第一次在大都会唱歌什么感觉', 'Sorrento 哪里能看到你当年的海', '为什么歌剧让人哭'],
  giuseppe:     ['柠檬酒家里怎么泡', 'Amalfi 海岸必吃一样是什么', '柠檬树能活多少年'],
  ferrante:     ['你为什么坚持匿名', '那不勒斯四部曲里哪个角色最像你', '真的会永远不露面吗'],
};
function getSuggestions(charId){
  return SUGGESTIONS[charId] || [
    '给我讲一个没人知道的小故事',
    '推荐一个本地人才去的地方',
    '今天如果只有 2 小时，我该去哪',
  ];
}

function Photos({ state, setState, city, onBack, tab, onTab }){
  const cityInfo = CITIES[city];
  const [preview, setPreview] = useState(null);
  const [pendingPhoto, setPendingPhoto] = useState(null);
  const [filter, setFilter] = useState('all');
  const fileRef = useRef(null);
  const myPhotos = (state.photos||[]).filter(p=>p.city===city);
  const filtered = filter==='all' ? myPhotos : myPhotos.filter(p=>p.tag===filter);

  const pickFile = (e) => {
    const f = e.target.files?.[0]; if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPendingPhoto({ url:ev.target.result });
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  const commitPhoto = (tagId) => {
    setState(s=>({...s, photos:[...(s.photos||[]), { id:Date.now(), city, url:pendingPhoto.url, tag:tagId, ts:Date.now() }]}));
    setPendingPhoto(null);
  };

  const retagPhoto = (photoId, tagId) => setState(s=>({...s, photos:(s.photos||[]).map(p=>p.id===photoId?{...p,tag:tagId}:p)}));
  const del = (id) => setState(s=>({...s, photos:(s.photos||[]).filter(p=>p.id!==id)}));

  const counts = {};
  PHOTO_TAGS.forEach(t => counts[t.id] = myPhotos.filter(p=>p.tag===t.id).length);

  return (
    <div style={{minHeight:"100vh",background:"#faf7f2",display:"flex",flexDirection:"column"}}>
      <CityHeader city={cityInfo} onBack={onBack}/>
      <Tabs tab={tab} onTab={onTab}/>
      <div style={{padding:"14px 16px 6px"}}>
        <button onClick={()=>fileRef.current?.click()} style={{width:"100%",padding:"14px",background:cityInfo.color,color:"#fff",border:"none",borderRadius:14,fontWeight:700,fontSize:15,cursor:"pointer",boxShadow:"0 4px 14px rgba(0,0,0,.08)"}}>📷 添加一张照片</button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={pickFile} style={{display:"none"}}/>
      </div>
      {myPhotos.length > 0 && (
        <div className="no-scrollbar" style={{display:"flex",gap:8,padding:"10px 16px 6px",overflowX:"auto"}}>
          <FilterChip active={filter==='all'} onClick={()=>setFilter('all')} label={`全部 ${myPhotos.length}`} color="#666"/>
          {PHOTO_TAGS.filter(t=>counts[t.id]>0).map(t=>(
            <FilterChip key={t.id} active={filter===t.id} onClick={()=>setFilter(t.id)}
              label={`${t.emoji} ${t.label} ${counts[t.id]}`} color={t.color}/>
          ))}
        </div>
      )}
      <div style={{padding:"6px 12px 30px",flex:1}}>
        {myPhotos.length === 0 ? (
          <div style={{textAlign:"center",color:"#999",padding:"40px 20px",fontSize:14,fontFamily:"'Noto Serif SC',serif",lineHeight:1.8}}>
            <div style={{fontSize:32,marginBottom:10}}>📷</div>
            还没有照片。<br/>去打卡、拍风景、记录瞬间。
          </div>
        ) : (
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
            {filtered.map(p=>(
              <div key={p.id} onClick={()=>setPreview(p)} style={{position:"relative",aspectRatio:"1",background:`url(${p.url}) center/cover,#eee`,borderRadius:10,cursor:"pointer",overflow:"hidden"}}>
                {p.tag && TAG_BY_ID[p.tag] && (
                  <div style={{position:"absolute",bottom:4,left:4,background:TAG_BY_ID[p.tag].color,color:"#fff",fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:10}}>
                    {TAG_BY_ID[p.tag].emoji} {TAG_BY_ID[p.tag].label}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      {pendingPhoto && <TagPicker photo={pendingPhoto} onPick={commitPhoto} onCancel={()=>setPendingPhoto(null)}/>}
      {preview && (
        <PhotoPreview photo={preview} onClose={()=>setPreview(null)}
          onRetag={(tagId)=>{ retagPhoto(preview.id, tagId); setPreview({...preview, tag:tagId}); }}
          onDelete={()=>{ del(preview.id); setPreview(null); }}/>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, label, color }){
  return (
    <button onClick={onClick} style={{
      flexShrink:0, border:"none", padding:"6px 12px", borderRadius:16, fontSize:12, fontWeight:700,
      cursor:"pointer", background:active?color:"#fff", color:active?"#fff":"#555",
      boxShadow:active?"none":"0 1px 3px rgba(0,0,0,.06)"
    }}>{label}</button>
  );
}

function TagPicker({ photo, onPick, onCancel }){
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",zIndex:200,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div className="anim-slide" style={{background:"#fff",borderTopLeftRadius:22,borderTopRightRadius:22,padding:"18px 18px 24px",paddingBottom:"max(18px,env(safe-area-inset-bottom))"}}>
        <div style={{display:"flex",gap:12,marginBottom:14}}>
          <img src={photo.url} style={{width:70,height:70,borderRadius:12,objectFit:"cover"}}/>
          <div style={{flex:1}}>
            <div style={{fontWeight:800,fontSize:16,fontFamily:"'Noto Serif SC',serif"}}>这张是？</div>
            <div style={{fontSize:12.5,color:"#999",marginTop:3,lineHeight:1.5}}>给它贴一个标签。留作这一路最抽象、最好吃、最破防的回忆。</div>
          </div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:10}}>
          {PHOTO_TAGS.map(t=>(
            <button key={t.id} onClick={()=>onPick(t.id)}
              style={{background:"#f7f3eb",border:"none",padding:"12px 4px",borderRadius:12,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
              <div style={{fontSize:22}}>{t.emoji}</div>
              <div style={{fontSize:12,fontWeight:700,color:t.color}}>{t.label}</div>
            </button>
          ))}
        </div>
        <button onClick={()=>onPick(null)} style={{width:"100%",background:"#f0f0f0",border:"none",padding:"10px",borderRadius:10,fontSize:13,color:"#666",cursor:"pointer",marginTop:6}}>不贴标签，直接保存</button>
        <button onClick={onCancel} style={{width:"100%",background:"transparent",border:"none",padding:"10px",fontSize:13,color:"#999",cursor:"pointer",marginTop:4}}>取消</button>
      </div>
    </div>
  );
}

function PhotoPreview({ photo, onClose, onRetag, onDelete }){
  const [showTags, setShowTags] = useState(false);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.92)",zIndex:100,display:"flex",flexDirection:"column"}}>
      <div onClick={onClose} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:20,cursor:"pointer"}}>
        <img src={photo.url} style={{maxWidth:"100%",maxHeight:"100%",borderRadius:10}} onClick={e=>e.stopPropagation()}/>
      </div>
      <div style={{background:"rgba(0,0,0,.4)",padding:"14px 20px",paddingBottom:"max(14px,env(safe-area-inset-bottom))",display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
        <button onClick={()=>setShowTags(v=>!v)} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.25)",color:"#fff",padding:"8px 16px",borderRadius:22,fontSize:13,cursor:"pointer"}}>
          🏷️ {photo.tag && TAG_BY_ID[photo.tag] ? `${TAG_BY_ID[photo.tag].emoji} ${TAG_BY_ID[photo.tag].label}` : "加标签"}
        </button>
        <button onClick={()=>{if(confirm("删除这张照片？"))onDelete();}} style={{background:"rgba(255,59,48,.85)",border:"none",color:"#fff",padding:"8px 16px",borderRadius:22,fontSize:13,cursor:"pointer"}}>🗑 删除</button>
        <button onClick={onClose} style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.25)",color:"#fff",padding:"8px 16px",borderRadius:22,fontSize:13,cursor:"pointer"}}>关闭</button>
      </div>
      {showTags && (
        <div className="anim-slide" style={{position:"absolute",bottom:70,left:10,right:10,background:"#fff",borderRadius:16,padding:14,maxHeight:"50vh",overflowY:"auto"}}>
          <div style={{fontSize:12,color:"#999",marginBottom:8,textAlign:"center"}}>选一个标签</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
            {PHOTO_TAGS.map(t=>(
              <button key={t.id} onClick={()=>{onRetag(t.id);setShowTags(false);}}
                style={{background:photo.tag===t.id?t.color:"#f7f3eb",color:photo.tag===t.id?"#fff":t.color,border:"none",padding:"10px 4px",borderRadius:10,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontSize:11,fontWeight:700}}>
                <div style={{fontSize:18}}>{t.emoji}</div>
                {t.label}
              </button>
            ))}
          </div>
          {photo.tag && <button onClick={()=>{onRetag(null);setShowTags(false);}} style={{width:"100%",marginTop:8,background:"transparent",border:"1px solid #eee",padding:"8px",borderRadius:8,fontSize:12,color:"#999",cursor:"pointer"}}>移除标签</button>}
        </div>
      )}
    </div>
  );
}

function Tasks({ state, city, onBack, tab, onTab, onOpenChar }){
  const cityInfo = CITIES[city];
  const chars = charactersInCity(city);
  const allTasks = [];
  chars.forEach(c => {
    const convo = CONVERSATIONS[c.id] || [];
    convo.forEach(m => {
      if (m.t === 'task') allTasks.push({ charId:c.id, char:c, task:m });
    });
  });
  const done = state.tasksDone || {};
  const doneCount = allTasks.filter(t => done[t.charId]).length;

  return (
    <div style={{minHeight:"100vh",background:"#faf7f2",display:"flex",flexDirection:"column"}}>
      <CityHeader city={cityInfo} onBack={onBack}/>
      <Tabs tab={tab} onTab={onTab}/>
      <div style={{padding:"20px 20px 10px"}}>
        <div style={{fontSize:11,letterSpacing:3,color:"#8a6f47",fontWeight:700}}>OBSERVATIONS</div>
        <div style={{fontFamily:"'Noto Serif SC',serif",fontSize:15,fontWeight:700,marginTop:2,marginBottom:10,color:"#2a1e10"}}>你抬头看了多少次</div>
        <div style={{fontSize:26,fontWeight:800,color:cityInfo.color,fontFamily:"'Playfair Display',serif"}}>{doneCount} <span style={{fontSize:16,color:"#999",fontWeight:500}}>/ {allTasks.length}</span></div>
        <div style={{height:6,background:"#eee",borderRadius:3,marginTop:8,overflow:"hidden"}}>
          <div style={{width:`${allTasks.length?doneCount/allTasks.length*100:0}%`,height:"100%",background:cityInfo.color,transition:"width .4s"}}/>
        </div>
      </div>
      <div style={{padding:"10px 16px 30px"}}>
        {allTasks.map((t,i)=>{
          const isDone = !!done[t.charId];
          return (
            <button key={i} onClick={()=>onOpenChar(t.charId)}
              style={{width:"100%",border:"none",background:isDone?"#e8f5e9":"#f7f7f7",padding:"12px 14px",marginBottom:8,borderRadius:12,display:"flex",gap:10,alignItems:"center",textAlign:"left",cursor:"pointer"}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:t.char.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>{t.char.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:11,color:"#999"}}>{t.char.nameZh}</div>
                <div style={{fontWeight:700,fontSize:14,marginTop:2}}>{t.task.title}</div>
              </div>
              <div style={{fontSize:22}}>{isDone?"✅":"○"}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CharacterProfileSheet({ charId, onClose, onOpenChat, alreadyInChat, photos, onOpenGallery }){
  if (!charId) return null;
  const c = CHARACTERS[charId];
  if (!c) return null;
  const city = CITIES[c.city];
  const convo = CONVERSATIONS[charId] || [];
  const hasTask = convo.some(m => m.t === 'task');
  const hasSecret = convo.some(m => m.t === 'secret');
  const groupIn = Object.entries(GROUPS).filter(([_,g])=>g.members.includes(charId)).map(([_,g])=>g.name);
  const characterPhotos = (photos || []).filter(p => p.charId === charId);
  const cityPhotos = (photos || []).filter(p => p.city === c.city);
  const displayPhotos = characterPhotos.length > 0 ? characterPhotos : cityPhotos;
  const photoTitle = characterPhotos.length > 0 ? "你和 TA 的合影 / 打卡" : `${city.nameZh} 的照片`;
  const bio = c.bio || c.tagline || '';
  const wiki = c.wiki;
  const fun = c.funFacts || [];

  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:150,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} className="anim-slide" style={{background:"#fff",borderTopLeftRadius:22,borderTopRightRadius:22,maxHeight:"88vh",overflowY:"auto",paddingBottom:"max(18px,env(safe-area-inset-bottom))"}}>
        <div style={{position:"relative",padding:"26px 22px 16px",background:`linear-gradient(180deg,${c.color}22 0%,#fff 100%)`,borderTopLeftRadius:22,borderTopRightRadius:22}}>
          <button onClick={onClose} style={{position:"absolute",top:14,right:14,border:"none",background:"rgba(0,0,0,.08)",width:30,height:30,borderRadius:"50%",fontSize:16,color:"#666",cursor:"pointer"}}>✕</button>
          <div style={{display:"flex",alignItems:"center",gap:16}}>
            <div style={{width:72,height:72,borderRadius:"50%",background:c.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:34,boxShadow:`0 6px 20px ${c.color}55`}}>{c.emoji}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'Noto Serif SC',serif",fontWeight:800,fontSize:22,color:"#1a1a1a"}}>{c.nameZh}</div>
              <div style={{fontSize:13,color:"#888",fontStyle:"italic",marginTop:2}}>{c.name}</div>
              <div style={{fontSize:12.5,color:c.color,fontWeight:600,marginTop:4}}>{c.title}</div>
              <div style={{fontSize:11,color:"#9a8a6a",marginTop:4}}>📍 {city.emoji} {city.nameZh} · {city.en}</div>
            </div>
          </div>
        </div>

        <div style={{padding:"4px 22px 10px"}}>
          <div style={{fontSize:11,letterSpacing:2,color:"#999",fontWeight:700,marginBottom:6}}>TA 是谁</div>
          <div style={{fontSize:14.5,lineHeight:1.65,color:"#2a2a2a",fontFamily:"'Noto Serif SC',serif",whiteSpace:"pre-wrap"}}>{bio}</div>
          {fun.length > 0 && (
            <div style={{marginTop:10,padding:"10px 12px",background:`${c.color}0c`,border:`1px dashed ${c.color}40`,borderRadius:12}}>
              {fun.map((f,i)=>(
                <div key={i} style={{fontSize:12.5,color:"#3a2f1e",lineHeight:1.5,paddingLeft:14,position:"relative",marginTop:i===0?0:4}}>
                  <span style={{position:"absolute",left:0,top:0,color:c.color}}>·</span>{f}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{padding:"4px 22px 10px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:8}}>
            <div style={{fontSize:11,letterSpacing:2,color:"#999",fontWeight:700}}>{photoTitle}</div>
            {displayPhotos.length > 3 && <button onClick={()=>onOpenGallery && onOpenGallery(charId)} style={{border:"none",background:"transparent",color:c.color,fontSize:11.5,fontWeight:700,cursor:"pointer"}}>看全部 ›</button>}
          </div>
          {displayPhotos.length === 0 ? (
            <div style={{padding:"18px 14px",background:"#faf7f0",border:`1px dashed ${c.color}40`,borderRadius:12,textAlign:"center"}}>
              <div style={{fontSize:26,marginBottom:6,opacity:.5}}>📷</div>
              <div style={{fontSize:12.5,color:"#8a6e3f",lineHeight:1.5}}>还没有照片<br/>去相册记录这座城市的一瞬间</div>
            </div>
          ) : (
            <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:4}} className="no-scrollbar">
              {displayPhotos.slice(0,6).map((p,i)=>(
                <div key={i} style={{flexShrink:0,width:96,height:96,borderRadius:12,overflow:"hidden",background:`${c.color}22`,border:`1px solid ${c.color}33`,position:"relative"}}>
                  {p.url
                    ? <img src={p.url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                    : <div style={{width:"100%",height:"100%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>{c.emoji}</div>}
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{padding:"0 22px 4px",display:"flex",flexWrap:"wrap",gap:6}}>
          {hasTask && <Tag color="#e67e22" emoji="📸" label="有打卡任务"/>}
          {hasSecret && <Tag color="#8e44ad" emoji="🔒" label="有隐藏秘密"/>}
          {groupIn.map((gn,i)=><Tag key={i} color="#B8860B" emoji="👥" label={gn}/>)}
          {c.domain && <Tag color={c.color} emoji="🎯" label={c.domain}/>}
        </div>

        {wiki && (
          <div style={{padding:"10px 22px 0"}}>
            <a href={wiki} target="_blank" rel="noreferrer"
               style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#f5f1e8",border:"1px solid #e4d9bf",borderRadius:12,textDecoration:"none",color:"#3a2f1e"}}>
              <span style={{fontSize:18}}>📚</span>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:700}}>Wikipedia</div>
                <div style={{fontSize:11,color:"#8a6e3f",wordBreak:"break-all"}}>{wiki.replace(/^https?:\/\//,'')}</div>
              </div>
              <span style={{fontSize:14,color:"#8a6e3f"}}>↗</span>
            </a>
          </div>
        )}

        <div style={{padding:"14px 22px 8px",display:"flex",gap:8}}>
          {!alreadyInChat && (
            <button onClick={()=>{onOpenChat(charId); onClose();}}
              style={{flex:1,background:c.color,color:"#fff",border:"none",padding:"12px",borderRadius:14,fontWeight:700,fontSize:14,cursor:"pointer"}}>💬 打开聊天</button>
          )}
          <button onClick={onClose}
            style={{flex:alreadyInChat?1:"0 0 auto",background:"#f2f2f7",color:"#555",border:"none",padding:"12px 18px",borderRadius:14,fontWeight:600,fontSize:14,cursor:"pointer"}}>
            {alreadyInChat?"回到聊天":"关闭"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }){
  return (
    <div style={{background:"#faf7f2",borderRadius:12,padding:"10px 8px",textAlign:"center"}}>
      <div style={{fontSize:10,letterSpacing:1.5,color:"#999",fontWeight:600}}>{label}</div>
      <div style={{fontSize:13,color:color,fontWeight:700,marginTop:4,fontFamily:"'Noto Serif SC',serif"}}>{value}</div>
    </div>
  );
}

function Tag({ color, emoji, label }){
  return (
    <div style={{background:`${color}15`,color:color,fontSize:11.5,padding:"4px 10px",borderRadius:12,fontWeight:600,border:`1px solid ${color}33`}}>{emoji} {label}</div>
  );
}

function WikiCard({ wiki, accent }){
  if (!wiki) return null;
  return (
    <a href={wiki} target="_blank" rel="noreferrer"
       style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:"#f5f1e8",border:"1px solid #e4d9bf",borderRadius:12,textDecoration:"none",color:"#3a2f1e",marginTop:12}}>
      <span style={{fontSize:18}}>📚</span>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:700,color:accent||"#8a6f47"}}>Wikipedia</div>
        <div style={{fontSize:11,color:"#8a6e3f",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{wiki.replace(/^https?:\/\//,'')}</div>
      </div>
      <span style={{fontSize:14,color:"#8a6e3f"}}>↗</span>
    </a>
  );
}

function ArtworkDetailSheet({ msg, onClose }){
  if (!msg) return null;
  const kind = msg.t;
  const isArtwork = kind === 'artwork';
  const isTip = kind === 'tip';
  const accent = isArtwork ? '#b8860b' : (isTip ? '#c9a55b' : '#7c5cff');
  const bg = isArtwork ? '#faf7f2' : (isTip ? '#f5f1e8' : '#f0ebff');
  const label = isArtwork ? msg.title : (msg.label || (isTip ? '实用小贴士' : '文艺彩蛋'));
  const kindLabel = isArtwork ? 'ARTWORK · 作品卡' : (isTip ? 'TIP · 小贴士' : 'REFERENCE · 彩蛋');
  const firstEmoji = !isArtwork ? ((msg.label || '').match(/^\p{Extended_Pictographic}/u) || [])[0] || (isTip ? '💡' : '✨') : null;

  const factPairs = [];
  if (isArtwork){
    if (msg.year)    factPairs.push(['年代', msg.year]);
    if (msg.artist)  factPairs.push(['作者', msg.artist]);
    if (msg.medium)  factPairs.push(['材质', msg.medium]);
    if (msg.size)    factPairs.push(['尺寸', msg.size]);
  }

  return (
    <div onClick={onClose}
      style={{position:"fixed",inset:0,background:"rgba(0,0,0,.55)",zIndex:150,display:"flex",flexDirection:"column",justifyContent:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} className="anim-slide"
        style={{background:"#fff",borderTopLeftRadius:22,borderTopRightRadius:22,maxHeight:"92vh",display:"flex",flexDirection:"column",overflow:"hidden",position:"relative",boxShadow:"0 -12px 40px rgba(0,0,0,.18)"}}>

        <div style={{position:"sticky",top:0,zIndex:5,display:"flex",alignItems:"center",justifyContent:"center",paddingTop:8,paddingBottom:4,background:"#fff"}}>
          <div style={{width:40,height:4,borderRadius:2,background:"#d8cfbd"}}/>
          <button onClick={onClose} aria-label="关闭"
            style={{position:"absolute",top:10,right:12,border:"none",background:"rgba(255,255,255,.95)",width:32,height:32,borderRadius:"50%",fontSize:15,color:"#333",cursor:"pointer",boxShadow:"0 2px 8px rgba(0,0,0,.12)"}}>✕</button>
        </div>

        <div style={{flex:1,overflowY:"auto"}}>
          {msg.image ? (
            <div style={{height: isArtwork ? "34vh" : "24vh",background:"#1a1a1a",overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <img src={msg.image} alt={label}
                   style={{maxWidth:"100%",maxHeight:"100%",objectFit: isArtwork ? "contain" : "cover",width:"100%",height:"100%"}}
                   onError={(e)=>{ e.currentTarget.style.display='none'; }}/>
            </div>
          ) : !isArtwork ? (
            <div style={{height:120,background:`linear-gradient(135deg,${accent}22,${accent}08)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:56}}>{firstEmoji}</div>
          ) : null}

          <div style={{padding:"16px 22px 10px"}}>
            <div style={{fontSize:10.5,letterSpacing:3,color:accent,fontWeight:700,marginBottom:6}}>{kindLabel}</div>
            <div style={{fontFamily: isArtwork ? "'Playfair Display',serif" : CN_SERIF, fontSize: isArtwork ? 26 : 20, fontWeight:800,lineHeight:1.2,color:"#1a1a1a"}}>{label}</div>
            {isArtwork && msg.nameIt && <div style={{fontSize:13,color:"#9a8a6a",fontStyle:"italic",marginTop:2}}>{msg.nameIt}</div>}
            {isArtwork && msg.location && <div style={{fontSize:13,color:"#8a6f47",fontWeight:600,marginTop:6}}>📍 {msg.location}</div>}

            {isArtwork && factPairs.length > 0 && (
              <div style={{marginTop:14,display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:8}}>
                {factPairs.map(([k,v],i)=>(
                  <div key={i} style={{padding:"8px 10px",background:"#f7f3eb",borderRadius:10}}>
                    <div style={{fontSize:10,letterSpacing:1.5,color:"#a8792a",fontWeight:700}}>{k}</div>
                    <div style={{fontSize:13,color:"#2a1e10",fontWeight:600,marginTop:2}}>{v}</div>
                  </div>
                ))}
              </div>
            )}

            {isArtwork && msg.why && (
              <div style={{marginTop:16,padding:"14px 16px",background:"#faf7f2",borderRadius:12,fontSize:14.5,lineHeight:1.65,color:"#2a1e10",fontFamily:CN_SERIF}}>
                <div style={{fontSize:11,letterSpacing:2,color:"#8a6f47",fontWeight:700,marginBottom:6}}>为什么重要</div>
                {msg.why}
              </div>
            )}
            {isArtwork && msg.story && (
              <div style={{marginTop:12,padding:"14px 16px",background:"#fff",border:"1px solid #eadfc2",borderRadius:12,fontSize:14,lineHeight:1.65,color:"#3a2f1e",fontFamily:CN_SERIF}}>
                <div style={{fontSize:11,letterSpacing:2,color:"#8a6f47",fontWeight:700,marginBottom:6}}>📖 幕后故事</div>
                {msg.story}
              </div>
            )}
            {isArtwork && msg.observe && (
              <div style={{marginTop:12,padding:"14px 16px",background:"#fffbee",borderLeft:"3px solid #d4a574",borderRadius:"0 12px 12px 0",fontSize:14,lineHeight:1.65,color:"#5a4a1a",fontFamily:CN_SERIF}}>
                <div style={{fontSize:11,letterSpacing:2,color:"#a8792a",fontWeight:700,marginBottom:6}}>👁️ 现场怎么看</div>
                {msg.observe}
              </div>
            )}
            {isArtwork && Array.isArray(msg.lookAt) && msg.lookAt.length > 0 && (
              <div style={{marginTop:12,padding:"14px 16px",background:"#f4efe3",borderRadius:12,fontSize:13.5,lineHeight:1.6,color:"#3a2f1e",fontFamily:CN_SERIF}}>
                <div style={{fontSize:11,letterSpacing:2,color:"#8a6f47",fontWeight:700,marginBottom:8}}>🔍 三个细节不要错过</div>
                {msg.lookAt.map((item,i)=>(
                  <div key={i} style={{display:"flex",gap:10,marginTop:i===0?0:6}}>
                    <div style={{flexShrink:0,width:22,height:22,borderRadius:"50%",background:"#8a6f47",color:"#fff",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center"}}>{i+1}</div>
                    <div style={{flex:1}}>{item}</div>
                  </div>
                ))}
              </div>
            )}
            {isArtwork && msg.ticket && (
              <div style={{marginTop:12,padding:"12px 14px",background:"#eef6ff",border:"1px solid #cfe1ff",borderRadius:12,fontSize:12.5,lineHeight:1.55,color:"#1a3a6a"}}>
                <div style={{fontSize:10.5,letterSpacing:2,color:"#4a6aa8",fontWeight:700,marginBottom:4}}>🎫 实用信息</div>
                {msg.ticket}
              </div>
            )}
            {isArtwork && msg.quote && (
              <div style={{marginTop:14,padding:"12px 16px",background:"#fff",borderLeft:"3px solid #c9a55b",fontStyle:"italic",fontFamily:CN_SERIF,fontSize:14,lineHeight:1.6,color:"#3a2f1e"}}>
                「{msg.quote}」
                {msg.quoteBy && <div style={{fontStyle:"normal",fontSize:11.5,color:"#8a6f47",marginTop:4}}>— {msg.quoteBy}</div>}
              </div>
            )}

            {!isArtwork && (
              <div style={{marginTop:14,padding:"16px 18px",background:bg,borderLeft:`4px solid ${accent}`,borderRadius:"0 14px 14px 0",fontSize:15,lineHeight:1.7,color:"#2a1e10",whiteSpace:"pre-wrap",fontFamily:CN_SERIF}}>{msg.text}</div>
            )}

            <WikiCard wiki={msg.wiki} accent={accent}/>
          </div>
        </div>

        <div style={{padding:"10px 18px",paddingBottom:"max(14px,env(safe-area-inset-bottom))",background:"#fff",borderTop:"1px solid #f0ebe0"}}>
          <button onClick={onClose}
            style={{width:"100%",padding:"12px",background:"#f2f2f7",color:"#333",border:"none",borderRadius:12,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:CN_SERIF}}>
            {isArtwork ? '收起 · 继续聊天' : '关闭'}
          </button>
        </div>

      </div>
    </div>
  );
}

export default function App(){
  const [state, _setState] = useState(load);
  const setState = useCallback((updater)=>{
    _setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      save(next);
      return next;
    });
  }, []);

  const [city, setCity] = useState(state.city);
  const [charId, setCharId] = useState(null);
  const [groupId, setGroupId] = useState(null);
  const [tab, setTab] = useState('chats');
  const [profileCharId, setProfileCharId] = useState(null);
  const [sheetMsg, setSheetMsg] = useState(null);

  useEffect(()=>{
    const link = document.createElement('link'); link.rel='stylesheet'; link.href=FONT; document.head.appendChild(link);
    const style = document.createElement('style'); style.innerHTML=CSS; document.head.appendChild(style);
  }, []);

  useEffect(()=>{ setState(s=>({...s, city})); }, [city]);

  const openProfile = (id) => setProfileCharId(id);
  const closeProfile = () => setProfileCharId(null);
  const openSheet = (msg) => setSheetMsg(msg);
  const closeSheet = () => setSheetMsg(null);

  const sheets = (
    <>
      <CharacterProfileSheet charId={profileCharId} onClose={closeProfile}
        onOpenChat={(id)=>{ setCharId(id); setGroupId(null); }}
        photos={state.photos || []}
        onOpenGallery={()=>{ setProfileCharId(null); setTab('photos'); }}
        alreadyInChat={!!charId && profileCharId === charId}/>
      <ArtworkDetailSheet msg={sheetMsg} onClose={closeSheet}/>
    </>
  );

  if (!city) return <>
    <Welcome onPick={(c)=>{ setCity(c); setTab('chats'); setCharId(null); setGroupId(null); }}/>
    {sheets}
  </>;

  if (charId || groupId){
    return <>
      <Chat charId={charId} groupId={groupId} state={state} setState={setState}
        onBack={()=>{ setCharId(null); setGroupId(null); }}
        onOpenProfile={openProfile} onOpenArtwork={openSheet}/>
      {sheets}
    </>;
  }

  const backToCities = () => { setCity(null); setCharId(null); setGroupId(null); };

  if (tab === 'photos') return <>
    <Photos state={state} setState={setState} city={city} onBack={backToCities} tab={tab} onTab={setTab}/>
    {sheets}
  </>;
  if (tab === 'tasks') return <>
    <Tasks state={state} city={city} onBack={backToCities} tab={tab} onTab={setTab} onOpenChar={setCharId}/>
    {sheets}
  </>;
  return <>
    <ChatList city={city} state={state} onOpen={setCharId} onOpenGroup={setGroupId}
      onBack={backToCities} tab={tab} onTab={setTab} onOpenProfile={openProfile}/>
    {sheets}
  </>;
}
