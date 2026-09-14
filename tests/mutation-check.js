/* =====================================================================
   红纸鸢 · 归名 (v3) 变异测试
   运行: node tests/mutation-check.js

   目的: 回归测试全绿不代表它有效。这里逐个把 v3 引擎的关键行为改坏,
   断言"改坏后测试必须变红, 且红在该管的那一节"。若某变异体改完后测试
   仍然全绿, 说明对应断言是空断言 —— 这正是本项目历史上踩过的坑。

   每个变异体自带 from/to 精确文本; 应用后回读校验, 确保变异真的落地
   (Windows 上 python3 是商店空壳, 曾出现过"改了但没改"的假象)。
   无论成功失败, 结束时一律从快照还原源码, 并用哈希复核还原完整性。
   ===================================================================== */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const cp = require('child_process');

const ROOT = path.join(__dirname, '..');
const SNAPSHOT = path.join(os.tmpdir(), 'hz-v3-mutation-snapshot');
const SOURCES = ['js/core.js', 'js/chapter-v3.js', 'js/items.js'];

const hash = f => crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex').slice(0, 12);
const digest = () => SOURCES.map(f => f + ':' + hash(f)).join(' ');

/* =====================================================================
   变异体清单 —— 每条都对应 v3 的一个真实保护点
   ===================================================================== */
const MUTANTS = [
  /* ---- 结构性死路: 本项目最容易复发的缺陷 ---- */
  {
    id: 'A-死路-唯一导航选项标成一次性',
    file: 'js/chapter-v3.js',
    desc: '还原 gate-ledger 的 once:true —— 再进账本场景就零选项',
    from: `next:'arrival', effects:{ flag:'knowsPaternalName' } }`,
    to: `next:'arrival', once:true, effects:{ flag:'knowsPaternalName' } }`,
    expect: ['1.', '2.'],
  },
  {
    id: 'B-死路-火盆缺退开兜底',
    file: 'js/chapter-v3.js',
    desc: '删掉补加的"退开火盆", 抢回残页用过后火盆就成了陷阱',
    from: `      { id:'return', label:'从火中抢回残页', next:'shrine-room', once:true, effects:{ item:'burnedPage' } },
      { id:'step-back', label:'退开火盆', next:'shrine-room' }`,
    to: `      { id:'return', label:'从火中抢回残页', next:'shrine-room', once:true, effects:{ item:'burnedPage' } }`,
    expect: ['1.', '2.'],
  },
  {
    id: 'C-死路-定名去掉沉默兜底',
    file: 'js/chapter-v3.js',
    desc: '让"喜婆替你落笔"永不可得。注：随机播放已不再报 —— naming 有了退路后 fuzzer 能自行脱身, 只有定向路线会撞穿',
    from: `      { id:'let-them', label:'沉默。喜婆替你落笔', next:'ending-marriage', mood:'danger',
        usurp:{ explicit:true } }`,
    to: `      { id:'let-them', label:'沉默。喜婆替你落笔', next:'ending-marriage', mood:'danger',
        condition:{flag:'neverAchievedFlag'} }`,
    expect: ['3.', '4.'],
  },

  /* ---- 门控: 找名字这条进度线 ---- */
  {
    id: 'E-门控-照面门槛 3 类降为 1 类',
    file: 'js/chapter-v3.js',
    from: `next:'reunion', condition:{evidenceTotal:3} },`,
    to: `next:'reunion', condition:{evidenceTotal:1} },`,
    expect: ['4.'],
  },
  {
    id: 'F-门控-定名不再要求证据',
    file: 'js/chapter-v3.js',
    from: `next:'naming', condition:{evidenceTotal:1, rite:2} },`,
    to: `next:'naming', condition:{rite:2} },`,
    expect: ['4.'],
  },
  {
    id: 'F2-门控-定名不再要求礼数',
    file: 'js/chapter-v3.js',
    desc: '去掉 rite>=2 —— 速通玩家又能以渗透 0 通关, 措辞侵蚀/代笔/锚点失守全部不可见',
    from: `next:'naming', condition:{evidenceTotal:1, rite:2} },`,
    to: `next:'naming', condition:{evidenceTotal:1} },`,
    expect: ['4.'],
  },
  {
    id: 'I-进度-证据不再封顶',
    file: 'js/core.js',
    from: `  G.evidence[kind]=Math.min(5,evidenceScore(kind)+amount);`,
    to: `  G.evidence[kind]=evidenceScore(kind)+amount;`,
    expect: ['4.'],
  },
  {
    id: 'J-进度-一次性选项不再隐藏',
    file: 'js/chapter-v3.js',
    from: `  if(choice.once && hasFlag('choice-'+choice.id)) return false;`,
    to: `  /* once 不再隐藏 */`,
    expect: ['4.'],
  },
  {
    id: 'R-进度-选项不再发放证据',
    file: 'js/chapter-v3.js',
    from: `  if(fx.evidence) Object.keys(fx.evidence).forEach(k=>addEvidence(k,fx.evidence[k]));`,
    to: `  /* 证据不再累积 */`,
    expect: ['3.', '4.'],
  },

  /* ---- 称呼渗透: 本作真正的恐怖机制 ---- */
  {
    id: 'G-称呼-阈值降为 0 (开场即替换)',
    file: 'js/chapter-v3.js',
    from: `  return G.rite>=2 ? text.replace(/她/g, dominantName()) : text;`,
    to: `  return text.replace(/她/g, dominantName());`,
    expect: ['7.'],
  },
  {
    id: 'H-称呼-自称不再最优先',
    file: 'js/chapter-v3.js',
    from: `  if(s===max) return '鸢';`,
    to: `  if(s===max) return '新妇';`,
    expect: ['7.'],
  },
  {
    id: 'T-氛围-渗透不再驱动画面类名',
    file: 'js/core.js',
    from: `  if(G.rite>=4) b.add('rite-critical');
  else if(G.rite>=3) b.add('rite-high');`,
    to: `  if(G.rite>=9) b.add('rite-critical');
  else if(G.rite>=9) b.add('rite-high');`,
    expect: ['5.'],
  },
  {
    id: 'U-氛围-渗透极高时不再追加替念一句',
    file: 'js/chapter-v3.js',
    from: `      if(G.rite>=4) text+='<br><br><span class="rited">你几乎能抢在别人前面，把下面那句话说完。</span>';`,
    to: `      if(G.rite>=9) text+='<br><br><span class="rited">你几乎能抢在别人前面，把下面那句话说完。</span>';`,
    expect: ['5.'],
  },

  /* ---- 时间与确定性 ---- */
  {
    id: 'D-时辰-单调推进改成直接赋值',
    file: 'js/core.js',
    desc: '还原成 G.hour=h —— 从子时房退回中庭就会把钟拨回去',
    from: `function advanceHourTo(h){ if(h>G.hour) G.hour=Math.max(0,Math.min(4,h)); }`,
    to: `function advanceHourTo(h){ G.hour=Math.max(0,Math.min(4,h)); }`,
    expect: ['3.', '4.', '9.', '17.'],
  },
  {
    id: 'O-文本-重访差量失效',
    file: 'js/chapter-v3.js',
    from: `      const raw = again ? (d.text.again!=null ? d.text.again : d.text.first) : d.text.first;`,
    to: `      const raw = d.text.first;`,
    expect: ['8.'],
  },

  /* ---- 结局与存档 ---- */
  {
    id: 'P-结局-终局分派失效',
    file: 'js/chapter-v3.js',
    from: `          if(ENDINGS_V3[choice.next]) reachEnding(choice.next);
          else goTo(choice.next);`,
    to: `          goTo(choice.next);`,
    expect: ['3.', '4.', '10.', '14.', '16.', '17.'],
  },
  {
    id: 'Q-结局-不再写入结局录',
    file: 'js/core.js',
    from: `  addEnding(endId);`,
    to: `  /* 结局录不写 */`,
    expect: ['3.'],
  },
  {
    id: 'K-存档-非法场景不再回起点',
    file: 'js/chapter-v3.js',
    from: `  if(typeof st.scene!=='string' || !currentScenes()[st.scene]) st.scene='arrival';`,
    to: `  /* 场景合法性交给运气 */`,
    expect: ['10.'],
  },
  {
    id: 'L-存档-类型校验退回 || 兜底',
    file: 'js/chapter-v3.js',
    desc: '脏档 inventory:"x" 是真值, || 兜不住, 后续 forEach 直接抛错',
    from: `  if(!isArr(st.inventory)) st.inventory=[];`,
    to: `  st.inventory=st.inventory||[];`,
    expect: ['10.'],
  },
  {
    id: 'M-存档-未知遗物 id 不再剔除',
    file: 'js/chapter-v3.js',
    from: `  st.inventory=st.inventory.filter(k=>typeof k==='string' && !!ITEMS[k]);`,
    to: `  /* 不校验遗物 */`,
    expect: ['10.'],
  },
  {
    id: 'N-存档-起点不再拒绝覆盖',
    file: 'js/core.js',
    from: `  if(G.scene==='arrival') return false; // 起点不覆盖已有进度`,
    to: `  /* 起点也照写 */`,
    expect: ['10.'],
  },
  {
    id: 'S-遗物-选项不再发放遗物',
    file: 'js/chapter-v3.js',
    from: `  if(fx.item) giveItem(fx.item);`,
    to: `  /* 遗物不入囊 */`,
    expect: ['11.'],
  },

  /* ---- 第二轮：对抗式审查后补上的四处修复 ---- */
  {
    id: 'V-刷分-增量记账失效',
    file: 'js/chapter-v3.js',
    desc: '还原成"每次点击都重新结算 rite/evidence" —— 掀帘与投火盆两条循环即可刷满隐藏状态',
    from: `    const spentFlag='fx-spent-'+guardKey;
    if(!hasFlag(spentFlag)){`,
    to: `    const spentFlag='fx-spent-'+guardKey;
    if(true){`,
    expect: ['4.'],
  },
  {
    id: 'W-陷阱门-定名退路被删',
    file: 'js/chapter-v3.js',
    desc: '还原成四条出边全指向结局 —— 1 点证据误点定名即被迫拿《正婚》',
    from: `      { id:'not-yet', label:'笔还空着。退回中庭，再去找她的名字', next:'courtyard' },
`,
    to: ``,
    expect: ['1.', '4.'],
  },
  {
    id: 'X-措辞-追加句重新引入裸她',
    file: 'js/chapter-v3.js',
    desc: '还原旧文案：全文已改口为"新妇",句尾却仍写"替她"',
    from: `      if(G.rite>=4) text+='<br><br><span class="rited">你几乎能抢在别人前面，把下面那句话说完。</span>';`,
    to: `      if(G.rite>=4) text+='<br><br><span class="rited">你几乎能替她把下面那句话念完。</span>';`,
    expect: ['5.'],
  },
  {
    id: 'Y-单程票-中庭回碑前的边被删',
    file: 'js/chapter-v3.js',
    from: `      { id:'stele', label:'退回村口的石碑前', next:'arrival' },
`,
    to: ``,
    expect: ['1.'],
  },

  /* ---- 第三轮：作者权侵蚀 / 回看账 / 节点剥夺 / 界面分层 ---- */
  {
    id: 'Z1-侵蚀-措辞改为随机驱动',
    file: 'js/chapter-v3.js',
    desc: '往接管规则里注入 Math.random —— 违反"异变只能来自确定状态"的契约',
    from: `  return outsideQuotes(t, s=>s.replace(/你/g, ERODE_VOICE));`,
    to: `  if(Math.random()<0.5) return outsideQuotes(t, s=>s.replace(/你/g, ERODE_VOICE));
  return t;`,
    expect: ['6.', '12.'],
  },
  {
    id: 'Z2-侵蚀-选项措辞不再被接管',
    file: 'js/chapter-v3.js',
    desc: 'erodeLabel 直接原样返回 —— 恐怖机制静默失效',
    from: `  if(choice.spoken) return choice.label;
  return erodeVoice(choice.label, true);`,
    to: `  return choice.label;`,
    expect: ['12.'],
  },
  {
    id: 'Z3-侵蚀-吞掉玩家说出口的话',
    file: 'js/chapter-v3.js',
    desc: '去掉 spoken 例外 —— "你不只是新妇"会被改成"新郎不只是新妇"',
    from: `  if(choice.spoken) return choice.label;`,
    to: `  /* spoken 例外失效 */`,
    expect: ['12.'],
  },
  {
    id: 'Z4-侵蚀-破坏了 HTML 标签',
    file: 'js/chapter-v3.js',
    desc: '把替换目标写成含标签片段的串, 检验标签守卫真的会红',
    from: `  return outsideQuotes(t, s=>s.replace(/你/g, ERODE_VOICE));`,
    to: `  return outsideQuotes(t, s=>s.replace(/你/g, '<span>新郎'));`,
    expect: ['12.'],
  },
  {
    id: 'Z5-剥夺-不再要求两条预警',
    file: 'js/chapter-v3.js',
    desc: '门槛降为 0 —— 无预警即夺权, 违反契约第 7 条',
    from: `  return warningsMet(choice)>=2;`,
    to: `  return true;`,
    expect: ['14.'],
  },
  {
    id: 'Z6-剥夺-不再看渗透档位',
    file: 'js/chapter-v3.js',
    desc: 'watch 在低渗透即被接管。注：代笔记账会改变 flags 集合，可能偶然扰动随机播放路径，使第 17 节一并报红 —— 那是溢出而非必然，不写入预期',
    from: `  if(u.minRite!=null && G.rite<u.minRite) return false;`,
    to: `  /* 渗透档位不再参与判定 */`,
    expect: ['14.'],
  },
  {
    id: 'Z7-剥夺-代笔不留证据',
    file: 'js/chapter-v3.js',
    desc: '删掉 usurped 记账与锚点标记 —— 玩家无从回看核对',
    from: `            setFlag('usurped-'+id+':'+choice.id);
            setFlag('anchorFall');
            recordTranscript('usurp', id+':'+choice.id);`,
    to: `            /* 代笔不留痕 */`,
    expect: ['14.'],
  },
  {
    id: 'Z8-回看-账页自己也被侵蚀',
    file: 'js/chapter-v3.js',
    desc: '去掉 margins 的 noErode —— 证据面被改写就等于没有证据',
    from: `    noErode:true,   /* 证据面必须永远诚实，否则"可回看验证"不成立 */`,
    to: `    /* 账页也交给仪式措辞 */`,
    expect: ['13.'],
  },
  {
    id: 'Z9-界面-改字时顺手清了处理函数',
    file: 'js/core.js',
    desc: '顶栏换称呼时把 onclick 一起清掉 —— 玩家失去存档与退路',
    from: `    b.textContent = deep?TOPBAR_ERODED[id]:TOPBAR_HONEST[id];`,
    to: `    const eTxt=TOPBAR_ERODED[id], hTxt=TOPBAR_HONEST[id];
    b.textContent = deep?eTxt:hTxt;
    if(deep) b.onclick=null;`,
    expect: ['15.'],
  },
  {
    id: 'ZA-界面-锚点提前失守',
    file: 'js/core.js',
    desc: '渗透 1 就改主菜单 —— 锚点从未立住, 异常变成背景噪音',
    from: `function chromeEroded(){ return !!G && (G.rite>=4 || hasFlag('anchorFall')); }`,
    to: `function chromeEroded(){ return !!G && (G.rite>=1 || hasFlag('anchorFall')); }`,
    expect: ['15.'],
  },
  {
    id: 'ZB-界面-锚点失守是永久污染',
    file: 'js/core.js',
    desc: '改成只写不清: 新开一局菜单仍是失守文案',
    from: `  const src=fell?MENU_FALL:MENU_HONEST;
  if(el('menu-title')) el('menu-title').textContent=src.title;`,
    to: `  const src=fell?MENU_FALL:MENU_HONEST;
  if(el('menu-title') && fell) el('menu-title').textContent=src.title;`,
    expect: ['15.'],
  },
  {
    id: 'ZC-违规-应门外之声不再有后果',
    file: 'js/chapter-v3.js',
    desc: '删掉 answeredName 变体的触发条件 —— 违规只剩文本收益',
    from: `        { when:{flag:'answeredName'},`,
    to: `        { when:{flag:'neverAchievedFlag'},`,
    expect: ['16.'],
  },
  {
    id: 'ZD-违规-掀轿帘不再有后果',
    file: 'js/chapter-v3.js',
    from: `        { when:{flag:'liftedVeil'},`,
    to: `        { when:{flag:'neverAchievedFlag'},`,
    expect: ['16.'],
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
  /* 源码为 CRLF 而锚点为 LF, 不换算行尾会让跨行锚点静默失配 */
  const crlf = s => s.replace(/\r?\n/g, '\r\n');
  const from = src.includes('\r\n') ? crlf(m.from) : m.from;
  const to = src.includes('\r\n') ? crlf(m.to) : m.to;
  const hits = src.split(from).length - 1;
  if (hits === 0) return { ok: false, why: '目标文本不存在(锚点已失效)' };
  if (hits > 1) return { ok: false, why: `目标文本出现 ${hits} 次, 拒绝盲改` };
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
  let current = null;
  for (const line of out.split('\n')) {
    const sec = line.match(/^\s*(\d+[a-z]?)\.\s/);
    if (sec) current = sec[1] + '.';
    if (/^\s*FAIL\s/.test(line) && current) failed.add(current);
  }
  return { code: r.status, failed: [...failed], out };
}

console.log('红纸鸢 · 归名 (v3) 变异测试\n' + '-'.repeat(66));
const baselineDigest = digest();
const clean = runSuite();
if (clean.code !== 0) {
  console.log('基线不绿, 先修测试再谈变异。FAIL 组:', clean.failed.join(' ') || '(未解析)');
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
    const extra = res.failed.filter(g => !m.expect.includes(g));
    rows.push({
      id: m.id,
      verdict: caught ? (missedExpected.length ? '捕获但不精准' : '已被捕获') : '★ 未被捕获',
      note: caught
        ? `报于 ${res.failed.join(' ') || '(未解析)'}` +
          (missedExpected.length ? ` | 预期未中: ${missedExpected.join(' ')}` : '') +
          (extra.length ? ` | 溢出: ${extra.join(' ')}` : '')
        : (m.desc || '对应断言是空断言'),
    });
  }
} finally {
  restore();
  fs.rmSync(SNAPSHOT, { recursive: true, force: true });
}

const w = Math.max(...rows.map(r => r.id.length));
for (const r of rows) console.log(`  ${r.id.padEnd(w)}  ${r.verdict.padEnd(14)} ${r.note}`);
const survivors = rows.filter(r => /未被捕获/.test(r.verdict)).length;
const imprecise = rows.filter(r => /不精准/.test(r.verdict)).length;
const broken = rows.filter(r => r.verdict === '无法应用').length;
console.log('-'.repeat(66));
console.log(`变异体 ${rows.length}: 精准捕获 ${rows.length - survivors - imprecise - broken} / 漏网 ${survivors} / 不精准 ${imprecise} / 无法应用 ${broken}`);

const finalDigest = digest();
const intact = finalDigest === baselineDigest;
const finalCheck = runSuite();
console.log('收尾源码完整性: ' + (intact ? '哈希与开工前一致 ✓' : '!! 哈希已变, 请 git diff 检查\n  前 ' + baselineDigest + '\n  后 ' + finalDigest));
console.log('收尾基线回归: ' + (finalCheck.code === 0 ? '全绿 ✓' : '!! 仍为红, 请 git checkout'));
process.exit(survivors || imprecise || broken || !intact || finalCheck.code !== 0 ? 1 : 0);
