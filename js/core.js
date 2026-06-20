/* ===================================================================
   《红纸鸢》核心引擎
   含状态感知系统（理智/阴气影响文字与感知）
   =================================================================== */

const MAX_SAN=10;
let G=null;
let pendingTips=[];
let typeTimer=null;

/* ---------- 视角与存档 ---------- */
const SAVE_KEY='hongzhiyuan_save_v2';
const END_KEY='hongzhiyuan_endings_v2';
const ACH_KEY='hongzhiyuan_achievements_v2';
const POV_KEY='hongzhiyuan_pov_unlocked_v2';
const MEM_KEY='hongzhiyuan_memory_v2'; // New Game+ 记忆

const POV_LIST=['newcomer','ayuan','po']; // 新郎、阿鸢、喜婆

function freshState(pov){
  const p=pov||'newcomer';
  const startScene = p==='ayuan'?'ayuan_intro':p==='po'?'po_intro':'intro';
  return {
    pov: p,
    scene:startScene,
    san:10, yin:0,
    flags:{},
    inventory:[],
    rules:[],
    truths:[],
    visited:{},
    choicesLog:[],
    hour:0,            // 0=戌时初, 1=亥时, 2=子时, 3=丑时, 4=寅时
    hourEvents:[],     // 已触发的时辰事件
    randomEvents:[],   // 本局抽到的随机事件id
    exploredRooms:[],  // 已探索房间
    achievements:[],   // 本局获得的成就
    carriedMemory:false, // 是否携带记忆(New Game+)
    typewriter:false
  };
}

function saveGame(){
  if(!G) return false;
  // 初始场景不允许存档（避免存档覆盖新游戏）
  const startScenes=['intro','ayuan_intro','po_intro'];
  if(startScenes.includes(G.scene)) return false;
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(G)); return true; }catch(e){return false;}
}
function loadGame(){
  try{ const s=localStorage.getItem(SAVE_KEY); if(s){ G=JSON.parse(s); return true; } }catch(e){}
  return false;
}
function hasSave(){ try{return !!localStorage.getItem(SAVE_KEY);}catch(e){return false;} }
function clearSave(){ try{ localStorage.removeItem(SAVE_KEY); }catch(x){} }

function getEndings(){ try{return JSON.parse(localStorage.getItem(END_KEY)||'[]');}catch(e){return[];} }
function addEnding(id){
  const e=getEndings(); if(!e.includes(id)){ e.push(id); try{localStorage.setItem(END_KEY,JSON.stringify(e));}catch(x){} }
}
function getAchievements(){ try{return JSON.parse(localStorage.getItem(ACH_KEY)||'[]');}catch(e){return[];} }
function unlockAchievement(id){
  const ach=getAchievements();
  if(!ach.includes(id)){
    ach.push(id);
    try{localStorage.setItem(ACH_KEY,JSON.stringify(ach));}catch(x){}
    G.achievements.push(id);
    pendingTips.push({text:`【成就解锁】${ACHIEVEMENTS[id]?ACHIEVEMENTS[id].name:id}`,gain:true});
  }
}
function hasAchievement(id){ return getAchievements().includes(id); }

function getUnlockedPov(){ try{return JSON.parse(localStorage.getItem(POV_KEY)||'["newcomer"]');}catch(e){return['newcomer'];} }
function unlockPov(pov){
  const p=getUnlockedPov();
  if(!p.includes(pov)){ p.push(pov); try{localStorage.setItem(POV_KEY,JSON.stringify(p));}catch(x){} }
}
function isPovUnlocked(pov){ return getUnlockedPov().includes(pov); }

function getMemory(){ try{return JSON.parse(localStorage.getItem(MEM_KEY)||'false');}catch(e){return false;} }
function setMemory(v){ try{localStorage.setItem(MEM_KEY,JSON.stringify(v));}catch(x){} }

/* ---------- UI 渲染 ---------- */
const el=id=>document.getElementById(id);

function updateStats(){
  el('bar-san').style.width=Math.max(0,G.san)/MAX_SAN*100+'%';
  el('val-san').textContent=G.san;
  el('bar-yin').style.width=Math.min(10,G.yin)/10*100+'%';
  el('val-yin').textContent=G.yin;
  // 时辰显示
  if(el('hour-name')){
    el('hour-name').textContent=HOUR_NAMES[G.hour]||'';
    const candleLeft=Math.max(0,5-G.hour);
    el('candle-icon').textContent='🕯'.repeat(candleLeft)||'·';
  }
  // 状态异变 body class
  document.body.classList.remove('san-low','san-critical','yin-high','yin-extreme');
  if(G.san<=3) document.body.classList.add('san-critical');
  else if(G.san<=6) document.body.classList.add('san-low');
  if(G.yin>=8) document.body.classList.add('yin-extreme');
  else if(G.yin>=5) document.body.classList.add('yin-high');
  // 心跳
  if(G.san<=3) Sound.startHeart(); else Sound.stopHeart();
}

function updateInventory(){
  const inv=el('inventory');
  // 统计道具数量（纸鸢可重复）
  const counts={};
  G.inventory.forEach(id=>{ counts[id]=(counts[id]||0)+1; });
  const items=Object.keys(counts).map(id=>{
    const it=ITEMS[id]; if(!it) return '';
    const cnt=counts[id];
    return `<span class="inv-item" title="${it.desc||''}">${it.name}${cnt>1?' ×'+cnt:''}</span>`;
  }).join('');
  inv.innerHTML=`<span class="inv-title">行囊</span>${items?items:'<span style="color:rgba(80,40,20,.5);font-size:13px;letter-spacing:1px;">空空如也</span>'}`;
}

/* ============ 状态感知系统（核心） ============ */
/* 根据理智/阴气修改文字,制造"不确定自己看到的是真是假"的体验 */
/* 只处理文本节点,不处理 HTML 标签内的内容 */
function applyPerception(text){
  if(!text) return text;
  // 将文本按标签拆分,只处理非标签部分
  const parts=[];
  let last=0, idx=0;
  while(idx<text.length){
    const s=text.indexOf('<',idx);
    if(s===-1){ parts.push({tag:false,text:text.slice(last)}); break; }
    if(s>last) parts.push({tag:false,text:text.slice(last,s)});
    const e=text.indexOf('>',s);
    if(e===-1){ parts.push({tag:false,text:text.slice(s)}); break; }
    parts.push({tag:true,text:text.slice(s,e+1)});
    last=e+1; idx=e+1;
  }
  // 对非标签部分应用状态感知
  for(const p of parts){
    if(p.tag) continue;
    // 理智极低:插入异常字符
    if(G.san<=2){
      p.text=p.text.replace(/。/g,(m)=>{
        if(Math.random()<0.3) return '。<span class="glitch">鸢</span>';
        return m;
      });
      if(Math.random()<0.4){
        p.text=p.text.replace(/(红|纸|烛|喜)/,'$1$1');
      }
    }
    // 理智低:某些词变色
    else if(G.san<=4){
      if(Math.random()<0.2){
        p.text=p.text.replace(/新郎/g,'<span class="fade">新郎</span>');
      }
    }
    // 阴气高:囍字渗血
    if(G.yin>=6 && Math.random()<0.3){
      p.text=p.text.replace(/囍/g,'<span class="bleed">囍</span>');
    }
  }
  return parts.map(p=>p.text).join('');
}

/* 状态感知:可能生成幻象选项 */
function maybeAddIllusion(choices){
  if(G.san<=3 && choices.length>0 && Math.random()<0.35){
    const illusions=[
      {text:'(角落里好像有什么在动……)',illusion:true,action:()=>{ adjustSan(-1); flashTip('什么也没有。或许只是烛影。',false); renderScene(); }},
      {text:'(你听见有人在叫你的名字……)',illusion:true,action:()=>{ adjustSan(-1); Sound.breath(); flashTip('寂静。只有你自己的心跳。',false); renderScene(); }},
      {text:'(镜子里好像映出了什么……)',illusion:true,action:()=>{ adjustYin(1); flashTip('镜中空无一物。不,你不敢再看第二眼。',true); renderScene(); }},
      {text:'(你想把红烛吹灭……)',illusion:true,action:()=>{ adjustYin(2); Sound.candle(); flashTip('你忍住了。烛火是这里唯一的光。',true); renderScene(); }}
    ];
    const ill=illusions[Math.floor(Math.random()*illusions.length)];
    choices.push(ill);
  }
  return choices;
}

/* ============ 打字机渲染 ============ */
function renderText(text, done){
  // 应用状态感知
  const perceivedText=applyPerception(text);
  el('narration').innerHTML='<span class="cursor"></span>';
  if(typeTimer) clearTimeout(typeTimer);
  G.typewriter=true;
  // 解析标签与文字
  const tokens=[]; let buf=''; let intag=false;
  for(const ch of perceivedText){
    if(ch==='<'){ if(buf){tokens.push({t:buf});buf='';} intag=true; buf+=ch; }
    else if(ch==='>'){ buf+=ch; tokens.push({tag:buf}); buf=''; intag=false; }
    else { buf+=ch; }
  }
  if(buf) tokens.push({t:buf});
  const segs=[];
  for(const tk of tokens){
    if(tk.tag) segs.push({html:tk.tag,n:0});
    else { for(const c of tk.t) segs.push({html:c,n:1}); }
  }
  let acc=''; let idx=0;
  el('narration').innerHTML=acc+'<span class="cursor"></span>';
  function step(){
    if(idx>=segs.length){ G.typewriter=false; el('narration').innerHTML=acc; if(done)done(); return; }
    const s=segs[idx];
    acc+=s.html; idx++;
    el('narration').innerHTML=acc+'<span class="cursor"></span>';
    el('narration').scrollTop=el('narration').scrollHeight;
    if(s.n) Sound.type();
    typeTimer=setTimeout(step, 36+Math.random()*28);
  }
  step();
  el('narration').onclick=function(){
    if(G.typewriter){
      if(typeTimer) clearTimeout(typeTimer);
      acc=segs.map(s=>s.html).join('');
      el('narration').innerHTML=acc; G.typewriter=false;
      el('narration').onclick=null;
      if(done)done();
    }
  };
}

/* ============ 选项渲染 ============ */
function renderChoices(choices){
  // 状态感知:可能添加幻象选项
  choices=maybeAddIllusion(choices||[]);
  const box=el('choices'); box.innerHTML='';
  choices.forEach((c)=>{
    const b=document.createElement('button');
    b.className='choice';
    if(c.death) b.classList.add('death');
    if(c.illusion) b.classList.add('illusion');
    let extra='';
    if(c.cost) extra=`<span class="cost">${c.cost}</span>`;
    b.innerHTML=`${c.text}${extra}`;
    if(c.disabled) b.classList.add('disabled');
    else b.onclick=function(){
      Sound.select();
      if(c.illusion){
        onIllusionClick();
        if(c.action) c.action();
      } else {
        if(c.log) G.choicesLog.push(c.log);
        if(c.action) c.action();
        else if(c.go) goTo(c.go, c.fx);
      }
    };
    box.appendChild(b);
  });
}

/* ============ 提示渲染 ============ */
function showTips(tips){
  const t=el('tip-area'); t.innerHTML='';
  (tips||[]).forEach(tp=>{
    const d=document.createElement('div');
    d.className='tip-line'+(tp.gain?' gain':'')+(tp.warn?' warn':'');
    d.innerHTML=tp.text;
    t.appendChild(d);
  });
  pendingTips.forEach(tp=>{
    const d=document.createElement('div');
    d.className='tip-line'+(tp.gain?' gain':'')+(tp.warn?' warn':'');
    d.innerHTML=tp.text;
    t.appendChild(d);
  });
  pendingTips=[];
}
function flashTip(text,gain){ pendingTips.push({text,gain:!!gain}); }

/* ============ 场景跳转 ============ */
function goTo(sceneId, fx){
  el('narration').onclick=null;
  if(typeTimer) clearTimeout(typeTimer);
  G.scene=sceneId;
  G.visited[sceneId]=(G.visited[sceneId]||0)+1;
  // 检查时辰事件
  checkHourEvent(sceneId);
  // 检查随机事件
  checkRandomEvent(sceneId);
  if(fx==='shake'){ el('stage').classList.add('shake'); setTimeout(()=>el('stage').classList.remove('shake'),350); }
  renderScene();
  saveGame();
}

function adjustSan(d){
  const old=G.san;
  G.san=Math.max(0,Math.min(MAX_SAN,G.san+d));
  if(d<0 && old>G.san){
    // 不再用震屏,改为静默的视觉变化
    Sound.ghost();
  }
  updateStats();
  // 成就检查
  if(G.san===0 && G.scene!=='finale') checkAchievements();
}
function adjustYin(d){
  G.yin=Math.max(0,Math.min(10,G.yin+d));
  updateStats();
}
function setFlag(k,v){ G.flags[k]=v===undefined?true:v; }
function hasFlag(k){ return !!G.flags[k]; }
function addTruth(id){ if(!G.truths.includes(id)){ G.truths.push(id);} }

/* 返回当前探索中枢场景（explore 或 explore2） */
function getExploreScene(){
  return hasFlag('ziShiDone') ? 'explore2' : 'explore';
}

/* 安全推进时辰（explore2 阶段不再推进） */
function safeAdvanceHour(){
  if(hasFlag('ziShiDone')) return; // 子时已过,不再推进
  advanceHour();
}

/* ============ 结局判定 ============ */
function reachEnding(endId){
  Sound.stopHeart();
  Sound.stopAmbient();
  addEnding(endId);
  // 检查成就
  checkEndingAchievements(endId);
  // 解锁视角
  unlockPovByEnding(endId);
  const e=ENDINGS[endId];
  const scr=el('ending-screen');
  scr.className='ending-screen '+e.type;
  el('ending-tag').textContent=e.tag;
  el('ending-name').textContent=e.name;
  el('ending-text').innerHTML=e.text;
  el('ending-stat').innerHTML=`理智残存 ${G.san} · 阴气侵蚀 ${G.yin} · 查明真相 ${G.truths.length}/${TRUTH_TOTAL} · 视角 ${G.pov==='ayuan'?'阿鸢':G.pov==='po'?'喜婆':'新郎'}`;
  // 解锁提示
  const unlockEl=el('ending-unlock');
  const unlocked=[];
  if(endId==='truth' && !isPovUnlocked('ayuan')){ unlockPov('ayuan'); unlocked.push('阿鸢视角'); }
  if((endId==='truth'||endId==='save') && !isPovUnlocked('po')){ unlockPov('po'); unlocked.push('喜婆视角'); }
  if(unlocked.length>0){
    unlockEl.textContent='已解锁：'+unlocked.join('、');
    unlockEl.classList.remove('hidden');
  } else {
    unlockEl.classList.add('hidden');
  }
  scr.classList.remove('hidden');
  if(e.type==='death'){ Sound.death(); document.body.classList.add('deathflash'); setTimeout(()=>document.body.classList.remove('deathflash'),600); }
  else if(e.type==='good'){ Sound.reveal(); }
  else { Sound.suona(); }
  clearSave();
}

function unlockPovByEnding(endId){
  // 通关任意结局解锁记忆继承(New Game+)
  if(!getMemory()) setMemory(true);
}

const TRUTH_TOTAL=6;

/* ============ 主渲染 ============ */
function renderScene(){
  const scenes=getCurrentScenes();
  const sc=scenes[G.scene];
  if(!sc){ el('scene-title').textContent='…'; el('narration').innerHTML='(此处空无一物)'; el('choices').innerHTML=''; return; }
  markExploreDone();
  const data=sc.run();
  el('scene-title').textContent=sc.title;
  showTips(data.tips);
  renderChoices(data.choices||[]);
  updateStats();
  updateInventory();
  renderText(data.text, ()=>{
    if(el('choices').children.length>0)
      el('choices').scrollIntoView({behavior:'smooth',block:'end'});
  });
  // 死亡边缘检查（不在 finale/结局场景触发）
  if(G.san<=0 && G.scene!=='finale' && !G.scene.startsWith('ayuan_') && !G.scene.startsWith('po_')){
    reachEnding('puppet');
  }
}

function getCurrentScenes(){
  if(G.pov==='ayuan') return SCENES_AYUAN;
  if(G.pov==='po') return SCENES_PO;
  return SCENES;
}

function markExploreDone(){
  const s=G.scene;
  if(s==='study'||s==='study2') setFlag('doneStudy',true);
  if(s==='bridal'||s==='peekBride'||s==='mirror'||s==='bridal2') setFlag('doneBridal',true);
  if(s==='shrine'||s==='shrine2'||s==='callName') setFlag('doneShrine',true);
}

/* ============ 屏幕/流程控制 ============ */
function showMenu(){
  el('menu-screen').classList.remove('hidden');
  el('ending-screen').classList.add('hidden');
  el('gallery-screen').classList.add('hidden');
  el('ach-screen').classList.add('hidden');
  el('pov-screen').classList.add('hidden');
  el('btn-continue').style.display = hasSave()?'inline-block':'none';
  Sound.stopHeart();
  Sound.stopAmbient();
}

function startGame(pov){
  Sound.click();
  G=freshState(pov||'newcomer');
  // New Game+ 记忆继承
  if(getMemory() && G.pov==='newcomer'){
    G.carriedMemory=true;
  }
  // 抽取本局随机事件
  rollRandomEvents();
  el('menu-screen').classList.add('hidden');
  el('pov-screen').classList.add('hidden');
  Sound.startAmbient();
  renderScene();
}

function continueGame(){
  if(loadGame()){
    el('menu-screen').classList.add('hidden');
    Sound.startAmbient();
    renderScene();
    Sound.click();
  } else {
    startGame();
  }
}

function showPovSelect(){
  el('menu-screen').classList.add('hidden');
  const grid=el('pov-cards'); grid.innerHTML='';
  POV_LIST.forEach(pov=>{
    const card=document.createElement('div');
    const unlocked=isPovUnlocked(pov);
    card.className='pov-card'+(unlocked?'':' locked');
    const info=POV_INFO[pov];
    card.innerHTML=`
      <div class="pov-icon">${info.icon}</div>
      <div class="pov-name">${unlocked?info.name:'? ? ?'}</div>
      <div class="pov-desc">${unlocked?info.desc:info.lockedDesc}</div>`;
    if(unlocked){
      card.onclick=()=>startGame(pov);
    }
    grid.appendChild(card);
  });
  el('pov-screen').classList.remove('hidden');
}

function showGallery(){
  const ends=getEndings();
  // 只统计新郎视角的6个结局
  const newcomerEndings=['puppet','substitute','flee','save','together','truth'];
  const newcomerCount=newcomerEndings.filter(id=>ends.includes(id)).length;
  el('gallery-count').textContent=`新郎视角 ${newcomerCount} / 6 · 全部结局 ${ends.length} / ${Object.keys(ENDINGS).length}`;
  const grid=el('gallery-grid'); grid.innerHTML='';
  // 先显示新郎视角结局
  newcomerEndings.forEach(id=>{
    const e=ENDINGS[id]; const unlocked=ends.includes(id);
    const card=document.createElement('div');
    card.className='gcard'+(unlocked?' unlocked':'');
    card.innerHTML=`
      <div class="gname">${unlocked?e.name:'? ? ?'}</div>
      <div class="gdesc">${unlocked?e.text:'尚未解锁。再入槐阴,探寻此结局。'}</div>
      <div class="gtag">${unlocked?(e.type==='death'?'凶 终':e.type==='good'?'吉 终':'平 终'):''}</div>`;
    grid.appendChild(card);
  });
  // 再显示其他视角结局
  Object.keys(ENDINGS).forEach(id=>{
    if(newcomerEndings.includes(id)) return;
    const e=ENDINGS[id]; const unlocked=ends.includes(id);
    const card=document.createElement('div');
    card.className='gcard'+(unlocked?' unlocked':'');
    card.innerHTML=`
      <div class="gname">${unlocked?e.name:'? ? ?'}</div>
      <div class="gdesc">${unlocked?e.text:'尚未解锁。换一双眼睛,再看这个故事。'}</div>
      <div class="gtag">${unlocked?(e.type==='death'?'凶 终':e.type==='good'?'吉 终':'平 终'):''}</div>`;
    grid.appendChild(card);
  });
  el('gallery-screen').classList.remove('hidden');
}

function showAchievements(){
  const ach=getAchievements();
  const total=Object.keys(ACHIEVEMENTS).length;
  el('ach-count').textContent=`已达成 ${ach.length} / ${total} 项成就`;
  const grid=el('ach-grid'); grid.innerHTML='';
  Object.keys(ACHIEVEMENTS).forEach(id=>{
    const a=ACHIEVEMENTS[id]; const unlocked=ach.includes(id);
    const card=document.createElement('div');
    card.className='acard'+(unlocked?' unlocked':'');
    card.innerHTML=`
      <div class="aname">${unlocked?a.name:'? ? ?'}</div>
      <div class="adesc">${unlocked?a.desc:a.hint||'隐藏成就,等待发现。'}</div>`;
    grid.appendChild(card);
  });
  el('ach-screen').classList.remove('hidden');
}

/* ============ 时辰名称 ============ */
const HOUR_NAMES=['戌时 · 黄昏','亥时 · 人定','子时 · 夜半','丑时 · 鸡鸣','寅时 · 平旦'];

/* ============ 视角信息 ============ */
const POV_INFO={
  newcomer:{icon:'🕯',name:'新 郎',desc:'民俗学研究生,为论文踏入槐阴村。你不知道等待你的是什么。',lockedDesc:'初始视角。'},
  ayuan:{icon:'🪁',name:'阿 鸢',desc:'九十年前的绣娘。你被选中,被钉入棺中。你在黑暗里等了九十年,等一个肯替你说话的人。',lockedDesc:'以真相结局通关后解锁。'},
  po:{icon:'🏮',name:'喜 婆',desc:'槐阴村的喜婆。你送走了无数新郎。今夜,你又迎来一个。但这一次,你开始犹豫。',lockedDesc:'以超度或真相结局通关后解锁。'}
};

/* ============ 结局表 ============ */
const ENDINGS={
  puppet:{ type:'death', tag:'— 结 局 壹 —', name:'纸 偶', text:'你的瞳孔里映出一双含笑的眉眼——那是你自己的。红烛燃尽时,你已端坐轿中,衣袂如新。槐阴村的喜婆笑着合上轿帘:"这新郎,糊得真俊。"九十年了,这场冥婚,终于又续上了一具躯壳。'},
  substitute:{ type:'death', tag:'— 结 局 贰 —', name:'替 死', text:'红绳自腕间缠上,越收越紧。你终于想起那本禁忌册上被血污盖住的一行字——<span class="em">"新郎不系红绳,系者替之。"</span>你想喊,喉咙里却只涌出纸屑。'},
  flee:{ type:'normal', tag:'— 结 局 叁 —', name:'逃 离', text:'天光乍破时,你跌跌撞撞冲出槐阴村。回头望去,陈家老宅在晨雾中淡去,像从未存在过。论文你终究没写成——有些事,知道得越少,活得越久。只是每到深夜,你总觉得腕上还缠着一根看不见的红绳。'},
  save:{ type:'good', tag:'— 结 局 肆 —', name:'超 度', text:'你将六枚铜钱、骨灰与婚书残页一并投入火盆,念出那女子临终前的名讳。火光里,纸扎新娘的眉眼第一次没有笑意——她垂下了头。一阵风过,纸灰盘旋如蝶,九十年,她终于等来了一个肯替她说话的人。'},
  together:{ type:'death', tag:'— 结 局 伍 —', name:'同 穴', text:'你亲手为纸人盖上盖头,又为自己系上红绳。喜乐骤起,你竟觉得那唢呐声无比动听。当你的呼吸与她的重叠,你忽然记起——九十年前那个雨夜,你本就该死在这里。原来这一世,只是来赴约的。'},
  truth:{ type:'good', tag:'— 真 结 局 —', name:'真 相', text:'九十年前的槐阴村,一个叫阿鸢的绣娘被陈家选中,活活钉进棺中,为死去的陈家三郎"冲喜"。她的冤屈被写进婚书,又被村人用一本假禁忌册掩盖至今。你带着全部证据走出村口时,身后传来一声极轻的——<span class="em">"多谢。"</span>这是九十年来,槐阴村头一回,没有新郎。'}
};
