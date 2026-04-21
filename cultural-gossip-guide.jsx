import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { PHOTOS, CITIES } from "./data.js";
import { CHARACTERS, CONVERSATIONS, charactersInCity, getPreview } from "./conversations.js";

/* ═══════════════════════════════════════════
   CULTURA SEGRETA v10 — iMessage edition
   17 characters · 6 cities · 200+ beats
   ═══════════════════════════════════════════ */

const FONT = "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&family=Playfair+Display:ital,wght@0,400;0,800;1,400;1,800&family=Inter:wght@400;500;600;700&display=swap";
const API_KEY = "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";

const CSS = `
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased}
body{margin:0;background:#fff;font-family:'Inter','Noto Serif SC',sans-serif;color:#1a1a1a;overscroll-behavior-y:none}
input::placeholder{color:#b0b0b0}
::-webkit-scrollbar{width:0;height:0}
img{-webkit-user-drag:none;user-select:none}
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes popIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:scale(1)}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes typingBounce{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-4px);opacity:1}}
@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
@keyframes taskDone{0%{transform:scale(1)}50%{transform:scale(1.05)}100%{transform:scale(1)}}
.anim-up{animation:fadeUp .35s ease both}
.anim-pop{animation:popIn .3s ease both}
.anim-slide{animation:slideUp .3s ease both}
.no-scrollbar::-webkit-scrollbar{display:none}
.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
button{font-family:inherit;cursor:pointer}
.typing-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#999;margin:0 1px;animation:typingBounce 1.2s infinite}
.typing-dot:nth-child(2){animation-delay:.15s}.typing-dot:nth-child(3){animation-delay:.3s}
`;

// ═══ Photo tags ═══
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

// ═══ Persistence ═══
function load(){
  try { const s = localStorage.getItem("cs_v10"); if (s) return JSON.parse(s); } catch {}
  return { progress:{}, choices:{}, tasksDone:{}, photos:[], city:null };
}
function save(s){ try { localStorage.setItem("cs_v10", JSON.stringify(s)); } catch {} }

// ═══════════════════════════════
// Welcome / City Picker
// ═══════════════════════════════
function Welcome({ onPick }){
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#faf7f2 0%,#fff 60%)"}}>
      <div style={{maxWidth:720,margin:"0 auto",padding:"60px 20px 40px"}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontSize:13,letterSpacing:4,color:"#8a6f47",fontWeight:600,marginBottom:8}}>CULTURA SEGRETA</div>
          <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:42,fontWeight:800,margin:"0 0 10px",lineHeight:1.1}}>意大利的秘密<br/>就藏在本地人的手机里</h1>
          <p style={{color:"#666",fontSize:15,lineHeight:1.6,margin:"16px auto 0",maxWidth:440}}>米开朗基罗、达芬奇、Lucia 奶奶和 Maradona 给你发消息了。聊天记录里藏着这座国家真正的打开方式。</p>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,marginTop:24}}>
          {Object.entries(CITIES).map(([id,c])=>(
            <button key={id} onClick={()=>onPick(id)}
              style={{position:"relative",border:"none",borderRadius:18,overflow:"hidden",aspectRatio:"1/1.1",padding:0,cursor:"pointer",background:"#222",color:"#fff"}}>
              <img src={PHOTOS[id]} alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:.7}}/>
              <div style={{position:"absolute",inset:0,background:`linear-gradient(180deg,transparent 40%,${c.color}dd 100%)`}}/>
              <div style={{position:"absolute",bottom:14,left:14,right:14,textAlign:"left"}}>
                <div style={{fontSize:24}}>{c.emoji}</div>
                <div style={{fontWeight:800,fontSize:18,fontFamily:"'Noto Serif SC',serif",marginTop:4}}>{c.nameZh}</div>
                <div style={{fontSize:11,opacity:.85,letterSpacing:1}}>{c.en.toUpperCase()}</div>
                <div style={{fontSize:11,opacity:.85,marginTop:6}}>{charactersInCity(id).length} 人在线</div>
              </div>
            </button>
          ))}
        </div>
        <div style={{textAlign:"center",fontSize:11,color:"#aaa",marginTop:40}}>v10 · iMessage edition</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════
// Chat List (inbox)
// ═══════════════════════════════
function ChatList({ city, state, onOpen, onBack, onTab, tab }){
  const chars = charactersInCity(city);
  const cityInfo = CITIES[city];
  const unread = (id) => {
    const total = (CONVERSATIONS[id]||[]).length;
    const seen = state.progress[id] || 0;
    return Math.max(0, total - seen);
  };
  return (
    <div style={{minHeight:"100vh",background:"#faf7f2",display:"flex",flexDirection:"column"}}>
      <CityHeader city={cityInfo} onBack={onBack}/>
      <Tabs tab={tab} onTab={onTab}/>
      <div style={{padding:"18px 20px 6px"}}>
        <div style={{fontSize:11,letterSpacing:3,color:"#8a6f47",fontWeight:700}}>LETTERS FROM LOCALS</div>
        <div style={{fontFamily:"'Noto Serif SC',serif",fontSize:17,fontWeight:700,marginTop:2,color:"#2a1e10"}}>他们想跟你说几件事</div>
      </div>
      <div style={{flex:1,padding:"4px 12px 20px"}}>
        {chars.map(c => {
          const u = unread(c.id);
          const preview = getPreview(c.id);
          return (
            <button key={c.id} onClick={()=>onOpen(c.id)}
              style={{width:"100%",border:"none",background:"#fff",padding:"14px 16px",marginBottom:8,borderRadius:16,display:"flex",gap:12,alignItems:"center",textAlign:"left",cursor:"pointer",boxShadow:"0 1px 4px rgba(60,40,20,.05)"}}>
              <div style={{width:54,height:54,borderRadius:"50%",background:c.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,boxShadow:`0 4px 12px ${c.color}55`}}>{c.emoji}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8}}>
                  <div style={{fontFamily:"'Noto Serif SC',serif",fontWeight:700,fontSize:16.5,color:"#1a1a1a"}}>{c.nameZh}</div>
                  <div style={{fontSize:10.5,color:c.color,flexShrink:0,fontWeight:600,letterSpacing:.5}}>{c.tagline}</div>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:5,gap:8}}>
                  <div style={{color:"#7a6a54",fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,fontStyle:"italic"}}>"{preview}"</div>
                  {u > 0 && <div style={{background:"#d94f3a",color:"#fff",fontSize:11,fontWeight:700,borderRadius:12,padding:"2px 8px",minWidth:22,textAlign:"center"}}>{u}</div>}
                </div>
              </div>
            </button>
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

// ═══════════════════════════════
// Chat (conversation)
// ═══════════════════════════════
function Chat({ charId, state, setState, onBack }){
  const char = CHARACTERS[charId];
  const convo = CONVERSATIONS[charId] || [];
  const cityColor = CITIES[char.city].color;

  // user choices: { msgIndex: optionIndex }
  const myChoices = state.choices[charId] || {};

  // build display list, expanding choices
  const display = useMemo(()=>{
    const out = [];
    for (let i=0; i<convo.length; i++){
      const m = convo[i];
      if (m.t === 'choice'){
        const picked = myChoices[i];
        if (picked != null){
          out.push({ t:'text', mine:true, text:m.options[picked].label, _k:`c${i}u` });
          out.push({ t:'text', text:m.options[picked].reply, _k:`c${i}r` });
        } else {
          out.push({ t:'choice', options:m.options, _idx:i, _k:`c${i}` });
          break; // stop at unanswered choice
        }
      } else {
        out.push({ ...m, _k:`m${i}`, _idx:i });
      }
    }
    return out;
  }, [convo, myChoices]);

  const taskDone = !!state.tasksDone[charId];

  // revealed: how many display items are visible
  const savedProg = state.progress[charId] || 1;
  const [revealed, setRevealed] = useState(Math.min(savedProg, display.length));
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);

  // keep revealed at least 1, and cap to display.length
  useEffect(()=>{
    if (revealed > display.length) setRevealed(display.length);
    if (revealed < 1) setRevealed(1);
  }, [display.length]);

  // auto-advance with pacing (slower, leave reading time)
  useEffect(()=>{
    if (revealed >= display.length) return;
    const next = display[revealed];
    if (!next) return;
    if (next.t === 'choice') return; // user must pick
    if (next.t === 'secret' && !taskDone) return;
    const prev = display[revealed-1];
    const prevIsCard = prev && (prev.t==='artwork'||prev.t==='ref'||prev.t==='tip'||prev.t==='task');
    let delay;
    if (next.mine) delay = 450;
    else if (next.t === 'text') {
      const len = (next.text||'').length;
      // ~3-4 Chinese chars per second reading, plus 1s "read and digest"
      delay = 1100 + Math.min(2600, len * 55);
    }
    else if (next.t === 'artwork') delay = 2000;
    else if (next.t === 'ref' || next.t === 'tip') delay = 1500;
    else if (next.t === 'task') delay = 1600;
    else delay = 1200;
    if (prevIsCard) delay += 1200;  // extra pause after visual cards
    setTyping(!next.mine && next.t === 'text');
    const timer = setTimeout(()=>{
      setTyping(false);
      setRevealed(r=>r+1);
    }, delay);
    return ()=>clearTimeout(timer);
  }, [revealed, display.length, taskDone]);

  // persist progress
  useEffect(()=>{
    setState(s=>{
      const prog = {...s.progress, [charId]:revealed};
      return { ...s, progress:prog };
    });
  }, [revealed, charId]);

  // scroll to bottom
  useEffect(()=>{
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [revealed, typing]);

  const pickChoice = (msgIdx, optIdx) => {
    setState(s=>({ ...s, choices:{ ...s.choices, [charId]:{...(s.choices[charId]||{}), [msgIdx]:optIdx} }}));
    setRevealed(r=>r+2); // user bubble + char reply auto-reveal
  };

  const completeTask = () => {
    setState(s=>({ ...s, tasksDone:{...s.tasksDone, [charId]:Date.now()} }));
  };

  const items = display.slice(0, revealed);
  const last = display[revealed-1];
  const atChoice = last && last.t === 'choice';
  const atLockedSecret = revealed < display.length && display[revealed]?.t === 'secret' && !taskDone;
  const finished = revealed >= display.length;

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100vh",background:"#f5f0e4"}}>
      <ChatHeader char={char} color={cityColor} onBack={onBack}/>
      <div ref={scrollRef} className="no-scrollbar" style={{flex:1,overflowY:"auto",padding:"14px 14px 20px"}}
           onClick={()=>{ if (!atChoice && revealed < display.length && !atLockedSecret) setRevealed(r=>Math.min(r+1, display.length)); }}>
        {items.map((m,i)=>(
          <MessageBubble key={m._k} msg={m} charColor={cityColor} onTask={completeTask} taskDone={taskDone}/>
        ))}
        {atLockedSecret && <LockedSecret/>}
        {typing && !atChoice && <TypingBubble color={cityColor}/>}
        {finished && !atChoice && <div style={{textAlign:"center",color:"#999",fontSize:11,padding:"20px 0 4px"}}>— 聊天记录结束 —</div>}
      </div>
      {atChoice && <ChoiceDock options={last.options} onPick={(idx)=>pickChoice(last._idx, idx)}/>}
      {!atChoice && <AskDock char={char} color={cityColor}/>}
    </div>
  );
}

function ChatHeader({ char, color, onBack }){
  return (
    <div style={{background:"#fff",borderBottom:"1px solid #e5e5e5",padding:"10px 14px",paddingTop:"max(10px,env(safe-area-inset-top))",display:"flex",alignItems:"center",gap:10,position:"sticky",top:0,zIndex:10}}>
      <button onClick={onBack} style={{border:"none",background:"transparent",color:color,fontSize:26,padding:"0 6px",cursor:"pointer"}}>‹</button>
      <div style={{width:36,height:36,borderRadius:"50%",background:color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{char.emoji}</div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontFamily:"'Noto Serif SC',serif",fontWeight:700,fontSize:15.5,color:"#1a1a1a"}}>{char.nameZh}</div>
        <div style={{fontSize:11,color:"#999",marginTop:1}}>{char.title}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════
// Message bubble renderer
// ═══════════════════════════════
function MessageBubble({ msg, charColor, onTask, taskDone }){
  if (msg.t === 'text'){
    return <TextBubble mine={msg.mine} text={msg.text} color={charColor}/>;
  }
  if (msg.t === 'artwork'){
    return <ArtworkCard msg={msg} color={charColor}/>;
  }
  if (msg.t === 'task'){
    return <TaskCard msg={msg} color={charColor} done={taskDone} onTask={onTask}/>;
  }
  if (msg.t === 'secret'){
    return <SecretBlock texts={msg.texts} color={charColor}/>;
  }
  if (msg.t === 'tip'){
    return <TipCard label={msg.label} text={msg.text} color={charColor}/>;
  }
  if (msg.t === 'ref'){
    return <RefCard label={msg.label} text={msg.text} color={charColor}/>;
  }
  return null;
}

function TextBubble({ mine, text, color }){
  return (
    <div className="anim-up" style={{display:"flex",justifyContent:mine?"flex-end":"flex-start",margin:"3px 0"}}>
      <div style={{
        maxWidth:"78%",
        background:mine?color:"#fff",
        color:mine?"#fff":"#1a1a1a",
        padding:"9px 14px",
        borderRadius:20,
        borderBottomRightRadius:mine?6:20,
        borderBottomLeftRadius:mine?20:6,
        fontSize:15,
        lineHeight:1.45,
        boxShadow:mine?"none":"0 1px 2px rgba(0,0,0,.06)",
        whiteSpace:"pre-wrap",
        wordBreak:"break-word",
      }}>{text}</div>
    </div>
  );
}

function TypingBubble({ color }){
  return (
    <div className="anim-up" style={{display:"flex",justifyContent:"flex-start",margin:"3px 0"}}>
      <div style={{background:"#fff",padding:"12px 16px",borderRadius:20,borderBottomLeftRadius:6,boxShadow:"0 1px 2px rgba(0,0,0,.06)"}}>
        <span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/>
      </div>
    </div>
  );
}

function ArtworkCard({ msg, color }){
  return (
    <div className="anim-up" style={{display:"flex",justifyContent:"flex-start",margin:"8px 0"}}>
      <div style={{maxWidth:"88%",background:"#fff",borderRadius:18,overflow:"hidden",boxShadow:"0 2px 10px rgba(0,0,0,.08)"}}>
        {msg.image && <div style={{height:160,background:`url(${msg.image}) center/cover,#eee`}}/>}
        <div style={{padding:"12px 14px"}}>
          <div style={{fontWeight:800,fontSize:16,fontFamily:"'Noto Serif SC',serif"}}>{msg.title}</div>
          <div style={{fontSize:12,color:color,fontWeight:600,marginTop:3}}>📍 {msg.location}</div>
          <div style={{fontSize:13.5,color:"#333",lineHeight:1.5,marginTop:8}}>{msg.why}</div>
          {msg.observe && <div style={{marginTop:10,padding:"8px 10px",background:"#fffbee",borderLeft:`3px solid ${color}`,fontSize:12.5,color:"#5a4a1a",lineHeight:1.5,borderRadius:"0 6px 6px 0"}}>👁️ <b>观察</b>：{msg.observe}</div>}
        </div>
      </div>
    </div>
  );
}

function TaskCard({ msg, color, done, onTask }){
  const [shooting, setShooting] = useState(false);
  return (
    <div className="anim-up" style={{margin:"12px 0",display:"flex",justifyContent:"center"}}>
      <div style={{width:"92%",background:done?"#e8f5e9":"#fff",border:`2px dashed ${done?"#4caf50":color}`,borderRadius:16,padding:14,transition:"all .3s"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
          <span style={{fontSize:20}}>{done?"✅":"📸"}</span>
          <div style={{fontWeight:800,fontSize:15,color:done?"#2e7d32":"#222"}}>{done?"打卡完成":"观察任务"}</div>
        </div>
        <div style={{fontWeight:700,fontSize:14.5,marginBottom:4}}>{msg.title}</div>
        <div style={{fontSize:12.5,color:"#666",lineHeight:1.5}}>{msg.hint}</div>
        {!done && (
          <button onClick={()=>{ setShooting(true); setTimeout(()=>{ onTask(); setShooting(false); }, 800); }}
            style={{marginTop:12,width:"100%",padding:"10px",background:color,color:"#fff",border:"none",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer",opacity:shooting?.6:1}}>
            {shooting?"📸 拍照中…":"去打卡"}
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
          <div style={{maxWidth:"82%",background:"linear-gradient(135deg,#fffbef,#fff)",border:`1px solid ${color}33`,padding:"9px 14px",borderRadius:20,borderBottomLeftRadius:6,fontSize:14.5,lineHeight:1.5,color:"#2a2a2a",whiteSpace:"pre-wrap"}}>{t}</div>
        </div>
      ))}
    </div>
  );
}

function LockedSecret(){
  return (
    <div style={{textAlign:"center",padding:"16px 20px",margin:"12px 0",color:"#999"}}>
      <div style={{fontSize:26,marginBottom:6}}>🔒</div>
      <div style={{fontSize:12.5}}>完成上面的观察任务<br/>解锁 TA 的小秘密</div>
    </div>
  );
}

function TipCard({ label, text, color }){
  return (
    <div className="anim-up" style={{margin:"6px 0",display:"flex",justifyContent:"flex-start"}}>
      <div style={{maxWidth:"88%",background:"#f5f1e8",borderLeft:`3px solid ${color}`,padding:"10px 14px",borderRadius:"0 12px 12px 0",fontSize:13.5,lineHeight:1.55,color:"#3a2f1e"}}>
        <div style={{fontWeight:700,marginBottom:3,fontSize:12.5}}>{label}</div>
        {text}
      </div>
    </div>
  );
}

function RefCard({ label, text, color }){
  return (
    <div className="anim-up" style={{margin:"6px 0",display:"flex",justifyContent:"flex-start"}}>
      <div style={{maxWidth:"88%",background:"#f0ebff",borderLeft:`3px solid #7c5cff`,padding:"10px 14px",borderRadius:"0 12px 12px 0",fontSize:13,lineHeight:1.55,color:"#2a1e4a"}}>
        <div style={{fontWeight:700,marginBottom:3,fontSize:12.5}}>{label}</div>
        {text}
      </div>
    </div>
  );
}

// ═══════════════════════════════
// Choice dock (bottom)
// ═══════════════════════════════
function ChoiceDock({ options, onPick }){
  return (
    <div className="anim-slide" style={{background:"#fff",borderTop:"1px solid #e5e5e5",padding:"10px 14px",paddingBottom:"max(10px,env(safe-area-inset-bottom))"}}>
      <div style={{fontSize:11,color:"#999",marginBottom:8,letterSpacing:1}}>选择一条回复</div>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {options.map((o,i)=>(
          <button key={i} onClick={()=>onPick(i)}
            style={{textAlign:"left",background:"#f2f2f7",border:"1px solid #e5e5e5",padding:"10px 14px",borderRadius:14,fontSize:14,color:"#222",cursor:"pointer"}}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════
// Ask-AI dock (ask the character a question)
// ═══════════════════════════════
function AskDock({ char, color }){
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [busy, setBusy] = useState(false);

  const ask = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setMsgs(m=>[...m,{mine:true,text:q}]);
    setInput("");
    setBusy(true);
    try {
      const sys = `你现在扮演${char.nameZh} (${char.name})，${char.title}。性格：${char.tagline}。用第一人称回答，保持角色声音（${char.nameZh}独有的语气和视角）。回答要简短（2-4 句），像在手机上发消息。可以用表情。不要说"作为 AI 助手"之类的话。只说${char.nameZh}会说的话。问题：${q}`;
      const r = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:300,messages:[{role:"user",content:sys}]})
      });
      const j = await r.json();
      const txt = j.content?.[0]?.text || "…我一时想不出怎么回你。";
      setMsgs(m=>[...m,{mine:false,text:txt}]);
    } catch (e) {
      setMsgs(m=>[...m,{mine:false,text:"📶 网络不太好。等等再问我一次。"}]);
    }
    setBusy(false);
  };

  if (!open){
    return (
      <div style={{background:"#fff",borderTop:"1px solid #e5e5e5",padding:"10px 14px",paddingBottom:"max(10px,env(safe-area-inset-bottom))"}}>
        <button onClick={()=>setOpen(true)} style={{width:"100%",background:"#f2f2f7",border:"none",borderRadius:22,padding:"10px 14px",textAlign:"left",fontSize:14,color:"#666",cursor:"pointer"}}>💬 问 {char.nameZh} 一个问题…</button>
      </div>
    );
  }

  return (
    <div className="anim-slide" style={{background:"#fff",borderTop:"1px solid #e5e5e5",padding:"10px 14px",paddingBottom:"max(10px,env(safe-area-inset-bottom))",maxHeight:"50vh",display:"flex",flexDirection:"column"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
        <div style={{fontSize:12,color:"#999"}}>直接问 {char.nameZh}</div>
        <button onClick={()=>setOpen(false)} style={{border:"none",background:"transparent",fontSize:18,color:"#999",cursor:"pointer"}}>✕</button>
      </div>
      {msgs.length > 0 && (
        <div className="no-scrollbar" style={{maxHeight:200,overflowY:"auto",marginBottom:8}}>
          {msgs.map((m,i)=>(
            <div key={i} style={{display:"flex",justifyContent:m.mine?"flex-end":"flex-start",margin:"3px 0"}}>
              <div style={{maxWidth:"82%",background:m.mine?color:"#f2f2f7",color:m.mine?"#fff":"#222",padding:"8px 12px",borderRadius:16,fontSize:13.5,lineHeight:1.45,whiteSpace:"pre-wrap"}}>{m.text}</div>
            </div>
          ))}
          {busy && <div style={{color:"#999",fontSize:12,padding:"4px 8px"}}><span className="typing-dot"/><span className="typing-dot"/><span className="typing-dot"/></div>}
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

// ═══════════════════════════════
// Photos tab
// ═══════════════════════════════
function Photos({ state, setState, city, onBack, tab, onTab }){
  const cityInfo = CITIES[city];
  const [preview, setPreview] = useState(null);
  const [pendingPhoto, setPendingPhoto] = useState(null); // {url} before tagging
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

  // tag counts for filter chips
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

// ═══════════════════════════════
// Tasks tab
// ═══════════════════════════════
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

// ═══════════════════════════════
// App root
// ═══════════════════════════════
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
  const [tab, setTab] = useState('chats');

  useEffect(()=>{
    const link = document.createElement('link'); link.rel='stylesheet'; link.href=FONT; document.head.appendChild(link);
    const style = document.createElement('style'); style.innerHTML=CSS; document.head.appendChild(style);
  }, []);

  useEffect(()=>{ setState(s=>({...s, city})); }, [city]);

  if (!city) return <Welcome onPick={(c)=>{ setCity(c); setTab('chats'); setCharId(null); }}/>;

  if (charId){
    return <Chat charId={charId} state={state} setState={setState} onBack={()=>setCharId(null)}/>;
  }

  const backToCities = () => { setCity(null); setCharId(null); };

  if (tab === 'photos') return <Photos state={state} setState={setState} city={city} onBack={backToCities} tab={tab} onTab={setTab}/>;
  if (tab === 'tasks') return <Tasks state={state} city={city} onBack={backToCities} tab={tab} onTab={setTab} onOpenChar={setCharId}/>;
  return <ChatList city={city} state={state} onOpen={setCharId} onBack={backToCities} tab={tab} onTab={setTab}/>;
}
