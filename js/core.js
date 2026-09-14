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
}

function updateInventory(){
  const inv=el('inventory');
  const counts={};
  G.inventory.forEach(id=>{ counts[id]=(counts[id]||0)+1; });
  const items=Object.keys(counts).map(id=>{
    const it=ITEMS[id]; if(!it) return '';
    const cnt=counts[id];
    return `<span class="inv-item" title="${it.desc||''}">${it.name}${cnt>1?' ×'+cnt:''}</span>`;
  }).join('');
  inv.innerHTML=`<span class="inv-title">遗物</span>${items?items:'<span class="inv-empty">尚未拾起任何名字</span>'}`;
}

/* ---------- 打字机(纯渲染,不做随机异变) ---------- */
function renderText(text, done){
  el('narration').innerHTML='<span class="cursor"></span>';
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
  function step(){
    if(idx>=segs.length){ G.typewriter=false; el('narration').innerHTML=acc; if(done)done(); return; }
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
      el('narration').innerHTML=segs.map(s=>s.html).join('');
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
  const ends=getEndings();
  const ids=Object.keys(ENDINGS_V3);
  const n=ends.filter(id=>ids.includes(id)).length;
  el('gallery-count').textContent=`已见 ${n} / ${ids.length} 种结局`;
  const grid=el('gallery-grid'); grid.innerHTML='';
  ids.forEach(id=>{
    const e=ENDINGS_V3[id]; const un=ends.includes(id);
    const card=document.createElement('div');
    card.className='gcard'+(un?' unlocked':'');
    card.innerHTML=`
      <div class="gname">${un?e.name:'？ ？ ？'}</div>
      <div class="gdesc">${un?e.text:'尚未见证。换一种方式记住她,再来一次。'}</div>
      <div class="gtag">${un?(e.type==='death'?'凶 终':e.type==='good'?'吉 终':'平 终'):''}</div>`;
    grid.appendChild(card);
  });
  el('gallery-screen').classList.remove('hidden');
}

/* ============ 时辰名称 ============ */
const HOUR_NAMES=['戌时 · 黄昏','亥时 · 人定','子时 · 夜半','丑时 · 鸡鸣','寅时 · 平旦'];
