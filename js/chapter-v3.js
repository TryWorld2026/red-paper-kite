/* =====================================================================
   重构引擎：规则与名字证据系统
   兼容读取 v2 理智/阴气存档，但 v3 不再向玩家显示或推进旧数值。
   ===================================================================== */

const CHAPTER_V3 = {
  arrival: {
    title: '槐阴村 · 婚期第三日',
    text: {
      first: '你来迎亲，却没有人肯告诉你新娘在哪里。<br><br>村路口的石碑被红纸覆住，纸下拓着一行旧字：<span class="em">“新妇未至，婿不得归。”</span><br><br>你握住那封残缺婚书。纸上只剩她的姓，名字处被水渍洇开，像有人反复摩挲，想把它抹平。',
      again: '你又回到碑前。红纸比方才更湿，边缘贴着石面，像刚有人用掌心压过。<br><br>碑上的字仍是那一句。只是“婿”字下面多了一道指甲划出的浅痕。'
    },
    choices: [
      { id: 'read-ledger', label: '查看碑侧的婚期账本', next: 'gate-ledger', once: true, effects: { evidence: { paternal: 1 } } },
      { id: 'enter', label: '进入挂着白灯笼的宅院', next: 'courtyard' }
    ]
  },

  'gate-ledger': {
    title: '婚期账本',
    text: {
      first: '账本记着酒席、纸扎、唢呐，每一笔都清楚。<br><br>只有新娘那一栏没有名字，写着：<span class="em">“周氏，归宗待填。”</span><br><br>“归宗”两个字旁边，另有人用细笔添了一句：她还姓周吗？',
      again: '账本自己翻到同一页。<br><br>“周氏”旁的那句疑问不见了，像从未被写过。'
    },
    choices: [{ id: 'back', label: '记住“周氏”', next: 'arrival', once: true, effects: { flag: 'knowsPaternalName' } }]
  },

  courtyard: {
    title: '陈家老宅 · 中庭',
    text: {
      first: '院中无风，满树红纸鸢却一起朝向东厢。<br><br>喜婆站在廊下，手里拿着一根未系的红绳：<span class="ghost">“新郎官来得不巧，新娘子还没过门。你若急着找人，先应下三条规矩。”</span>',
      again: '红绳仍在喜婆手中。绳结却已经打好，仿佛你刚才离开的那一会儿，有人替你系上过，又解开。'
    },
    choices: [
      { id: 'rules', label: '问她是哪三条规矩', next: 'rules' },
      { id: 'west', label: '先去西厢', next: 'west-room' },
      { id: 'east', label: '先去东厢新房', next: 'east-room' },
      { id: 'shrine', label: '先去后院祠堂', next: 'shrine-room' },
      { id: 'naming', label: '天将明，走到牌位前替她定名', next: 'naming', condition: { evidenceTotal: 1 } }
    ]
  },

  rules: {
    title: '三条婚仪规矩',
    text: {
      first: '喜婆竖起三根枯指：<br><br><span class="ghost">“一、听见门外叫名，不许应。<br>二、轿帘落下，不许揭。<br>三、天未亮，不许提她的旧名。”</span><br><br>她笑道：「都是为了活人好。规矩若不护人，还会专门写下来么？」',
      again: '三条规矩被你念过一遍后，喜婆的话术忽然变得像你的想法。<br><br>你不确定自己是在复述她，还是在说服自己。'
    },
    choices: [
      { id: 'agree', label: '应下规矩，换取入宅路引', next: 'first-call', effects: { flag: 'acceptedRules', rite: 1 } },
      { id: 'refuse', label: '先弄清她为何失踪', next: 'courtyard', effects: { flag: 'questionedRules' } }
    ]
  },

  'first-call': {
    title: '亥时 · 门外',
    text: {
      first: '厢房门外传来女子的声音：<span class="whisper">“夫君，我在此处。”</span><br><br>她的嗓音很轻，尾音却没有回。门外的人又叫了一次，叫的是<span class="em">“新郎”</span>，而不是你的名字。',
      again: '门外已经无声。门缝下却多了一张被踩脏的纸鸢翅，翅上只写了半个“鸢”字。'
    },
    choices: [
      { id: 'answer', label: '回应门外', next: 'answered-call', effects: { flag: 'answeredName', rite: 1 } },
      { id: 'silence', label: '遵守第一条规矩，沉默', next: 'west-room', effects: { flag: 'keptSilence' } }
    ]
  },

  'answered-call': {
    title: '门缝',
    text: {
      first: '你应了一声。<br><br>门外的呼吸停住。片刻后，那声音用你的语气重新说了一遍：「我在此处。」<br><br>它不是在叫你。它在学习如何替你回答。',
      again: '门外反复播放你刚才那一声回应。声音越来越像你自己，直到你无法从口型判断刚才谁先开口。'
    },
    choices: [{ id: 'step-back', label: '退开', next: 'west-room', effects: { evidence: { personal: 1 } } }]
  },

  'west-room': {
    title: '西厢 · 嫁妆箱',
    text: {
      first: '箱中没有金银，只有一摞未交付的家书。<br><br>第一封由父亲所写，抬头是<span class="em">“周家小女”</span>。最后一封由夫家所写，抬头是<span class="em">“陈门新妇”</span>。<br><br>两封信之间夹着一张没有抬头的纸，只写着：等我绣完这只纸鸢，我自己取名。',
      again: '家书顺序变了。那页“我自己取名”被压到最底层，上面落了一层新鲜香灰。'
    },
    choices: [
      { id: 'take-father', label: '取走父亲的信', next: 'evidence-father', once: true, effects: { evidence: { paternal: 2 }, item: 'fatherLetter' } },
      { id: 'take-husband', label: '取走夫家的信', next: 'evidence-husband', once: true, effects: { evidence: { marital: 2 }, item: 'marriageLetter' } },
      { id: 'take-personal', label: '取走没有抬头的那页', next: 'evidence-personal', once: true, effects: { evidence: { personal: 2 }, item: 'unfinishedLetter' } },
      { id: 'leave', label: '合上箱子', next: 'courtyard' }
    ]
  },

  'evidence-father': {
    title: '父书',
    text: { first: '信上说她生在一个登记的日期，却没有写她喜欢什么。<br><br>最后叮嘱是：「嫁入陈门后，勿再提周家旧事。」', again: '你再看，那句叮嘱已经变成：「归宗之后，勿再提陈门旧事。」' },
    choices: [{ id: 'back', label: '记住她的出身', next: 'west-room' }]
  },

  'evidence-husband': {
    title: '夫书',
    text: { first: '信纸洒过香灰，字迹端正得像牌位上的刻文。<br><br>「吉时已定，新妇入轿。此后一切礼数，由新郎代全。」', again: '你发现最后一句被红绳压住。掀开红绳，下面不是墨迹，而是早已写好的你的名字。' },
    choices: [{ id: 'back', label: '记住礼数正在替你完成', next: 'west-room' }]
  },

  'evidence-personal': {
    title: '无名之页',
    text: { first: '她写字很急，笔画却干净。<br><br>「父亲说我归母家，夫家说我归夫门。若我还能选，我想先选自己。」<br><br>落款空着。', again: '空落款旁出现一道很浅的铅笔痕，像有人刚替你写过，又马上擦掉。' },
    choices: [{ id: 'back', label: '把那处空白记住', next: 'west-room', effects: { flag: 'sawSelfName' } }]
  },

  'east-room': {
    title: '东厢 · 空轿',
    text: {
      first: '轿帘低垂，里面没有重量，纸鞋底却沾着新鲜泥。<br><br>镜前放着一只未糊完的纸鸢。纸面上有一个被涂黑的称呼，隐约还能辨出：<span class="em">“新娘”</span>。',
      again: '轿帘仍垂着，但轿底泥印多出一双，方向从轿内朝外。<br><br>纸鸢上的涂黑处被指甲刮开，露出一小片空白。'
    },
    choices: [
      { id: 'lift', label: '违反第二条规矩，掀开轿帘', next: 'open-veil', effects: { flag: 'liftedVeil', rite: 1 } },
      { id: 'kite', label: '取走纸鸢', next: 'kite-clue', once: true, effects: { evidence: { personal: 1 }, item: 'kite' } },
      { id: 'leave', label: '退出新房', next: 'courtyard' }
    ]
  },

  'open-veil': {
    title: '轿内',
    text: { first: '轿中只有一叠空白婚书。<br><br>最上面那张正逐字浮现你的名字。墨迹尚未干透，笔锋却来自轿内。', again: '空白婚书已经完整，双方姓名都是你的。第三个位置写着“新妇”，后面只有一枚尚未落下的指印。' },
    choices: [{ id: 'close', label: '放下轿帘', next: 'east-room', effects: { flag: 'sawSelfMarriage' } }]
  },

  'kite-clue': {
    title: '纸鸢',
    text: { first: '你翻过纸鸢。背面原本涂黑的名字被刮开一层，露出更小的自书：<span class="em">鸢</span>。<br><br>不是“阿鸢”，不是“周氏”，也不是“陈门新妇”。只有一个她单独使用过的字。', again: '纸鸢上又多了半个“鸢”字，墨迹未干。你手上没有墨。' },
    choices: [{ id: 'keep', label: '收好纸鸢', next: 'east-room', effects: { flag: 'knowsPersonalName' } }]
  },

  'shrine-room': {
    title: '后院 · 祠堂',
    text: {
      first: '牌位上没有名字，只有三行空格：父名、夫名、自名。<br><br>喜婆的声音从身后传来：「前两项已填。最后那格空着，不算礼成。」',
      again: '前两项的名字已被填满，第三项也开始出现笔画。笔迹与你写字时极为相似。'
    },
    choices: [
      { id: 'ask', label: '问这块牌位给谁', next: 'tablet-talk' },
      { id: 'burn', label: '烧掉喜婆递来的婚书', next: 'burning', effects: { flag: 'burnedMarriagePaper', evidence: { personal: 1 } } },
      { id: 'leave', label: '退出祠堂', next: 'courtyard' }
    ]
  },

  'tablet-talk': {
    title: '空牌位',
    text: { first: '喜婆没有回答，只把红绳放到空格旁。<br><br>「名字不是查出来的，是有人肯替她填。」<br><br>这句话乍听像邀请，细想却是推责。', again: '空格中已经填入“周氏”。笔迹端正，不像喜婆，也不像她。' },
    choices: [{ id: 'back', label: '退回祠堂', next: 'shrine-room', effects: { flag: 'knowsTablet' } }]
  },

  burning: {
    title: '火盆',
    text: { first: '婚书入火，纸上所有夫家姓名同时消失，只剩“新妇”二字。<br><br>你意识到烧掉婚书并不等于还给她名字。', again: '火盆里烧出一份新的空白婚书，仿佛这里永远会补上另一份。' },
    choices: [{ id: 'return', label: '从火中抢回残页', next: 'shrine-room', once: true, effects: { item: 'burnedPage' } }]
  },

  naming: {
    title: '寅时 · 礼成前',
    text: {
      first: '院门终于打开，轿帘却自行升起。<br><br>轿中无人，喜婆却把你领到牌位前：「说出她的名字，她便归你找到之处。」<br><br>三条证据在你脑中同时作响。',
      again: '牌位上的空格已经填了一半。再迟疑，名字就会由别人替你写完。'
    },
    choices: [
      { id: 'paternal', label: '称她为周氏', next: 'ending-return', condition: { minEvidence: { paternal: 2 } } },
      { id: 'marital', label: '称她为陈门新妇', next: 'ending-marriage', condition: { minEvidence: { marital: 2 } } },
      { id: 'personal', label: '只念她自写的“鸢”', next: 'ending-loss', condition: { minEvidence: { personal: 2 } } },
      { id: 'say-father', label: '说出父亲给她的名字', next: 'ending-return', condition: { minEvidence: { paternal: 1 } } },
      { id: 'say-husband', label: '说出夫家给她的称呼', next: 'ending-marriage', condition: { minEvidence: { marital: 1 } } },
      { id: 'say-kite', label: '说出纸鸢背面的字', next: 'ending-loss', condition: { minEvidence: { personal: 1 } } },
      { id: 'let-them', label: '沉默。喜婆替你落笔，把“她”这个字填上牌位', next: 'ending-marriage' }
    ]
  }
};

const ENDINGS_V3 = {
  'ending-return': {
    type: 'normal',
    tag: '— 结局 壹 —',
    name: '归 籍',
    text: '村口开了。轿中走出一个没有五官的纸人，向你福了一福。<br><br>喜婆在婚书上写下“周氏归宗”。她确实离开了陈家，却被领回另一座登记户籍的宅门。<br><br>你回头时，只听见她极平静地说：「你把我送回去了。谢谢你。」'
  },
  'ending-marriage': {
    type: 'good',
    tag: '— 结局 贰 —',
    name: '正 婚',
    text: '你念出“陈门新妇”，所有矛盾忽然顺了。<br><br>牌位合拢，纸鸢落地，喜路明亮。喜婆替你整理衣袖，夸你是最懂礼数的新郎。<br><br>一个月后，你收到一封喜帖。寄件人一栏没有名字，只有你自己端端正正的字迹：<b>陈门新妇。</b>'
  },
  'ending-loss': {
    type: 'normal',
    tag: '— 真结局候选 —',
    name: '失 讳',
    text: '你只念出那个“鸢”字。牌位裂开，院门却向后缩回黑暗。<br><br>轿中人终于第一次拒绝礼词，问：<br><span class="em">“既然记得我，你为什么还要娶我？”</span><br><br>你想起自己一路寻找她，却始终握着那封有自己名字的婚书。'
  }
};

const SCENE_ALIASES = {
  'ending-return': 'ending-return',
  'ending-marriage': 'ending-marriage',
  'ending-loss': 'ending-loss'
};

let _v3Scenes=null;
function v3Scenes(){
  if(!_v3Scenes) _v3Scenes=compileAllScenes();
  return _v3Scenes;
}

/* 不依赖全局 G,供加载/渲染共用。阿鸢、喜婆沿用旧场景表,其余走 v3 新章节 */
function scenesForPov(pov){
  if(pov==='ayuan') return SCENES_AYUAN;
  if(pov==='po') return SCENES_PO;
  return v3Scenes();
}

function normalizeGameState(state){
  const s = state && typeof state === 'object' ? state : {};
  s.version = 3;
  s.pov = s.pov || 'newcomer';
  s.flags = s.flags || {};
  s.evidence = s.evidence || { paternal:0, marital:0, personal:0 };
  s.rite = typeof s.rite === 'number' ? Math.max(0, Math.min(5, s.rite)) : 0;
  s.hour = typeof s.hour === 'number' ? s.hour : 0;
  s.visited = s.visited || {};
  s.inventory = s.inventory || [];
  s.transcript = s.transcript || [];
  s.san = s.san === undefined ? 10 : s.san;   // 仅作旧字段占位,不再驱动玩法
  s.yin = s.yin === undefined ? 0 : s.yin;

  // 新郎:旧 v2 场景(intro/explore/finale…)无法映射进 v3 章节,回到新起点
  // 阿鸢/喜婆:其场景表未变,保留原进度
  const sceneKnown = scenesForPov(s.pov)[s.scene];
  if(!sceneKnown) s.scene = (s.pov==='newcomer'||s.pov!=='ayuan'&&s.pov!=='po') ? 'arrival' : s.scene;
  return s;
}

function evidenceScore(kind){
  return Math.max(0, Math.min(5, (G.evidence && G.evidence[kind]) || 0));
}

function addEvidence(kind, amount){
  if(!kind || amount <= 0) return;
  G.evidence[kind] = evidenceScore(kind) + amount;
}

function adjustRite(delta){
  if(!delta) return;
  const before = G.rite;
  G.rite = Math.max(0, Math.min(5, G.rite + delta));
  if(delta > 0 && G.rite !== before){
    recordTranscript('rite', G.rite);
    Sound.ghost();
  }
}

function recordTranscript(kind, value){
  G.transcript.push({ kind, value, at: G.scene });
  if(G.transcript.length > 30) G.transcript.shift();
}

function applyChoiceEffects(effects){
  if(!effects) return;
  if(effects.flag) setFlag(effects.flag);
  if(effects.item) giveItem(effects.item);
  if(effects.rite) adjustRite(effects.rite);
  if(effects.evidence){
    Object.keys(effects.evidence).forEach(kind => addEvidence(kind, effects.evidence[kind]));
  }
}

/* 选项可用性:一次性选项去重 + 显式 flag 条件 + 各类证据阈值,任一命中即可 */
function choiceIsAvailable(choice){
  if(choice.once && hasFlag('scene-choice-' + choice.id)) return false;
  const condition = choice.condition;
  if(!condition) return true;
  if(condition.flag && !hasFlag(condition.flag)) return false;
  if(condition.notFlag && hasFlag(condition.notFlag)) return false;
  if(condition.minEvidence){
    const met = Object.keys(condition.minEvidence)
      .some(kind => evidenceScore(kind) >= condition.minEvidence[kind]);
    if(!met) return false;
  }
  if(condition.evidenceTotal != null){
    const total = evidenceScore('paternal') + evidenceScore('marital') + evidenceScore('personal');
    if(total < condition.evidenceTotal) return false;
  }
  return true;
}

function renderNameSubstitution(text){
  if(G.rite < 2) return text;
  return text.replace(/她/g, dominantName());
}

/* 哪一类称呼在当前证据下最响亮,用于文本替换与终局提示 */
function dominantName(){
  const p = evidenceScore('paternal'), m = evidenceScore('marital'), s = evidenceScore('personal');
  const max = Math.max(p, m, s);
  if(max === 0) return '她';
  if(s === max) return '鸢';
  if(m === max) return '新妇';
  return '周氏';
}

const RITE_NAMES=['尚无','微澜','渗透','浸礼','难分彼此','已成'];
function riteName(){
  return RITE_NAMES[Math.max(0, Math.min(5, G.rite|0))];
}

/* 结局页统计：新郎用"仪式渗透"文字档位,副视角回退到真相计数 */
function endingStatText(){
  const povName = G.pov==='ayuan' ? '阿鸢' : G.pov==='po' ? '喜婆' : '新郎';
  if(G.pov==='newcomer' && G.evidence){
    const kinds = ['paternal','marital','personal'].filter(k => evidenceScore(k) > 0).length;
    return `仪式渗透 ${riteName()} · 你以此称呼了她：${dominantName()} · 寻得 ${kinds} 类名字证据 · 视角 ${povName}`;
  }
  return `视角 ${povName}`;
}

function compileScene(id){
  const definition = CHAPTER_V3[id];
  if(!definition) return null;
  return {
    title: definition.title,
    run(){
      const visits = G.visited[id] || 0;
      let text = visits > 1 && definition.text.again ? definition.text.again : definition.text.first;
      text = renderNameSubstitution(text);
      if(G.rite >= 4) text += '<br><br><span class="rited">你几乎能替她把下面那句话念完。</span>';
      const choices = (definition.choices || []).filter(choiceIsAvailable).map(choice => ({
        text: choice.label,
        id: choice.id,
        action(){
          if(choice.once) setFlag('scene-choice-' + choice.id);
          applyChoiceEffects(choice.effects);
          recordTranscript('choice', choice.id);
          if(ENDINGS_V3[choice.next]) reachEnding(choice.next);
          else goTo(choice.next);
        }
      }));
      return { text, choices };
    }
  };
}

function compileAllScenes(){
  const compiled = {};
  Object.keys(CHAPTER_V3).forEach(id => { compiled[id] = compileScene(id); });
  return compiled;
}
