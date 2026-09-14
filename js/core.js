/* ===================================================================
   《红纸鸢 · 归名》核心引擎 (v3)
   单线叙事：寻找失踪的未婚妻。恐怖由文字、规则与"称呼"驱动，
   不显示理智/阴气等生存数值；仪式渗透(rite)与名字证据(evidence)是隐藏状态。
   剧本数据与场景编译器在 chapter-v3.js。
   =================================================================== */

let G=null;
let pendingTips=[];
let typeTimer=null;

/* ---------- 存档键 (v3) ---------- */
const SAVE_KEY='hongzhiyuan_save_v3';
const END_KEY='hongzhiyuan_endings_v3';
const MEM_KEY='hongzhiyuan_memory_v3';   // 首章是否已被玩过(用于序章微调)

function freshState(){
  return {
    version:3,
    scene:'arrival',
    flags:{},
    inventory:[],
    evidence:{paternal:0, marital:0, personal:0},
    rite:0,          // 仪式渗透 0-5,隐藏,只驱动氛围与措辞
    transcript:[],   // 最近的选择/事件,用于可回溯的重复场景差异
    visited:{},
    hour:0,          // 0戌 1亥 2子 3丑 4寅
    typewriter:false
  };
}

function saveGame(){
  if(!G) return false;
  if(G.scene==='arrival') return false; // 起点不覆盖已有进度
  try{ localStorage.setItem(SAVE_KEY, JSON.stringify(G)); return true; }catch(e){return false;}
}
function loadGame(){
  try{
    const s=localStorage.getItem(SAVE_KEY);
    if(s){ G=normalizeGameState(JSON.parse(s)); return true; }
  }catch(e){}
  return false;
}
function hasSave(){ try{return !!localStorage.getItem(SAVE_KEY);}catch(e){return false;} }
function clearSave(){ try{ localStorage.removeItem(SAVE_KEY); }catch(x){} }

function getEndings(){ try{return JSON.parse(localStorage.getItem(END_KEY)||'[]');}catch(e){return[];} }
function addEnding(id){
  const e=getEndings(); if(!e.includes(id)){ e.push(id); try{localStorage.setItem(END_KEY,JSON.stringify(e));}catch(x){} }
}
function getMemory(){ try{return JSON.parse(localStorage.getItem(MEM_KEY)||'false');}catch(e){return false;} }
function setMemory(v){ try{localStorage.setItem(MEM_KEY,JSON.stringify(v));}catch(x){} }

/* ---------- 状态小工具 ---------- */
function setFlag(k,v){ G.flags[k]=v===undefined?true:v; }
function hasFlag(k){ return !!G.flags[k]; }

function addEvidence(kind,amount){
  if(!kind||amount<=0) return;
  G.evidence[kind]=Math.min(5,evidenceScore(kind)+amount);
}
function adjustRite(d){
  if(!d) return;
  const before=G.rite;
  G.rite=Math.max(0,Math.min(5,G.rite+d));
  if(G.rite!==before) recordTranscript('rite',G.rite);
}
function recordTranscript(kind,value){
  G.transcript.push({kind,value,at:G.scene});
  if(G.transcript.length>30) G.transcript.shift();
}
/* 时辰只可向前 */
function advanceHourTo(h){ if(h>G.hour) G.hour=Math.max(0,Math.min(4,h)); }

/* ---------- UI ---------- */
const el=id=>document.getElementById(id);

function updateStats(){
  if(el('hour-name')){
    el('hour-name').textContent=HOUR_NAMES[G.hour]||'';
    const candleLeft=Math.max(0,5-G.hour);
    el('candle-icon').textContent='🕯'.repeat(candleLeft)||'·';
  }
  // 仪式渗透只改画面氛围,绝不显示数字
  const b=document.body.classList;
  b.remove('rite-low','rite-mid','rite-high','rite-critical');
  if(G.rite>=4) b.add('rite-critical');
  else if(G.rite>=3) b.add('rite-high');
  else if(G.rite>=2) b.add('rite-mid');
  else if(G.rite>=1) b.add('rite-low');
  if(G.rite>=4) Sound.startHeart(); else Sound.stopHeart();
  applyErosion();
}

function updateInventory(){
  const inv=el('inventory');
  const counts={};
  G.inventory.forEach(id=>{ counts[id]=(counts[id]||0)+1; });
  const items=Object.keys(counts).map(id=>{
    const it=ITEMS[id]; if(!it) return '';
    const cnt=counts[id];
    return `<span class="inv-item" data-item="${id}" title="${it.desc||''}">${it.name}${cnt>1?' ×'+cnt:''}</span>`;
  }).join('');
  const empty = G.rite>=3 ? EMPTY_ERODED : EMPTY_HONEST;
  inv.innerHTML=`<span class="inv-title">遗物</span>${items?items:'<span class="inv-empty">'+empty+'</span>'}`;
}

/* ================= UI 分层侵蚀 =================
   顶栏与遗物栏是全游戏唯一一直对玩家说实话的地方。仪式渗透越深，
   它们越要改口；但主菜单/结局录是"现实锚点"，只有渗透 4 或
   已被代笔（anchorFall）时才失守 —— 锚点先立住，失守才有分量。
   两条铁律：①文案一律从下面的诚实常量重算（不做增量改写，故新开一局必然恢复）；
            ②只动 label，绝不动 onclick/handler（否则会把玩家唯一出路锁死）。 */
const HOUR_RITE_SUFFIX={3:' · 礼数在替你计时',4:' · 吉时将至',5:' · 吉时将至'};
const EMPTY_HONEST='尚未拾起任何名字';
const EMPTY_ERODED='你的名字还没被写下来';
const TOPBAR_HONEST={'btn-save':'存档','btn-load':'读档','btn-menu':'主菜单'};
const TOPBAR_ERODED ={'btn-save':'存名','btn-load':'唤名','btn-menu':'归席'};
const MENU_HONEST={
  title:'红纸鸢', sub:'归 名',
  desc:'民国二十三年，浙东槐阴村。<br>你来迎亲，却没有人肯告诉你新娘在哪里。<br><br>'
      +'<span class="menu-hazard">—— 找回她，你才能离村。而规矩说，别提她的名字。</span>'
};
const MENU_FALL={
  title:'婚 已 成', sub:'归 名',
  desc:'民国二十三年，浙东槐阴村。<br>你来迎亲，却没有人肯告诉你新娘在哪里。<br><br>'
      +'<span class="menu-hazard">—— 这一句已由新郎读过。婚期第三日，礼数不缺。</span>'
};

function chromeEroded(){ return !!G && (G.rite>=4 || hasFlag('anchorFall')); }

function applyErosion(){
  if(!G) return;
  if(el('hour-name')){
    const base=HOUR_NAMES[G.hour]||'';
    el('hour-name').textContent = G.rite>=3 ? base+(HOUR_RITE_SUFFIX[G.rite]||'') : base;
  }
  const deep=G.rite>=4;
  Object.keys(TOPBAR_HONEST).forEach(id=>{
    const b=el(id); if(!b) return;
    b.textContent = deep?TOPBAR_ERODED[id]:TOPBAR_HONEST[id];
    if(deep) b.classList.add('eroded'); else b.classList.remove('eroded');
  });
}
/* 锚点失守：只重写文案，不碰按钮与流程 */
function applyMenuErosion(){
  const fell=chromeEroded();
  const src=fell?MENU_FALL:MENU_HONEST;
  if(el('menu-title')) el('menu-title').textContent=src.title;
  if(el('menu-sub'))   el('menu-sub').textContent=src.sub;
  if(el('menu-desc'))  el('menu-desc').innerHTML=src.desc;
}

/* ---------- 遗物读原文：玩家可回看核对，异常不留白 ---------- */
function readRelic(id){
  const it=ITEMS[id]; if(!it) return;
  const box=el('relic-read');
  if(!box) return;
  /* 渗透 4 起，遗物原文里她已被换成玩家此刻对她的称呼 */
  box.innerHTML='<div class="relic-name">'+it.name+'</div><div class="relic-body">'
    + (G.rite>=4 ? erodeText(it.read) : it.read) + '</div>';
  box.classList.remove('hidden');
  Sound.paper();
}

/* ---------- 打字机(纯渲染,不做随机异变) ---------- */
function renderText(text, done){
  const box=el('narration');
  /* 打字机每 ~30ms 改写一次 innerHTML; 不挂 aria-busy, 读屏会逐字重播整段 */
  box.setAttribute('aria-busy','true');
  box.innerHTML='<span class="cursor"></span>';
  if(typeTimer) clearTimeout(typeTimer);
  G.typewriter=true;
  const tokens=[]; let buf='';
  for(const ch of text){
    if(ch==='<'){ if(buf){tokens.push({t:buf});buf='';} buf+=ch; }
    else if(ch==='>'){ buf+=ch; tokens.push({tag:buf}); buf=''; }
    else buf+=ch;
  }
  if(buf) tokens.push({t:buf});
  const segs=[];
  for(const tk of tokens){
    if(tk.tag) segs.push({html:tk.tag,n:0});
    else for(const c of tk.t) segs.push({html:c,n:1});
  }
  let acc=''; let idx=0;
  el('narration').innerHTML=acc+'<span class="cursor"></span>';
  function settle(finalHtml){
    const box=el('narration');
    box.innerHTML=finalHtml;
    box.setAttribute('aria-busy','false');   /* 此刻才让读屏播报完整一段 */
  }
  function step(){
    if(idx>=segs.length){ G.typewriter=false; settle(acc); if(done)done(); return; }
    const s=segs[idx]; acc+=s.html; idx++;
    el('narration').innerHTML=acc+'<span class="cursor"></span>';
    el('narration').scrollTop=el('narration').scrollHeight;
    if(s.n) Sound.type();
    typeTimer=setTimeout(step, 30+Math.random()*24);
  }
  step();
  el('narration').onclick=function(){
    if(G.typewriter){
      if(typeTimer) clearTimeout(typeTimer);
      settle(segs.map(s=>s.html).join(''));
      G.typewriter=false; el('narration').onclick=null; if(done)done();
    }
  };
}

/* ---------- 选项 ---------- */
function renderChoices(choices){
  const box=el('choices'); box.innerHTML='';
  (choices||[]).forEach(c=>{
    const b=document.createElement('button');
    b.className='choice';
    if(c.mood) b.classList.add('mood-'+c.mood);
    b.innerHTML=c.text;
    b.setAttribute('aria-disabled', c.disabled?'true':'false');
    if(c.disabled) b.classList.add('disabled');
    else b.onclick=function(){ Sound.select(); c.action(); };
    box.appendChild(b);
  });
}

/* ---------- 提示 ---------- */
function appendTip(tp){
  const t=el('tip-area'); if(!t) return;
  const d=document.createElement('div');
  d.className='tip-line'+(tp.gain?' gain':'')+(tp.warn?' warn':'');
  d.innerHTML=tp.text;
  t.appendChild(d);
}
function showTips(tips){
  el('tip-area').innerHTML='';
  (tips||[]).forEach(appendTip);
  pendingTips.forEach(appendTip);
  pendingTips=[];
}
function flashTip(text,gain){ pendingTips.push({text,gain:!!gain}); }

/* ---------- 跳转 ---------- */
function goTo(sceneId){
  el('narration').onclick=null;
  if(typeTimer) clearTimeout(typeTimer);
  G.scene=sceneId;
  G.visited[sceneId]=(G.visited[sceneId]||0)+1;
  const h=sceneHour(sceneId);
  if(h!=null) advanceHourTo(h);
  renderScene();
  saveGame();
}

/* ---------- 结局 ---------- */
function reachEnding(endId){
  Sound.stopHeart(); Sound.stopAmbient();
  addEnding(endId);
  const e=ENDINGS_V3[endId];
  if(!e){ el('ending-name').textContent='(结局缺失)'; return; }
  setMemory(true);
  const scr=el('ending-screen');
  scr.className='ending-screen '+e.type;
  el('ending-tag').textContent=e.tag;
  el('ending-name').textContent=e.name;
  el('ending-text').innerHTML=e.text;
  el('ending-stat').innerHTML=endingStatText();
  el('ending-unlock').classList.add('hidden');
  scr.classList.remove('hidden');
  if(e.type==='death'){ Sound.death(); document.body.classList.add('deathflash'); setTimeout(()=>document.body.classList.remove('deathflash'),600); }
  else if(e.type==='good'){ Sound.reveal(); }
  else { Sound.suona(); }
  clearSave();
}

/* ---------- 主渲染 ---------- */
function renderScene(){
  const sc=currentScenes()[G.scene];
  if(!sc){ el('scene-title').textContent='…'; el('narration').innerHTML='(此处空无一物)'; el('choices').innerHTML=''; return; }
  const data=sc.run();
  el('scene-title').textContent=sc.title;
  showTips(data.tips);
  renderChoices(data.choices||[]);
  updateStats();
  updateInventory();
  renderText(data.text, ()=>{
    if(el('choices').children.length>0) el('choices').scrollIntoView({behavior:'smooth',block:'end'});
  });
}

/* ---------- 流程 ---------- */
function showMenu(){
  applyMenuErosion();
  el('menu-screen').classList.remove('hidden');
  el('ending-screen').classList.add('hidden');
  el('gallery-screen').classList.add('hidden');
  el('btn-continue').style.display = hasSave()?'inline-block':'none';
  Sound.stopHeart(); Sound.stopAmbient();
}
function startGame(){
  Sound.click();
  G=freshState();
  el('menu-screen').classList.add('hidden');
  Sound.startAmbient();
  renderScene();
}
function continueGame(){
  if(loadGame()){
    el('menu-screen').classList.add('hidden');
    Sound.startAmbient(); renderScene(); Sound.click();
  } else startGame();
}

/* ---------- 结局图鉴 ---------- */
function showGallery(){
  applyMenuErosion();
  const fell=chromeEroded();
  const ends=getEndings();
  const ids=Object.keys(ENDINGS_V3);
  const n=ends.filter(id=>ids.includes(id)).length;
  el('gallery-count').textContent=fell
    ? `${n} / ${ids.length} 种结局 —— 其余的，也已替你走过`
    : `已见 ${n} / ${ids.length} 种结局`;
  const grid=el('gallery-grid'); grid.innerHTML='';
  ids.forEach(id=>{
    const e=ENDINGS_V3[id]; const un=ends.includes(id);
    const card=document.createElement('div');
    card.className='gcard'+(un?' unlocked':'');
    const locked=fell?'尚未见证。你不必再来一次——这一种已经发生过了。':'尚未见证。换一种方式记住她，再来一次。';
    card.innerHTML=`
      <div class="gname">${un?e.name:'？ ？ ？'}</div>
      <div class="gdesc">${un?e.text:locked}</div>
      <div class="gtag">${un?(e.type==='death'?'凶 终':e.type==='good'?'吉 终':'平 终'):''}</div>`;
    grid.appendChild(card);
  });
  el('gallery-screen').classList.remove('hidden');
}

/* ============ 时辰名称 ============ */
const HOUR_NAMES=['戌时 · 黄昏','亥时 · 人定','子时 · 夜半','丑时 · 鸡鸣','寅时 · 平旦'];
