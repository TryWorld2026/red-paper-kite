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

/* 一次性选项标记与场景跳转都必须记录, 便于定向复现 */
T.tap = function (scene, frag) {
  const before = G.hour;
  const list = (currentScenes()[scene].run().choices) || [];
  const hit = list.find(c => c.text.indexOf(frag) >= 0);
  if (!hit) throw new Error('场景「' + scene + '」无可用选项含「' + frag + '」; 实际: ' + (list.map(c => c.text).join(' | ') || '(零选项)'));
  if (hit.disabled) throw new Error('场景「' + scene + '」选项「' + frag + '」是禁用的');
  hit.action();
  /* 一次点击可能走完整条回调链, 回拨只会在此暴露 */
  if (G && G.hour < before) T.hourBad.push('点击「' + frag + '」致回拨 ' + before + '->' + G.hour);
};

T.KEYS = ['hongzhiyuan_save_v3', 'hongzhiyuan_endings_v3', 'hongzhiyuan_memory_v3',
          'hongzhiyuan_save_v2', 'hongzhiyuan_endings_v2', 'hongzhiyuan_achievements_v2',
          'hongzhiyuan_pov_unlocked_v2', 'hongzhiyuan_memory_v2'];
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
  if (o.ledger !== false) { T.tap('arrival', '婚期账本'); T.tap('gate-ledger', '记住'); }
  T.tap('arrival', '进入挂着白灯笼');
};

T.court = function () { T.tap('courtyard', '是哪三条规矩'); T.tap('rules', '应下规矩'); };

/*
 * 三条终局路线。每步显式给出, 用例之间不共享残留状态。
 *  return   : 父证 >=2 → 归籍
 *  marriage : 夫证 >=2 → 正婚;  silent 则走"喜婆替你落笔"兜底
 *  loss     : 自称 >=2 → 失讳
 */
T.route = function (kind) {
  if (kind === 'return') {
    T.enter(); T.court();
    T.tap('first-call', '守住第一条规矩');
    T.tap('courtyard', '去西厢');
    T.tap('west-room', '取走父亲的信');
    T.tap('evidence-father', '记住');
    T.tap('west-room', '合上箱子');
    T.tap('courtyard', '替她定名');
    T.tap('naming', '周氏');
    return;
  }
  if (kind === 'marriage') {
    T.enter(); T.court();
    T.tap('first-call', '守住第一条规矩');
    T.tap('courtyard', '去西厢');
    T.tap('west-room', '取走夫家的信');
    T.tap('evidence-husband', '记住');
    T.tap('west-room', '合上箱子');
    T.tap('courtyard', '去后院祠堂');
    T.tap('shrine-room', '问这块牌位');
    T.tap('tablet-talk', '退回祠堂');
    T.tap('shrine-room', '退出祠堂');
    T.tap('courtyard', '替她定名');
    T.tap('naming', '陈门新妇');
    return;
  }
  if (kind === 'marriage-silent') {
    /* 只读了账本、什么都没深究的新郎: 系统会替他写完这个名字 */
    T.enter(); T.court();
    T.tap('first-call', '守住第一条规矩');
    T.tap('courtyard', '替她定名');
    T.tap('naming', '喜婆替你落笔');
    return;
  }
  if (kind === 'loss') {
    T.enter(); T.court();
    T.tap('first-call', '回应门外');
    T.tap('answered-call', '退开');
    T.tap('courtyard', '去西厢');
    T.tap('west-room', '没有抬头');
    T.tap('evidence-personal', '空白');
    T.tap('west-room', '合上箱子');
    T.tap('courtyard', '替她定名');
    T.tap('naming', '自写的那个字');
    T.tap('loss-question', '把名字还给你');
    return;
  }
  if (kind === 'reunion') {
    /* 三类证据各至少一枚 → 照面, 再把她从"新妇"里纠正出来 */
    T.enter(); T.court();
    T.tap('first-call', '守住第一条规矩');
    T.tap('courtyard', '去西厢');
    T.tap('west-room', '没有抬头');
    T.tap('evidence-personal', '空白');
    T.tap('west-room', '取走夫家的信');
    T.tap('evidence-husband', '记住');
    T.tap('west-room', '合上箱子');
    T.tap('courtyard', '去东厢新房');
    T.tap('east-room', '取走纸鸢');
    T.tap('kite-clue', '收好');
    T.tap('east-room', '退出新房');
    T.tap('courtyard', '轿帘后');
    T.tap('reunion', '纠正称呼');
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
  ids.forEach(id=>{
    const cs=CHAPTER_V3[id].choices||[];
    if(!cs.length) bad.push(id+':无任何选项');
    cs.forEach(c=>{ if(!ENDINGS_V3[c.next] && !CHAPTER_V3[c.next]) bad.push(id+'.'+c.id+' -> 未知目标 '+c.next); });
    /* 全是一次性选项的场景 = 重访必死 */
    if(cs.length && cs.every(c=>c.once)) allOnce.push(id);
  });
  /* 从 arrival 出发的可达闭包 */
  const seen=new Set(['arrival']), q=['arrival'];
  while(q.length){ const id=q.shift();
    (CHAPTER_V3[id].choices||[]).forEach(c=>{ const n=c.next;
      if(CHAPTER_V3[n]&&!seen.has(n)){seen.add(n);q.push(n);} });
  }
  ids.forEach(id=>{ if(!seen.has(id)) unreachable.push(id); });
  const endsWithEntry=Object.keys(ENDINGS_V3).filter(e=>ids.some(id=>(CHAPTER_V3[id].choices||[]).some(c=>c.next===e)));
  return JSON.stringify({bad:bad,allOnce:allOnce,unreachable:unreachable,endsWithEntry:endsWithEntry,
    sceneCount:ids.length,endingCount:Object.keys(ENDINGS_V3).length});
})()`);
guard('无悬空跳转', () => check('坏边', graph.bad.length ? graph.bad.join(',') : '(无)', '(无)'));
guard('无"全是选项皆一次性"的场景', () => check('重访即死锁场景', graph.allOnce.length ? graph.allOnce.join(',') : '(无)', '(无)'));
guard('所有场景自 arrival 可达', () => check('不可达场景', graph.unreachable.length ? graph.unreachable.join(',') : '(无)', '(无)'));
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
  check('纠正后仪式渗透回落', run('G.rite'), '0');
});

/* =====================================================================
   4. 门控: 证据不足时不得出现定名/照面; 足量时必须出现
   ===================================================================== */
section('4. 寻名进度门控');
guard('零证据时 courtyard 不给定名', () => {
  run(`T.wipe(); G=null; startGame(); T.tap('arrival','进入挂着白灯笼')`);
  check('证据总数', run('T.total()'), '0');
  check('无"定名"选项', run(`!(currentScenes().courtyard.run().choices.some(c=>c.text.indexOf('定名')>=0))`), 'true');
  check('无"照面"选项', run(`!(currentScenes().courtyard.run().choices.some(c=>c.text.indexOf('轿帘后')>=0))`), 'true');
  check('仍有出路(不锁死)', run(`currentScenes().courtyard.run().choices.length>0`), 'true');
});
guard('一类证据即可定名, 三类的证据才可见照面', () => {
  run(`T.enter({ledger:false}); addEvidence('paternal',1)`);
  check('1 类证据可定名', run(`currentScenes().courtyard.run().choices.some(c=>c.text.indexOf('定名')>=0)`), 'true');
  check('1 类证据不可照面', run(`!currentScenes().courtyard.run().choices.some(c=>c.text.indexOf('轿帘后')>=0)`), 'true');
  run(`addEvidence('marital',1); addEvidence('personal',1)`);
  check('3 类证据可照面', run(`currentScenes().courtyard.run().choices.some(c=>c.text.indexOf('轿帘后')>=0)`), 'true');
});
guard('定名前不得有零选项死路', () => {
  check('沉默兜底始终可用', run(`currentScenes().naming.run().choices.some(c=>c.text.indexOf('替你落笔')>=0)`), 'true');
});
guard('同一路证据有上限,不可反复刷', () => {
  run(`T.wipe(); G=null; startGame(); for(let i=0;i<20;i++) addEvidence('paternal',2)`);
  check('父证封顶', run('evidenceScore("paternal")'), '5');
  check('原始存储也被夹住(不靠读时兜底)', run('G.evidence.paternal'), '5');
  check('证据总数封顶', run('T.total()'), '5');
});
guard('一次性选项用完即消失', () => {
  run(`T.wipe(); G=null; startGame();
       T.tap('arrival','婚期账本'); T.tap('gate-ledger','记住'); T.tap('arrival','进入挂着白灯笼');
       T.tap('courtyard','去西厢'); T.tap('west-room','取走父亲的信'); T.tap('evidence-father','记住')`);
  check('父亲的信已不可再取', run(`!currentScenes()['west-room'].run().choices.some(c=>c.text.indexOf('取走父亲的信')>=0)`), 'true');
  check('其余两封仍可取', run(`currentScenes()['west-room'].run().choices.filter(c=>/取走夫家的信|没有抬头/.test(c.text)).length`), '2');
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
  const diff = run(`(function(){
    T.wipe(); G=null; startGame(); T.tap('arrival','婚期账本'); T.tap('gate-ledger','记住');
    T.tap('arrival','进入挂着白灯笼'); addEvidence('paternal',2); adjustRite(3);
    const bad=[];
    Object.keys(CHAPTER_V3).forEach(id=>{
      G.scene=id;
      const a=currentScenes()[id].run(), b=currentScenes()[id].run();
      if(a.text!==b.text) bad.push(id+':文本');
      if(JSON.stringify(a.choices.map(c=>c.text))!==JSON.stringify(b.choices.map(c=>c.text))) bad.push(id+':选项');
    });
    return bad.join(',');
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
  run(`T.wipe(); G=null; startGame(); T.tap('arrival','婚期账本'); T.tap('gate-ledger','记住');
       T.tap('arrival','进入挂着白灯笼'); addEvidence('paternal',2); G.scene='courtyard'; saveGame();`);
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
       T.tap('arrival','婚期账本'); T.tap('gate-ledger','记住'); T.tap('arrival','进入挂着白灯笼');
       T.tap('courtyard','是哪三条规矩'); T.tap('rules','应下规矩'); T.tap('first-call','守住');
       T.tap('courtyard','去西厢');
       T.tap('west-room','取走父亲的信');  T.tap('evidence-father','记住');
       T.tap('west-room','取走夫家的信');  T.tap('evidence-husband','记住');
       T.tap('west-room','没有抬头');      T.tap('evidence-personal','空白');
       T.tap('west-room','合上箱子');
       T.tap('courtyard','去东厢新房');
       T.tap('east-room','取走纸鸢');      T.tap('kite-clue','收好');
       T.tap('east-room','退出新房');
       T.tap('courtyard','去后院祠堂');    T.tap('shrine-room','火盆');
       T.tap('burning','抢回残页');
       T.tap('shrine-room','退出祠堂')`);
  const missing = run(`Object.keys(ITEMS).filter(k=>G.inventory.indexOf(k)<0)`);
  check('缺失遗物', missing.length ? missing.join(',') : '(无)', '(无)');
  check('五件不重复', run(`G.inventory.length`), run(`new Set(G.inventory).size`));
});

/* =====================================================================
   12. 随机播放: 零选项 / 缺失场景 / 不收敛 / 结局分布
   ===================================================================== */
section('12. 随机播放冒烟测试');
guard('500 局随机路线', () => {
  const stat = runJson(`(function(){
    const bad=new Set(), ends=new Set(); let unconv=0;
    for(let i=0;i<500;i++){
      const p=T.fuzzOnce();
      if(T.ended) ends.add(T.ended);
      if(p){ if(/未收敛/.test(p)) unconv++; else bad.add(p); }
    }
    return JSON.stringify({problems:[...bad].join(' ; '),unconv:unconv,ends:[...ends].sort().join(',')});
  })()`);
  check('异常', stat.problems || '(无)', '(无)');
  check('未收敛局数', stat.unconv, '0');
  check('随机也能撞到全部三结局', stat.ends, 'ending-loss,ending-marriage,ending-return');
});

console.log(`\n${'='.repeat(66)}`);
if (failed) { console.log(`共 ${failed} 项失败`); process.exit(1); }
console.log('全部通过');
