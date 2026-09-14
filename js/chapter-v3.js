/* ===================================================================
   《红纸鸢 · 归名》第一章剧本 + 场景编译器 (v3)
   数据驱动的确定性文字恐怖：重复场景差量、称呼替换、仪式渗透。
   引擎运行时在 core.js；此处只提供内容、结局与编译。
   =================================================================== */

const CHAPTER_V3 = {

  arrival:{
    title:'槐阴村 · 婚期第三日',
    text:{
      first:[
        { when:{memory:true},
          text:'你还是先走到了碑前。<br><br>红纸下那行旧字没有变：<span class="em">“新妇未至，婿不得归。”</span>只是“婿”字下面那道浅痕，比你记得的又深了一些。<br><br>碑不写你来过。你手上的墨写。' },
        { text:'你来迎亲，却没有人肯告诉你新娘在哪里。<br><br>村路口的石碑被红纸覆住，纸下拓着一行旧字：<span class="em">“新妇未至，婿不得归。”</span><br><br>你握住那封残缺婚书。纸上只剩她的姓，名字处被水渍洇开，像有人反复摩挲，想把它抹平。' }
      ],
      again:'你又回到碑前。红纸比方才更湿，边缘贴着石面，像刚有人用掌心压过。<br><br>碑上的字仍是那一句。只是“婿”字下面，多了一道与你手型相符的浅痕。'
    },
    choices:[
      { id:'read-ledger', label:'查看碑侧的婚期账本', next:'gate-ledger', effects:{ evidence:{paternal:1} } },
      { id:'enter', label:'进入挂着白灯笼的宅院', next:'courtyard' }
    ]
  },

  'gate-ledger':{
    title:'婚期账本',
    text:{
      first:'账本记着酒席、纸扎、唢呐，每一笔都清楚。<br><br>只有新娘那一栏没有名字，写着：<span class="em">“周氏，归宗待填。”</span><br><br>“归宗”两字旁，另有人用细笔添了一句：她还姓周吗？',
      again:'账本自己翻到同一页。<br><br>“周氏”旁的那句疑问不见了，像从未被写过。'
    },
    choices:[
      { id:'back', label:'记住“周氏”', next:'arrival', effects:{ flag:'knowsPaternalName' } }
    ]
  },

  courtyard:{
    title:'陈家老宅 · 中庭',
    text:{
      first:[
        { when:{rite:3},
          text:'院中无风，满树红纸鸢却一起朝向东厢。<br><br>喜婆迎出来，两只手都拢在袖子里：<span class="ghost">“新郎回来了。礼数上你已替她全了几样，剩下的，也有人替你记着。”</span><br><br>喜婆不再问你要找谁。' },
        { text:'院中无风，满树红纸鸢却一起朝向东厢。<br><br>喜婆站在廊下，手里拿着一根未系的红绳：<span class="ghost">“新郎官来得不巧。你要找人，先应下三条规矩。”</span>' }
      ],
      again:[
        { when:{rite:3},
          text:'红绳已经不在喜婆手里了。<br><br>你想不起它是什么时候系上的，也只记得自己从未答应过。' },
        { text:'红绳仍在喜婆手中，绳结却已经打好。<br><br>仿佛你离开的这一会儿，有人替你系上过，又解开。' }
      ]
    },
    choices:[
      { id:'rules', label:'问她，是哪三条规矩', next:'rules' },
      { id:'west', label:'去西厢', next:'west-room' },
      { id:'east', label:'去东厢新房', next:'east-room' },
      { id:'shrine', label:'去后院祠堂', next:'shrine-room' },
      { id:'stele', label:'退回村口的石碑前', next:'arrival' },
      { id:'margins', label:'低头看你自己的婚书', next:'margins' },
      { id:'reunion', label:'轿帘后传来纸摩擦的声音', next:'reunion', condition:{evidenceTotal:3} },
      { id:'naming', label:'天将明，走到牌位前替她定名', next:'naming', condition:{evidenceTotal:1} }
    ]
  },

  rules:{
    title:'三条婚仪规矩',
    text:{
      first:'喜婆竖起三根枯指：<br><br><span class="ghost">“一、听见门外叫名，不许应。<br>二、轿帘落下，不许揭。<br>三、天未亮，不许提她的旧名。”</span><br><br>她笑道：「都是为了活人好。规矩若不护人，还会专门写下来么？」',
      again:'三条规矩被你复述过一遍后，忽然变得像你自己想出来的。<br><br>你不确定刚才是她在说，还是你在替她说。'
    },
    choices:[
      { id:'agree', label:'应下规矩，换取入宅', next:'first-call', effects:{ flag:'acceptedRules', flags:['rulesSeen','warnNoAnswer','warnNoNaming'], rite:1 } },
      { id:'refuse', label:'先弄清她为何失踪', next:'courtyard', effects:{ flag:'questionedRules', flags:['rulesSeen'] } }
    ]
  },

  'first-call':{
    title:'亥时 · 门外',
    text:{
      first:'厢房门外传来女子的声音：<span class="whisper">“夫君，我在此处。”</span><br><br>嗓音很轻，尾音却没有回。门外的人又叫了一次，叫的是<span class="em">“新郎”</span>，而不是你的名字。',
      again:'门外又叫了一声，用的是你刚才的语调。<br><br>这一次，连“新郎”两个字都不见了——只剩一张嘴在门缝里开合。'
    },
    choices:[
      { id:'answer', label:'回应门外', next:'answered-call', effects:{ flag:'answeredName', rite:1 } },
      { id:'silence', label:'守住第一条规矩，沉默', next:'courtyard', effects:{ flag:'keptSilence' } }
    ]
  },

  'answered-call':{
    title:'门缝',
    text:{
      first:'你应了一声。<br><br>门外的呼吸停住。片刻后，那声音用<span class="em">你的语气</span>重新说了一遍：「我在此处。」<br><br>它不是在叫你。它在学习如何替你回答。',
      again:'门外反复播放你刚才那一声回应，越来越像你自己。<br><br>你已经分不清，刚才是谁先开口。'
    },
    choices:[
      { id:'step-back', label:'退开', next:'courtyard', effects:{ evidence:{personal:1} } }
    ]
  },

  'west-room':{
    title:'西厢 · 嫁妆箱',
    text:{
      first:'箱中没有金银，只有一摞未交付的家书。<br><br>最上一封由父亲所写，抬头<span class="em">“周家小女”</span>；最下一封由夫家所写，抬头<span class="em">“陈门新妇”</span>。<br><br>两封信之间夹着一张没有抬头的纸：等我绣完这只纸鸢，我自己取名。',
      again:[
        { when:{item:'unfinishedLetter'},
          text:'家书顺序变了。原本压着那页无抬头之纸的位置空了，香灰直接落在箱底，<span class="em">灰上留着一个角翘起的印子</span>。<br><br>像是那页纸自己走开的。' },
        { text:'家书顺序变了。“我自己取名”那页被压到最底层，上面落了一层新鲜香灰。' }
      ]
    },
    choices:[
      { id:'take-father', label:'取走父亲的信', next:'evidence-father', once:true, effects:{ evidence:{paternal:2}, item:'fatherLetter' } },
      { id:'take-husband', label:'取走夫家的信', next:'evidence-husband', once:true, effects:{ evidence:{marital:2}, item:'marriageLetter', flag:'warnDeputy' } },
      { id:'take-personal', label:'取走没有抬头的那页', next:'evidence-personal', once:true, effects:{ evidence:{personal:2}, item:'unfinishedLetter', flag:'sawSelfName' } },
      { id:'leave', label:'合上箱子', next:'courtyard' }
    ]
  },

  'evidence-father':{
    title:'父书',
    text:{
      first:'信上写她生于某年某月，却没写她喜欢什么。<br><br>末尾叮嘱：<span class="ghost">「嫁入陈门后，勿再提周家旧事。」</span>',
      again:'你又看一遍。那句叮嘱变成了：<span class="ghost">「归宗之后，勿再提陈门旧事。」</span><br><br>墨是旧的，改动却是新的。'
    },
    choices:[
      { id:'back', label:'记住她的出身', next:'west-room' }
    ]
  },

  'evidence-husband':{
    title:'夫书',
    text:{
      first:'信纸洒过香灰，字迹端正得像牌位刻文。<br><br><span class="ghost">「吉时已定，新妇入轿。此后一切礼数，由新郎代全。」</span>',
      again:'最后一句被红绳压住。掀开红绳，下面不是她的名字，<br><br>是早已写好的<span class="em">你的名字</span>。'
    },
    choices:[
      { id:'back', label:'记住礼数正在替你完成', next:'west-room' }
    ]
  },

  'evidence-personal':{
    title:'无名之页',
    text:{
      first:'她写字很急，笔画却干净。<br><br><span class="ghost">「父亲说我归母家，夫家说我归夫门。若我还能选，我想先选自己。」</span><br><br>落款是空的。',
      again:'空落款旁多了一道很浅的铅笔痕，像有人刚替你写过，又马上擦掉。'
    },
    choices:[
      { id:'back', label:'把那处空白记住', next:'west-room' }
    ]
  },

  'east-room':{
    title:'东厢 · 空轿',
    text:{
      first:'轿帘低垂。里面没有重量，纸鞋底却沾着新鲜泥。<br><br>镜前放着一只未糊完的纸鸢。纸面上有个被涂黑的称呼，隐约还能辨出：<span class="em">“新娘”</span>。',
      again:[
        { when:{item:'kite'},
          text:'轿帘仍垂着，但轿底泥印多出一双，方向从轿内<span class="em">朝外</span>。<br><br>镜前原本搁纸鸢的地方空了，台面上只余一圈指甲刮出的白痕。' },
        { text:'轿帘仍垂着，但轿底泥印多出一双，方向从轿内<span class="em">朝外</span>。<br><br>纸鸢上的涂黑被指甲刮开，露出一小片空白。' }
      ]
    },
    choices:[
      { id:'lift', label:'违反第二条规矩，掀开轿帘', next:'open-veil', effects:{ flag:'liftedVeil', rite:1 } },
      { id:'kite', label:'取走纸鸢', next:'kite-clue', once:true, effects:{ evidence:{personal:1}, item:'kite', flag:'knowsPersonalName' } },
      { id:'leave', label:'退出新房', next:'courtyard' }
    ]
  },

  'open-veil':{
    title:'轿内',
    text:{
      first:'轿中只有一叠空白婚书。<br><br>最上面那张正逐字浮现你的名字。墨迹未干，笔锋却来自轿内。',
      again:'空白婚书已经填全。双方姓名<span class="em">都是你的</span>。<br><br>第三个位置写着“新妇”，后面只有一枚尚未落下的指印。'
    },
    choices:[
      { id:'close', label:'放下轿帘', next:'east-room', effects:{ flag:'sawSelfMarriage' } }
    ]
  },

  'kite-clue':{
    title:'纸鸢',
    text:{
      first:'你翻过纸鸢。涂黑处被刮开一层，露出更小的自书：<span class="em">鸢</span>。<br><br>不是“阿鸢”，不是“周氏”，也不是“陈门新妇”。只有一个她单独使用过的字。',
      again:'纸鸢上又多了半个“鸢”字，墨迹未干。<br><br>你摊开自己的手——手上没有墨。'
    },
    choices:[
      { id:'keep', label:'收好纸鸢', next:'east-room' }
    ]
  },

  'shrine-room':{
    title:'后院 · 祠堂',
    text:{
      first:'牌位上没有名字，只有三行空格：父名、夫名、自名。<br><br>喜婆的声音从身后传来：「前两项已填。最后那格空着，不算礼成。」',
      again:'前两项已填满。第三项也开始出现笔画——<br><br>那笔迹，与你写字时极为相似。'
    },
    choices:[
      { id:'ask', label:'问这块牌位是给谁的', next:'tablet-talk' },
      { id:'burn', label:'把喜婆递来的婚书投进火盆', next:'burning', effects:{ flag:'burnedMarriagePaper', evidence:{personal:1} } },
      { id:'leave', label:'退出祠堂', next:'courtyard' }
    ]
  },

  'tablet-talk':{
    title:'空牌位',
    text:{
      first:'喜婆没有回答，只把红绳放到空格旁。<br><br><span class="ghost">「名字不是查出来的，是有人肯替她填。」</span><br><br>这句话乍听像邀请，细想却是推责。',
      again:'空格中已经填入“周氏”。笔迹端正，不像喜婆，也不像她。'
    },
    choices:[
      { id:'back', label:'退回祠堂', next:'shrine-room', effects:{ flag:'knowsTablet', evidence:{marital:1}, rite:1 } }
    ]
  },

  burning:{
    title:'火盆',
    text:{
      first:'婚书入火，纸上所有夫家的姓名同时消失，只剩“新妇”二字。<br><br>你意识到：烧掉婚书，并不等于还给她名字。',
      again:'火盆里又烧出一份新的空白婚书，仿佛这里永远会补上另一份。'
    },
    choices:[
      { id:'return', label:'从火中抢回残页', next:'shrine-room', once:true, effects:{ item:'burnedPage' } },
      { id:'step-back', label:'退开火盆', next:'shrine-room' }
    ]
  },

  margins:{
    title:'婚书边角 · 你自己的账',
    textFn: marginsText,
    noErode:true,   /* 证据面必须永远诚实，否则"可回看验证"不成立 */
    choices:[
      { id:'back', label:'把婚书合上，回中庭', next:'courtyard', marksRows:true }
    ]
  },

  reunion:{
    title:'子时 · 第一次照面',
    text:{
      first:[
        { when:{flag:'answeredName'},
          text:'轿中人抬起头。她的五官还是空的，像没干透的纸。<br><br>她没有念礼词。她开口叫的，是<span class="em">你的名字</span>——用的是你在门外那一声的语调。<br><br>那一声你只应过一次。她记到今天。' },
        { text:'轿中人抬起头。她的五官还是空的，像没干透的纸。<br><br><span class="whisper">“良辰已至。恭请——”</span><br><br>她只会念礼词。念到“新妇”时顿了一下，那是九十年来，她第一次自己停下来。' }
      ],
      again:[
        { when:{flag:'correctedName'},
          text:'她看见你，又把礼词从头念起。<br><br>念到你纠正过的那一处，仍会顿住。' },
        { when:{flag:'watchedRitual'},
          text:'她看见你，把礼词从头念起。<br><br>这一回她念得极顺，一处也不停了——顺得像你上次听完时，替她把停顿也咽了回去。' },
        { text:'她看见你，又把礼词从头念起。<br><br>念到一半，她抬眼看你是否会替她接下去。' }
      ]
    },
    choices:[
      { id:'correct', label:'纠正称呼：你不只是“新妇”', next:'courtyard', once:true, spoken:true,
        effects:{ evidence:{personal:1}, rite:-1, flag:'correctedName' } },
      { id:'watch', label:'沉默，看她把礼词念完', next:'courtyard', effects:{ rite:1, flag:'watchedRitual' },
        usurp:{ minRite:2, warn:['acceptedRules','warnDeputy'] } }
    ]
  },

  naming:{
    title:'寅时 · 礼成前',
    text:{
      first:[
        { when:{flag:'liftedVeil'},
          text:'院门终于打开。轿帘没有再动——你掀过它一次，它就不必再自行升起。<br><br>喜婆把你领到牌位前。空格上已经有一划，墨迹未干，笔锋是从右向左来的。<br><br><span class="ghost">「你已经起过笔了。」她说，「剩下的，接着写就是。」</span>' },
        { text:'院门终于打开，轿帘却自行升起。<br><br>轿中无人。喜婆把你领到牌位前：「说出她的名字，她便归你找到之处。」<br><br>三类证据在你脑中同时作响。' }
      ],
      again:'牌位空格已填了一半。再迟疑，名字就会由别人替你写完。'
    },
    choices:[
      { id:'paternal', label:'称她为周氏，送她归宗', next:'ending-return', condition:{minEvidence:{paternal:2}} },
      { id:'marital', label:'称她为陈门新妇，礼成', next:'ending-marriage', condition:{minEvidence:{marital:2}} },
      { id:'personal', label:'只念她自写的那个字：鸢', next:'loss-question', condition:{minEvidence:{personal:2}} },
      { id:'not-yet', label:'笔还空着。退回中庭，再去找她的名字', next:'courtyard' },
      { id:'let-them', label:'沉默。喜婆替你落笔', next:'ending-marriage', mood:'danger',
        usurp:{ minRite:2, warn:['warnDeputy','acceptedRules'] } }
    ]
  },

  'loss-question':{
    title:'她第一次拒绝礼词',
    noErode:true,   /* 话头交还给玩家：这一处必须用他自己的口说 */
    text:{
      first:'你只念出那个“鸢”字。牌位裂开，院门却向后缩回黑暗。<br><br>轿中人终于不再念礼词。她第一次问：<br><span class="em">“既然记得我，你为什么还要娶我？”</span><br><br>你这才发觉，自己一路握着的，是那封写有你名字的婚书。',
      again:'她又问了一遍。这一次，用的是你自己的声音。'
    },
    choices:[
      { id:'admit-duty', label:'“我以为找回你，就算完成任务。”', next:'ending-loss', effects:{ flag:'lossAdmit' } },
      { id:'admit-loss', label:'“我把你的失踪，当成了我自己的损失。”', next:'ending-loss', effects:{ flag:'lossOwn' } },
      { id:'return-name', label:'“我不娶你。我把名字还给你。”', next:'ending-loss', effects:{ flag:'lossReturn' } },
      { id:'burn-self', label:'撕掉写有你姓名的那页婚书', next:'ending-loss', effects:{ flag:'lossBurn' } }
    ]
  }
};

const ENDINGS_V3 = {
  'ending-return':{
    type:'normal', tag:'— 结局 壹 · 归籍 —', name:'归 籍',
    text:'村口开了。轿中走出一个没有五官的纸人，向你福了一福。<br><br>喜婆在婚书上写下“周氏归宗”。她确实离开了陈家，却被领回另一座登记户籍的宅门。<br><br>你回头时，只听见她极平静地说：<span class="em">「你把我送回去了。谢谢你。」</span>'
  },
  'ending-marriage':{
    type:'good', tag:'— 结局 贰 · 正婚 —', name:'正 婚',
    text:'你念出“陈门新妇”，所有矛盾忽然顺了。<br><br>牌位合拢，纸鸢落地，喜路明亮。喜婆替你整理衣袖，夸你是最懂礼数的新郎。<br><br>一个月后，你收到一封喜帖。寄件人一栏没有名字，只有你自己端端正正的字迹：<span class="em">陈门新妇。</span>'
  },
  'ending-loss':{
    type:'normal', tag:'— 结局 叁 · 失讳 —', name:'失 讳',
    text:'牌位碎裂，名字却谁也没有得到。她终于能自己开口，而第一句是问你，不是道谢。<br><br>从此每年婚期，村口都会多一封无人认领的喜帖，落款处永远空着一格。<br><br><span class="em">你记得她。可“记得”，也是一种占有。</span>'
  }
};

/* 时辰按叙事节点单调推进,避免"寅时倒退回子时" */
const HOUR_OF = {
  'arrival':0, 'gate-ledger':0, 'courtyard':1, 'rules':1, 'first-call':1, 'answered-call':2, 'margins':1,
  'west-room':1, 'evidence-father':1, 'evidence-husband':1, 'evidence-personal':1,
  'east-room':2, 'open-veil':2, 'kite-clue':2,
  'shrine-room':2, 'tablet-talk':3, 'burning':3,
  'reunion':3, 'naming':4, 'loss-question':4
};
function sceneHour(id){ return Object.prototype.hasOwnProperty.call(HOUR_OF,id) ? HOUR_OF[id] : null; }

/* ---------- 证据与仪式渗透读取(供 core 与编译共用) ---------- */
function evidenceScore(kind){
  return Math.max(0, Math.min(5, (G.evidence && G.evidence[kind]) || 0));
}
function dominantName(){
  const p=evidenceScore('paternal'), m=evidenceScore('marital'), s=evidenceScore('personal');
  const max=Math.max(p,m,s);
  if(max===0) return '她';
  if(s===max) return '鸢';
  if(m===max) return '新妇';
  return '周氏';
}
const RITE_NAMES=['尚无','微澜','渗透','浸礼','难分彼此','已成'];
function riteName(){ return RITE_NAMES[Math.max(0,Math.min(5,G.rite|0))]; }
function endingStatText(){
  const kinds=['paternal','marital','personal'].filter(k=>evidenceScore(k)>0).length;
  return `仪式渗透 ${riteName()} · 你以此称呼了她：${dominantName()} · 寻得 ${kinds} 类名字证据`;
}

/* ---------- 编译：把数据变成 core 可消费的 run() ---------- */
/* rite/evidence 是"渗透"与"证据"的增量，必须一个选项只结算一次：
   否则任何可重复选项（掀帘、投火盆）都能被循环刷满，隐藏状态就变成
   了按按钮的次数，而不是玩家走过的剧情。flag/item 本身幂等，不记账。 */
function applyEffects(fx, guardKey){
  if(!fx) return;
  if(fx.flag) setFlag(fx.flag);
  if(isArr(fx.flags)) fx.flags.forEach(setFlag);
  if(fx.item) giveItem(fx.item);
  if(fx.rite || fx.evidence){
    const spentFlag='fx-spent-'+guardKey;
    if(!hasFlag(spentFlag)){
      if(fx.rite) adjustRite(fx.rite);
      if(fx.evidence) Object.keys(fx.evidence).forEach(k=>addEvidence(k,fx.evidence[k]));
      setFlag(spentFlag);
    }
  }
}
/* 条件求值：选项门控与文案变体共用同一套形状，避免两处语义漂移 */
function condMet(c){
  if(!c) return true;
  if(c.flag && !hasFlag(c.flag)) return false;
  if(c.notFlag && hasFlag(c.notFlag)) return false;
  if(c.item && !hasItem(c.item)) return false;
  if(c.notItem && hasItem(c.notItem)) return false;
  if(c.memory && !getMemory()) return false;
  if(c.rite!=null && G.rite<c.rite) return false;
  if(c.minEvidence){
    const met=Object.keys(c.minEvidence).some(k=>evidenceScore(k)>=c.minEvidence[k]);
    if(!met) return false;
  }
  if(c.evidenceTotal!=null){
    const total=evidenceScore('paternal')+evidenceScore('marital')+evidenceScore('personal');
    if(total<c.evidenceTotal) return false;
  }
  return true;
}
function choiceAvailable(choice){
  if(choice.once && hasFlag('choice-'+choice.id)) return false;
  return condMet(choice.condition);
}
/* 文案变体：first/again 可以是字符串，也可以是按 when 取第一个成立项的数组。
   数组必须以一个无 when 的兜底项收尾，否则新状态会渲染出 undefined。 */
function pickText(variant){
  if(typeof variant==='string') return variant;
  if(Array.isArray(variant)){
    for(const v of variant) if(condMet(v.when)) return v.text;
  }
  return null;
}
function substituteName(text){
  return G.rite>=2 ? text.replace(/她/g, dominantName()) : text;
}
/* ---------- 作者权侵蚀 ----------
   本作真正被夺走的是"谁在说话"。侵蚀只改写字的归属：
   绝不改动 choice.id / condition / next / 结局门控，因此玩家永远
   做着自己原本要做的选择 —— 变的只是这句话由谁开口。
   替换表全部由 rite 档位与 flags 决定，无任何随机（契约第 2 条）。 */
const ERODE_VOICE='新郎';
/* 仪式只接管"由游戏替玩家叙述"的字，不接管任何角色开口说出的话。
   因此引号区间（「」与弯引号）内的第二人称一律放过：
   "你不只是新妇"是对她说的，"我把你的失踪…"是玩家自白，都不许被改写。 */
const QUOTED=/「[^」]*」|“[^”]*”/g;
function outsideQuotes(t, fn){
  let out='', last=0, m;
  QUOTED.lastIndex=0;
  while((m=QUOTED.exec(t))){
    out+=fn(t.slice(last,m.index))+m[0];
    last=m.index+m[0].length;
  }
  return out+fn(t.slice(last));
}
/* 正文：渗透满格后，叙述连"你"都不再给玩家（rite>=5）。
   选项：渗透 2 起，玩家连想做的事都要用礼数的口吻念出来（"你"→"新郎"）。
   两者都只作用于引号之外的叙述部分。 */
function erodeVoice(t, isLabel){
  if(!((isLabel && G.rite>=2) || (!isLabel && G.rite>=5))) return t;
  return outsideQuotes(t, s=>s.replace(/你/g, ERODE_VOICE));
}
/* 正文：先做称呼替换（她→玩家此刻对她的称呼），再接管人称 */
function erodeText(text){
  return erodeVoice(substituteName(text), false);
}
function erodeLabel(choice){
  /* spoken: 这句话是玩家亲口对别人说的，不是游戏替玩家叙述。
     中文"你"两种用法同形，引号判不出来，故显式标注。 */
  if(choice.spoken) return choice.label;
  return erodeVoice(choice.label, true);
}
/* ---------- 节点剥夺（全作唯一的"夺权"，门槛极高） ----------
   必须由两条可识别预警铺满、且仪式渗透达标才生效（契约第 7 条）。
   生效时选项仍显示为玩家本意，只是这一笔由仪式落下的 —— 并在
   margins 回看账上留一条不可抵赖的证据。 */
function warningsMet(choice){
  const u=choice && choice.usurp;
  if(!u || !u.warn) return 0;
  return u.warn.filter(f=>hasFlag(f)).length;
}
function usurpActive(choice){
  const u=choice && choice.usurp;
  if(!u) return false;
  if(u.minRite!=null && G.rite<u.minRite) return false;
  return warningsMet(choice)>=2;
}
function usurpCount(){
  return Object.keys(G.flags).filter(k=>k.indexOf('usurped-')===0).length;
}
/* 婚书边角：本作唯一由玩家自己核对"我到底做过什么"的账页。
   契约第 2 条要求每次异常都能回看验证 —— 违规、被代笔、渗透跨档，
   都必须在这里落成一行可核对的字。全部读自 flags，无随机。 */
const MARGIN_BOOK=[
  { flag:'answeredName',        line:'亥时：门外叫了一声，你应了。' },
  { flag:'liftedVeil',          line:'子时之前：轿帘落下过，你揭了。' },
  { flag:'burnedMarriagePaper', line:'祠堂：你烧过一次婚书。夫家的名字没了，“新妇”还在。' },
  { flag:'correctedName',       line:'你纠正过一回称呼：她不只是“新妇”。' },
  { flag:'watchedRitual',       line:'有一回你站着听她把礼词念完，没有打断。' },
  { flag:'questionedRules',     line:'你问过她为什么失踪。喜婆没有回答。' },
];
function marginLines(){
  const lines=MARGIN_BOOK.filter(e=>hasFlag(e.flag)).map(e=>e.line);
  Object.keys(G.flags).forEach(k=>{
    if(k.indexOf('usurped-')!==0) return;
    const at=k.slice('usurped-'.length).split(':');
    const where=(CHAPTER_V3[at[0]]&&CHAPTER_V3[at[0]].title)||'礼成之前';
    lines.push(where+'：那一笔，不是你落的。');
  });
  return lines;
}
/* 只读不写：渲染期间改状态会让同一状态两次渲染不一致（契约第 2 条） */
function marginsText(){
  const lines=marginLines();
  const clean=!lines.length;
  let tail;
  if(clean) tail='这些边角还空着。你没有做过任何一件需要向你本人解释的事。';
  else if(usurpCount()) tail='已经有一笔不是你落下的了。你把它核对出来，它就再也擦不掉。';
  else tail='这些笔笔都对得上你。至少目前，还没有哪一笔不是你落的。';
  /* 重访不许空口宣称"又多出一行"：与合上婚书时记下的行数真比对才敢说。 */
  const seen=G.flags['margins-rows'];
  const revisit=(G.visited['margins']||0)>1 && seen!==undefined
    ? (lines.length>seen
        ? '<br><br><span class="ghost">你数了一遍：比方才合上婚书时多出 '+(lines.length-seen)+' 行。你并没有添过字。</span>'
        : '<br><br><span class="ghost">行数没有变。你什么也没做，纸上也就不再长。</span>')
    : '';
  return '<span class="em">婚书背面的边角空白，自己写满了小字。</span><br><br>'
       + (clean?tail:lines.join('<br>'))
       + (clean?'':'<br><br><span class="ghost">'+tail+'</span>')
       + revisit;
}
function compileScene(id){
  const d=CHAPTER_V3[id];
  if(!d) return null;
  return {
    title:d.title,
    run(){
      let text;
      if(d.textFn){
        text=d.textFn();
      }else{
        const again=(G.visited[id]||0)>1;
        const raw = again ? (d.text.again!=null ? d.text.again : d.text.first) : d.text.first;
        text = pickText(raw);
        if(text==null) throw new Error('场景「'+id+'」的文案变体没有无条件的兜底项');
      }
      /* noErode：这一处由它自己的声音说话 —— 回看账页只摆事实，
         失讳要玩家用自己的口认账，仪式连旁白都不许加。 */
      if(!d.noErode){
        text=erodeText(text);
        /* 追加必须在替换之后：否则替换会替追加句掩盖掉误写的裸"她"，
           那条契约断言就成了永远抓不到错的正则。 */
        if(G.rite>=4) text+='<br><br><span class="rited">你几乎能抢在别人前面，把下面那句话说完。</span>';
      }
      const choices=(d.choices||[]).filter(choiceAvailable).map(choice=>({
        /* id 与 rawLabel 稳定: 侵蚀只改写 text, 测试按 id 定位而非按文案 */
        id:choice.id,
        rawLabel:choice.label,
        text:d.noErode?choice.label:erodeLabel(choice),
        mood:choice.mood||(/禁忌|违反|沉默/.test(choice.label)?'danger':null),
        action(){
          if(choice.once) setFlag('choice-'+choice.id);
          applyEffects(choice.effects, id+':'+choice.id);
          recordTranscript('choice',choice.id);
          if(usurpActive(choice)){
            setFlag('usurped-'+id+':'+choice.id);
            setFlag('anchorFall');
            recordTranscript('usurp', id+':'+choice.id);
          }
          /* 合上婚书时记下核对到的行数 —— 写状态发生在玩家动作里，不在渲染里 */
          if(choice.marksRows) setFlag('margins-rows', marginLines().length);
          if(ENDINGS_V3[choice.next]) reachEnding(choice.next);
          else goTo(choice.next);
        }
      }));
      return { text, choices };
    }
  };
}
let _scenes=null;
function currentScenes(){
  if(!_scenes){
    _scenes={};
    Object.keys(CHAPTER_V3).forEach(id=>{ _scenes[id]=compileScene(id); });
  }
  return _scenes;
}

/* ---------- 存档归一：类型不合法一律重建、非法场景回到起点 ---------- */
const isArr=v=>Array.isArray(v);
const isObj=v=>!!v && typeof v==='object' && !isArr(v);
function normalizeGameState(s){
  const st=isObj(s)?s:{};
  st.version=3;
  if(!isObj(st.flags)) st.flags={};
  if(!isObj(st.evidence)) st.evidence={paternal:0,marital:0,personal:0};
  ['paternal','marital','personal'].forEach(k=>{
    st.evidence[k]=typeof st.evidence[k]==='number'?Math.max(0,Math.min(5,st.evidence[k]|0)):0;
  });
  st.rite=typeof st.rite==='number'?Math.max(0,Math.min(5,st.rite|0)):0;
  if(!isArr(st.transcript)) st.transcript=[];
  if(!isObj(st.visited)) st.visited={};
  if(!isArr(st.inventory)) st.inventory=[];
  st.inventory=st.inventory.filter(k=>typeof k==='string' && !!ITEMS[k]);
  st.hour=typeof st.hour==='number'?Math.max(0,Math.min(4,st.hour|0)):0;
  if(typeof st.scene!=='string' || !currentScenes()[st.scene]) st.scene='arrival';
  return st;
}
