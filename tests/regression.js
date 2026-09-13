/* =====================================================================
   红纸鸢 · 回归测试
   运行: node tests/regression.js
   零第三方依赖:用 Node 内置 vm 加载游戏脚本,直接驱动场景逻辑。

   为什么需要它:本作的缺陷多为"随机播放测不出、定向走位才触发"一类
   —— 进房未取关键证据即永久封死真相线、时辰倒退回拨、成就条件不可达。
   因此这里用固定路线逐项断言,而非只做冒烟。
   ===================================================================== */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const SCRIPTS = [
  'js/items.js', 'js/sound.js', 'data/events.js', 'js/systems.js',
  'js/core.js', 'js/scenes.js', 'js/scenes_ayuan.js', 'js/scenes_po.js',
];

/* ---------- 最小 DOM / localStorage 桩 ---------- */
function makeEl() {
  return {
    style: {}, innerHTML: '', textContent: '', scrollTop: 0, scrollHeight: 0, onclick: null,
    classList: { add() {}, remove() {}, contains() { return false; } },
    children: { length: 0 },
    appendChild() {}, addEventListener() {}, scrollIntoView() {},
  };
}
const elements = {};
const store = {};
const sandbox = {
  console, Math, JSON, Set, Object, Array,
  setTimeout: fn => fn(), clearTimeout() {}, setInterval: () => 0, clearInterval() {},
  document: {
    getElementById: id => (elements[id] || (elements[id] = makeEl())),
    createElement: makeEl,
    body: { classList: { add() {}, remove() {}, contains() { return false; } }, appendChild() {}, addEventListener() {} },
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
Object.assign(ENDINGS, AYUAN_ENDINGS || {}, PO_ENDINGS || {});

/* 打字机与选项渲染拖慢且与逻辑无关,直接短路 */
renderText = function (text, done) { if (done) done(); };
renderChoices = function () {};

/* 结局哨兵:到达结局即停止推进,便于随机播放判定收敛 */
T.ended = null;
const _reachEnding = reachEnding;
reachEnding = function (id) { T.ended = id; _reachEnding(id); };

/* 时间回拨哨兵:任何让 hour 变小的路径都要被抓到 */
T.hourBad = [];
const _advanceHour = advanceHour;
advanceHour = function () {
  const before = G.hour; _advanceHour();
  if (G.hour < before) T.hourBad.push('advanceHour ' + before + '->' + G.hour);
};
const _goTo = goTo;
goTo = function (id, fx) {
  const before = G.hour; _goTo(id, fx);
  if (G && G.hour < before) T.hourBad.push('进入 ' + id + ' 时回拨 ' + before + '->' + G.hour);
};

/* 点击 scene 中文案含 frag 的选项;不存在或被禁用即视为失败 */
T.tap = function (scene, frag) {
  const before = G.hour;
  const list = (getCurrentScenes()[scene].run().choices) || [];
  const hit = list.find(c => c.text.indexOf(frag) >= 0);
  if (!hit) throw new Error('场景「' + scene + '」无选项含「' + frag + '」;实际: ' + list.map(c => c.text).join(' | '));
  if (hit.disabled) throw new Error('场景「' + scene + '」选项「' + frag + '」是禁用的');
  if (hit.log) G.choicesLog.push(hit.log);
  if (hit.action) hit.action(); else if (hit.go) goTo(hit.go, hit.fx);
  /* 哨兵主战场:一次点击走完整个选项回调,任何位置的时辰倒退都会在此暴露 */
  if (G && G.hour < before) T.hourBad.push('点击「' + frag + '」致回拨 ' + before + '->' + G.hour);
};

T.wipe = function () {
  ['hongzhiyuan_achievements_v2', 'hongzhiyuan_endings_v2',
   'hongzhiyuan_pov_unlocked_v2', 'hongzhiyuan_save_v2'].forEach(k => localStorage.removeItem(k));
};
T.ach = id => getAchievements().indexOf(id) >= 0;
T.end = id => getEndings().indexOf(id) >= 0;
T.at  = () => (G ? G.scene : null);
T.pick = arr => arr[Math.floor(Math.random() * arr.length)];

/*
 * 按选项搭一条完整路线。每步显式可选,避免用例之间互相依赖残留状态。
 *  入口:  stele(读石碑,给红烛+真相) / candle(点烛)
 *  红绳:  cord
 *  书房:  frag(婚书残页一)
 *  新房:  peek(掀帘) veil(取盖头) wine(取合卺酒) drink(饮一口)
 *  祠堂:  scissors(剪刀+黑炭) kite(画像纸鸢) bow(一揖)
 *  地宫:  under(在子时前后各试一次)
 *  子时:  turn(回首) mirrorTrick(借镜)  默认不回首
 *  终局:  ending('truth'|'save'|'flee'|...)
 */
T.route = function (o) {
  o = o || {};
  T.wipe(); T.ended = null; G = null;
  startGame('newcomer');

  if (o.stele) { T.tap('intro', '石碑'); T.tap('stele', '前往红宅'); }
  else T.tap('intro', '走近那座');
  if (o.candle) T.tap('gate', '点燃'); else T.tap('gate', '走进');
  T.tap('hall1', '接过'); T.tap('rules', '牢记');
  T.tap('hall2', o.cord ? '系上红绳' : '不系');
  T.tap('cordResult', '继续');

  T.tap('explore', '书房');
  if (o.frag) T.tap('study', '捡起半张');
  T.tap('study', '书架后'); T.tap('study2', '返回中庭');

  T.tap('explore', '新房');
  if (o.peek) {
    T.tap('bridal', '掀开轿帘');
    T.tap('peekBride', o.veil ? '扯下她的盖头' : '退开');
  }
  T.tap('bridal', '镜台'); T.tap('mirror', '退回');
  if (o.wine) {
    T.tap('bridal', '拿走桌上');
    if (o.drink) T.tap('bridal2', '饮下一口');
    T.tap('bridal2', '退回新房');
  }
  T.tap('bridal', '返回中庭');
  if (o.stopAt === 'preShrine') return;

  T.tap('explore', '祠堂');
  if (o.scissors) T.tap('shrine', '拾起蒲团旁');
  if (o.kite) T.tap('shrine', '从画像前');
  if (o.bow) T.tap('shrine', '深深一揖');
  T.tap('shrine', '供桌下'); T.tap('shrine2', '铭记');

  if (o.under && o.underEarly) { T.tap('explore', '地宫'); T.tap('under', '返回地面'); }
  if (o.stopAt === 'preZiShi') return;

  T.tap('explore', '子时三刻');
  if (o.turn) {
    T.tap('ziShi', '忍不住回头');
    T.tap('ziShiFail', o.peachPush ? '用桃木簪刺向她' : '拼死挣脱');
  } else if (o.mirrorTrick) {
    T.tap('ziShi', '举起阴阳铜镜');
    T.tap('ziShiPass', '继续等待天明');
  } else {
    T.tap('ziShi', '死也不回头');
    T.tap('ziShiPass', '继续等待天明');
  }

  if (o.under && !o.underEarly) { T.tap('explore2', '地宫'); T.tap('under', '返回地面'); }
  if (o.ending) { T.tap('explore2', '喜堂'); T.tap('finale', o.ending); }
};

/* 随机播放一局;返回 null 表示正常收场,否则返回问题描述 */
T.fuzzOnce = function (pov) {
  T.ended = null; G = null;
  startGame(pov); clearSave();
  for (let step = 0; step < 200; step++) {
    const sc = getCurrentScenes()[G.scene];
    if (!sc) return '缺失场景 ' + G.scene;
    let data;
    try { data = sc.run(); } catch (e) { return '渲染异常 ' + G.scene + ': ' + e.message; }
    const usable = (data.choices || []).filter(c => !c.disabled);
    if (!usable.length) return '死胡同 ' + G.scene;
    const c = T.pick(usable);
    if (c.log) G.choicesLog.push(c.log);
    try { if (c.action) c.action(); else if (c.go) goTo(c.go, c.fx); }
    catch (e) { return '跳转异常 ' + G.scene + ': ' + e.message; }
    if (T.ended) return null;
    if (G.san <= 0 && G.scene !== 'finale' && !/^(ayuan_|po_)/.test(G.scene)) return null;
  }
  return '200 步未收敛,停在 ' + G.scene;
};
`, sandbox);

const run = expr => vm.runInContext(expr, sandbox);

let failed = 0;
function check(name, actual, expected) {
  const ok = String(actual) === String(expected);
  if (!ok) failed++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(32)} ${actual}${ok ? '' : `   ← 期望 ${expected}`}`);
}
function section(t) { console.log(`\n${t}`); }
function guard(name, fn) {
  try { fn(); } catch (e) { failed++; console.log(`  FAIL  ${name}\n        ${e.message}`); }
}

/* =====================================================================
   1. 软锁:进了房间却没取关键证据,必须还能折返补齐
   ===================================================================== */
section('1. 软锁回归 —— 进新房未看镜台');
guard('进房即走不得封死真相线', () => {
  run(`T.wipe(); G=null; startGame('newcomer');
       T.tap('intro','走近那座'); T.tap('gate','走进');
       T.tap('hall1','接过'); T.tap('rules','牢记'); T.tap('hall2','不系'); T.tap('cordResult','继续');
       T.tap('explore','新房'); T.tap('bridal','返回中庭')`);
  check('doneBridal 未提前置位', run('!!G.flags.doneBridal'), 'false');
  check('新房仍可再进', run(`getCurrentScenes().explore.run().choices.find(c=>c.text.indexOf('新房')>=0).disabled`), 'false');
  run(`T.tap('explore','新房'); T.tap('bridal','镜台'); T.tap('mirror','退回'); T.tap('bridal','返回中庭')`);
  check('镜台证据可补齐', run(`['mirror','ash','fragment2','fragment3'].every(hasItem)`), 'true');
});

section('2. 软锁回归 —— 从唤名处逃回中庭');
guard('逃回后祠堂仍可完成', () => {
  run(`T.route({ stele:true, candle:true, frag:true, stopAt:'preShrine' });
       T.tap('explore','祠堂'); T.tap('shrine','拈起黑炭'); T.tap('callName','夺门逃回')`);
  check('doneShrine 未提前置位', run('!!G.flags.doneShrine'), 'false');
  check('祠堂仍可再进', run(`getCurrentScenes().explore.run().choices.find(c=>c.text.indexOf('祠堂')>=0).disabled`), 'false');
  run(`T.tap('explore','祠堂'); T.tap('shrine','供桌下'); T.tap('shrine2','铭记')`);
  check('补齐后子时之劫出现', run(`!!getCurrentScenes().explore.run().choices.find(c=>c.text.indexOf('子时三刻')>=0)`), 'true');
});

/* =====================================================================
   3. 时辰:全程只能向前,不得出现"寅时倒退回子时"
   ===================================================================== */
section('3. 时辰单调性');
guard('完整路线无回拨', () => {
  run(`T.hourBad.length = 0;
       T.route({ stele:true, candle:true, frag:true, under:true, ending:'【真相】' })`);
  check('回拨次数', run('T.hourBad.length'), '0');
  check('终局时辰为寅时(4)', run('G.hour'), '4');
});

/* =====================================================================
   4. 成就可达性 —— 这些条件都曾因机制而在数学上不可能满足
   ===================================================================== */
section('4. 速悟 fast_truth —— 子时前集齐全部真相');
guard('地宫可在子时前进入', () => {
  run(`T.route({ stele:true, candle:true, frag:true, scissors:true, kite:true,
                 wine:true, under:true, underEarly:true, stopAt:'preZiShi' })`);
  check('真相数', run('G.truths.length'), '6');
  check('时辰仍早于子时', run('G.hour < 2'), 'true');
  check('fast_truth 解锁', run(`T.ach('fast_truth')`), 'true');
  check('回到子时前中枢', run('T.at()'), 'explore');
});

section('5. 忤逆新郎 broke_all_rules —— 四条真禁忌全破且存活');
guard('破全四条仍以逃离收场', () => {
  run(`T.route({ cord:true, peek:true, wine:true, drink:true, turn:true, peachPush:true,
                 ending:'【逃离】' })`);
  check('四条 flag 齐备', run(`['woreCord','peekedBride','drankWine','turned'].every(hasFlag)`), 'true');
  check('存活', run(`T.end('flee')`), 'true');
  check('broke_all_rules', run(`T.ach('broke_all_rules')`), 'true');
  check('no_rule_broken 不误发', run(`T.ach('no_rule_broken')`), 'false');
});

section('6. 守礼之人 no_rule_broken —— 一条不犯');
guard('干净路线以超度收场', () => {
  run(`T.route({ stele:true, candle:true, frag:true, scissors:true, kite:true, bow:true,
                 under:true, ending:'【超度】' })`);
  check('四条 flag 均未触发', run(`['woreCord','peekedBride','drankWine','turned'].some(hasFlag)`), 'false');
  check('超度结局', run(`T.end('save')`), 'true');
  check('no_rule_broken', run(`T.ach('no_rule_broken')`), 'true');
  check('替她说话 save_ayuan', run(`T.ach('save_ayuan')`), 'true');
});

section('6a. 规则成就门槛 —— 死亡结局不得解锁');
guard('破全四条但赴死,不计忤逆新郎', () => {
  run(`T.route({ cord:true, peek:true, wine:true, drink:true, turn:true, peachPush:true,
                 ending:'【从命】' })`);
  check('确为死亡结局', run(`T.end('puppet')`), 'true');
  check('四条 flag 确实全破', run(`['woreCord','peekedBride','drankWine','turned'].every(hasFlag)`), 'true');
  check('broke_all_rules 不解锁', run(`T.ach('broke_all_rules')`), 'false');
});

section('6b. 规则成就门槛 —— 副视角不得白送守礼之人');
guard('阿鸢视角吉结局不送 no_rule_broken', () => {
  run(`T.wipe(); G=null; startGame('ayuan');
       T.tap('ayuan_intro','…'); T.tap('ayuan_chosen','…'); T.tap('ayuan_nailed','…');
       T.tap('ayuan_darkness','等'); T.tap('ayuan_waiting','观察');
       T.tap('ayuan_observe','没有系红绳'); T.tap('ayuan_help','等待');
       T.tap('ayuan_finale','【放手】')`);
  check('阿鸢视角吉结局', run(`T.end('ayuan_peace')`), 'true');
  check('四个 flag 本就不存在', run(`['woreCord','peekedBride','drankWine','turned'].some(hasFlag)`), 'false');
  check('no_rule_broken 不白送', run(`T.ach('no_rule_broken')`), 'false');
  check('鸢之视角正常解锁', run(`T.ach('ayuan_pov')`), 'true');
});

section('7. 行囊满载 all_items —— 道具表逐项可得');
guard('单局集齐全部声明道具', () => {
  run(`T.route({ stele:true, candle:true, frag:true, peek:true, veil:true, wine:true,
                 scissors:true, kite:true, bow:true, under:true, ending:'【真相】' })`);
  const missing = run(`Object.keys(ITEMS).filter(k=>G.inventory.indexOf(k)<0)`);
  check('缺失道具', missing.length ? missing.join(',') : '(无)', '(无)');
  check('all_items', run(`T.ach('all_items')`), 'true');
  check('纸鸢三枚 kite_collector', run(`T.ach('kite_collector')`), 'true');
  check('真相结局', run(`T.end('truth')`), 'true');
  check('阿鸢+喜婆视角解锁', run('getUnlockedPov().length'), '3');
});

/* =====================================================================
   5. 引擎层不变量
   ===================================================================== */
section('8. 幻象点击计数跨存档存活');
guard('illusionClicks 随存档持久化', () => {
  run(`T.wipe(); G=null; startGame('newcomer');
       for(let i=0;i<5;i++) onIllusionClick();
       G.scene='explore'; saveGame(); G=null; loadGame();`);
  check('读档后计数', run('G.illusionClicks'), '5');
  check('illusion_5 解锁', run(`T.ach('illusion_5')`), 'true');
});

section('9. 随机事件池不变量');
guard('300 局抽池统计', () => {
  const stat = run(`(function(){
    const itemTotal=Object.keys(RANDOM_EVENTS).filter(e=>RANDOM_EVENTS[e].item).length;
    let lost=0, contradict=0, min=99, max=0;
    for(let i=0;i<300;i++){
      G=null; startGame('newcomer');
      const p=G.randomEvents;
      if(p.filter(e=>RANDOM_EVENTS[e].item).length<itemTotal) lost++;
      if(p.indexOf('candle_out')>=0 && p.indexOf('candle_steady')>=0) contradict++;
      min=Math.min(min,p.length); max=Math.max(max,p.length);
    }
    return JSON.stringify({lost:lost, contradict:contradict, min:min, max:max});
  })()`);
  console.log('  INFO  池大小区间 / 异常计数', stat);
  check('发道具事件全部入池', run(`(${stat}).lost`), '0');
  check('矛盾灯笼不同局', run(`(${stat}).contradict`), '0');
});

/* =====================================================================
   6. 三视角随机播放冒烟:死胡同 / 缺失场景 / 不收敛
   ===================================================================== */
section('10. 随机播放冒烟测试');
for (const pov of ['newcomer', 'ayuan', 'po']) {
  const N = pov === 'newcomer' ? 800 : 200;
  const problems = run(`(function(){
    const bad=new Set();
    for(let i=0;i<${N};i++){ const p=T.fuzzOnce('${pov}'); if(p) bad.add(p); }
    return [...bad].join(' ; ');
  })()`);
  check(`${pov} 视角 ${N} 局`, problems || '(无异常)', '(无异常)');
}

console.log(`\n${'='.repeat(60)}`);
if (failed) { console.log(`共 ${failed} 项失败`); process.exit(1); }
console.log('全部通过');
