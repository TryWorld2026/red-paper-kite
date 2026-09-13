/* =====================================================================
   红纸鸢 · 变异测试
   运行: node tests/mutation-check.js

   目的:回归测试全绿不代表它有效。这里逐个把已修复原的缺陷还原回去,
   断言"还原后测试必须变红"。若某处还原后测试仍然全绿,说明对应断言是空断言。

   每个变异体自带 from/to 精确文本;应用后回读校验,确保变异真的落地
   (Windows 上 python3 是商店空壳,历史上曾出现过"改了但没改"的假象)。
   无论成功失败,结束时一律从快照还原源码。
   ===================================================================== */

const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const ROOT = path.join(__dirname, '..');
const SNAPSHOT = path.join(os.tmpdir(), 'hz-mutation-snapshot');
const SOURCES = ['js/core.js', 'js/scenes.js', 'js/systems.js', 'js/scenes_ayuan.js', 'js/scenes_po.js'];

const MUTANTS = [
  {
    id: 'M1-软锁-进房即算探明',
    file: 'js/core.js',
    from: `  if(s==='study2') setFlag('doneStudy',true);
  if(s==='mirror') setFlag('doneBridal',true);
  if(s==='shrine2') setFlag('doneShrine',true);`,
    to: `  if(s==='study'||s==='study2') setFlag('doneStudy',true);
  if(s==='bridal'||s==='peekBride'||s==='mirror'||s==='bridal2') setFlag('doneBridal',true);
  if(s==='shrine'||s==='shrine2'||s==='callName') setFlag('doneShrine',true);`,
    expect: ['1.', '2.'],
  },
  {
    id: 'M2-时辰-explore2倒退回拨',
    file: 'js/scenes.js',
    from: `    advanceToHour(3);
    return {`,
    to: `    G.hour=1;
    return {`,
    expect: ['3.'],
  },
  {
    id: 'M3-速悟-地宫不开放至子时前',
    file: 'js/scenes.js',
    from: `  if(hasItem('mirror')&&hasItem('peach')&&hasFlag('knowsTruth')&&!hasFlag('fullTruth')){
    c.push({text:'【隐藏】凭铜镜与桃木簪,寻地宫', go:'under'});
  }
  if(hasFlag('doneStudy')`,
    to: `  if(hasFlag('doneStudy')`,
    expect: ['4.'],
  },
  {
    id: 'M4-忤逆新郎-去掉饮合卺酒入口',
    file: 'js/scenes.js',
    from: `        {text:'【规则·真禁忌】鬼使神差,饮下一口合卺酒', disabled:hasFlag('drankWine'), log:'饮合卺酒', action:()=>{ setFlag('drankWine'); adjustYin(2); adjustSan(-1); Sound.drip(); flashTip('酒液入喉,是灰的味道。你听见自己喉咙里响起纸摩擦的声音。',true); goTo('bridal2'); }},
`,
    to: ``,
    expect: ['5.'],
  },
  {
    id: 'M5-规则成就-去掉视角与死亡门槛',
    file: 'js/systems.js',
    from: `  if(G.pov==='newcomer' && ENDINGS[endId] && ENDINGS[endId].type!=='death'){`,
    to: `  {`,
    expect: ['6a.', '6b.'],
  },
  {
    id: 'M6-全道具-真禁忌册不发放',
    file: 'js/scenes.js',
    from: `action:()=>{ giveItem('fullBook'); setFlag('knowsTruth')`,
    to: `action:()=>{ setFlag('knowsTruth')`,
    expect: ['7.'],
  },
  {
    id: 'M7-幻象计数-退回全局变量',
    file: 'js/systems.js',
    from: `function onIllusionClick(){
  G.illusionClicks=(G.illusionClicks||0)+1;
  checkAchievements();
}`,
    to: `var illusionClickCount=0;
function onIllusionClick(){
  illusionClickCount++;
  checkAchievements();
}`,
    expect: ['8.'],
  },
  {
    id: 'M8-事件池-道具事件可漏抽',
    file: 'js/systems.js',
    from: `  const picked=itemIds.slice();`,
    to: `  const picked=[];`,
    expect: ['9.'],
  },
  {
    id: 'M9-冒烟-中庭渲染抛异常',
    file: 'js/scenes.js',
    from: `explore:{
  title:'陈家老宅 · 中庭',
  run(){
    advanceToHour(1);`,
    to: `explore:{
  title:'陈家老宅 · 中庭',
  run(){
    if(G.flags.doneBridal) throw new Error('injected render fault');
    advanceToHour(1);`,
    expect: ['10.'],
  },
  {
    id: 'M10-冒烟-造一个死胡同',
    file: 'js/scenes.js',
    from: `        {text:'伏身查看供桌下', action:()=>{ goTo('shrine2'); }}`,
    to: `        {text:'伏身查看供桌下', disabled:true, action:()=>{ goTo('shrine2'); }}`,
    expect: ['10.'],
  },
  {
    id: 'M11-冒烟-终局无选项',
    file: 'js/scenes.js',
    desc: '喜堂抉择返回空选项,任何到达终局的一局都成死胡同',
    from: `function buildFinaleChoices(){
  const c=[];`,
    to: `function buildFinaleChoices(){
  return [];
  const c=[];`,
    expect: ['10.'],
  },
  {
    id: 'M12-冒烟-中庭死胡同',
    file: 'js/scenes.js',
    from: `  c.push({text:'前往西厢·书房(查族谱)', go:'study', disabled:hasFlag('doneStudy')});`,
    to: `  c.push({text:'前往西厢·书房(查族谱)', go:'study', disabled:true});
  c.push({text:'前往东厢·新房(见新娘)', go:'bridal', disabled:true});
  c.push({text:'前往后院·祠堂(拜祖先)', go:'shrine', disabled:true});
  return c;`,
    expect: ['10.'],
  },
  {
    id: 'M13-冒烟-喜婆终局无出口',
    file: 'js/scenes_po.js',
    from: `function buildPoFinaleChoices(){
  const c=[];`,
    to: `function buildPoFinaleChoices(){
  return [];
  const c=[];`,
    expect: ['10.'],
  },
  {
    id: 'M14-冒烟-阿鸢场景缺失',
    file: 'js/scenes_ayuan.js',
    from: `ayuan_help:{
  title:'试图帮助',`,
    to: `ayuan_help_RENAMED:{
  title:'试图帮助',`,
    expect: ['10.'],
  },
];

function read(f) { return fs.readFileSync(path.join(ROOT, f), 'utf8'); }
function write(f, s) { fs.writeFileSync(path.join(ROOT, f), s); }

function snapshot() {
  fs.rmSync(SNAPSHOT, { recursive: true, force: true });
  fs.mkdirSync(SNAPSHOT, { recursive: true });
  SOURCES.forEach(f => fs.copyFileSync(path.join(ROOT, f), path.join(SNAPSHOT, path.basename(f))));
}
function restore() {
  SOURCES.forEach(f => fs.copyFileSync(path.join(SNAPSHOT, path.basename(f)), path.join(ROOT, f)));
}

function apply(m) {
  const src = read(m.file);
  /* 源码为 CRLF 而锚点为 LF,不换算行尾会让跨行锚点静默失配 */
  const crlf = s => s.replace(/\r?\n/g, '\r\n');
  const from = src.includes('\r\n') ? crlf(m.from) : m.from;
  const to = src.includes('\r\n') ? crlf(m.to) : m.to;
  const hits = src.split(from).length - 1;
  if (hits === 0) return { ok: false, why: '目标文本不存在(锚点已失效)' };
  if (hits > 1) return { ok: false, why: `目标文本出现 ${hits} 次,拒绝盲改` };
  write(m.file, src.replace(from, to));
  const back = read(m.file);
  if (!back.includes(to) || back.includes(from)) return { ok: false, why: '回读校验失败' };
  return { ok: true };
}

function runSuite() {
  const r = cp.spawnSync(process.execPath, [path.join(__dirname, 'regression.js')],
    { cwd: ROOT, encoding: 'utf8', timeout: 300000 });
  const out = (r.stdout || '') + (r.stderr || '');
  const failed = new Set();
  for (const line of out.split('\n')) {
    const sec = line.match(/^\s*(\d+[a-z]?)\.\s/);
    if (sec) var current = sec[1] + '.';
    if (/^\s*FAIL\s/.test(line) && current) failed.add(current);
  }
  return { code: r.status, failed: [...failed], out };
}

console.log('红纸鸢 · 变异测试\n' + '-'.repeat(64));
const clean = runSuite();
if (clean.code !== 0) {
  console.log('基线不绿,先修测试再谈变异。FAIL 组:', clean.failed.join(' ') || '(未解析)');
  console.log(clean.out.split('\n').filter(l => /^\s*FAIL/.test(l)).slice(0, 8).join('\n'));
  process.exit(1);
}
console.log('基线: 全绿 ✓\n');

snapshot();
const rows = [];
try {
  for (const m of MUTANTS) {
    const a = apply(m);
    if (!a.ok) { rows.push({ id: m.id, verdict: '无法应用', note: a.why }); continue; }
    const res = runSuite();
    restore();
    const caught = res.code !== 0;
    const missedExpected = m.expect.filter(g => !res.failed.includes(g));
    rows.push({
      id: m.id,
      verdict: caught ? '已被捕获' : '★ 未被捕获',
      note: caught
        ? (missedExpected.length ? '但超出预期组: 仅报于 ' + res.failed.join(' ') : '报于 ' + res.failed.join(' '))
        : '对应断言是空断言',
    });
    /* 还原后必须回到全绿,否则说明变异未清干净 */
    if (runSuite().code !== 0) console.log(`  !! ${m.id} 还原后仍红,源码可能被污染`);
  }
} finally {
  restore();
  fs.rmSync(SNAPSHOT, { recursive: true, force: true });
}

const w = Math.max(...rows.map(r => r.id.length));
for (const r of rows) console.log(`  ${r.id.padEnd(w)}  ${r.verdict.padEnd(10)} ${r.note}`);
const survivors = rows.filter(r => r.verdict === '★ 未被捕获').length;
const broken = rows.filter(r => r.verdict === '无法应用').length;
console.log('-'.repeat(64));
console.log(`变异体 ${rows.length}:捕获 ${rows.length - survivors - broken} / 漏网 ${survivors} / 无法应用 ${broken}`);
const finalCheck = runSuite();
console.log('收尾源码完整性: ' + (finalCheck.code === 0 ? '已还原,基线全绿 ✓' : '!! 仍为红,请 git checkout'));
process.exit(survivors || broken || finalCheck.code !== 0 ? 1 : 0);
