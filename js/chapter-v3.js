/* ===================================================================
   《红纸鸢 · 归名》第一章剧本 + 场景编译器 (v3)
   数据驱动的确定性文字恐怖：重复场景差量、称呼替换、仪式渗透。
   引擎运行时在 core.js；此处只提供内容、结局与编译。
   =================================================================== */

const CHAPTER_V3 = {

  arrival:{
    title:'槐阴村 · 婚期第三日',
    text:{
      first:'你来迎亲，却没有人肯告诉你新娘在哪里。<br><br>村路口的石碑被红纸覆住，纸下拓着一行旧字：<span class="em">“新妇未至，婿不得归。”</span><br><br>你握住那封残缺婚书。纸上只剩她的姓，名字处被水渍洇开，像有人反复摩挲，想把它抹平。',
      again:'你又回到碑前。红纸比方才更湿，边缘贴着石面，像刚有人用掌心压过。<br><br>碑上的字仍是那一句。只是“婿”字下面，多了一道与你手型相符的浅痕。'
    },
    choices:[
      { id:'read-ledger', label:'查看碑侧的婚期账本', next:'gate-ledger', once:true, effects:{ evidence:{paternal:1} } },
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
      first:'院中无风，满树红纸鸢却一起朝向东厢。<br><br>喜婆站在廊下，手里拿着一根未系的红绳：<span class="ghost">“新郎官来得不巧。你要找人，先应下三条规矩。”</span>',
      again:'红绳仍在喜婆手中，绳结却已经打好。<br><br>仿佛你离开的这一会儿，有人替你系上过，又解开。'
    },
    choices:[
      { id:'rules', label:'问她，是哪三条规矩', next:'rules', once:true },
      { id:'west', label:'去西厢', next:'west-room' },
      { id:'east', label:'去东厢新房', next:'east-room' },
      { id:'shrine', label:'去后院祠堂', next:'shrine-room' },
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
      { id:'agree', label:'应下规矩，换取入宅', next:'first-call', effects:{ flag:'acceptedRules', rite:1 } },
      { id:'refuse', label:'先弄清她为何失踪', next:'courtyard', effects:{ flag:'questionedRules' } }
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
      again:'家书顺序变了。“我自己取名”那页被压到最底层，上面落了一层新鲜香灰。'
    },
    choices:[
      { id:'take-father', label:'取走父亲的信', next:'evidence-father', once:true, effects:{ evidence:{paternal:2}, item:'fatherLetter' } },
      { id:'take-husband', label:'取走夫家的信', next:'evidence-husband', once:true, effects:{ evidence:{marital:2}, item:'marriageLetter' } },
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
      again:'轿帘仍垂着，但轿底泥印多出一双，方向从轿内<span class="em">朝外</span>。<br><br>纸鸢上的涂黑被指甲刮开，露出一小片空白。'
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

  reunion:{
    title:'子时 · 第一次照面',
    text:{
      first:'轿中人抬起头。她的五官还是空的，像没干透的纸。<br><br><span class="whisper">“良辰已至。恭请——”</span><br><br>她只会念礼词。念到“新妇”时顿了一下，那是九十年来，她第一次自己停下来。',
      again:'她看见你，又把礼词从头念起。<br><br>念到昨夜你纠正过的那一处，仍会顿住。'
    },
    choices:[
      { id:'correct', label:'纠正称呼：你不只是“新妇”', next:'courtyard', once:true, effects:{ evidence:{personal:1}, rite:-1, flag:'correctedName' } },
      { id:'watch', label:'沉默，看她把礼词念完', next:'courtyard', effects:{ rite:1, flag:'watchedRitual' } }
    ]
  },

  naming:{
    title:'寅时 · 礼成前',
    text:{
      first:'院门终于打开，轿帘却自行升起。<br><br>轿中无人。喜婆把你领到牌位前：「说出她的名字，她便归你找到之处。」<br><br>三类证据在你脑中同时作响。',
      again:'牌位空格已填了一半。再迟疑，名字就会由别人替你写完。'
    },
    choices:[
      { id:'paternal', label:'称她为周氏，送她归宗', next:'ending-return', condition:{minEvidence:{paternal:2}} },
      { id:'marital', label:'称她为陈门新妇，礼成', next:'ending-marriage', condition:{minEvidence:{marital:2}} },
      { id:'personal', label:'只念她自写的那个字：鸢', next:'loss-question', condition:{minEvidence:{personal:2}} },
      { id:'let-them', label:'沉默。喜婆替你落笔', next:'ending-marriage' }
    ]
  },

  'loss-question':{
    title:'她第一次拒绝礼词',
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
  'arrival':0, 'gate-ledger':0, 'courtyard':1, 'rules':1, 'first-call':1, 'answered-call':2,
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
function applyEffects(fx){
  if(!fx) return;
  if(fx.flag) setFlag(fx.flag);
  if(fx.item) giveItem(fx.item);
  if(fx.rite) adjustRite(fx.rite);
  if(fx.evidence) Object.keys(fx.evidence).forEach(k=>addEvidence(k,fx.evidence[k]));
}
function choiceAvailable(choice){
  if(choice.once && hasFlag('choice-'+choice.id)) return false;
  const c=choice.condition;
  if(!c) return true;
  if(c.flag && !hasFlag(c.flag)) return false;
  if(c.notFlag && hasFlag(c.notFlag)) return false;
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
function substituteName(text){
  return G.rite>=2 ? text.replace(/她/g, dominantName()) : text;
}
function compileScene(id){
  const d=CHAPTER_V3[id];
  if(!d) return null;
  return {
    title:d.title,
    run(){
      const again=(G.visited[id]||0)>1;
      let text = (again && d.text.again) ? d.text.again : d.text.first;
      text=substituteName(text);
      if(G.rite>=4) text+='<br><br><span class="rited">你几乎能替她把下面那句话念完。</span>';
      const choices=(d.choices||[]).filter(choiceAvailable).map(choice=>({
        text:choice.label,
        mood:choice.mood||(/禁忌|违反|沉默/.test(choice.label)?'danger':null),
        action(){
          if(choice.once) setFlag('choice-'+choice.id);
          applyEffects(choice.effects);
          recordTranscript('choice',choice.id);
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
