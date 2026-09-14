/* =====================================================================
   红纸鸢 · 归名 (v3) 回归测试
   运行: node tests/regression.js
   零第三方依赖: 用 Node 内置 vm 加载游戏脚本, 直接驱动场景逻辑。

   本作的地雷不是"算错数值", 而是文字冒险特有的三类:
     A 零选项死路 —— 一次性选项走完后再进该场景就什么都没有
     B 门控锁死 —— 达成条件需要的那条路本身被条件挡住了
     C 数值泄漏 —— 隐藏状态(仪式渗透/名字证据)以数字形式出现在画面或文本里
   因此这里用"静态图检查 + 定向路线 + 随机播放"三层夹击, 而非只做冒烟。
   ===================================================================== */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SCRIPTS = ['js/items.js', 'js/sound.js', 'js/chapter-v3.js', 'js/core.js'];

/* ---------- 最小 DOM / localStorage 桩 ---------- */
function makeClassList(){
  return {
    _s: new Set(),
    add(...c) { c.forEach(x => this._s.add(x)); },
    remove(...c) { c.forEach(x => this._s.delete(x)); },
    contains(c) { return this._s.has(c); }
  };
}
function makeEl() {
  return {
    style: {}, innerHTML: '', textContent: '', scrollTop: 0, scrollHeight: 0, onclick: null,
    className: '',
    classList: makeClassList(),
    children: { length: 0 },
    appendChild() {}, addEventListener() {}, scrollIntoView() {}, remove() {},
  };
}
const elements = {};
const store = {};
const sandbox = {
  console, Math, JSON, Set, Object, Array, String, Number, Boolean, RegExp, Error, Date,
  setTimeout: fn => fn(), clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  document: {
    getElementById: id => (elements[id] || (elements[id] = makeEl())),
    createElement: makeEl,
    __els: elements,   /* 供界面侵蚀断言读取真实渲染结果 */
    body: { classList: makeClassList(), appendChild() {}, addEventListener() {} },
  },
  localStorage: {
    getItem: k => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: k => { delete store[k]; },
  },
  window: { AudioContext: null },
  Audio: function () { this.play = () => ({ catch() {} }); },
  T: {},
};
sandbox.global = sandbox;
vm.createContext(sandbox);
for (const rel of SCRIPTS) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), sandbox, { filename: rel });
}

/* ---------- 测试驱动 ---------- */
vm.runInContext(`
/* 打字机与选项渲染拖慢且与逻辑无关, 直接短路; 但保留一份"上屏文本"快照供泄漏检查 */
T.screen = { narration: '', tips: [] };
renderText = function (text, done) { T.screen.narration = text; if (done) done(); };
renderChoices = function () {};
const _showTips = showTips;
showTips = function (tips) { _showTips(tips); T.screen.tips = (tips || []).map(t => t.text); };

/* 结局哨兵 */
T.ended = null;
const _reachEnding = reachEnding;
reachEnding = function (id) { T.ended = id; _reachEnding(id); };

/* 时辰回拨哨兵: advanceHourTo 是本作唯一的时间写入点 */
T.hourBad = [];
const _advanceHourTo = advanceHourTo;
advanceHourTo = function (h) {
  const before = G.hour; _advanceHourTo(h);
  if (G.hour < before) T.hourBad.push('advanceHourTo(' + h + ') ' + before + '->' + G.hour);
};

/* 一次性选项标记与场景跳转都必须记录, 便于定向复现。
   按剧本 id 定位: 选项文案会被仪式侵蚀改写, id 才是稳定标识。 */
T.tap = function (scene, id) {
  const before = G.hour;
  const list = (currentScenes()[scene].run().choices) || [];
  const hit = list.find(c => c.id === id);
  if (!hit) throw new Error('场景「' + scene + '」无可用选项 id=「' + id + '」; 实际: ' + (list.map(c => c.id).join(' | ') || '(零选项)'));
  if (hit.disabled) throw new Error('场景「' + scene + '」选项 id=「' + id + '」是禁用的');
  hit.action();
  /* 一次点击可能走完整条回调链, 回拨只会在此暴露 */
  if (G && G.hour < before) T.hourBad.push('点击「' + id + '」致回拨 ' + before + '->' + G.hour);
};

T.KEYS = ['hongzhiyuan_save_v3', 'hongzhiyuan_endings_v3', 'hongzhiyuan_memory_v3',
          'hongzhiyuan_save_v2', 'hongzhiyuan_endings_v2', 'hongzhiyuan_achievements_v2',
          'hongzhiyuan_pov_unlocked_v2', 'hongzhiyuan_memory_v2'];
/* 按剧本 id 判断选项当前是否可点。文案会被仪式侵蚀改写, id 才是稳定标识。 */
T.has = function (scene, id) {
  return (currentScenes()[scene].run().choices || []).some(c => c.id === id);
};
T.wipe = function () { T.KEYS.forEach(k => localStorage.removeItem(k)); };
T.end = id => getEndings().indexOf(id) >= 0;
T.at = () => (G ? G.scene : null);
T.pick = arr => arr[Math.floor(Math.random() * arr.length)];
T.total = () => evidenceScore('paternal') + evidenceScore('marital') + evidenceScore('personal');

/* 进宅: 默认先读碑侧账本(拿到"周氏"), 这是唯一带 paternal 证据的入门口 */
T.enter = function (o) {
  o = o || {};
  T.wipe(); T.ended = null; G = null;
  startGame();
  if (o.ledger !== false) { T.tap('arrival', 'read-ledger'); T.tap('gate-ledger', 'back'); }
  T.tap('arrival', 'enter');
};

T.court = function () { T.tap('courtyard', 'rules'); T.tap('rules', 'agree'); };

/*
 * 三条终局路线。每步显式给出, 用例之间不共享残留状态。
 *  return   : 父证 >=2 → 归籍
 *  marriage : 夫证 >=2 → 正婚;  silent 则走"喜婆替你落笔"兜底
 *  loss     : 自称 >=2 → 失讳
 */
/* 定名门要求礼数已行两样：应下规矩(+1) 与 祠堂问牌位(+1)。
   纯守规矩也能开门 —— 仪式本就靠服进而非冒犯推进。 */
T.rites = function () {
  T.tap('courtyard','shrine'); T.tap('shrine-room','ask'); T.tap('tablet-talk','back'); T.tap('shrine-room','leave');
};

T.route = function (kind) {
  if (kind === 'return') {
    T.enter(); T.court();
    T.tap('first-call', 'silence');
    T.rites();
    T.tap('courtyard', 'west');
    T.tap('west-room', 'take-father');
    T.tap('evidence-father', 'back');
    T.tap('west-room', 'leave');
    T.tap('courtyard', 'naming');
    T.tap('naming', 'paternal');
    return;
  }
  if (kind === 'marriage') {
    T.enter(); T.court();
    T.tap('first-call', 'silence');
    T.tap('courtyard', 'west');
    T.tap('west-room', 'take-husband');
    T.tap('evidence-husband', 'back');
    T.tap('west-room', 'leave');
    T.rites();
    T.tap('courtyard', 'naming');
    T.tap('naming', 'marital');
    return;
  }
  if (kind === 'marriage-silent') {
    /* 只读了账本、什么都没深究的新郎: 系统会替他写完这个名字 */
    T.enter(); T.court();
    T.tap('first-call', 'silence');
    T.rites();
    T.tap('courtyard', 'naming');
    T.tap('naming', 'let-them');
    return;
  }
  if (kind === 'loss') {
    T.enter(); T.court();
    T.tap('first-call', 'answer');
    T.tap('answered-call', 'step-back');
    T.rites();
    T.tap('courtyard', 'west');
    T.tap('west-room', 'take-personal');
    T.tap('evidence-personal', 'back');
    T.tap('west-room', 'leave');
    T.tap('courtyard', 'naming');
    T.tap('naming', 'personal');
    T.tap('loss-question', 'return-name');
    return;
  }
  if (kind === 'reunion') {
    /* 三类证据各至少一枚 → 照面, 再把她从"新妇"里纠正出来 */
    T.enter(); T.court();
    T.tap('first-call', 'silence');
    T.tap('courtyard', 'west');
    T.tap('west-room', 'take-personal');
    T.tap('evidence-personal', 'back');
    T.tap('west-room', 'take-husband');
    T.tap('evidence-husband', 'back');
    T.tap('west-room', 'leave');
    T.tap('courtyard', 'east');
    T.tap('east-room', 'kite');
    T.tap('kite-clue', 'keep');
    T.tap('east-room', 'leave');
    T.rites();
    T.tap('courtyard', 'reunion');
    T.tap('reunion', 'correct');
    return;
  }
  throw new Error('未知路线 ' + kind);
};

/* 随机播放一局; 返回 null 表示正常收场, 否则返回问题描述 */
T.fuzzOnce = function () {
  T.ended = null; T.hourBad.length = 0; G = null;
  startGame(); clearSave();
  for (let step = 0; step < 400; step++) {
    const sc = currentScenes()[G.scene];
    if (!sc) return '缺失场景 ' + G.scene;
    let data;
    try { data = sc.run(); } catch (e) { return '渲染异常 ' + G.scene + ': ' + e.message; }
    const usable = (data.choices || []).filter(c => !c.disabled);
    if (!usable.length) return '零选项死路 ' + G.scene;
    const c = T.pick(usable);
    try { c.action(); } catch (e) { return '跳转异常 ' + G.scene + ': ' + e.message; }
    if (T.ended) return null;
    if (T.hourBad.length) return '时辰回拨: ' + T.hourBad[0];
  }
  return '400 步未收敛, 停在 ' + G.scene;
};
`, sandbox);

const run = expr => vm.runInContext(expr, sandbox);
const runJson = expr => JSON.parse(vm.runInContext(expr, sandbox));

let failed = 0;
function check(name, actual, expected) {
  const ok = String(actual) === String(expected);
  if (!ok) failed++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(34)} ${actual}${ok ? '' : `   ← 期望 ${expected}`}`);
}
function section(t) { console.log(`\n${t}`); }
function guard(name, fn) {
  try { fn(); } catch (e) { failed++; console.log(`  FAIL  ${name}\n        ${e.message}`); }
}

/* =====================================================================
   1. 静态图检查: 不跑起来就能发现的结构性缺陷
   ===================================================================== */
section('1. 场景图静态不变量');
const graph = runJson(`(function(){
  const ids=Object.keys(CHAPTER_V3), bad=[], allOnce=[], unreachable=[];
  /* disabled 项是"锁门说明"，不是可导航的边 */
  const nav=id=>(CHAPTER_V3[id].choices||[]).filter(c=>!c.disabled);
  ids.forEach(id=>{
    const cs=nav(id);
    if(!CHAPTER_V3[id].choices.length) bad.push(id+':无任何选项');
    cs.forEach(c=>{ if(!ENDINGS_V3[c.next] && !CHAPTER_V3[c.next]) bad.push(id+'.'+c.id+' -> 未知目标 '+c.next); });
    /* 全是一次性选项的场景 = 重访必死 */
    if(cs.length && cs.every(c=>c.once)) allOnce.push(id);
  });
  /* 从 arrival 出发的可达闭包 */
  const seen=new Set(['arrival']), q=['arrival'];
  while(q.length){ const id=q.shift();
    nav(id).forEach(c=>{ const n=c.next;
      if(CHAPTER_V3[n]&&!seen.has(n)){seen.add(n);q.push(n);} });
  }
  ids.forEach(id=>{ if(!seen.has(id)) unreachable.push(id); });
  /* 终局门前必须留退路。"是否死路"必须按传递闭包判：
     naming 的 personal 边指向 loss-question, 那是场景不是结局,
     但它自己所有出边都通向结局 —— 所以 naming 同样是单向门。 */
  const terminal=new Set(); let grew=true;
  while(grew){ grew=false;
    ids.forEach(id=>{ const cs=nav(id);
      if(!cs.length || terminal.has(id)) return;
      if(cs.every(c=>ENDINGS_V3[c.next]||terminal.has(c.next))){ terminal.add(id); grew=true; } }); }
  const noExit=[...terminal].filter(id=>id!=='loss-question');
  /* 中庭曾是单程票：进宅后再也回不到村口石碑 */
  const fromCourt=new Set(['courtyard']),qc=['courtyard'];
  while(qc.length){ const id=qc.shift();
    nav(id).forEach(c=>{ if(CHAPTER_V3[c.next]&&!fromCourt.has(c.next)){fromCourt.add(c.next);qc.push(c.next);} }); }
  const oneWay=!fromCourt.has('arrival');
  const endsWithEntry=Object.keys(ENDINGS_V3).filter(e=>ids.some(id=>nav(id).some(c=>c.next===e)));
  return JSON.stringify({bad:bad,allOnce:allOnce,unreachable:unreachable,noExit:noExit,oneWay:oneWay,
    endsWithEntry:endsWithEntry,sceneCount:ids.length,endingCount:Object.keys(ENDINGS_V3).length});
})()`);
guard('无悬空跳转', () => check('坏边', graph.bad.length ? graph.bad.join(',') : '(无)', '(无)'));
guard('无"全是选项皆一次性"的场景', () => check('重访即死锁场景', graph.allOnce.length ? graph.allOnce.join(',') : '(无)', '(无)'));
guard('所有场景自 arrival 可达', () => check('不可达场景', graph.unreachable.length ? graph.unreachable.join(',') : '(无)', '(无)'));
guard('结局门前不得断掉退路', () => check('必然终结的场景', graph.noExit.length ? graph.noExit.join(',') : '(无)', '(无)'));
guard('进宅后仍须回得去村口', () => check('courtyard 单向门', graph.oneWay, 'false'));
guard('三个结局均有入口', () => check('结局入口数', graph.endsWithEntry.length, '3'));

/* =====================================================================
   2. 零选项死路: 把每个场景在其"已消耗一次性选项"后再进一次
   ===================================================================== */
section('2. 一次性选项耗尽后仍可离开');
guard('逐场景二次进入均有出路', () => {
  const problems = run(`(function(){
    const bad=[];
    Object.keys(CHAPTER_V3).forEach(id=>{
      /* 先按"全部一次性选项都已用过"的最坏状态构造存档 */
      T.wipe(); G=null; startGame();
      G.scene=id;
      Object.keys(CHAPTER_V3).forEach(k=>(CHAPTER_V3[k].choices||[]).forEach(c=>{ if(c.once) setFlag('choice-'+c.id); }));
      G.rite=0; G.evidence={paternal:0,marital:0,personal:0};
      const cs=currentScenes()[id].run().choices||[];
      if(!cs.length) bad.push(id);
    });
    return bad.join(',');
  })()`);
  check('零选项场景', problems || '(无)', '(无)');
});

/* =====================================================================
   3. 三结局可达性 —— 曾经 naming 场景根本没有入口
   ===================================================================== */
section('3. 三种结局定向可达');
for (const [kind, expect] of [['return', 'ending-return'], ['marriage', 'ending-marriage'],
                              ['loss', 'ending-loss'], ['marriage-silent', 'ending-marriage']]) {
  guard(`${kind} 路线`, () => {
    run(`T.hourBad.length=0; T.route('${kind}')`);
    check(`${kind} → 结局`, run('T.ended'), expect);
    check(`${kind} → 写入结局录`, run(`T.end('${expect}')`), 'true');
    check(`${kind} → 时辰未回拨`, run('T.hourBad.length'), '0');
  });
}
guard('照面场景在证据 >=3 时开放', () => {
  run(`T.route('reunion')`);
  check('未直接落到结局', run('T.ended'), 'null');
  check('纠正称呼已生效', run('hasFlag("correctedName")'), 'true');
  /* 断言"纠正使渗透降一档", 而不是写死绝对值 —— 定名门提高后路线要先行两礼 */
  check('纠正后仪式渗透回落一档',
    run(`(function(){ const r=G.transcript.filter(e=>e.kind==='rite').map(e=>e.value);
          return r.length>=2 ? (r[r.length-1] === r[r.length-2]-1 ? 'true':'false') : '(无 rite 变化记录)'; })()`), 'true');
});

/* =====================================================================
   4. 门控: 证据不足时不得出现定名/照面; 足量时必须出现
   ===================================================================== */
section('4. 寻名进度门控');
guard('零证据时 courtyard 不给定名', () => {
  run(`T.wipe(); G=null; startGame(); T.tap('arrival','enter')`);
  check('证据总数', run('T.total()'), '0');
  check('无定名选项', run(`T.has('courtyard','naming')`), 'false');
  check('无照面选项', run(`T.has('courtyard','reunion')`), 'false');
  check('仍有出路(不锁死)', run(`currentScenes().courtyard.run().choices.length>0`), 'true');
});
guard('礼数行满但证据为零, 定名门仍不开(两道门各自有效)', () => {
  /* 上一节零证据时渗透也是 0, 光靠那一条判不出"证据门是否还在";
     这里把 rite 补足, 单独暴露证据要求。 */
  run(`T.wipe(); G=null; startGame(); G.rite=5`);
  check('证据仍为零', run('T.total()'), '0');
  check('不给定名', run(`T.has('courtyard','naming')`), 'false');
  check('也不给锁门说明', run(`T.has('courtyard','naming-locked')`), 'false');
});
guard('证据齐但礼数未行时, 门开着但写明白为何不能进', () => {
  run(`T.enter({ledger:false}); addEvidence('paternal',1)`);
  check('礼数未行不给定名', run(`T.has('courtyard','naming')`), 'false');
  check('锁门说明可见', run(`T.has('courtyard','naming-locked')`), 'true');
  check('锁门说明确实不可点',
    run(`currentScenes().courtyard.run().choices.find(c=>c.id==='naming-locked').disabled`), 'true');
  check('1 类证据不可照面', run(`T.has('courtyard','reunion')`), 'false');
  run(`G.rite=2`);
  check('礼数补足即可定名', run(`T.has('courtyard','naming')`), 'true');
  check('开门后锁门说明让位', run(`T.has('courtyard','naming-locked')`), 'false');
  run(`addEvidence('marital',1); addEvidence('personal',1)`);
  check('3 类证据可照面', run(`T.has('courtyard','reunion')`), 'true');
});
guard('零礼数也能开门: 仪式靠服进而非冒犯推进', () => {
  /* 全程不违一条规矩, 只应规矩 + 问牌位 两礼, 即可抵达三个结局 */
  run(`T.wipe(); T.ended=null; G=null; startGame();
       T.tap('arrival','read-ledger'); T.tap('gate-ledger','back'); T.tap('arrival','enter');
       T.tap('courtyard','rules'); T.tap('rules','agree'); T.tap('first-call','silence');
       T.tap('courtyard','shrine'); T.tap('shrine-room','ask'); T.tap('tablet-talk','back'); T.tap('shrine-room','leave')`);
  check('纯守规矩两礼即开门', run(`T.has('courtyard','naming')`), 'true');
  check('且未违反任何规矩', run(`hasFlag('answeredName')||hasFlag('liftedVeil')`), 'false');
});
guard('定名前不得有零选项死路', () => {
  check('沉默兜底始终可用', run(`T.has('naming','let-them')`), 'true');
});
guard('同一路证据有上限,不可反复刷', () => {
  run(`T.wipe(); G=null; startGame(); for(let i=0;i<20;i++) addEvidence('paternal',2)`);
  check('父证封顶', run('evidenceScore("paternal")'), '5');
  check('原始存储也被夹住(不靠读时兜底)', run('G.evidence.paternal'), '5');
  check('证据总数封顶', run('T.total()'), '5');
});
guard('可重复选项不得刷出隐藏状态', () => {
  run(`T.wipe(); G=null; startGame(); G.scene='east-room'; adjustRite(0)`);
  run(`(function(){ const tap=(s,id)=>currentScenes()[s].run().choices.find(c=>c.id===id).action();
        for(let i=0;i<30;i++){ tap('east-room','lift'); tap('open-veil','close'); } })()`);
  check('掀帘 30 次后渗透仍为 1', run('G.rite'), '1');
  check('掀帘仍可随时再掀(叙事未被锁死)', run(`T.has('east-room','lift')`), 'true');
  run(`G.scene='shrine-room'`);
  run(`(function(){ const tap=(s,id)=>currentScenes()[s].run().choices.find(c=>c.id===id).action();
        for(let i=0;i<30;i++){ tap('shrine-room','burn'); tap('burning','step-back'); } })()`);
  check('投火盆 30 次后自称证据仍为 1', run('evidenceScore("personal")'), '1');
  check('刷不到《失讳》门槛(需 2)', run('evidenceScore("personal") < 2'), 'true');
});
guard('误点定名不再被迫通关,可退回补证据', () => {
  run(`T.wipe(); G=null; startGame();
       T.tap('arrival','read-ledger'); T.tap('gate-ledger','back'); T.tap('arrival','enter');
       T.tap('courtyard','rules'); T.tap('rules','agree'); T.tap('first-call','silence');
       T.tap('courtyard','shrine'); T.tap('shrine-room','ask'); T.tap('tablet-talk','back'); T.tap('shrine-room','leave');
       T.tap('courtyard','naming')`);
  check('只有 1 点证据时仍可退出', run(`T.has('naming','not-yet')`), 'true');
  check('退出前未触发任何结局', run('T.ended'), 'null');
  run(`T.tap('naming','not-yet')`);
  check('退回后还在游戏内', run('T.at()'), 'courtyard');
  check('退回后时辰不回拨', run('G.hour'), '4');
  run(`T.tap('courtyard','west'); T.tap('west-room','take-father'); T.tap('evidence-father','back');
       T.tap('west-room','leave'); T.tap('courtyard','naming')`);
  check('补证据后具名结局可选', run(`T.has('naming','paternal')`), 'true');
  run(`T.tap('naming','paternal')`);
  check('最终仍能拿到归籍', run('T.ended'), 'ending-return');
});
guard('一次性选项用完即消失', () => {
  run(`T.wipe(); G=null; startGame();
       T.tap('arrival','read-ledger'); T.tap('gate-ledger','back'); T.tap('arrival','enter');
       T.tap('courtyard','west'); T.tap('west-room','take-father'); T.tap('evidence-father','back')`);
  check('父亲的信已不可再取', run(`T.has('west-room','take-father')`), 'false');
  check('其余两封仍可取', run(`['take-husband','take-personal'].filter(id=>T.has('west-room',id)).length`), '2');
  check('重复取证据不会叠加', run(`evidenceScore('paternal')`), '3');
});

/* =====================================================================
   5. 设计契约: 不显示理智/阴气等生存数值
   ===================================================================== */
section('5. 隐藏状态不外泄为数值');
guard('状态里根本没有 san/yin 字段', () => {
  run(`T.wipe(); G=null; startGame()`);
  check('无 san', run(`'san' in G`), 'false');
  check('无 yin', run(`'yin' in G`), 'false');
  check('无 truths', run(`'truths' in G`), 'false');
});
guard('全程画面文本不含生存数值字样', () => {
  const hits = run(`(function(){
    const banned=['理智','阴气','SAN','san:','点阴德'];
    const bad=[];
    T.wipe();
    for(let i=0;i<120;i++){
      G=null; startGame();
      for(let s=0;s<60 && !T.ended;s++){
        const sc=currentScenes()[G.scene]; if(!sc) break;
        T.ended=null;
        const d=sc.run();
        const hay=(T.screen.narration+T.screen.tips.join(''));
        banned.forEach(b=>{ if(hay.indexOf(b)>=0) bad.push(G.scene+':'+b); });
        /* 渗透/证据绝不允许以"数字条"形式出现在正文 */
        if(/仪式渗透\\s*\\d/.test(T.screen.narration)) bad.push(G.scene+':渗透数值裸露');
        const cs=(d.choices||[]).filter(c=>!c.disabled); if(!cs.length) break;
        T.pick(cs).action();
      }
    }
    return [...new Set(bad)].join(' ; ');
  })()`);
  check('泄漏点', hits || '(无)', '(无)');
});
guard('仪式渗透只以氛围与措辞现身', () => {
  run(`T.wipe(); G=null; startGame(); adjustRite(4); updateStats()`);
  check('渗透 4 挂 rite-critical', run(`document.body.classList.contains('rite-critical')`), 'true');
  check('渗透 4 追加替念一句', run(`currentScenes().courtyard.run().text.indexOf('class="rited"')>=0`), 'true');
  check('追加句不得再引入裸"她"', run(`(function(){ addEvidence('marital',5);
      const t=currentScenes().courtyard.run().text; return /替她|她的/.test(t.slice(t.indexOf('class="rited"'))); })()`), 'false');
  run(`G.rite=2; updateStats()`);
  check('渗透 2 不挂 critical', run(`document.body.classList.contains('rite-critical')`), 'false');
  check('渗透 2 挂 rite-mid', run(`document.body.classList.contains('rite-mid')`), 'true');
  check('渗透 2 不追加', run(`currentScenes().courtyard.run().text.indexOf('class="rited"')>=0`), 'false');
});
guard('结局小结只给措辞, 不给分数', () => {
  run(`T.route('return')`);
  const stat = run('endingStatText()');
  check('无"X/6"式计数', /\d+\s*\/\s*\d+/.test(stat) ? stat : '(无)', '(无)');
  check('含称呼', stat.indexOf('称呼') >= 0, 'true');
});

/* =====================================================================
   6. 确定性: 同一状态两次渲染必须逐字相同(幻象类随机选项已废除)
   ===================================================================== */
section('6. 渲染确定性');
guard('重复 run 输出一致', () => {
  /* 本节是"异变只能来自确定状态"的守门人。只跑两遍比对的话, 一个
     50% 掷硬币的实现有一半机会蒙过去 —— 所以这里把 Math.random 换成
     交替越过阈值的序列, 让任何掷硬币式写法必然产出两种结果。 */
  const diff = run(`(function(){
    const bak=Math.random;
    let flip=false; Math.random=()=>((flip=!flip)?0.51:0.49);
    try{
      T.wipe(); G=null; startGame(); T.tap('arrival','read-ledger'); T.tap('gate-ledger','back');
      T.tap('arrival','enter'); addEvidence('paternal',2); adjustRite(3);
      const bad=[];
      [0,2,3,5].forEach(r=>{ G.rite=r;
        Object.keys(CHAPTER_V3).forEach(id=>{
          G.scene=id;
          const a=currentScenes()[id].run(), b=currentScenes()[id].run();
          if(a.text!==b.text) bad.push(id+'@'+r+':文本');
          if(JSON.stringify(a.choices.map(c=>c.text))!==JSON.stringify(b.choices.map(c=>c.text))) bad.push(id+'@'+r+':选项');
        });
      });
      return bad.join(',');
    }finally{ Math.random=bak; }
  })()`);
  check('非确定性场景', diff || '(无)', '(无)');
});

/* =====================================================================
   7. 称呼替换: 渗透 >=2 起, "她"必须开始被玩家自己的措辞接管
   ===================================================================== */
section('7. 称呼渗透');
guard('rite 阈值前后文本不同', () => {
  const tags = s => (s.match(/<[^>]*>/g) || []).join('|');
  run(`T.wipe(); G=null; startGame(); addEvidence('paternal',3); G.rite=1`);
  const low = run(`currentScenes()['evidence-father'].run().text`);
  run(`G.rite=2`);
  const high = run(`currentScenes()['evidence-father'].run().text`);
  check('渗透 1 正文含裸"她"', (low.match(/她/g) || []).length, '2');
  check('渗透 2 起被替换为周氏', (high.match(/周氏/g) || []).length >= 2, 'true');
  check('替换后不留裸"她"', /她/.test(high), 'false');
  check('替换不破坏 HTML 标签', tags(high), tags(low));
  check('阈值前后文本确有改写', low !== high, 'true');
});
guard('dominantName 取最响的一路', () => {
  run(`T.wipe(); G=null; startGame()`);
  check('零证据 → 她', run('dominantName()'), '她');
  run(`addEvidence('marital',3)`);
  check('夫证最响 → 新妇', run('dominantName()'), '新妇');
  run(`addEvidence('personal',4)`);
  check('自称最响 → 鸢', run('dominantName()'), '鸢');
  check('并列时自称优先', run(`(addEvidence('paternal',4),dominantName())`), '鸢');
});

/* =====================================================================
   8. 重复场景差量文本
   ===================================================================== */
section('8. 重访差量');
guard('first/again 文本确有不同', () => {
  const same = run(`(function(){
    T.wipe(); G=null; startGame();
    const bad=[];
    Object.keys(CHAPTER_V3).forEach(id=>{
      /* textFn 场景(账页)的文案完全由状态推导, 本就没有 first/again 一对;
         它的重访差量靠"合上婚书时记下的行数基线", 只能走真实路径验证 —— 见第 13 节。 */
      if(CHAPTER_V3[id].textFn) return;
      G.scene=id; G.visited={};
      const one=currentScenes()[id].run().text;
      G.visited[id]=2;
      const two=currentScenes()[id].run().text;
      if(one===two) bad.push(id);
    });
    return bad.join(',');
  })()`);
  check('重访文本无变化', same || '(无)', '(无)');
});

/* =====================================================================
   9. 时辰只可向前
   ===================================================================== */
section('9. 时辰单调性');
guard('四条路线全程无回拨', () => {
  const bad = run(`(function(){
    const out=[];
    ['return','marriage','loss','reunion','marriage-silent'].forEach(k=>{
      T.hourBad.length=0;
      try{ T.route(k); }catch(e){ out.push(k+' 抛错:'+e.message); }
      if(T.hourBad.length) out.push(k+':'+T.hourBad.join(','));
    });
    return out.join(' ; ');
  })()`);
  check('回拨点', bad || '(无)', '(无)');
  check('终局时辰不倒退', run('G.hour<=4'), 'true');
});

/* =====================================================================
   10. 存档: 归一化 / 起点不覆盖 / 断点续玩
   ===================================================================== */
section('10. 存档与归一化');
guard('起点不覆盖已有进度', () => {
  run(`T.wipe(); G=null; startGame()`);
  check('停在起点', run('G.scene'), 'arrival');
  check('arrival 时拒绝存档', run('saveGame()'), 'false');
  run(`G.scene='courtyard'; saveGame();`);
  const before = run(`JSON.parse(localStorage.getItem('hongzhiyuan_save_v3')).scene`);
  run(`G.scene='arrival'; saveGame();`);
  check('回起点不覆盖', run(`JSON.parse(localStorage.getItem('hongzhiyuan_save_v3')).scene`), before);
});
guard('缺字段/脏场景的旧档可归一', () => {
  run(`T.wipe(); localStorage.setItem('hongzhiyuan_save_v3', JSON.stringify({scene:'不存在的场景'}))`);
  check('读脏档成功', run('loadGame()'), 'true');
  check('非法场景回起点', run('G.scene'), 'arrival');
  check('evidence 已补默认', run('T.total()'), '0');
  check('rite 已补默认', run('G.rite'), '0');
  check('version 归一', run('G.version'), '3');
  run(`localStorage.setItem('hongzhiyuan_save_v3', JSON.stringify({scene:'west-room',rite:99,hour:-3,inventory:'x'}))`);
  run('loadGame()');
  check('渗透越界被夹住', run('G.rite'), '5');
  check('时辰越界被夹住', run('G.hour'), '0');
  check('inventory 非数组被重建', run('Array.isArray(G.inventory)'), 'true');
  run(`localStorage.setItem('hongzhiyuan_save_v3', JSON.stringify({scene:'west-room',flags:'x',inventory:['kite','ghostItem',5]}))`);
  run('loadGame()');
  check('flags 类型错误被重建', run('Object.keys(G.flags).length'), '0');
  check('未知遗物被剔除', run(`JSON.stringify(G.inventory)`), '["kite"]');
});
guard('断点续玩状态一致', () => {
  run(`T.wipe(); G=null; startGame(); T.tap('arrival','read-ledger'); T.tap('gate-ledger','back');
       T.tap('arrival','enter'); addEvidence('paternal',2); G.scene='courtyard'; saveGame();`);
  const snap = run(`JSON.stringify({e:G.evidence,r:G.rite,h:G.hour,f:Object.keys(G.flags).sort(),i:G.inventory})`);
  run(`G=null; loadGame();`);
  const back = run(`JSON.stringify({e:G.evidence,r:G.rite,h:G.hour,f:Object.keys(G.flags).sort(),i:G.inventory})`);
  check('读回与存出一致', back, snap);
  check('读回后仍可渲染', run(`!!currentScenes()[G.scene]`), 'true');
});
guard('到达结局清除存档', () => {
  run(`T.route('return')`);
  check('结局后无存档', run('hasSave()'), 'false');
});

/* =====================================================================
   11. 遗物: 五件皆可得且不会重复入囊
   ===================================================================== */
section('11. 遗物与称呼碎片');
guard('单局集齐五件', () => {
  run(`T.wipe(); G=null; startGame();
       T.tap('arrival','read-ledger'); T.tap('gate-ledger','back'); T.tap('arrival','enter');
       T.tap('courtyard','rules'); T.tap('rules','agree'); T.tap('first-call','silence');
       T.tap('courtyard','west');
       T.tap('west-room','take-father');    T.tap('evidence-father','back');
       T.tap('west-room','take-husband');   T.tap('evidence-husband','back');
       T.tap('west-room','take-personal');  T.tap('evidence-personal','back');
       T.tap('west-room','leave');
       T.tap('courtyard','east');
       T.tap('east-room','kite');           T.tap('kite-clue','keep');
       T.tap('east-room','leave');
       T.tap('courtyard','shrine');         T.tap('shrine-room','burn');
       T.tap('burning','return');
       T.tap('shrine-room','leave')`);
  const missing = run(`Object.keys(ITEMS).filter(k=>G.inventory.indexOf(k)<0)`);
  check('缺失遗物', missing.length ? missing.join(',') : '(无)', '(无)');
  check('五件不重复', run(`G.inventory.length`), run(`new Set(G.inventory).size`));
});

/* =====================================================================
   12. 作者权侵蚀: 仪式接管"谁在说话", 但不得改变选择本身
   ===================================================================== */
section('12. 作者权侵蚀');
guard('渗透 2 起叙述性选项被改口, 且不改变指向与效果', () => {
  run(`T.wipe(); G=null; startGame(); T.tap('arrival','read-ledger'); T.tap('gate-ledger','back');
       T.tap('arrival','enter')`);
  const clean = run(`(function(){ const c=currentScenes().courtyard.run().choices.find(x=>x.id==='margins');
                      return [c.rawLabel, c.text, /你/.test(c.text)].join('#'); })()`);
  check('渗透 0 原文', clean.split('#')[0], clean.split('#')[1]);
  run(`G.rite=2`);
  /* 同一状态连评 30 次: 掷硬币式的实现必然在这里露馅 */
  const probe = run(`(function(){
    const seen=new Set(); let hadYou=false;
    for(let i=0;i<30;i++){
      const c=currentScenes().courtyard.run().choices.find(x=>x.id==='margins');
      seen.add(c.text); if(/你/.test(c.text)) hadYou=true;
    }
    return JSON.stringify({n:seen.size, changed:[...seen].some(t=>t!==${JSON.stringify(clean.split('#')[0])}), hadYou});
  })()`);
  const p = JSON.parse(probe);
  check('渗透 2 措辞确定', p.n, '1');
  check('渗透 2 已改口', p.changed, 'true');
  check('渗透 2 不再对玩家说"你"', p.hadYou, 'false');
  const before = run(`[G.scene, T.total(), G.inventory.join(',')].join('|')`);
  run(`T.tap('courtyard','margins')`);
  check('改口不改行为: 仍进同一场景', run(`[G.scene, T.total(), G.inventory.join(',')].join('|')`),
        'margins|'+before.split('|').slice(1).join('|'));
});
guard('玩家说出口的话不得被接管', () => {
  run(`T.wipe(); G=null; startGame(); G.rite=3`);
  check('纠正称呼仍是对她讲的原句',
    run(`currentScenes().reunion.run().choices.find(c=>c.id==='correct').text`),
    run(`CHAPTER_V3.reunion.choices.find(c=>c.id==='correct').label`));
  check('失讳自白一字不动',
    run(`(G.scene='loss-question', currentScenes()['loss-question'].run().choices.find(c=>c.id==='admit-loss').text)`),
    run(`CHAPTER_V3['loss-question'].choices.find(c=>c.id==='admit-loss').label`));
  check('失讳正文不被接管', run(`/新郎/.test(currentScenes()['loss-question'].run().text)`), 'false');
});
guard('渗透满格后正文连"你"也不给玩家', () => {
  run(`T.wipe(); G=null; startGame(); addEvidence('marital',3); G.scene='evidence-husband'; G.rite=4`);
  check('渗透 4 正文仍称玩家为"你"', run(`/你/.test(currentScenes()['evidence-husband'].run().text)`), 'true');
  run(`G.rite=5`);
  check('渗透 5 改称"新郎"', run(`currentScenes()['evidence-husband'].run().text.indexOf('新郎')>=0`), 'true');
});
guard('侵蚀不得破坏 HTML 标签', () => {
  const bad = run(`(function(){
    const tags=s=>(s.match(/<[^>]*>/g)||[]).join('|');
    const out=[];
    [0,1,2,3,4,5].forEach(r=>{ Object.keys(CHAPTER_V3).forEach(id=>{
      T.wipe(); G=null; startGame(); addEvidence('marital',3); G.rite=r; G.scene=id;
      const d=currentScenes()[id].run();
      /* 正文：尖括号必须成对, 且每个 < 都开启一个标签(替换若切进标签会留下裸 < 或孤立 >) */
      const t=d.text;
      const lt=(t.match(/</g)||[]).length, gt=(t.match(/>/g)||[]).length;
      if(lt!==gt) out.push(id+' 尖括号不成对');
      if(/<(?![\\/]?[a-zA-Z])/.test(t)) out.push(id+' 正文掺入残标签');
      /* 选项：只许换字, 标签结构必须与诚实原文完全一致 */
      d.choices.forEach(c=>{ if(tags(c.text)!==tags(c.rawLabel)) out.push(id+'.'+c.id+' 选项标签'); });
    }); });
    return [...new Set(out)].join(' ; ');
  })()`);
  check('破损点', bad || '(无)', '(无)');
});

/* =====================================================================
   13. 回看账: 契约第 2 条要求每次异常都能被核对
   ===================================================================== */
section('13. 回看账(婚书边角)');
guard('账页永远诚实且必有出口', () => {
  run(`T.wipe(); G=null; startGame(); G.rite=5; addEvidence('marital',5); setFlag('answeredName')`);
  const t = run(`currentScenes().margins.run().text`);
  check('账页不被仪式改写', /新郎/.test(t), 'false');
  check('账页含已犯之违规', t.indexOf('门外叫了一声')>=0, 'true');
  check('出口始终可用', run(`T.has('margins','back')`), 'true');
});
guard('每条违规都在账上留一行, 且重访比对真认行数', () => {
  run(`T.wipe(); G=null; startGame(); G.scene='margins'`);
  const empty = run(`currentScenes().margins.run().text`);
  check('干净时不虚构罪证', empty.indexOf('这些边角还空着')>=0, 'true');
  check('干净时不谎称有字', empty.indexOf('不是你写')>=0, 'false');
  run(`setFlag('liftedVeil'); setFlag('burnedMarriagePaper')`);
  const two = run(`currentScenes().margins.run().text`);
  check('掀帘入账', two.indexOf('轿帘')>=0, 'true');
  check('焚书入账', two.indexOf('烧过')>=0, 'true');
  check('未比对过就不谎称变多', two.indexOf('多出')>=0, 'false');
  /* 真走一遍：进账页 → 合上落基线 → 再违规 → 再进账页 */
  run(`T.tap('courtyard','margins')`);
  check('首访不谎称变多', run(`currentScenes().margins.run().text.indexOf('多出')>=0`), 'false');
  run(`T.tap('margins','back')`);
  check('合上时记下 2 行', run(`G.flags['margins-rows']`), '2');
  run(`setFlag('answeredName')`);
  run(`T.tap('courtyard','margins')`);
  check('再进账页报出多出的行数', run(`currentScenes().margins.run().text.indexOf('多出 1 行')>=0`), 'true');
  run(`T.tap('margins','back')`);
  run(`T.tap('courtyard','margins')`);
  check('什么都没做则明说没变', run(`currentScenes().margins.run().text.indexOf('行数没有变')>=0`), 'true');
});

/* =====================================================================
   14. 节点剥夺: 全作唯一的夺权, 门槛必须极高
   ===================================================================== */
section('14. 节点剥夺门槛');
guard('不足两条预警或渗透不够则不剥夺', () => {
  run(`T.wipe(); G=null; startGame(); G.scene='naming'; G.rite=2;
       setFlag('acceptedRules'); setFlag('warnDeputy')`);
  check('两预警+渗透 2', run(`usurpActive(CHAPTER_V3.naming.choices.find(c=>c.id==='let-them'))`), 'true');
  run(`G.rite=1`);
  check('两预警+渗透 1 不剥夺', run(`usurpActive(CHAPTER_V3.naming.choices.find(c=>c.id==='let-them'))`), 'false');
  run(`G.rite=4; delete G.flags.warnDeputy`);
  check('缺一预警不剥夺', run(`usurpActive(CHAPTER_V3.naming.choices.find(c=>c.id==='let-them'))`), 'false');
  run(`G.flags={}`);
  check('零预警不剥夺', run(`usurpActive(CHAPTER_V3.naming.choices.find(c=>c.id==='let-them'))`), 'false');
});
guard('剥夺一旦发生即入账并撼动锚点', () => {
  run(`T.wipe(); T.ended=null; G=null; startGame(); G.scene='naming';
       setFlag('acceptedRules'); setFlag('warnDeputy'); G.rite=2`);
  check('点击前无代笔记录', run(`usurpCount()`), '0');
  run(`T.tap('naming','let-them')`);
  check('结局仍按原设计抵达', run('T.ended'), 'ending-marriage');
  check('代笔已入账', run(`usurpCount()`), '1');
  check('锚点标记已落下', run(`hasFlag('anchorFall')`), 'true');
  check('账上可核对', run(`currentScenes().margins.run().text.indexOf('不是你落的')>=0`), 'true');
});

/* =====================================================================
   15. 界面分层侵蚀: 改字可以, 改行为就是杀人
   ===================================================================== */
section('15. 界面分层侵蚀');
guard('顶栏改称但功能分毫不动', () => {
  run(`T.wipe(); G=null; startGame(); T.tap('arrival','read-ledger'); T.tap('gate-ledger','back');
       T.tap('arrival','enter')`);
  /* 沙箱不加载 index.html, 处理函数由测试自己绑上, 再验证侵蚀不会清掉它 */
  const bound = run(`document.__els['btn-menu'].onclick=function backToMenu(){}; !!document.__els['btn-menu'].onclick`);
  check('已绑上返回主菜单', bound, 'true');
  run(`G.rite=3; updateStats()`);
  check('渗透 3 顶栏仍诚实', run(`document.__els['btn-save'].textContent`), '存档');
  run(`G.rite=4; updateStats()`);
  check('渗透 4 顶栏已改口', run(`document.__els['btn-save'].textContent`), '存名');
  check('时辰也已改口', run(`document.__els['hour-name'].textContent.indexOf('吉时将至')>=0`), 'true');
  check('存档仍可写', run(`saveGame()`), 'true');
  check('读档仍可还原', run(`(function(){ const want=G.scene; G.scene='arrival'; loadGame(); return G.scene===want; })()`), 'true');
  check('改口后处理函数未被清掉', run(`typeof document.__els['btn-menu'].onclick`), 'function');
  run(`G.rite=2; updateStats()`);
  check('渗透 2 顶栏恢复诚实', run(`document.__els['btn-save'].textContent`), '存档');
});
guard('锚点只在渗透极高或被代笔后失守', () => {
  run(`T.wipe(); G=null; startGame(); document.getElementById('btn-start').onclick=function go(){}`);
  run(`G.rite=3; showMenu()`);
  check('渗透 3 菜单诚实', run(`document.__els['menu-title'].textContent`), '红纸鸢');
  run(`G.rite=4; showMenu()`);
  check('渗透 4 菜单失守', run(`document.__els['menu-title'].textContent`), '婚 已 成');
  check('失守后开始按钮仍可点', run(`typeof document.__els['btn-start'].onclick`), 'function');
  run(`G=freshState(); showMenu()`);
  check('新开一局锚点复原', run(`document.__els['menu-title'].textContent`), '红纸鸢');
  run(`G=freshState(); setFlag('anchorFall'); showGallery()`);
  check('被代笔后结局录也失守', run(`document.__els['gallery-count'].textContent.indexOf('也已替你走过')>=0`), 'true');
});
guard('遗物栏措辞随渗透改变, 遗物本身不受影响', () => {
  run(`T.wipe(); G=null; startGame()`);
  check('无遗物时诚实', run(`document.__els['inventory'].innerHTML.indexOf('尚未拾起')>=0`), 'true');
  run(`G.rite=3; updateInventory()`);
  check('渗透 3 换了说法', run(`document.__els['inventory'].innerHTML.indexOf('你的名字还没被写下来')>=0`), 'true');
  run(`giveItem('kite'); G.rite=0; updateInventory()`);
  check('有遗物后不再显示空栏文案', run(`document.__els['inventory'].innerHTML.indexOf('还没被写下来')>=0`), 'false');
  check('遗物名仍可回看', run(`document.__els['inventory'].innerHTML.indexOf('kite')>=0`), 'true');
});

/* =====================================================================
   16. 违规代价: 违反规矩必须留下不可逆的痕迹
   ===================================================================== */
section('16. 违规的不可逆代价');
guard('应门外之声改变她第一次照面的方式', () => {
  run(`T.wipe(); G=null; startGame(); G.scene='reunion'; G.visited={}`);
  check('未违规: 她只会念礼词', run(`currentScenes().reunion.run().text.indexOf('良辰已至')>=0`), 'true');
  run(`T.wipe(); G=null; startGame(); setFlag('answeredName'); G.scene='reunion'; G.visited={}`);
  const t = run(`currentScenes().reunion.run().text`);
  check('违规后: 她改用你的声音叫你', t.indexOf('你的名字')>=0, 'true');
  check('违规后: 礼词不再救场', t.indexOf('良辰已至')>=0, 'false');
});
guard('掀轿帘让仪式提前起笔', () => {
  run(`T.wipe(); G=null; startGame(); G.scene='naming'; G.visited={}`);
  check('未违规: 帘自行升起', run(`currentScenes().naming.run().text.indexOf('自行升起')>=0`), 'true');
  run(`T.wipe(); G=null; startGame(); setFlag('liftedVeil'); G.scene='naming'; G.visited={}`);
  const t = run(`currentScenes().naming.run().text`);
  check('违规后: 空格上已有不是你落的一划', t.indexOf('一划')>=0, 'true');
  check('代价不改定名门控', run(`(addEvidence('paternal',2), T.has('naming','paternal'))`), 'true');
});
guard('代价只改措辞与痕迹, 不改三种结局的可达性', () => {
  const dist = runJson(`(function(){
    const out={};
    [['return','ending-return'],['marriage','ending-marriage'],['loss','ending-loss'],
     ['marriage-silent','ending-marriage']].forEach(([k,want])=>{
      T.hourBad.length=0; T.route(k); out[k]=(T.ended===want)?'ok':('落到 '+T.ended);
    });
    return JSON.stringify(out);
  })()`);
  check('四条终局路线仍各自收敛', Object.values(dist).filter(v=>v!=='ok').join(','), '');
  check('违规路线仍能拿到正婚', run(`(function(){
      T.wipe(); T.ended=null; G=null; startGame();
      T.tap('arrival','read-ledger'); T.tap('gate-ledger','back'); T.tap('arrival','enter');
      T.tap('courtyard','rules'); T.tap('rules','agree');
      T.tap('first-call','answer'); T.tap('answered-call','step-back');
      T.tap('courtyard','east'); T.tap('east-room','lift'); T.tap('open-veil','close');
      T.tap('east-room','leave'); T.tap('courtyard','west');
      T.tap('west-room','take-husband'); T.tap('evidence-husband','back'); T.tap('west-room','leave');
      T.tap('courtyard','naming'); T.tap('naming','marital');
      return T.ended; })()`), 'ending-marriage');
  check('违规也刷不出剥夺之外的捷径', run(`usurpCount()`), '0');
});

/* =====================================================================
   17. 随机播放: 零选项 / 缺失场景 / 不收敛 / 结局分布
   ===================================================================== */
section('17. 随机播放冒烟测试');
guard('500 局随机路线', () => {
  const stat = runJson(`(function(){
    const bad=new Set(), dist={}; let unconv=0;
    for(let i=0;i<500;i++){
      const p=T.fuzzOnce();
      if(T.ended) dist[T.ended]=(dist[T.ended]||0)+1;
      if(p){ if(/未收敛/.test(p)) unconv++; else bad.add(p); }
    }
    return JSON.stringify({problems:[...bad].join(' ; '),unconv:unconv,dist:dist,
      ends:Object.keys(dist).sort().join(',')});
  })()`);
  console.log('  INFO  随机播放结局分布', JSON.stringify(stat.dist));
  check('异常', stat.problems || '(无)', '(无)');
  check('未收敛局数', stat.unconv, '0');
  check('随机也能撞到全部三结局', stat.ends, 'ending-loss,ending-marriage,ending-return');
});

/* =====================================================================
   18. DOM 契约: 脚本要改的每个节点必须真的存在于页面里
   ===================================================================== */
section('18. DOM 契约');
guard('界面侵蚀不会改到空气', () => {
  /* 桩的 getElementById 会凭空造元素, 所以"引用了页面里不存在的 id"
     这类 bug 在逻辑测试里永远绿 —— 锚点失守就因此静默失效过一次。 */
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const present = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  const used = new Set();
  for (const rel of ['js/core.js', 'js/chapter-v3.js', 'js/items.js', 'index.html']) {
    const s = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    [...s.matchAll(/(?:\bel|document\.getElementById)\(\s*'([^']+)'\s*\)/g)].forEach(m => used.add(m[1]));
  }
  /* 界面侵蚀表里的 id 是动态取的, 正则扫不到, 单独并入 */
  run('G=freshState()');
  run('updateStats()');
  JSON.parse(run(`JSON.stringify(Object.keys(TOPBAR_HONEST))`)).forEach(id => used.add(id));
  const missing = [...used].filter(id => !present.has(id)).sort();
  check('页面里不存在的引用 id', missing.length ? missing.join(',') : '(无)', '(无)');
});

console.log(`\n${'='.repeat(66)}`);
if (failed) { console.log(`共 ${failed} 项失败`); process.exit(1); }
console.log('全部通过');
