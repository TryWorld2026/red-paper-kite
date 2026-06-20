/* ===================================================================
   主剧情场景（新郎视角）—— 留白暗示风格
   减少直白叙述,让异常自己说话
   =================================================================== */

const SCENES={

/* ===== 序章 ===== */
intro:{
  title:'槐阴村 · 黄昏',
  run(){
    return {
      text:`暮色四合。你踏进浙东深山里的<span class="em">槐阴村</span>。<br><br>
        巷道空无一人。家家户户门窗紧闭,门缝里透出昏黄的光。<br><br>
        唯有一座宅院张灯结彩——<span class="whisper">红。满院的,刺眼的红。</span><br><br>
        你是民俗学研究生,此行为论文考证一桩旧俗:民国年间,此村盛行<span class="em">「纸扎冥婚」</span>。村口立着一块歪斜的石碑,碑面被青苔糊住,依稀刻着"陈氏祖训"四字。`,
      choices:[
        {text:'走近那座张灯结彩的宅院', go:'gate'},
        {text:'先去看村口的石碑', action:()=>{ setFlag('readStele'); goTo('stele'); }}
      ]
    };
  }
},

stele:{
  title:'村口石碑',
  run(){
    return {
      text:`你蹲下身,擦去碑面的污渍。青苔下面,是风雨啃噬过的碑文:<br><br>
        <span class="ghost">"…陈氏历代,冥婚为训…</span><br>
        <span class="ghost">…入宅者,须守婚仪…</span><br>
        <span class="ghost">…违者,代新郎…"</span><br><br>
        末尾刻着一个被凿毁的名字。凿痕很深,像是不想让人看见。只剩一个<span class="em">"鸢"</span>字。<br><br>
        碑脚下的土是松的,像最近被人翻动过。`,
      tips:[{gain:true,text:'【线索】石碑提到「入宅须守婚仪」,违者「代新郎」。'}],
      choices:[
        {text:'记下此事,前往红宅', action:()=>{ addTruth('stele'); giveItem('candle'); goTo('gate'); }}
      ]
    };
  }
},

/* ===== 入宅 ===== */
gate:{
  title:'陈家老宅 · 门前',
  run(){
    Sound.candle();
    return {
      text:`红宅的门大敞着。门楣悬一白一红两盏灯笼。<br><br>
        门楣正中贴一副对联,墨迹尚新:<br>
        <span class="ghost">上联:红烛高烧迎新客</span><br>
        <span class="ghost">下联:白骨同穴结旧缘</span><br>
        <span class="ghost">横批:百年好合</span><br><br>
        院内无人。你听见细碎的脚步声,踩在青石板上,窸窸窣窣。不止一双。`,
      tips: hasFlag('readStele')?null:[{text:'你想起村口石碑上的警告——「入宅须守婚仪」。'}],
      choices:[
        {text:'走进去', action:()=>{ Sound.knock(); adjustYin(1); goTo('hall1'); }},
        {text:'点燃半截红烛再进', disabled:!hasItem('candle'), action:()=>{ setFlag('litCandle'); Sound.candle(); goTo('hall1'); }},
        {text:'掉头离开', go:'fleeEarly'}
      ]
    };
  }
},

fleeEarly:{
  title:'村口',
  run(){
    return {
      text:`你转身要走。来时的路不见了。<br><br>
        身后只有漫山遍野的白纸灯笼,每一盏下都挂着一双<span class="em">绣花鞋</span>,齐刷刷朝着你。<br><br>
        没有风。灯笼在动。`,
      choices:[
        {text:'回到红宅', action:()=>{ adjustSan(-1); goTo('hall1'); }}
      ]
    };
  }
},

/* ===== 喜堂 ===== */
hall1:{
  title:'喜堂',
  run(){
    Sound.paper();
    return {
      text:`堂上红烛高烧。八仙桌上摆着龙凤喜烛、合卺酒。正中一幅<span class="em">「囍」</span>字,用白纸剪成。<br><br>
        桌后端坐一位干瘦老妇,披红挂绿。她就是<span class="em">喜婆</span>。见你进来,她递过一本残破的纸册:<br><br>
        <span class="ghost">"既来了,便是新郎官。这是《陈氏婚仪禁忌》,今夜子时至寅时,你须一一记住。"</span><br><br>
        她又补了一句:<span class="whisper">"规矩嘛……有些是真,有些是假。新郎官自己分辨咯。"</span>`,
      tips:[{gain:true,text:'【获得】《陈氏婚仪禁忌》—— 残缺纸册,真假混杂。'}],
      choices:[
        {text:'接过禁忌册,翻开细读', action:()=>{ giveItem('rulebook'); setFlag('hasRules'); goTo('rules'); }}
      ]
    };
  }
},

rules:{
  title:'《陈氏婚仪禁忌》',
  run(){
    return {
      text:`你翻开纸册。墨迹有新有旧,共录<span class="em">六条</span>:<br><br>
        <span class="ghost">一、新郎入门,须于腕间系红绳,以示结缘。</span><br>
        <span class="ghost">二、子时三刻,若闻唢呐,切忌回首。</span><br>
        <span class="ghost">三、新娘盖头,新郎不可亲手揭。</span><br>
        <span class="ghost">四、堂上红烛,断不可灭,灭则大凶。</span><br>
        <span class="ghost">五、阴气重处,呼名即现,慎勿唤之。</span><br>
        <span class="ghost">六、天明之前,新郎须与新娘行合卺礼,礼成则送客。</span><br><br>
        册页边缘,有人用血歪歪扭扭补了一行小字:<span class="em">"…一…假…四…真…余者…"</span> 后面被撕掉了。`,
      tips:[
        {text:'【推理】血字提示:第一条(系红绳)疑为假,第四条(红烛不可灭)疑为真。其余需结合剧情辨别。'}
      ],
      choices:[
        {text:'牢记在心,问喜婆今夜该如何', go:'hall2'}
      ]
    };
  }
},

hall2:{
  title:'喜堂 · 问话',
  run(){
    return {
      text:`喜婆枯手往四周一指:<br><br>
        <span class="ghost">"这宅子大得很。东厢是新房,西厢是书房,后院有祠堂,地底下……地底下你莫去。"</span><br><br>
        她塞给你一截红绳和一把锈剪刀:<span class="ghost">"规矩一,你自己看着办。子时还没到,新郎官四处逛逛吧。"</span><br><br>
        她浑浊的眼珠盯着你。半晌,她低声自语了一句。你没听清。`,
      tips:[
        {gain:true,text:'【获得】红绳(规则一要求系于腕间——但血字警告此条为假!)'},
        {gain:true,text:'【获得】锈剪刀'}
      ],
      choices:[
        {text:'【抉择】按规矩一,系上红绳', log:'系红绳', action:()=>{ setFlag('woreCord'); giveItem('redCord'); addTruth('cordWorn'); adjustYin(1); goTo('cordResult'); }},
        {text:'【抉择】想起血字警告,不系红绳', log:'拒红绳', action:()=>{ setFlag('refusedCord'); giveItem('redCord'); if(!hasAchievement('no_cord')) unlockAchievement('no_cord'); checkAchievements(); goTo('cordResult'); }}
      ]
    };
  }
},

cordResult:{
  title:'红绳',
  run(){
    if(hasFlag('woreCord')){
      Sound.ghost();
      return {
        text:`红绳系上手腕。绳紧了紧,贴着皮肤,发烫。<br><br>
          喜婆的笑容裂得更开了:<span class="whisper">"好,好新郎,听话。"</span><br><br>
          你低头看了一眼腕上的绳。绳结的样式,你好像在哪里见过。`,
        tips:[{text:'⚠ 你系上了红绳(假规则)。阴气侵蚀 +1。',warn:true}],
        choices:[{text:'继续探索宅院', action:()=>{ advanceHour(); goTo('explore'); }}]
      };
    } else {
      Sound.candle();
      return {
        text:`你佯装系绳,却将红绳悄悄收入袖中。喜婆的笑容僵了一瞬:<br><br>
          <span class="whisper">"……也是个有主意的。"</span><br><br>
          腕上空空。你反而觉得轻省了些。`,
        tips:[{gain:true,text:'✓ 你识破了假规则一。红绳留作道具,日后或有大用。'}],
        choices:[{text:'继续探索宅院', action:()=>{ advanceHour(); goTo('explore'); }}]
      };
    }
  }
},

explore:{
  title:'陈家老宅 · 中庭',
  run(){
    if(G.hour<1) G.hour=1;
    return {
      text:`夜风穿堂。中庭立着一棵枯死的<span class="em">老槐</span>,枝头挂满红纸剪的鸢鸟,随风轻颤。<br><br>
        四下里,东厢、西厢、后院祠堂,皆可去得。<br><br>
        <span class="whisper">时辰:${HOUR_NAMES[G.hour]}。 理智 ${G.san} / 阴气 ${G.yin}。 已查明真相 ${G.truths.length}/${TRUTH_TOTAL}。</span>`,
      choices: buildExploreChoices()
    };
  }
},

/* ===== 西厢书房 ===== */
study:{
  title:'西厢 · 书房',
  run(){
    return {
      text:`书房积尘。案上摊着一本族谱,墨迹斑驳。你翻开,在民国二十三年的页面上看到一行:<br><br>
        <span class="ghost">"…三郎夭,未婚。择村中绣娘阿鸢,行冥婚礼,以全阴阳…"</span><br><br>
        后面被人涂改过。依稀可见<span class="em">"活钉"</span>二字,又被墨团盖住。<br><br>
        书架后,半张泛黄的纸飘落。`,
      tips:[{gain:true,text:'【线索·真相】族谱记载:陈家三郎死后,选中绣娘"阿鸢"行冥婚。疑为活人陪葬!'}],
      choices:[
        {text:'捡起婚书残页', action:()=>{ giveItem('fragment1'); addTruth('ahuang'); goTo('study2'); }},
        {text:'在书架后仔细翻找', action:()=>{ setFlag('searchedStudy'); goTo('study2'); }}
      ]
    };
  }
},
study2:{
  title:'西厢 · 书房深处',
  run(){
    return {
      text:`你在书架后翻找,摸到一支冰凉的<span class="em">桃木簪</span>,被压在一摞经书下。簪头刻着一朵小小的<span class="em">鸢尾</span>。<br><br>
        案角还压着一页纸:<span class="ghost">"…假禁忌册,乃族长所为,欲令新郎自投死路…真禁忌,只此一句——"</span> 纸被撕去了一半。<br><br>
        窗外的纸鸢,在枝头转了个方向。`,
      tips:[
        {gain:true,text:'【获得】桃木簪(克邪之物,鸢尾纹饰——属于"阿鸢")'},
        {text:'【线索·真相】假禁忌册是族长伪造,目的是让新郎自寻死路!'}
      ],
      choices:[
        {text:'记下,返回中庭', action:()=>{ giveItem('peach'); addTruth('fakeBook'); checkAchievements(); safeAdvanceHour(); goTo(getExploreScene()); }}
      ]
    };
  }
},

/* ===== 东厢新房 ===== */
bridal:{
  title:'东厢 · 新房',
  run(){
    Sound.paper();
    return {
      text:`推门。满目刺红。龙凤喜烛,大红帐幔,正中一顶<span class="em">八抬大轿</span>——轿帘低垂。<br><br>
        镜台前蒙着红绸。桌上摆着合卺酒、一只绣鞋。<br><br>
        空气里浮动着陈年檀香,与一丝若有若无的<span class="em">腐气</span>。<br><br>
        轿中传来极轻的、纸摩擦的声响。`,
      choices:[
        {text:'【规则三】掀开轿帘看新娘(禁忌:新郎不可亲手揭)', log:'揭新娘', action:()=>{ setFlag('peekedBride'); adjustYin(2); adjustSan(-1); Sound.paper(); goTo('peekBride'); }},
        {text:'【规则三】不亲手揭,转而查看镜台', go:'mirror'},
        {text:'拿走桌上的合卺酒与绣鞋', action:()=>{ setFlag('tookWine'); giveItem('coins'); goTo('bridal2'); }}
      ]
    };
  }
},
peekBride:{
  title:'轿中',
  run(){
    return {
      text:`你掀开轿帘。<br><br>
        一具糊得极精巧的<span class="em">纸扎新娘</span>端坐其中,凤冠霞帔,盖头下一张画上去的笑脸,眉眼弯弯。<br><br>
        她的嘴角,似乎比你刚看时……<span class="em">弯得更深了</span>。<br><br>
        <span class="whisper">"新郎……你来了。"</span> 这声音不是从她嘴里发出,而是<span class="em">从你脑子里</span>响起的。`,
      tips:[{text:'⚠ 你违反了规则三(亲揭新娘)。阴气侵蚀 +2,理智 -1。',warn:true}],
      choices:[
        {text:'扯下她的盖头带走', action:()=>{ giveItem('paperBride'); setFlag('hasPaperBride'); goTo('mirror'); }},
        {text:'退到镜台处', go:'mirror'}
      ]
    };
  }
},
mirror:{
  title:'镜台',
  run(){
    return {
      text:`你揭去镜台上的红绸。是一面<span class="em">阴阳铜镜</span>,镜面幽暗,映出的不是你的脸,而是满屋飘忽的白影。<br><br>
        镜中,纸新娘缓缓抬手,指向轿底。你循着她指的方向,从轿底摸出一只<span class="em">骨灰陶</span>和两页婚书残页。<br><br>
        残页上,一行娟秀小字:<span class="ghost">"…我不愿嫁…陈三郎已死…为何要我活人陪葬…娘,救我…——鸢 绝笔"</span>`,
      tips:[
        {gain:true,text:'【获得】阴阳铜镜(能照见鬼物真容)'},
        {gain:true,text:'【获得】骨灰陶 · 婚书残页·二 · 婚书残页·三'},
        {text:'【线索·真相】阿鸢绝笔!她是被活活钉入棺中陪葬,临死前呼救无门。'}
      ],
      choices:[
        {text:'收起证物,返回中庭', action:()=>{ giveItem('mirror'); giveItem('ash'); giveItem('fragment2'); giveItem('fragment3'); addTruth('letter'); checkAchievements(); safeAdvanceHour(); goTo(getExploreScene()); }}
      ]
    };
  }
},
bridal2:{
  title:'新房 · 桌前',
  run(){
    return {
      text:`你拿起合卺酒——酒是冷的,酒面浮着一层灰。绣鞋底下,压着六枚铜钱。<br><br>
        身后,轿中的窸窣声忽然停了。你不敢回头。`,
      tips:[{gain:true,text:'【获得】六枚铜钱(陪葬买路钱)'}],
      choices:[
        {text:'去查看镜台', go:'mirror'},
        {text:'直接回中庭', action:()=>{ safeAdvanceHour(); goTo(getExploreScene()); }}
      ]
    };
  }
},

/* ===== 后院祠堂 ===== */
shrine:{
  title:'后院 · 陈氏祠堂',
  run(){
    Sound.ghost();
    return {
      text:`祠堂森冷。灵牌密如列阵。正中最大一块,赫然写着<span class="em">「陈三郎」</span>,旁边空着一块,等着刻上新名字。<br><br>
        牌位前的蒲团旁,散落着一把<span class="em">锈剪刀</span>和一截黑炭。墙上挂着一幅画:一个梳着双髻的少女,怀里抱着一只红纸鸢——画下题字<span class="em">"阿鸢"</span>。<br><br>
        她的眼睛,无论你走到哪,都<span class="em">望着你</span>。`,
      choices:[
        {text:'【规则五】用黑炭在地上写"阿鸢"之名(慎勿唤名)', log:'唤名', action:()=>{ setFlag('calledName'); adjustYin(2); adjustSan(-1); goTo('callName'); }},
        {text:'【明智】不唤其名,只取剪刀', disabled:hasItem('scissors'), action:()=>{ giveItem('scissors'); setFlag('tookScissors'); goTo('shrine2'); }},
        {text:'【明智】不唤其名,只取剪刀', disabled:!hasItem('scissors'), action:()=>{ goTo('shrine2'); }},
        {text:'对着阿鸢的画像,深深一揖', action:()=>{ setFlag('bowed'); adjustSan(1); goTo('shrine2'); }}
      ]
    };
  }
},
callName:{
  title:'唤名',
  run(){
    return {
      text:`炭字写就的瞬间,祠堂的烛火齐齐变绿。<br><br>
        画中少女的眼珠动了——她<span class="em">转过头来</span>,直勾勾望着你,嘴角缓缓咧开,咧到耳根。<br><br>
        <span class="whisper">"你……唤我?"</span>无数个声音重叠在一起,从四面八方涌来。你的耳朵开始流血。`,
      tips:[{text:'⚠ 你违反了规则五(呼名即现)。阴气侵蚀 +2,理智 -1。',warn:true}],
      choices:[
        {text:'用桃木簪逼退她', disabled:!hasItem('peach'), action:()=>{ setFlag('peachUsed'); adjustSan(1); goTo('shrine2'); }},
        {text:'夺门逃回中庭', action:()=>{ adjustSan(-1); safeAdvanceHour(); goTo(getExploreScene()); }}
      ]
    };
  }
},
shrine2:{
  title:'祠堂 · 供桌下',
  run(){
    return {
      text:`你伏身查看供桌下。地砖松动。撬开,是一个暗格,里头藏着一本<span class="em">真正</span>的禁忌册——字迹与喜婆给你的截然不同,娟秀而急切:<br><br>
        <span class="ghost">"新郎鉴:此册为喜婆伪作。真禁忌只一条——</span><br>
        <span class="ghost"><b>子时三刻唢呐响时,万不可回首;切勿系红绳;切勿饮合卺酒;切勿亲揭新娘。</b></span><br>
        <span class="ghost">活下来,带我(阿鸢)的骨灰与婚书,于天明烧却,我可安息。"</span>`,
      tips:[
        {gain:true,text:'【获得】真禁忌册 —— 阿鸢亲笔!'},
        {text:'【线索·真相·关键】真禁忌=不系红绳、不饮合卺酒、不亲揭新娘、唢呐时不回首。阿鸢所求:天明烧其骨灰与婚书。'}
      ],
      choices:[
        {text:'铭记真禁忌,返回中庭', action:()=>{ setFlag('knowsTruth'); addTruth('trueBook'); checkAchievements(); safeAdvanceHour(); goTo(getExploreScene()); }}
      ]
    };
  }
},

/* ===== 子时事件 ===== */
ziShi:{
  title:'子时三刻 · 唢呐',
  run(){
    Sound.suona();
    return {
      text:`忽地,堂外传来唢呐声——凄厉,悠长,由远及近。<br><br>
        喜乐渐响,却无人奏乐。你感到后颈一阵冰凉,仿佛有人就站在你身后,贴着你的耳朵吹气。<br><br>
        <span class="em">身后,有"东西"在等你回头。</span>`,
      choices:[
        {text:'【规则二】按禁忌,死也不回头', log:'不回首', action:()=>{ setFlag('noTurn'); if(!hasAchievement('no_turn')) unlockAchievement('no_turn'); goTo('ziShiPass'); }},
        {text:'【抉择】忍不住回头一看', log:'回首', action:()=>{ setFlag('turned'); adjustSan(-3); adjustYin(2); goTo('ziShiFail'); }},
        {text:'【道具】举起阴阳铜镜照身后(借镜而不回头)', disabled:!hasItem('mirror'), log:'借镜', action:()=>{ setFlag('mirrorTrick'); if(!hasAchievement('mirror_trick')) unlockAchievement('mirror_trick'); if(!hasAchievement('no_turn')) unlockAchievement('no_turn'); goTo('ziShiPass'); }}
      ]
    };
  }
},
ziShiPass:{
  title:'子时 · 不回首',
  run(){
    return {
      text:`你咬紧牙关,死死盯着前方。唢呐声在耳畔炸响,又渐渐远去。<br><br>
        不知过了多久,一切归于死寂。你冷汗湿透衣背,却<span class="em">活了下来</span>。<br><br>
        喜婆不知何时站在堂前,神色复杂地看了你一眼:<span class="whisper">"……是个有定力的。这关,你过了。"</span>`,
      tips:[{gain:true,text:'✓ 你通过了子时之劫(真规则二)。'}],
      choices:[{text:'继续等待天明', action:()=>{ G.hour=3; goTo('explore2'); }}]
    };
  }
},
ziShiFail:{
  title:'子时 · 回首',
  run(){
    return {
      text:`你终究没忍住,回过头——<br><br>
        一张惨白的、画着笑脸的脸,几乎贴在你鼻尖。那是纸新娘,可她的脸上,缝满了<span class="em">不同人的五官</span>。<br><br>
        她对着你笑了:<span class="whisper">"新郎,你也想成为我的一部分吗?"</span>`,
      tips:[{text:'⚠ 你违反了规则二(回首)。理智暴跌。',warn:true}],
      choices:[
        {text:'用桃木簪刺向她', disabled:!hasItem('peach'), action:()=>{ setFlag('peachUsed'); adjustSan(1); goTo('explore2'); }},
        {text:'拼死挣脱,跌回中庭', action:()=>{ if(hasFlag('woreCord')){ reachEnding('substitute'); } else if(G.san<=0){ reachEnding('puppet'); } else { goTo('explore2'); } }}
      ]
    };
  }
},

/* ===== 探索二阶段 ===== */
explore2:{
  title:'丑时 · 老槐下',
  run(){
    G.hour=3;
    return {
      text:`子时已过。红烛燃去过半,堂上的"囍"字在烛影里忽明忽暗。<br><br>
        你已知悉真相的轮廓——阿鸢,一个被活活殉葬的绣娘,她的怨念,和这本假禁忌册,困住了所有踏入红宅的"新郎"。<br><br>
        <span class="whisper">距离天明(寅时),已不远。已查明真相:${G.truths.length}/${TRUTH_TOTAL}。 理智 ${G.san} / 阴气 ${G.yin}。</span>`,
      choices: buildExplore2Choices()
    };
  }
},

/* ===== 最终抉择 ===== */
finale:{
  title:'寅时 · 天将明',
  run(){
    Sound.stopHeart();
    G.hour=4;
    return {
      text:`东方现出一线鱼肚白。红烛只剩寸许,摇摇欲坠。喜婆捧着最后一碗合卺酒,立在你面前:<br><br>
        <span class="ghost">"时辰到了,新郎官。行礼,便是夫妻;不行……这宅子,可没那么容易放人走。"</span><br><br>
        你的手,按在了腰间的物件上。`,
      choices: buildFinaleChoices()
    };
  }
},

/* ===== 地宫 ===== */
under:{
  title:'地宫',
  run(){
    Sound.heartbeat();
    return {
      text:`你撬开祠堂深处一块刻着鸢纹的石板。石阶蜿蜒向下,冷气扑面。<br><br>
        地宫深处,并排两口黑棺——一口刻"陈三郎",一口空着,却刻着<span class="em">你的生辰</span>。<br><br>
        空棺里,静静躺着一封完整的婚书,与一卷<span class="em">村志</span>。村志详载:九十年前那场冥婚,陈家族长为镇压三郎"凶煞",选中孤女阿鸢,活钉入棺。此后每逢甲子,必诱一外乡人"续婚",以养此煞。<br><br>
        ——你,不是第一个。若你死,也不会是最后一个。`,
      tips:[
        {gain:true,text:'【获得】完整婚书 · 村志(全部真相)'},
        {text:'【真相全明】槐阴村冥婚乃陈族百年邪俗,以活人殉葬养煞。阿鸢是首位,你是最新一位。'}
      ],
      choices:[
        {text:'带上全部证据,返回地面', action:()=>{ addTruth('village'); setFlag('fullTruth'); giveItem('weddingLetter'); giveItem('villageRecord'); checkAchievements(); goTo('explore2'); }}
      ]
    };
  }
}

}; // end SCENES

/* ===== 动态选项构建 ===== */
function buildExploreChoices(){
  const c=[];
  c.push({text:'前往西厢·书房(查族谱)', go:'study', disabled:hasFlag('doneStudy')});
  c.push({text:'前往东厢·新房(见新娘)', go:'bridal', disabled:hasFlag('doneBridal')});
  c.push({text:'前往后院·祠堂(拜祖先)', go:'shrine', disabled:hasFlag('doneShrine')});
  if(hasFlag('doneStudy')&&hasFlag('doneBridal')&&hasFlag('doneShrine')&&!hasFlag('ziShiDone')){
    c.push({text:'【时辰至】子时三刻,唢呐骤起', action:()=>{ setFlag('ziShiDone'); G.hour=2; goTo('ziShi'); }});
  }
  return c;
}

function buildExplore2Choices(){
  const c=[];
  if(!hasFlag('doneStudy')) c.push({text:'再访书房', go:'study'});
  if(!hasFlag('doneBridal')) c.push({text:'再访新房', go:'bridal'});
  if(!hasFlag('doneShrine')) c.push({text:'再访祠堂', go:'shrine'});
  if(hasItem('mirror')&&hasItem('peach')&&hasFlag('knowsTruth')&&!hasFlag('fullTruth')){
    c.push({text:'【隐藏】凭铜镜与桃木簪,寻地宫', go:'under'});
  }
  c.push({text:'【天将明】前往喜堂,作最后抉择', go:'finale'});
  return c;
}
function buildFinaleChoices(){
  const c=[];
  const knowsReal = hasFlag('knowsTruth')||hasFlag('fullTruth');
  const hasAsh = hasItem('ash');
  const hasFrag = hasItem('fragment1')&&hasItem('fragment2')&&hasItem('fragment3');
  if(knowsReal && hasAsh && hasFrag){
    c.push({text:'【超度】拒饮合卺酒,当众烧却骨灰与婚书,念阿鸢名讳助其安息', action:()=>{ Sound.reveal(); reachEnding('save'); }});
  }
  if(G.san>0){
    c.push({text:'【逃离】趁天光,丢下一切夺门而出', action:()=>{ reachEnding('flee'); }});
  }
  if(hasFlag('woreCord')||hasFlag('hasPaperBride')){
    c.push({text:'【同穴】系上红绳,为纸新娘盖盖头,行冥婚礼', action:()=>{ Sound.suona(); reachEnding('together'); }});
  }
  if(hasFlag('fullTruth') && hasItem('mirror')){
    c.push({text:'【真相】以铜镜照破婚书,揭穿陈族百年邪俗,带证物走出槐阴村', action:()=>{ Sound.reveal(); reachEnding('truth'); }});
  }
  c.push({text:'【从命】接过合卺酒,一饮而尽', action:()=>{ Sound.death(); reachEnding('puppet'); }});
  return c;
}
