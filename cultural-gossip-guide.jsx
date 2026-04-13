import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { PHOTOS, CITIES, SPOTS, STORY_MODES, FOLLOW_UPS, PHOTO_TAGS, MISSIONS } from "./data.js";

/* ═══════════════════════════════════════════
   CULTURA SEGRETA v9
   UX polish · Claude API · Flip cards · Mission camera
   ═══════════════════════════════════════════ */

const FONT = "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;700;900&family=Playfair+Display:ital,wght@0,400;0,800;1,400;1,800&family=Inter:wght@400;500;600;700&display=swap";

const CSS = `
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-font-smoothing:antialiased}
body{margin:0;background:#fff;font-family:'Inter',sans-serif;color:#222}
input::placeholder{color:#b0b0b0}
::-webkit-scrollbar{width:3px;height:3px}
::-webkit-scrollbar-thumb{background:#ddd;border-radius:3px}
img{-webkit-user-drag:none;user-select:none}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes completeDone{0%{transform:scale(0);opacity:0}50%{transform:scale(1.2);opacity:1}100%{transform:scale(1);opacity:1}}
@keyframes completeRing{0%{transform:scale(.8);opacity:0;box-shadow:0 0 0 0 rgba(76,175,80,.4)}50%{opacity:1}100%{transform:scale(1);opacity:0;box-shadow:0 0 0 20px rgba(76,175,80,0)}}
@keyframes correctPulse{0%{box-shadow:0 0 0 0 rgba(76,175,80,.4)}70%{box-shadow:0 0 0 10px rgba(76,175,80,0)}100%{box-shadow:0 0 0 0 rgba(76,175,80,0)}}
.anim-up{animation:fadeUp .4s ease both}
.anim-in{animation:fadeIn .3s ease both}
.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
.no-scrollbar::-webkit-scrollbar{display:none}
.flip-inner{transition:transform .55s cubic-bezier(.4,.0,.2,1);transform-style:preserve-3d;position:relative}
.flip-inner.flipped{transform:rotateY(180deg)}
.flip-face{backface-visibility:hidden;-webkit-backface-visibility:hidden}
.flip-back{transform:rotateY(180deg)}
.mission-flip{perspective:800px}
.mission-flip-inner{transition:transform .6s cubic-bezier(.4,.0,.2,1);transform-style:preserve-3d;position:relative}
.mission-flip-inner.done{transform:rotateY(180deg)}
.correct-pulse{animation:correctPulse .6s ease}
button{font-family:inherit}
`;

// ─── State ───
function load(){
  try{const s=localStorage.getItem("cs_state");if(s)return JSON.parse(s)}catch{}
  const d=window.__cs||{unlocked:[],photos:[],players:[],missions:{},pts:0,journal:[],city:null};
  if(!d.journal)d.journal=[];
  return d;
}
function save(s){window.__cs=s;try{localStorage.setItem("cs_state",JSON.stringify(s))}catch{}}

// ─── AI Knowledge Base (offline fallback) ───
const AI_KB = {
  uffizi:{
    "鱼骨砖":"鱼骨砖砌法(opus spicatum)是罗马人发明的，砖像鱼骨一样45度交错排列。布鲁内莱斯基在穹顶里用了类似原理——砖块环形交错自锁，不需要木质脚手架支撑。简单说：砖自己撑自己。天才。",
    "必看":"乌菲兹必看：①波提切利《维纳斯的诞生》10-14厅 ②波提切利《春》同厅 ③达芬奇《天使报喜》15厅 ④卡拉瓦乔《美杜莎》90厅 ⑤米开朗基罗《圣家族》35厅——他唯一的画板画。建议早上开门直冲10厅，下午人巨多。",
    "汉尼拔":"《汉尼拔》(2001)里Anthony Hopkins演的食人魔博士在佛罗伦萨化名Dr. Fell，伪装成乌菲兹前任馆长。取景在老宫和瓦萨里走廊——就在乌菲兹隔壁。开头那段佛罗伦萨全景配大教堂钟声，是影史上最优雅的犯罪开场。",
    "default":"乌菲兹是文艺复兴艺术的宇宙中心。2500+幅画，精华在10-14厅（波提切利）、15厅（达芬奇）、35厅（米开朗基罗）、90厅（卡拉瓦乔）。建议3小时，不然会得司汤达综合征晕倒——每年真有人晕。"
  },
  ponte:{default:"老桥上面的瓦萨里走廊有时开放，里面有全世界最大的艺术家自画像收藏。下面的珠宝店虽然游客价但有些家族做了400年了。日落时桥上拍阿诺河两岸金色光线很绝。"},
  duomo:{
    "爬穹顶":"463级台阶，没电梯，中间没法停。大概30-40分钟。但到顶上看到的佛罗伦萨全景值回所有汗水。建议提前网上预约，现场排队至少1小时。下午3-4点光线最好。",
    "鱼骨砖":"布鲁内莱斯基的鱼骨砖砌法：砖块以人字形排列，每层微微向内倾斜，利用摩擦力自锁。不需要木质支撑架。他还发明了专门的起重机——达芬奇后来画过它的草图。整个工程用了400万块砖，16年完工。至今没人100%复原过。",
    "default":"穹顶直径45米，完工时是世界最大。里面壁画是瓦萨里和祖卡里画的《最后的审判》，3600平方米。底部全是地狱场景。洗礼堂的天堂之门也别错过。"
  },
  accademia:{default:"大卫像高5.17米。头和手偏大是故意的——本来要放屋顶上。现在在室内是因为1527年被砸断手臂、1991年被人拿锤子敲脚趾。广场上那个是复制品。排队至少1小时，建议买预约票。"},
  sistine:{
    "拍照":"西斯廷严禁拍照。保安每30秒喊一次'No photo!'。原因是80年代日本NTV花巨资赞助修复，换来独家图像版权。所以你看到的所有西斯廷照片理论上都侵权了。",
    "default":"米开朗基罗画天顶花了4年，不是躺着画——是仰着头站着画的。《创造亚当》在天顶正中间，进门仰头往前走就看到。《最后的审判》在祭坛墙上。"
  },
  colosseum:{
    "角斗士":"角斗士大概75%能活。训练成本太高老板不想亏。他们是古罗马流量明星——有粉丝后援会、同款橄榄油周边。庞贝挖出涂鸦写着：'Celadus让女孩们心碎'。两千年前的饭圈。",
    "default":"斗兽场能坐5-7万人，80个出入口，10分钟能全部疏散。地下层有升降机把动物送上场，2023年新开放第三层观景台。建议买含地下层的Underground Tour。"
  },
  trevi:{default:"许愿池每天捞出约3000欧元硬币，全部捐慈善。右手持硬币过左肩扔——1枚=会回来，2枚=找到爱情，3枚=结婚。晚上人最少灯光最美。旁边Gelato di San Crispino很多人说是罗马最好的冰淇淋。"},
  pantheon:{default:"万神殿穹顶大洞直径8.9米，下雨时雨真的落进来——地面有22个排水孔。2000年了还是世界最大无钢筋混凝土穹顶。拉斐尔的墓在里面。免费参观。"},
  last_supper:{default:"《最后的晚餐》每次只放25人看15分钟。必须提前2-3个月预约。达芬奇用蛋彩不用湿壁画技法，所以从画完就开始脱落。去的时候注意看犹大——唯一打翻盐罐的人。"},
  milan_duomo:{default:"600年还没彻底完工。屋顶可以上去走，坐电梯€16步行€10。上面能看到阿尔卑斯山。135个尖塔上全是圣人雕像。"},
  positano:{default:"波西塔诺沿悬崖而建，50年代Steinbeck写文章炒火了。SITA巴士从索伦托出发——坐右边靠窗，风景最好但也最晕。"},
  capri:{default:"蓝洞只有海面平静时能进，小船躺平钻过1米高洞口。蓝光是阳光通过水下洞口折射。提比略在卡普里住了10年不回罗马。奥古斯都花园看悬崖最好。"},
  pompeii:{default:"公元79年被火山灰掩埋。遗体是石膏灌注的。红灯区有石头路标指路。面包店里的面包都还在。建议从Porta Marina入口进，走完至少3小时。"},
  naples_pizza:{default:"那不勒斯是披萨发源地。Margherita是1889年为王后做的：番茄红+马苏里拉白+罗勒绿=国旗色。Da Michele排队至少1小时但只要€5。真正的那不勒斯披萨边缘要鼓、底要软到能折起来吃。"}
};

function getAIReply(spot, question) {
  const kb = AI_KB[spot.id] || {};
  const q = question.toLowerCase();
  for (const [key, val] of Object.entries(kb)) {
    if (key !== "default" && q.includes(key)) return val;
  }
  const keys = Object.keys(kb).filter(k => k !== "default");
  for (const key of keys) {
    const chars = key.split("");
    if (chars.filter(c => q.includes(c)).length >= chars.length * 0.5) return kb[key];
  }
  return kb.default || `关于${spot.nameZh}，我暂时没有更多八卦了。到了现场看看，说不定会有新发现！`;
}

// ─── Welcome ───
function Welcome({onSelect}){
  const[loaded,setLoaded]=useState(false);
  const cityList=[
    {id:"florence",emoji:"🌸",en:"Florence",zh:"佛罗伦萨",desc:"文艺复兴的朋友圈"},
    {id:"rome",emoji:"🐺",en:"Rome",zh:"罗马",desc:"永恒之城的八卦档案"},
    {id:"milan",emoji:"👗",en:"Milan",zh:"米兰",desc:"时尚与天才的碰撞"},
    {id:"dolomites",emoji:"🏔️",en:"Dolomiti",zh:"多洛米蒂",desc:"珊瑚礁变成的阿尔卑斯"},
    {id:"sorrento",emoji:"🍋",en:"Sorrento",zh:"索伦托",desc:"塞壬与柠檬的海岸"},
    {id:"naples",emoji:"🍕",en:"Napoli",zh:"那不勒斯",desc:"混乱、热情、真实"},
  ];
  return(
    <div style={{minHeight:"100vh",background:"#fff"}}>
      <div style={{position:"relative",height:"44vh",overflow:"hidden"}}>
        <img src={PHOTOS.hero} alt="" onLoad={()=>setLoaded(true)} style={{width:"100%",height:"100%",objectFit:"cover",opacity:loaded?1:0,transition:"opacity .8s"}}/>
        <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgba(0,0,0,.1) 0%,rgba(0,0,0,.35) 60%,rgba(255,255,255,1) 100%)"}}/>
        <div style={{position:"absolute",bottom:"16%",left:0,right:0,textAlign:"center"}}>
          <h1 style={{margin:0,fontSize:"36px",fontFamily:"'Playfair Display',serif",fontWeight:800,fontStyle:"italic",color:"#fff",textShadow:"0 2px 20px rgba(0,0,0,.3)"}}>Cultura Segreta</h1>
          <p style={{margin:"6px 0 0",fontSize:"13px",color:"rgba(255,255,255,.85)",letterSpacing:".5px"}}>正经导游不会告诉你的事</p>
        </div>
      </div>
      <div style={{maxWidth:500,margin:"0 auto",padding:"24px 20px 40px"}}>
        <p style={{fontSize:"18px",fontWeight:700,color:"#222",marginBottom:"20px"}}>Ciao，今天我们去哪？</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"12px"}}>
          {cityList.map((c,i)=>(
            <button key={c.id} onClick={()=>onSelect(c.id)} className="anim-up" style={{animationDelay:`${i*.06}s`,padding:0,border:"none",background:"#fff",borderRadius:"12px",cursor:"pointer",textAlign:"left",overflow:"hidden",boxShadow:"0 1px 4px rgba(0,0,0,.08)"}}>
              <div style={{position:"relative",paddingTop:"70%"}}>
                <img src={PHOTOS[c.id]} alt="" loading="lazy" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
              </div>
              <div style={{padding:"12px 14px 14px"}}>
                <div style={{fontSize:"15px",fontWeight:700,color:"#222"}}>{c.emoji} {c.en}</div>
                <div style={{fontSize:"12px",color:"#717171",marginTop:"2px"}}>{c.desc}</div>
              </div>
            </button>
          ))}
        </div>
        <p style={{textAlign:"center",fontSize:"12px",color:"#b0b0b0",marginTop:"32px"}}>很艺术的八卦 · 和朋友一起玩</p>
      </div>
    </div>
  );
}

// ─── Story Card ───
function StoryCard({story,spot,unlocked,onUnlock,color,onAsk}){
  const[picked,setPicked]=useState(null);
  const[open,setOpen]=useState(unlocked);
  const mode=STORY_MODES[story.id]||"quiz";
  const followUps=FOLLOW_UPS[story.id]||[`${spot.nameZh}还有什么八卦？`,"附近有什么好玩的？"];

  const pick=i=>{if(open)return;setPicked(i);setTimeout(()=>{setOpen(true);onUnlock(story.id,i===story.ans)},600)};
  const reveal=()=>{setOpen(true);onUnlock(story.id,true)};

  return(
    <div style={{background:"#fff",borderRadius:"12px",marginBottom:"10px",border:"1px solid #ebebeb",overflow:"hidden"}}>
      <div style={{padding:"16px"}}>
        <div style={{display:"flex",alignItems:"flex-start",gap:"8px",marginBottom:"6px"}}>
          <h3 style={{margin:0,fontSize:"15px",fontWeight:700,color:"#222",lineHeight:1.4,flex:1,fontFamily:"'Noto Serif SC',serif"}}>{story.title}</h3>
          {mode!=="quiz"&&<span style={{fontSize:"10px",padding:"2px 8px",borderRadius:"6px",background:mode==="reveal"?"#FFF3E0":"#F3E5F5",color:mode==="reveal"?"#E65100":"#7B1FA2",fontWeight:600,flexShrink:0,whiteSpace:"nowrap"}}>{mode==="reveal"?"揭秘":"故事"}</span>}
          {open&&<span style={{fontSize:"13px",flexShrink:0}}>✅</span>}
        </div>
        <p style={{margin:"0 0 12px",fontSize:"13px",lineHeight:1.8,color:"#717171",fontFamily:"'Noto Serif SC',serif"}}>{story.hook}</p>

        {!open&&mode==="quiz"&&<>
          <p style={{margin:"0 0 8px",fontSize:"13px",color,fontWeight:600,fontFamily:"'Noto Serif SC',serif"}}>{story.q}</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
            {story.opts.map((o,i)=>{
              const done=picked!==null,right=done&&i===story.ans,wrong=picked===i&&i!==story.ans;
              return<button key={i} onClick={()=>pick(i)} disabled={done} className={right?"correct-pulse":""} style={{padding:"10px",borderRadius:"10px",textAlign:"left",border:right?"2px solid #4CAF50":wrong?"2px solid #ef5350":"1.5px solid #ebebeb",background:right?"#E8F5E9":wrong?"#FFEBEE":done?"#fafafa":"#fff",color:right?"#2E7D32":wrong?"#c62828":"#555",fontSize:"12px",cursor:done?"default":"pointer",fontFamily:"'Noto Serif SC',serif",lineHeight:1.5,opacity:done&&!right&&picked!==i?.35:1,transition:"all .3s"}}>{right?"✅ ":wrong?"❌ ":""}{o}</button>
            })}
          </div>
          {picked!==null&&picked!==story.ans&&<div className="anim-up" style={{marginTop:"8px",padding:"8px 12px",background:"#FFF8E1",borderRadius:"8px",fontSize:"12px",color:"#F57F17",fontFamily:"'Noto Serif SC',serif"}}>正确答案是：{story.opts[story.ans]}</div>}
        </>}

        {!open&&mode==="reveal"&&<>
          <p style={{margin:"0 0 10px",fontSize:"13px",color,fontWeight:600,fontFamily:"'Noto Serif SC',serif"}}>{story.q}</p>
          <button onClick={reveal} style={{width:"100%",padding:"14px",borderRadius:"10px",border:`1.5px dashed ${color}55`,background:`${color}08`,color,fontSize:"13px",cursor:"pointer",fontWeight:600,fontFamily:"'Noto Serif SC',serif"}}>🔮 点击揭秘</button>
        </>}

        {!open&&mode==="story"&&<button onClick={reveal} style={{width:"100%",padding:"14px",borderRadius:"10px",border:"1.5px solid #ebebeb",background:"#fafafa",color:"#717171",fontSize:"13px",cursor:"pointer",fontWeight:600,fontFamily:"'Noto Serif SC',serif"}}>📖 展开完整故事</button>}

        {open&&<div className="anim-up">
          <div style={{background:`${color}0a`,borderRadius:"10px",padding:"10px 14px",marginBottom:"10px",borderLeft:`3px solid ${color}`}}>
            <span style={{fontSize:"13px",fontWeight:700,color,fontFamily:"'Noto Serif SC',serif"}}>{story.punch}</span>
          </div>
          <p style={{margin:"0 0 16px",fontSize:"13px",lineHeight:2,color:"#484848",fontFamily:"'Noto Serif SC',serif",whiteSpace:"pre-line"}}>{story.reveal}</p>
          <div style={{display:"flex",flexWrap:"wrap",gap:"6px"}}>
            {followUps.map((fq,i)=><button key={i} onClick={()=>onAsk(fq)} style={{padding:"8px 14px",borderRadius:"20px",border:"1px solid #ebebeb",background:"#fff",color:"#717171",fontSize:"11px",cursor:"pointer",fontFamily:"'Noto Serif SC',serif",transition:"all .15s"}}>💬 {fq}</button>)}
          </div>
        </div>}
      </div>
    </div>
  );
}

// ─── Guide Section (must-see items) ───
function GuideSection({guide, color}){
  if(!guide||!guide.length) return null;
  return(
    <div style={{background:"#fff",borderRadius:"12px",marginBottom:"10px",border:"1px solid #ebebeb",overflow:"hidden"}}>
      <div style={{padding:"14px 16px 12px",borderBottom:"1px solid #f5f5f5"}}>
        <h3 style={{margin:0,fontSize:"14px",fontWeight:700,color:"#222",fontFamily:"'Noto Serif SC',serif"}}>🎨 必看清单</h3>
      </div>
      {guide.map((g,i)=>(
        <div key={i} style={{padding:"10px 16px",borderBottom:i<guide.length-1?"1px solid #f5f5f5":"none",display:"flex",gap:"12px",alignItems:"flex-start"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:color,marginTop:7,flexShrink:0}}/>
          <div style={{flex:1}}>
            <div style={{fontSize:"13px",fontWeight:700,color:"#222",fontFamily:"'Noto Serif SC',serif"}}>{g.name}</div>
            <div style={{fontSize:"11px",color:"#717171",marginTop:"2px"}}>{g.room} · {g.artist}</div>
            {g.tip&&<div style={{fontSize:"11px",color,marginTop:"3px",fontWeight:500}}>💡 {g.tip}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Flip Card ───
function FlipSpotCard({spot,gs,city,unlock,openAsk}){
  const[flipped,setFlipped]=useState(false);
  const[q,setQ]=useState("");
  const[frontH,setFrontH]=useState(0);
  const[backH,setBackH]=useState(0);
  const fRef=useRef(null);
  const bRef=useRef(null);

  useEffect(()=>{
    const measure=()=>{
      if(fRef.current)setFrontH(fRef.current.scrollHeight);
      if(bRef.current)setBackH(bRef.current.scrollHeight);
    };
    measure();
    const obs=new ResizeObserver(measure);
    if(fRef.current)obs.observe(fRef.current);
    if(bRef.current)obs.observe(bRef.current);
    return()=>obs.disconnect();
  });

  const h=flipped?backH:frontH;
  const progress=spot.stories.filter(s=>gs.unlocked.includes(s.id)).length;

  return(
    <div style={{perspective:"1200px",marginBottom:"20px"}}>
      <div className={`flip-inner${flipped?" flipped":""}`} style={{height:h||"auto",transition:"transform .55s cubic-bezier(.4,.0,.2,1), height .35s ease"}}>

        {/* FRONT */}
        <div ref={fRef} className="flip-face" style={{position:flipped?"absolute":"relative",width:"100%",top:0}}>
          <div onClick={()=>setFlipped(true)} style={{cursor:"pointer",borderRadius:"12px",overflow:"hidden",boxShadow:"0 1px 6px rgba(0,0,0,.08)"}}>
            <div style={{position:"relative",paddingTop:"75%"}}>
              <img src={PHOTOS[spot.id]} alt="" loading="lazy" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover"}}/>
              <div style={{position:"absolute",top:12,left:12,background:"rgba(255,255,255,.92)",backdropFilter:"blur(4px)",padding:"4px 10px",borderRadius:"8px",fontSize:"11px",fontWeight:600,color:"#222"}}>
                {progress}/{spot.stories.length} 故事
              </div>
              {progress===spot.stories.length&&spot.stories.length>0&&<div style={{position:"absolute",top:12,right:12,background:"rgba(76,175,80,.9)",color:"#fff",padding:"4px 10px",borderRadius:"8px",fontSize:"11px",fontWeight:600}}>已完成 🎉</div>}
            </div>
            <div style={{padding:"14px 16px 16px",background:"#fff"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                <div>
                  <h2 style={{margin:0,fontSize:"17px",fontWeight:700,color:"#222"}}>{spot.name}</h2>
                  <p style={{margin:"3px 0 0",fontSize:"13px",color:"#717171",fontFamily:"'Noto Serif SC',serif"}}>{spot.vibe}</p>
                </div>
                <div style={{display:"flex",gap:"3px",marginTop:"4px"}}>
                  {spot.stories.map(s=><div key={s.id} style={{width:7,height:7,borderRadius:"50%",background:gs.unlocked.includes(s.id)?city.color:"#ddd",transition:"background .3s"}}/>)}
                </div>
              </div>
              <div style={{marginTop:"10px",fontSize:"12px",color:city.color,fontWeight:600}}>点击翻转 →</div>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div ref={bRef} className="flip-face flip-back" style={{position:flipped?"relative":"absolute",width:"100%",top:0}}>
          <div style={{borderRadius:"12px",overflow:"hidden",border:"1px solid #ebebeb",background:"#fafafa"}}>
            <div style={{padding:"14px 16px",background:"#fff",borderBottom:"1px solid #ebebeb",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <h2 style={{margin:0,fontSize:"16px",fontWeight:700,color:"#222"}}>{spot.nameZh}</h2>
                <p style={{margin:"2px 0 0",fontSize:"12px",color:"#717171"}}>{spot.name}</p>
              </div>
              <button onClick={(e)=>{e.stopPropagation();setFlipped(false)}} style={{background:"#f7f7f7",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:"14px",display:"flex",alignItems:"center",justifyContent:"center",color:"#717171"}}>✕</button>
            </div>

            <div style={{padding:"12px 16px 16px"}} onClick={e=>e.stopPropagation()}>
              {spot.guide&&<GuideSection guide={spot.guide} color={city.color}/>}
              {spot.stories.map(s=><StoryCard key={s.id} story={s} spot={spot} unlocked={gs.unlocked.includes(s.id)} onUnlock={unlock} color={city.color} onAsk={question=>openAsk(question,spot)}/>)}

              <div style={{display:"flex",gap:"8px",marginTop:"4px"}}>
                <input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&q.trim()){openAsk(q,spot);setQ("")}}} placeholder={`关于${spot.nameZh}想问点啥？`} style={{flex:1,padding:"10px 14px",borderRadius:"10px",border:"1px solid #ddd",fontSize:"13px",outline:"none",background:"#fff",fontFamily:"'Noto Serif SC',serif"}}/>
                <button onClick={()=>{if(q.trim()){openAsk(q,spot);setQ("")}}} style={{padding:"10px 16px",borderRadius:"10px",border:"none",background:city.color,color:"#fff",fontSize:"12px",cursor:"pointer",fontWeight:600}}>问</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AI Chat (Claude API + offline fallback) ───
const API_KEY="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";

function AIChat({spot,question,city,onClose}){
  const[msgs,setMsgs]=useState([]);
  const[ld,setLd]=useState(false);
  const[inp,setInp]=useState("");
  const ref=useRef(null);

  const ask=useCallback(async(q,prev=[])=>{
    const nm=[...prev,{role:"user",content:q}];
    setMsgs(nm);
    setLd(true);
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json","x-api-key":API_KEY,"anthropic-version":"2023-06-01","anthropic-dangerous-direct-browser-access":"true"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:800,
          system:`你是Cultura Segreta的AI导游，讲话幽默抽象像见多识广但嘴损的朋友。用户在意大利${city.nameZh}参观${spot.nameZh}(${spot.name})。要求：中文回答，像聊天吐槽但信息准确，不确定就说不确定。200字内，不用bullet point，不要太正经。`,
          messages:nm
        })
      });
      const d=await r.json();
      const t=d.content?.map(c=>c.text||"").join("");
      if(t){setMsgs([...nm,{role:"assistant",content:t}])}
      else{throw new Error("empty")}
    }catch{
      const reply=getAIReply(spot,q);
      setMsgs([...nm,{role:"assistant",content:"📖 "+reply}]);
    }
    setLd(false);
  },[spot,city]);

  useEffect(()=>{ask(question)},[]);
  useEffect(()=>{ref.current?.scrollTo(0,ref.current.scrollHeight)},[msgs,ld]);

  const suggestions=msgs.length>=2&&!ld?[
    `${spot.nameZh}必看的是什么？`,
    "还有什么八卦？",
    "附近有什么好玩的？"
  ]:[];

  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,zIndex:1000,background:"rgba(0,0,0,.4)",backdropFilter:"blur(6px)",display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div onClick={e=>e.stopPropagation()} className="anim-up" style={{width:"100%",maxWidth:500,maxHeight:"80vh",background:"#fff",borderRadius:"16px 16px 0 0",display:"flex",flexDirection:"column",boxShadow:"0 -4px 24px rgba(0,0,0,.1)"}}>
        <div style={{padding:"16px 20px 12px",borderBottom:"1px solid #ebebeb",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><span style={{fontWeight:700,color:"#222"}}>{spot.nameZh}</span><span style={{color:"#b0b0b0",fontSize:"13px",marginLeft:"8px"}}>问点啥</span></div>
          <button onClick={onClose} style={{background:"#f7f7f7",border:"none",borderRadius:"50%",width:32,height:32,cursor:"pointer",fontSize:"13px",color:"#717171"}}>✕</button>
        </div>
        <div ref={ref} style={{flex:1,overflowY:"auto",padding:"16px 20px"}}>
          {msgs.map((m,i)=><div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start",marginBottom:"10px"}}><div style={{background:m.role==="user"?city.color:"#f7f7f7",color:m.role==="user"?"#fff":"#222",padding:"10px 14px",maxWidth:"82%",borderRadius:m.role==="user"?"14px 14px 4px 14px":"14px 14px 14px 4px",fontSize:"13px",lineHeight:1.75,fontFamily:"'Noto Serif SC',serif",whiteSpace:"pre-wrap"}}>{m.content}</div></div>)}
          {ld&&<div style={{color:"#b0b0b0",fontSize:"13px",fontFamily:"'Noto Serif SC',serif"}}>翻档案中...</div>}
          {suggestions.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:"6px",marginTop:"6px"}}>{suggestions.map((s,i)=><button key={i} onClick={()=>ask(s,msgs)} style={{padding:"6px 12px",borderRadius:"16px",border:"1px solid #ebebeb",background:"#fff",color:"#717171",fontSize:"11px",cursor:"pointer",fontFamily:"'Noto Serif SC',serif"}}>{s}</button>)}</div>}
        </div>
        <div style={{padding:"12px 20px",paddingBottom:"max(20px, env(safe-area-inset-bottom))",borderTop:"1px solid #ebebeb",display:"flex",gap:"8px"}}>
          <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&inp.trim()&&!ld){const q=inp;setInp("");ask(q,msgs)}}} placeholder="继续问..." disabled={ld} style={{flex:1,padding:"10px 14px",borderRadius:"10px",border:"1px solid #ddd",background:"#fff",color:"#222",fontSize:"13px",fontFamily:"'Noto Serif SC',serif",outline:"none"}}/>
          <button onClick={()=>{if(inp.trim()&&!ld){const q=inp;setInp("");ask(q,msgs)}}} style={{padding:"10px 18px",borderRadius:"10px",border:"none",background:city.color,color:"#fff",fontSize:"13px",cursor:"pointer",fontWeight:600}}>💬</button>
        </div>
      </div>
    </div>
  );
}

// ─── Photos ───
function Photos({gs,setGs}){
  const[tag,setTag]=useState("all");
  const fR=useRef(null);
  const[pk,setPk]=useState(null);
  const[confirm,setConfirm]=useState(null);

  const up=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{const ns={...gs,photos:[{id:Date.now(),src:ev.target.result,tag:null,time:Date.now()},...gs.photos]};setGs(ns);save(ns)};r.readAsDataURL(f);e.target.value=""};
  const st=(i,t)=>{const p=[...gs.photos];p[i]={...p[i],tag:t};const ns={...gs,photos:p};setGs(ns);save(ns);setPk(null)};
  const del=(i)=>{const p=[...gs.photos];p.splice(i,1);const ns={...gs,photos:p};setGs(ns);save(ns);setConfirm(null);setPk(null)};
  const ps=tag==="all"?gs.photos:gs.photos.filter(p=>p.tag===tag);

  return(
    <div style={{padding:"0 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"16px"}}>
        <h2 style={{fontSize:"22px",fontWeight:700,color:"#222",margin:0}}>相册</h2>
        {gs.photos.length>0&&<span style={{fontSize:"12px",color:"#b0b0b0"}}>{gs.photos.length} 张照片</span>}
      </div>
      <div className="no-scrollbar" style={{display:"flex",gap:"6px",overflowX:"auto",marginBottom:"16px",paddingBottom:"4px"}}>
        <button onClick={()=>setTag("all")} style={{padding:"6px 14px",borderRadius:"20px",border:tag==="all"?"2px solid #222":"1px solid #ddd",background:tag==="all"?"#222":"#fff",color:tag==="all"?"#fff":"#717171",fontSize:"12px",cursor:"pointer",fontWeight:600,whiteSpace:"nowrap",flexShrink:0}}>全部</button>
        {PHOTO_TAGS.map(t=><button key={t.id} onClick={()=>setTag(t.id)} style={{padding:"6px 12px",borderRadius:"20px",border:tag===t.id?`2px solid ${t.color}`:"1px solid #ddd",background:tag===t.id?t.color:"#fff",color:tag===t.id?"#fff":"#717171",fontSize:"12px",cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{t.emoji} {t.label}</button>)}
      </div>
      <input ref={fR} type="file" accept="image/*" capture="environment" onChange={up} style={{display:"none"}}/>
      <button onClick={()=>fR.current?.click()} style={{width:"100%",padding:"18px",borderRadius:"12px",border:"2px dashed #ddd",background:"#fafafa",cursor:"pointer",fontSize:"14px",color:"#b0b0b0",marginBottom:"16px",fontWeight:500}}>📷 拍一张</button>
      {ps.length===0?<div style={{textAlign:"center",padding:"48px 20px",color:"#ddd",fontSize:"14px"}}>{tag==="all"?"还没有照片":"这个标签下还没有照片"}</div>:
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
        {ps.map((p,i)=>{const ri=gs.photos.indexOf(p);const t=PHOTO_TAGS.find(x=>x.id===p.tag);return(
          <div key={p.id} style={{position:"relative",borderRadius:"12px",overflow:"hidden",aspectRatio:"1"}}>
            <img src={p.src} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
            <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,transparent 60%,rgba(0,0,0,.4) 100%)"}}/>
            {/* Tag button */}
            <div onClick={()=>{setPk(pk===ri?null:ri);setConfirm(null)}} style={{position:"absolute",bottom:8,left:8,background:t?t.color:"rgba(0,0,0,.5)",color:"#fff",padding:"4px 10px",borderRadius:"10px",fontSize:"11px",cursor:"pointer",fontWeight:500}}>{t?`${t.emoji} ${t.label}`:"+标签"}</div>
            {/* Delete button */}
            <div onClick={()=>setConfirm(confirm===ri?null:ri)} style={{position:"absolute",top:6,right:6,background:"rgba(0,0,0,.4)",color:"#fff",width:24,height:24,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",cursor:"pointer",backdropFilter:"blur(4px)"}}>✕</div>
            {/* Delete confirmation */}
            {confirm===ri&&<div className="anim-in" style={{position:"absolute",inset:0,background:"rgba(0,0,0,.6)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"10px"}}>
              <span style={{color:"#fff",fontSize:"13px",fontWeight:500}}>删除这张？</span>
              <div style={{display:"flex",gap:"8px"}}>
                <button onClick={()=>del(ri)} style={{padding:"6px 16px",borderRadius:"8px",border:"none",background:"#ef5350",color:"#fff",fontSize:"12px",cursor:"pointer",fontWeight:600}}>删除</button>
                <button onClick={()=>setConfirm(null)} style={{padding:"6px 16px",borderRadius:"8px",border:"1px solid rgba(255,255,255,.5)",background:"transparent",color:"#fff",fontSize:"12px",cursor:"pointer"}}>取消</button>
              </div>
            </div>}
            {/* Tag picker */}
            {pk===ri&&confirm===null&&<div className="anim-in" style={{position:"absolute",bottom:36,left:4,right:4,background:"#fff",borderRadius:"12px",padding:"8px",boxShadow:"0 4px 16px rgba(0,0,0,.15)",display:"flex",flexWrap:"wrap",gap:"4px"}}>
              {PHOTO_TAGS.map(t2=><button key={t2.id} onClick={e=>{e.stopPropagation();st(ri,t2.id)}} style={{padding:"4px 8px",borderRadius:"8px",border:"none",background:`${t2.color}12`,color:t2.color,fontSize:"11px",cursor:"pointer",fontWeight:600}}>{t2.emoji}{t2.label}</button>)}
            </div>}
          </div>
        )})}
      </div>}
    </div>
  );
}

// ─── Mission Card (flippable with camera) ───
function MissionCard({player,mission,missionData,onUpdate,color}){
  const[showConfetti,setShowConfetti]=useState(false);
  const[confirmRetake,setConfirmRetake]=useState(false);
  const fR=useRef(null);
  const done=!!missionData?.photo;

  const takePhoto=e=>{
    const f=e.target.files?.[0];
    if(!f)return;
    const r=new FileReader();
    r.onload=ev=>{
      setShowConfetti(true);
      setConfirmRetake(false);
      setTimeout(()=>setShowConfetti(false),1500);
      onUpdate(player,{
        ...mission,
        photo:ev.target.result,
        completedAt:Date.now(),
        completedBy:player,
      });
    };
    r.readAsDataURL(f);
    e.target.value="";
  };

  const timeStr=missionData?.completedAt?new Date(missionData.completedAt).toLocaleTimeString("zh-CN",{hour:"2-digit",minute:"2-digit"}):"";

  return(
    <div className="mission-flip" style={{marginBottom:"14px",position:"relative"}}>
      {showConfetti&&<div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",zIndex:10,pointerEvents:"none",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <div style={{width:72,height:72,borderRadius:"50%",background:"#4CAF50",display:"flex",alignItems:"center",justifyContent:"center",animation:"completeDone .5s cubic-bezier(.175,.885,.32,1.275) both",boxShadow:"0 4px 20px rgba(76,175,80,.3)"}}>
          <span style={{fontSize:"32px",color:"#fff"}}>✓</span>
        </div>
        <div style={{position:"absolute",width:72,height:72,borderRadius:"50%",border:"3px solid #4CAF50",animation:"completeRing .8s ease-out both"}}/>
      </div>}

      <input ref={fR} type="file" accept="image/*" capture="environment" onChange={takePhoto} style={{display:"none"}}/>

      <div className={`mission-flip-inner${done?" done":""}`}>
        {/* FRONT */}
        <div className="flip-face" style={{position:done?"absolute":"relative",width:"100%",top:0}}>
          <div style={{background:"#fff",borderRadius:"12px",border:"1px solid #ebebeb",overflow:"hidden"}}>
            <div style={{padding:"16px"}}>
              <div style={{fontSize:"12px",color:"#b0b0b0",marginBottom:"10px"}}>{player} 的任务</div>
              <div style={{display:"flex",alignItems:"center",gap:"14px",marginBottom:"14px"}}>
                <span style={{fontSize:"32px"}}>{mission.e}</span>
                <div>
                  <div style={{fontWeight:700,fontSize:"16px",color:"#222"}}>{mission.t}</div>
                  <div style={{fontSize:"13px",color:"#717171",marginTop:"2px"}}>{mission.d}</div>
                </div>
              </div>
              <button onClick={()=>fR.current?.click()} style={{width:"100%",padding:"14px",borderRadius:"10px",border:"none",background:color,color:"#fff",fontSize:"14px",cursor:"pointer",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"}}>
                📷 拍照完成
              </button>
            </div>
          </div>
        </div>

        {/* BACK */}
        <div className="flip-face flip-back" style={{position:done?"relative":"absolute",width:"100%",top:0}}>
          <div style={{background:"#fff",borderRadius:"12px",border:`2px solid ${color}30`,overflow:"hidden"}}>
            <div style={{padding:"12px 16px",borderBottom:"1px solid #f0f0f0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span style={{fontSize:"18px"}}>{mission.e}</span>
                <div>
                  <div style={{fontWeight:700,fontSize:"14px",color:"#222"}}>{mission.t}</div>
                  <div style={{fontSize:"11px",color:"#717171"}}>{player} · {timeStr}</div>
                </div>
              </div>
              <span style={{fontSize:"16px"}}>✅</span>
            </div>
            {missionData?.photo&&(
              <div style={{position:"relative"}}>
                <img src={missionData.photo} alt="" style={{width:"100%",aspectRatio:"4/3",objectFit:"cover",display:"block"}}/>
                {!confirmRetake?
                  <button onClick={()=>setConfirmRetake(true)} style={{position:"absolute",bottom:10,right:10,background:"rgba(0,0,0,.6)",color:"#fff",border:"none",borderRadius:"8px",padding:"6px 12px",fontSize:"11px",cursor:"pointer",fontWeight:500,backdropFilter:"blur(4px)"}}>📷 重拍</button>
                :
                  <div className="anim-in" style={{position:"absolute",bottom:10,right:10,display:"flex",gap:"6px"}}>
                    <button onClick={()=>fR.current?.click()} style={{padding:"6px 12px",borderRadius:"8px",border:"none",background:"#fff",color:"#222",fontSize:"11px",cursor:"pointer",fontWeight:600}}>确认重拍</button>
                    <button onClick={()=>setConfirmRetake(false)} style={{padding:"6px 12px",borderRadius:"8px",border:"none",background:"rgba(0,0,0,.6)",color:"#fff",fontSize:"11px",cursor:"pointer",backdropFilter:"blur(4px)"}}>取消</button>
                  </div>
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Missions ───
function Miss({gs,setGs,color}){
  const[nm,setNm]=useState("");
  const add=()=>{if(!nm.trim()||gs.players.includes(nm.trim()))return;const ns={...gs,players:[...gs.players,nm.trim()]};setGs(ns);save(ns);setNm("")};
  const roll=()=>{const sh=[...MISSIONS].sort(()=>Math.random()-.5);const m={};gs.players.forEach((p,i)=>{m[p]={...sh[i%sh.length]}});const ns={...gs,missions:m};setGs(ns);save(ns)};
  const updateMission=(player,mData)=>{const ns={...gs,missions:{...gs.missions,[player]:mData}};setGs(ns);save(ns)};
  const completedCount=Object.values(gs.missions).filter(m=>m.photo).length;

  return(
    <div style={{padding:"0 20px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:"16px"}}>
        <h2 style={{fontSize:"22px",fontWeight:700,color:"#222",margin:0}}>今日任务</h2>
        {Object.keys(gs.missions).length>0&&<span style={{fontSize:"12px",color:"#b0b0b0"}}>{completedCount}/{Object.keys(gs.missions).length} 完成</span>}
      </div>
      <div style={{display:"flex",gap:"8px",marginBottom:"14px"}}>
        <input value={nm} onChange={e=>setNm(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")add()}} placeholder="输入朋友名字" style={{flex:1,padding:"12px 14px",borderRadius:"10px",border:"1px solid #ddd",fontSize:"14px",outline:"none"}}/>
        <button onClick={add} style={{padding:"12px 18px",borderRadius:"10px",border:"none",background:color,color:"#fff",fontSize:"13px",cursor:"pointer",fontWeight:600}}>加入</button>
      </div>
      {gs.players.length>0&&<>
        <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"14px"}}>{gs.players.map(p=><span key={p} style={{padding:"6px 14px",borderRadius:"20px",background:"#f7f7f7",border:"1px solid #ebebeb",color:"#222",fontSize:"13px",display:"flex",alignItems:"center",gap:"8px"}}>{p}<span onClick={()=>{const ns={...gs,players:gs.players.filter(x=>x!==p)};const m={...ns.missions};delete m[p];ns.missions=m;setGs(ns);save(ns)}} style={{cursor:"pointer",color:"#b0b0b0",fontSize:"12px"}}>✕</span></span>)}</div>
        <button onClick={roll} style={{width:"100%",padding:"16px",borderRadius:"12px",border:"none",background:color,color:"#fff",fontSize:"16px",fontWeight:700,cursor:"pointer",marginBottom:"18px"}}>🎲 {Object.keys(gs.missions).length>0?"重新分配":"随机分配任务"}</button>
      </>}
      {Object.entries(gs.missions).map(([p,m])=>(
        <MissionCard key={p} player={p} mission={m} missionData={m} onUpdate={updateMission} color={color}/>
      ))}
      {gs.players.length===0&&<div style={{textAlign:"center",padding:"48px 20px",color:"#ddd",fontSize:"14px"}}>加几个朋友名字<br/>随机分配拍摄任务</div>}
    </div>
  );
}

// ═══ Main App ═══
export default function App(){
  const[gs,setGs]=useState(load);
  const[cid,setCid]=useState(()=>gs.city||null);
  const[tab,setTab]=useState("explore");
  const[chat,setChat]=useState(null);
  const scrollRef=useRef(null);

  const city=cid?CITIES[cid]:null;
  const spots=cid?SPOTS[cid]||[]:[];
  const total=spots.reduce((s,sp)=>s+sp.stories.length,0);
  const cityUnlocked=gs.unlocked.filter(sid=>spots.some(sp=>sp.stories.some(st=>st.id===sid)));

  const selectCity=id=>{
    setCid(id);
    setTab("explore");
    const ns={...gs,city:id};
    setGs(ns);
    save(ns);
    // Scroll to top on city switch
    setTimeout(()=>window.scrollTo({top:0,behavior:"smooth"}),100);
  };
  const unlock=(sid,ok)=>{if(gs.unlocked.includes(sid))return;const ns={...gs,unlocked:[...gs.unlocked,sid],pts:gs.pts+(ok?2:1),journal:[...gs.journal,{type:"unlock",id:sid,time:Date.now()}]};setGs(ns);save(ns)};
  const openAsk=(question,spot)=>{setChat({spot,question})};

  // Welcome
  if(!cid) return(<><link href={FONT} rel="stylesheet"/><style>{CSS}</style><Welcome onSelect={selectCity}/></>);

  return(
    <>
      <link href={FONT} rel="stylesheet"/>
      <style>{CSS}</style>
      <div ref={scrollRef} style={{maxWidth:500,margin:"0 auto",minHeight:"100vh",background:"#fff",paddingBottom:"calc(72px + env(safe-area-inset-bottom, 0px))"}}>

        {/* Header */}
        <div style={{padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #ebebeb",position:"sticky",top:0,background:"rgba(255,255,255,.97)",backdropFilter:"blur(8px)",zIndex:50}}>
          <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
            <button onClick={()=>{setCid(null);setTab("explore")}} style={{background:"none",border:"none",cursor:"pointer",fontSize:"16px",padding:"4px",color:"#222"}}>←</button>
            <span style={{fontSize:"16px"}}>{city.emoji}</span>
            <h1 style={{margin:0,fontSize:"17px",fontWeight:700,color:"#222"}}>{city.en}</h1>
          </div>
          <div style={{fontSize:"12px",color:"#717171",fontWeight:500}}>
            🔓 {cityUnlocked.length}/{total}
            {cityUnlocked.length===total&&total>0&&" 🎉"}
          </div>
        </div>

        {/* City tabs */}
        {tab==="explore"&&(
          <div className="no-scrollbar" style={{display:"flex",gap:"8px",padding:"12px 20px",overflowX:"auto",borderBottom:"1px solid #ebebeb"}}>
            {Object.entries(CITIES).map(([id,c])=>(
              <button key={id} onClick={()=>selectCity(id)} style={{padding:"8px 16px",borderRadius:"20px",border:cid===id?"2px solid #222":"1px solid #ddd",background:cid===id?"#222":"#fff",color:cid===id?"#fff":"#717171",fontSize:"13px",fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0}}>{c.emoji} {c.nameZh}</button>
            ))}
          </div>
        )}

        {/* Content */}
        <div style={{padding:"20px 20px 0"}}>
          {tab==="explore"&&spots.map((spot,si)=>(
            <div key={spot.id} className="anim-up" style={{animationDelay:`${si*.05}s`}}>
              <FlipSpotCard spot={spot} gs={gs} city={city} unlock={unlock} openAsk={openAsk}/>
            </div>
          ))}
          {tab==="photos"&&<Photos gs={gs} setGs={s=>{setGs(s);save(s)}}/>}
          {tab==="missions"&&<Miss gs={gs} setGs={s=>{setGs(s);save(s)}} color={city.color}/>}
        </div>
      </div>

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:500,background:"rgba(255,255,255,.97)",backdropFilter:"blur(8px)",borderTop:"1px solid #ebebeb",display:"flex",zIndex:100,paddingBottom:"env(safe-area-inset-bottom, 0px)"}}>
        {[{k:"explore",e:"🗺️",l:"探索"},{k:"photos",e:"📸",l:"相册"},{k:"missions",e:"🎲",l:"任务"}].map(t=>(
          <button key={t.k} onClick={()=>{setTab(t.k);window.scrollTo({top:0,behavior:"smooth"})}} style={{flex:1,padding:"10px 0 8px",border:"none",background:"none",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:"2px",position:"relative"}}>
            <span style={{fontSize:"18px"}}>{t.e}</span>
            <span style={{fontSize:"10px",fontWeight:600,color:tab===t.k?"#222":"#b0b0b0"}}>{t.l}</span>
            {tab===t.k&&<div style={{position:"absolute",top:0,left:"30%",right:"30%",height:"2px",background:"#222",borderRadius:"0 0 2px 2px"}}/>}
          </button>
        ))}
      </div>

      {chat&&<AIChat spot={chat.spot} question={chat.question} city={city} onClose={()=>setChat(null)}/>}
    </>
  );
}
